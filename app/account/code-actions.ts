'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { CodeEntryState } from '@/lib/organizations/codes';

export async function submitOrganizationCode(_state: CodeEntryState, form: FormData): Promise<CodeEntryState> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email_confirmed_at) return { message: 'Sign in with your confirmed account to submit a code.' };
  const codes = form.getAll('organization_code');
  // The RPC counts malformed attempts too. Do not return submitted codes or raw DB errors.
  const code = codes.length === 1 && typeof codes[0] === 'string' && codes[0].length <= 256 ? codes[0] : null;
  const result = await supabase.rpc('submit_organization_access_code', { p_code: code });
  if (result.error || result.data === 'unavailable') return { message: 'This code cannot be used for your current request. Check the code with the person who shared it or contact your administrator.' };
  if (result.data === 'rate_limited') return { message: 'Too many attempts. Please wait 15 minutes before trying again.' };
  if (result.data !== 'submitted') return { message: 'We could not submit your code. Please try again later.' };
  revalidatePath('/account');
  revalidatePath('/admin/requests');
  redirect('/account?notice=code-submitted');
}
