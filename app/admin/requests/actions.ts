'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { reviewAccess } from '@/lib/registration/access';
import type { ReviewState } from '@/lib/registration/types';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function text(form: FormData, name: string) {
  const entries = form.getAll(name);
  return entries.length === 1 && typeof entries[0] === 'string' ? entries[0].trim() : '';
}

export async function submitReview(_state: ReviewState, form: FormData): Promise<ReviewState> {
  // The action is independently reachable. Neither hidden IDs nor rendered buttons authorize it.
  const access = await reviewAccess();
  if (access.kind !== 'allowed') return { message: access.kind === 'unavailable' ? 'Review access is temporarily unavailable. Please try again.' : 'Your review permissions have changed. Sign in with an active administrator account.' };
  const intent = text(form, 'intent'), requestId = text(form, 'request_id');
  if (!uuid.test(requestId) || !['route', 'unroute', 'reject', 'approve', 'approve-new'].includes(intent)) return { message: 'This review form is invalid. Refresh the list and try again.' };
  if (['route', 'unroute', 'approve-new'].includes(intent) && access.role !== 'super_admin') return { message: 'Only a Super Admin can perform this action.' };

  const errors: Record<string, string> = {}, values: Record<string, string> = {};
  let call: PromiseLike<{ error: { code?: string } | null }>;
  if (intent === 'reject') {
    values.reason = text(form, 'reason');
    if (!values.reason || values.reason.length > 2000) errors.reason = 'Enter a reason of 1 to 2000 characters. The applicant will see it.';
    if (Object.keys(errors).length) return { errors, values };
    call = access.supabase.rpc('reject_registration_request', { p_request_id: requestId, p_reason: values.reason });
  } else if (intent === 'route' || intent === 'unroute' || intent === 'approve') {
    values.organization_id = text(form, 'organization_id');
    if (intent !== 'unroute' && !uuid.test(values.organization_id)) errors.organization_id = 'Choose a company from your available options.';
    if (intent === 'approve' && text(form, 'verified') !== 'yes') errors.verified = 'Confirm that you checked the applicant and company details.';
    if (Object.keys(errors).length) return { errors, values };
    call = access.supabase.rpc(intent === 'approve' ? 'approve_registration_request' : 'route_registration_request', { p_request_id: requestId, p_organization_id: intent === 'unroute' ? null : values.organization_id });
  } else {
    const limits: Record<string, number> = { name: 200, address: 1000, email: 254, phone: 40, description: 4000, industry: 200, contact_person: 120 };
    // Only these verified company fields reach the RPC. Caller-supplied roles, actor and status never do.
    for (const [key, limit] of Object.entries(limits)) {
      values[key] = text(form, key);
      if ((values[key].length === 0 && !['industry', 'contact_person'].includes(key)) || values[key].length > limit) errors[key] = 'Enter ' + (['industry', 'contact_person'].includes(key) ? 'up to ' : '1 to ') + limit + ' characters.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid company email address.';
    if (text(form, 'verified') !== 'yes') errors.verified = 'Confirm that you checked the applicant and company details.';
    if (Object.keys(errors).length) return { errors, values };
    const details = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
    call = access.supabase.rpc('approve_registration_new_organization', { p_request_id: requestId, p_details: details });
  }
  const result = await call;
  if (result.error) return { values, message: result.error.code === '42501' ? 'This request is unavailable or your review permissions have changed. Refresh the list.' : result.error.code === '22023' ? 'Approval requirements are not met. Check email confirmation, company details and the current request, then refresh the list.' : 'We could not save this decision. Please refresh and check its current status before trying again.' };
  revalidatePath('/admin/requests');
  revalidatePath('/account');
  const notice = intent === 'reject' ? 'rejected' : intent === 'route' || intent === 'unroute' ? 'routed' : 'approved';
  redirect('/admin/requests?notice=' + notice);
}

