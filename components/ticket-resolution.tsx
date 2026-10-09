import { randomUUID } from 'node:crypto';
import type { ReactNode } from 'react';
import { TicketForm } from '@/components/ticket-form';
import { ticketDate, type TicketChoice, type TicketContext, type TicketDetail, type TicketResolutionData } from '@/lib/tickets/types';
const exactDate = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
export function TicketResolution({ ticket: t, context, resolution: r, candidates, page, pages }: { ticket: TicketDetail; context: TicketContext; resolution: TicketResolutionData; candidates: TicketChoice[]; page: number; pages: ReactNode }) {
  if (!['Resolved', 'Closed'].includes(t.status) && !r.requests.length && page === 1) return null;
  const common = { organization: t.organization_id, ticket: t.id, context }, version = { revision: t.revision };
  return <section className="org-panel mt-6" data-ticket-resolution>
    <h2 className="text-xl font-semibold">Solution & continuation</h2>
    {t.status === 'Resolved' && <><p className="mt-3 leading-7 text-[var(--org-muted)]">The work is marked as resolved. The original Client can accept the solution or request more work on the same problem within seven days.</p>{r.deadline && <p className="mt-3 text-sm">New continuation requests must arrive before <strong>{exactDate(r.deadline)}</strong>.</p>}{r.has_pending_reopen && <p className="org-notice mt-4" role="status">A continuation request is waiting for a decision. The ticket remains Resolved. Review this request before closing the ticket.</p>}</>}
    {t.status === 'Closed' && <p className="mt-3 leading-7 text-[var(--org-muted)]">This ticket is Closed. Closure is final; it cannot be reopened or moved to another status.</p>}
    {(r.can_accept || r.can_request_reopen) && <div className="mt-6 grid gap-7 lg:grid-cols-2">
      {r.can_accept && <div><h3 className="mb-3 font-medium">The problem is solved</h3><TicketForm {...common} intent="accept_solution" fields={version} button="Accept solution & close"><p className="text-sm leading-6 text-[var(--org-muted)]">Accepting closes this ticket permanently. Submit only when this problem is solved.</p></TicketForm></div>}
      {r.can_request_reopen && <TicketForm {...common} intent="request_reopen" fields={{ ...version, request_id: randomUUID() }} button="Request continuation"><p className="text-sm leading-6 text-[var(--org-muted)]">Explain what still needs work. The owner or company administrator will review your request.</p></TicketForm>}
    </div>}
    {r.can_admin_close && <details className="mt-6 border-t border-[var(--org-border)] pt-5"><summary className="cursor-pointer font-medium">Exceptional administrative closure</summary><div className="mt-4"><TicketForm {...common} intent="admin_close" fields={version} button="Close with administrative reason"><p className="text-sm leading-6 text-[var(--org-muted)]">Use only for an exceptional administrative decision. A reason is required and closure is final.</p></TicketForm></div></details>}
    {r.requests.length > 0 && <div className="mt-7"><h3 className="font-semibold">Continuation history</h3><div className="mt-4 space-y-7">{r.requests.slice(0, 25).map(request => <article className="border-t border-[var(--org-border)] pt-5" key={request.id} data-reopen-request={request.id}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-medium">{request.requester_name}</p><p className="mt-1 text-sm text-[var(--org-muted)]">Requested {ticketDate(request.created_at)}</p></div><span className="org-status capitalize">{request.status}</span></div>
      <p className="mt-4 whitespace-pre-wrap break-words leading-7">{request.reason}</p>
      {request.reviewed_at && <p className="mt-3 break-words text-sm text-[var(--org-muted)]">Reviewed {ticketDate(request.reviewed_at)}{request.reviewer_name ? ' by ' + request.reviewer_name : ''}</p>}
      {request.rejection_reason && <div className="mt-3"><h4 className="text-sm font-medium">Reason for rejection</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{request.rejection_reason}</p></div>}
      {request.status === 'pending' && r.can_review_reopen && <div className="mt-5 grid gap-7 lg:grid-cols-2">
        <TicketForm {...common} intent="approve_reopen" fields={{ ...version, request_id: request.id, request_revision: request.revision, ...(!r.can_reassign_reopen ? { owner_staff_user_id: '' } : {}) }} button="Approve continuation">
          {r.can_reassign_reopen && <label className="org-field">Staff owner after approval<select className="org-input" name="owner_staff_user_id" defaultValue=""><option value="">Keep current owner if available</option>{candidates.slice(0, 25).map(person => <option key={person.id} value={person.id}>{person.label}</option>)}</select><span className="text-sm font-normal text-[var(--org-muted)]">Approval needs an active Staff owner assigned to this company. If the current owner is unavailable, choose a replacement using the people search below.</span></label>}
          <p className="text-sm leading-6 text-[var(--org-muted)]">Approval returns the ticket to Assigned. Work can then continue.</p>
        </TicketForm>
        <TicketForm {...common} intent="reject_reopen" fields={{ ...version, request_id: request.id, request_revision: request.revision }} button="Reject continuation"><p className="text-sm leading-6 text-[var(--org-muted)]">Rejection keeps the original seven-day deadline. If that deadline has passed, this decision also closes the ticket.</p></TicketForm>
      </div>}
    </article>)}</div></div>}
    {page > 1 && !r.requests.length && <p className="mt-5 text-[var(--org-muted)]">No continuation requests on this page.</p>}
    {(r.requests.length > 0 || page > 1) && pages}
  </section>;
}