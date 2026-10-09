'use client';

import { useActionState } from 'react';
import { requestTransfer, reviewTransfer } from '@/app/organizations/transfer/actions';

const inputClass = 'block w-full rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-3 text-sm text-[var(--org-text)]';
export function TransferRequestForm() {
  const [state, action, pending] = useActionState(requestTransfer, { message: '' });
  return <form action={action} data-transfer-entry className="org-panel mt-7 space-y-4">
    <h2 className="text-lg font-semibold">Request a transfer</h2>
    <p id="transfer-code-help" className="text-sm leading-6 text-[var(--org-muted)]">Ask the destination company for its invitation code. Your current access stays in place while both companies review the request, or a Super Admin makes the decision.</p>
    <label htmlFor="transfer-code" className="block text-sm font-semibold">Destination organization code</label>
    <input id="transfer-code" name="organization_code" required maxLength={256} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby="transfer-code-help" className={inputClass + ' font-mono'} />
    <label htmlFor="transfer-reason" className="block text-sm font-semibold">Reason (optional)</label>
    <textarea id="transfer-reason" name="reason" maxLength={2000} rows={3} className={inputClass} />
    {state.message && <p role="alert" className="text-sm leading-6">{state.message}</p>}
    <button disabled={pending} className="org-button disabled:opacity-60">{pending ? 'Submitting…' : 'Send transfer request'}</button>
  </form>;
}

export function TransferReviewForm({ id, revision, side }: { id: string; revision: string; side: 'source' | 'destination' | 'super_admin' | 'reject' }) {
  const [state, action, pending] = useActionState(reviewTransfer, { message: '' });
  const reject = side === 'reject';
  const label = side === 'source' ? 'Approve leaving this company' : side === 'destination' ? 'Approve joining this company' : 'Approve transfer';
  return <form action={action} data-transfer-review={side} data-transfer-id={id} className="space-y-3 rounded-lg border border-[var(--org-border)] p-4">
    <input type="hidden" name="request_id" value={id} /><input type="hidden" name="revision" value={revision} />
    <input type="hidden" name="intent" value={reject ? 'reject' : 'approve'} /><input type="hidden" name="side" value={reject ? '' : side} />
    {reject ? <label className="block text-sm font-semibold">Rejection reason<textarea name="reason" required maxLength={2000} rows={3} className={inputClass + ' mt-2 font-normal'} /></label>
      : <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="verified" value="yes" required className="mt-1 size-4 shrink-0" />I checked this applicant and the companies. I understand that a completed transfer ends the old company access immediately.</label>}
    {state.message && <p role="alert" className="text-sm leading-6">{state.message}</p>}
    <button disabled={pending} className="org-button disabled:opacity-60">{pending ? 'Saving…' : reject ? 'Reject transfer' : label}</button>
  </form>;
}
