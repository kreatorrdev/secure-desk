'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { reviewAccess } from '@/lib/registration/access';
import type { AccessState, AccessTarget } from '@/lib/access/types';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (form: FormData, name: string) => { const values = form.getAll(name); return values.length === 1 && typeof values[0] === 'string' ? values[0].trim() : ''; };
const stale = 'This access has changed or is no longer available. Reload the page before trying again.';
export async function submitAccess(_state: AccessState, form: FormData): Promise<AccessState> {
  const access = await reviewAccess();
  if (access.kind !== 'allowed') return { message: access.kind === 'unavailable' ? 'Access management is temporarily unavailable. Please try again.' : 'Your administrator access has changed. Sign in with an active administrator account.' };
  const intent = text(form, 'intent'), email = text(form, 'email'), userId = text(form, 'user_id'), organizationId = text(form, 'organization_id');
  if (!['approve-role', 'role', 'staff-grant', 'staff-revoke', 'admin-grant', 'admin-revoke'].includes(intent)
    || !uuid.test(userId) || !email || [...email].length > 254 || (organizationId !== 'none' && !uuid.test(organizationId))) return { message: 'This form is invalid. Reload the page and choose the account and company again.' };
  if (['approve-role', 'role', 'admin-grant', 'admin-revoke'].includes(intent) && access.role !== 'super_admin') return { message: 'Only a Super Admin can perform this action.' };
  const selected = await access.supabase.rpc('admin_access_target', { p_email: email, p_organization_id: organizationId === 'none' ? null : organizationId });
  const target = (selected.data as AccessTarget[] | null)?.[0];
  if (selected.error || !target || target.id !== userId) return { message: stale };
  if (text(form, 'access_revision') !== target.access_revision) return { message: stale };
  const allowed = intent === 'approve-role' ? target.can_approve_privileged : intent === 'role' ? target.can_change_role
    : intent === 'staff-grant' ? target.can_grant_staff : intent === 'staff-revoke' ? target.can_revoke_staff
      : intent === 'admin-grant' ? target.can_grant_admin : target.can_revoke_admin;
  if (!allowed) return { message: stale };
  const values: Record<string, string> = { reason: text(form, 'reason'), new_role: text(form, 'new_role'), can_create_project: text(form, 'can_create_project') };
  const errors: Record<string, string> = {};
  if (!values.reason || [...values.reason].length > 2000) errors.reason = 'Enter a business reason of 1 to 2000 characters.';
  if (text(form, 'verified') !== 'yes') errors.verified = 'Confirm that you checked this account and the effect of the change.';
  let call: PromiseLike<{ error: { code?: string } | null }>;
  if (intent === 'approve-role' || intent === 'role') {
    if (!(intent === 'approve-role' ? ['staff', 'admin'] : ['client', 'staff', 'admin']).includes(values.new_role)
      || (intent === 'role' && (values.new_role === target.app_role || (!target.auth_eligible && values.new_role !== 'client')))) errors.new_role = 'Choose an available role.';
    if (intent === 'approve-role' && text(form, 'request_id') !== target.latest_request?.id) return { message: stale };
    if (Object.keys(errors).length) return { values, errors };
    call = intent === 'approve-role'
      ? access.supabase.rpc('approve_privileged_registration', { p_request_id: target.latest_request!.id, p_role: values.new_role, p_reason: values.reason })
      : access.supabase.rpc('change_account_role', { p_user_id: target.id, p_expected_access_revision: target.access_revision, p_new_role: values.new_role, p_reason: values.reason });
  } else {
    if (organizationId === 'none') return { message: 'Choose an available company first.' };
    const isStaff = intent.startsWith('staff-'), assignment = isStaff ? target.staff_assignment : target.admin_assignment;
    if (text(form, 'assignment_revision') !== (assignment?.revision ?? 'none')) return { message: stale };
    if (isStaff && intent === 'staff-grant' && !['yes', 'no'].includes(values.can_create_project)) errors.can_create_project = 'Choose whether this Staff account may create projects.';
    if (Object.keys(errors).length) return { values, errors };
    call = isStaff
      ? access.supabase.rpc('set_staff_organization_assignment', { p_organization_id: organizationId, p_staff_user_id: target.id,
        p_expected_access_revision: target.access_revision, p_expected_assignment_revision: assignment?.revision ?? null,
        p_active: intent === 'staff-grant', p_can_create_project: intent === 'staff-grant' && values.can_create_project === 'yes', p_reason: values.reason })
      : access.supabase.rpc('set_organization_admin_assignment', { p_organization_id: organizationId, p_admin_user_id: target.id,
        p_expected_access_revision: target.access_revision, p_expected_assignment_revision: assignment?.revision ?? null,
        p_active: intent === 'admin-grant', p_reason: values.reason });
  }
  const result = await call;
  if (result.error) return { message: result.error.code === '42501' ? stale : result.error.code === '22023' ? 'The account or company is not eligible for this change. Reload and check its current status.' : 'We could not confirm this change. Reload and check the current access before submitting again.' };
  revalidatePath('/admin/access'); revalidatePath('/admin/requests'); revalidatePath('/account');
  // Fixed local destination. Caller-provided actor/role/status/next parameters never reach the RPC.
  redirect('/admin/access?' + new URLSearchParams({ email: target.email, ...(organizationId !== 'none' ? { company: organizationId } : {}), notice: 'saved' }));
}
