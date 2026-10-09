'use server';

import { revalidatePath } from 'next/cache';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import type { CodeActionState } from '@/lib/organizations/codes';

const field = (form: FormData, name: string) => { const values = form.getAll(name); return values.length === 1 && typeof values[0] === 'string' ? values[0].trim() : ''; };

export async function manageOrganizationCode(_state: CodeActionState, form: FormData): Promise<CodeActionState> {
  const access = await organizationAccess();
  if (access.kind !== 'allowed' || !['admin', 'super_admin'].includes(access.role)) return { message: 'Your administrator access is no longer available. Refresh the page.' };
  const organizationId = field(form, 'organization_id'), expectedId = field(form, 'expected_code_id'), intent = field(form, 'intent');
  if (!organizationIdPattern.test(organizationId) || (expectedId !== 'none' && !organizationIdPattern.test(expectedId)) || !['issue', 'revoke'].includes(intent)) return { message: 'This form is invalid. Refresh the page and try again.' };
  if (field(form, 'confirmed') !== 'yes') return { message: 'Confirm that you understand the effect of this change.' };
  const result = await access.supabase.rpc('manage_organization_access_code', { p_organization_id: organizationId, p_expected_code_id: expectedId === 'none' ? null : expectedId, p_intent: intent });
  if (result.error) return { message: result.error.code === '40001' ? 'The code has changed. Refresh this page before trying again.' : 'The code could not be changed. Check your access and refresh the page.' };
  revalidatePath('/organizations/' + organizationId + '/codes');
  const issued = result.data?.[0] as { id: string; code: string; expires_at: string } | undefined;
  return issued ? { message: 'New code issued. Save it now; it will not be shown again after leaving or refreshing this page.', changed: true, ...issued }
    : { message: 'Code revoked. It can no longer be used for new requests. Submitted requests still need an administrator decision.', changed: true, id: null };
}
