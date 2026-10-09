'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import type { TransferState } from '@/lib/organizations/transfers';
const field = (form: FormData, name: string) => { const values = form.getAll(name); return values.length === 1 && typeof values[0] === 'string' ? values[0] : ''; };

export async function requestTransfer(_state: TransferState, form: FormData): Promise<TransferState> {
  const access = await organizationAccess();
  if (access.kind !== 'allowed' || access.role !== 'client') return { message: 'Your active Client access is no longer available. Refresh the page.' };
  const values = form.getAll('organization_code'), reason = field(form, 'reason');
  const code = values.length === 1 && typeof values[0] === 'string' && values[0].length <= 256 ? values[0] : null;
  const result = await access.supabase.rpc('submit_organization_transfer', { p_code: code, p_reason: reason });
  if (result.error || result.data === 'unavailable') return { message: 'This code cannot be used for your transfer. Check it with the person who shared it and keep the reason within 2000 characters.' };
  if (result.data === 'rate_limited') return { message: 'Too many code attempts. Wait 15 minutes before trying again.' };
  if (result.data !== 'submitted' && result.data !== 'already_pending') return { message: 'We could not submit your transfer. Refresh to check its current status.' };
  revalidatePath('/organizations/transfer');
  revalidatePath('/organizations/transfers');
  redirect('/organizations/transfer?notice=' + (result.data === 'submitted' ? 'submitted' : 'pending'));
}

export async function reviewTransfer(_state: TransferState, form: FormData): Promise<TransferState> {
  const access = await organizationAccess();
  if (access.kind !== 'allowed' || !['admin', 'super_admin'].includes(access.role)) return { message: 'Your administrator access is no longer available. Refresh the page.' };
  const id = field(form, 'request_id'), revision = field(form, 'revision'), intent = field(form, 'intent'), side = field(form, 'side'), reason = field(form, 'reason').trim();
  if (!organizationIdPattern.test(id) || !/^[1-9][0-9]{0,17}$/.test(revision) || !['approve', 'reject'].includes(intent)) return { message: 'This transfer form is invalid. Refresh the list.' };
  if (intent === 'approve' && (field(form, 'verified') !== 'yes' || !['source', 'destination', 'super_admin'].includes(side))) return { message: 'Confirm that you reviewed the applicant, companies and effect of this transfer.' };
  if (intent === 'reject' && (!reason || [...reason].length > 2000)) return { message: 'Enter a rejection reason of 1 to 2000 characters.' };
  const result = await access.supabase.rpc('review_organization_transfer', { p_request_id: id, p_expected_revision: revision, p_intent: intent, p_side: side || null, p_reason: reason || null });
  if (result.error) return { message: result.error.code === '40001' ? 'This transfer has changed. Refresh the list before reviewing again.' : result.error.code === '22023' ? 'Transfer requirements are no longer met. Check the current account, membership and company status.' : 'This transfer is unavailable or your review access has changed. Refresh the list.' };
  revalidatePath('/organizations', 'layout');
  revalidatePath('/account');
  const notice = result.data === 'awaiting_other_company' ? 'consent' : result.data === 'approved' ? 'approved' : 'rejected';
  redirect('/organizations/transfers?notice=' + notice);
}
