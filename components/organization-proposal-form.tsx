'use client';
import { useActionState } from 'react';
import { saveProposal } from '@/app/organizations/[id]/proposals/actions';
import type { Proposal, ProposalContext } from '@/lib/organizations/proposals';

const input = 'mt-2 block w-full rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-3 text-sm';
export function OrganizationProposalForm({ organization, id, context, proposal, intent = 'submit', reviewers = [] }: { organization: string; id: string; context: ProposalContext; proposal?: Proposal; intent?: 'submit' | 'assign' | 'recommend' | 'approve' | 'reject'; reviewers?: { user_id: string; full_name: string }[] }) {
 const [state, action, pending] = useActionState(saveProposal, { message: '' });
 const title = { submit: 'Propose a project', assign: 'Assign a Staff reviewer', recommend: 'Staff or administrator recommendation', approve: 'Approve proposal', reject: 'Reject proposal' }[intent];
 return <form action={action} data-proposal-form={intent} className="org-panel mt-6 space-y-5">
  <h2 className="text-lg font-semibold">{title}</h2>
  <input type="hidden" name="organization_id" value={organization} /><input type="hidden" name="proposal_id" value={id} />
  <input type="hidden" name="intent" value={intent} /><input type="hidden" name="access_revision" value={context.access_revision} />
  <input type="hidden" name="assignment_revision" value={context.assignment_revision || ''} /><input type="hidden" name="revision" value={proposal?.revision || ''} />
  {intent === 'submit' && <>
   <p className="text-sm leading-6 text-[var(--org-muted)]">This creates a proposal for review. An administrator must approve it before it becomes an active project. You can add private attachments after submitting.</p>
   <label className="block text-sm">Project title<input name="title" required maxLength={200} defaultValue={state.values?.title} className={input} /></label>
   <label className="block text-sm">Description<textarea name="description" required maxLength={4000} rows={4} defaultValue={state.values?.description} className={input} /></label>
   <label className="block text-sm">Business reason<textarea name="reason" required maxLength={4000} rows={3} defaultValue={state.values?.reason} className={input} /></label>
   <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm">Desired deadline<input name="desired_deadline" type="date" required defaultValue={state.values?.desired_deadline} className={input} /></label>
    <label className="block text-sm">Estimated priority<select name="proposed_priority" defaultValue={state.values?.proposed_priority || 'Medium'} className={input}>{['Low','Medium','High','Critical'].map(p => <option key={p}>{p}</option>)}</select></label></div>
  </>}
  {intent === 'assign' && <><p className="text-sm leading-6 text-[var(--org-muted)]">Choose an active Staff member assigned to this company. Changing or renewing the reviewer clears the previous recommendation.</p><label className="block text-sm">Staff reviewer<select name="reviewer_id" className={input} defaultValue={reviewers.some(r => r.user_id === proposal?.reviewer_staff_user_id) ? proposal?.reviewer_staff_user_id || '' : ''}><option value="">No reviewer</option>{reviewers.map(r => <option key={r.user_id} value={r.user_id}>{r.full_name} · {r.user_id.slice(0,8)}</option>)}</select></label></>}
  {intent !== 'submit' && intent !== 'assign' && <><p className="text-sm leading-6 text-[var(--org-muted)]">{intent === 'approve' ? 'Approval creates one active project using the proposal title and description. This decision is final.' : intent === 'reject' ? 'Give the author a reason. Rejection is final and creates no project.' : 'Your recommendation informs the administrator. It does not activate the project.'}</p><label className="block text-sm">{intent === 'recommend' ? 'Recommendation' : intent === 'reject' ? 'Rejection reason' : 'Decision note (optional)'}<textarea name="text" rows={3} required={intent !== 'approve'} maxLength={4000} className={input} /></label></>}
  {state.message && <p role="alert" className="text-sm leading-6">{state.message}</p>}
  <button disabled={pending} className="org-button disabled:opacity-50">{pending ? 'Saving…' : { submit: 'Submit proposal', assign: 'Save reviewer', recommend: 'Save recommendation', approve: 'Approve and create project', reject: 'Reject proposal' }[intent]}</button>
 </form>;
}
