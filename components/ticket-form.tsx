'use client';
import { useActionState, useId, type ReactNode } from 'react';
import { ticketAction } from '@/app/tickets/actions';
import type { TicketContext, TicketFormState } from '@/lib/tickets/types';
export function TicketForm({ organization, ticket, context, intent, fields = {}, children, button, initial = {} }: { organization: string; ticket: string; context: TicketContext; intent: string; fields?: Record<string, string>; children?: ReactNode; button: string; initial?: TicketFormState['values'] }) {
  const [state, action, pending] = useActionState(ticketAction, { message: '', values: initial });
  const key = useId();
  return <form action={action} data-ticket-form={intent} className="space-y-4">
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="ticket_id" value={ticket}/><input type="hidden" name="intent" value={intent}/><input type="hidden" name="access_revision" value={context.access_revision}/><input type="hidden" name="scope_revision" value={context.scope_revision ?? ''}/>
    {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>)}
    {children}
    {intent === 'create' && <><label className="org-field" htmlFor={key + 'title'}>Title<input className="org-input" id={key + 'title'} name="title" required maxLength={200} defaultValue={state.values?.title ?? ''}/></label><label className="org-field" htmlFor={key + 'description'}>Description<textarea className="org-input min-h-36" id={key + 'description'} name="description" required maxLength={8000} defaultValue={state.values?.description ?? ''}/></label><p className="text-sm text-[var(--org-muted)]">New tickets start as Open with Medium priority.</p></>}
    {['comment', 'edit_comment'].includes(intent) && <label className="org-field" htmlFor={key + 'body'}>{intent === 'comment' ? 'Your comment' : 'Edit your comment'}<textarea className="org-input min-h-28" id={key + 'body'} name="body" required maxLength={8000} defaultValue={state.values?.body ?? ''}/></label>}
    {['request_reopen', 'reject_reopen', 'admin_close'].includes(intent) && <label className="org-field" htmlFor={key + 'resolution-reason'}>{intent === 'request_reopen' ? 'Why does this problem need more work?' : intent === 'reject_reopen' ? 'Reason for rejecting continuation' : 'Reason for exceptional closure'}<textarea className="org-input min-h-28" id={key + 'resolution-reason'} name="reason" required maxLength={intent === 'reject_reopen' ? 1000 : 2000} defaultValue={state.values?.reason ?? ''}/><span className="text-sm font-normal text-[var(--org-muted)]">{intent === 'reject_reopen' ? 'Up to 1000 characters. The original Client can read this decision.' : 'Up to 2000 characters. Explain the decision for the ticket history.'}</span></label>}
    {intent === 'reject_sharing' && <label className="org-field" htmlFor={key + 'reason'}>Rejection reason<textarea className="org-input" id={key + 'reason'} name="reason" required maxLength={1000}/></label>}
    {state.message && <p className="org-notice" role="alert">{state.message}</p>}
    <button disabled={pending} className="org-button" type="submit">{pending ? 'Saving…' : button}</button>
  </form>;
}
