'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { RetryDetails, RetryState, RetryValues } from '@/lib/registration/retry-types';

function value(form: FormData, name: string) {
  const entries = form.getAll(name);
  return entries.length === 1 && typeof entries[0] === 'string' ? entries[0].trim() : '';
}
function unavailable(): never {
  revalidatePath('/account');
  redirect('/account?notice=retry-unavailable');
}

export async function resubmitRequest(_state: RetryState, form: FormData): Promise<RetryState> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email_confirmed_at) redirect('/login');
  // Re-read only this identity's eligible latest rejected request. No caller-supplied user/role.
  const retry = await supabase.rpc('own_registration_retry_details');
  if (retry.error) return { message: 'We could not check your request. Refresh your account and try again.' };
  const current = (retry.data as RetryDetails[] | null)?.[0];
  if (!current || value(form, 'expected_request_id') !== current.request_id) unavailable();

  const values: RetryValues = { company_name: value(form, 'company_name'), phone: value(form, 'phone'), message: value(form, 'message') };
  const errors: RetryState['errors'] = {};
  for (const [name, label, limit] of [['company_name', 'Company name', 200], ['phone', 'Contact phone', 40], ['message', 'Message', 4000]] as const) {
    if (!values[name] || [...values[name]].length > limit) errors[name] = label + ' is required and must be at most ' + limit + ' characters.';
  }
  if (Object.keys(errors).length) return { values, errors, message: 'Check the highlighted fields. Your request has not been submitted.' };
  // The DB repeats eligibility and locks the expected attempt together with the atomic retry.
  const result = await supabase.rpc('resubmit_registration_form', { p_expected_request_id: current.request_id, p_company_name: values.company_name, p_phone: values.phone, p_message: values.message });
  if (result.error?.code === '42501') unavailable();
  if (result.error) return { values, message: 'We could not confirm submission. Refresh and check your current status before trying again.' };
  revalidatePath('/account');
  revalidatePath('/admin/requests');
  redirect('/account?notice=resubmitted');
}
