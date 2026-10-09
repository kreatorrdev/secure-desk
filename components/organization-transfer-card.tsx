import { transferDate, type TransferRequest } from '@/lib/organizations/transfers';
import { TransferReviewForm } from '@/components/organization-transfer-forms';

export function TransferCard({ request, review = false }: { request: TransferRequest; review?: boolean }) {
  return <article data-transfer-record={request.id} className="org-panel">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h2 className="break-words text-lg font-semibold">{review ? request.full_name : 'Your transfer request'}</h2>
      <span className="org-status capitalize">{request.status}</span>
    </div>
    {review && <p className="mt-2 break-all text-sm text-[var(--org-muted)]">{request.email}</p>}
    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="text-[var(--org-muted)]">Source company</dt><dd className="mt-1 break-words font-medium">{request.source_name ?? 'Previous company'}</dd></div>
      <div><dt className="text-[var(--org-muted)]">Destination company</dt><dd className="mt-1 break-words font-medium">{request.destination_name ?? (request.status === 'pending' ? 'Invitation verified; awaiting review' : 'Company details unavailable')}</dd></div>
      <div><dt className="text-[var(--org-muted)]">Submitted</dt><dd className="mt-1">{transferDate(request.created_at)}</dd></div>
      {request.reviewed_at && <div><dt className="text-[var(--org-muted)]">Decision</dt><dd className="mt-1">{transferDate(request.reviewed_at)}</dd></div>}
    </dl>
    {request.reason && <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">{request.reason}</p>}
    {request.rejection_reason && <div className="mt-4 text-sm"><p className="font-semibold">Administrator response</p><p className="mt-2 whitespace-pre-wrap break-words leading-6">{request.rejection_reason}</p></div>}
    {request.status === 'pending' && <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
      <p>Source approval: <strong>{request.source_approved ? 'Confirmed' : 'Awaiting confirmation'}</strong></p>
      <p>Destination approval: <strong>{request.destination_approved ? 'Confirmed' : 'Awaiting confirmation'}</strong></p>
    </div>}
    {review && request.status === 'pending' && <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {request.can_approve_source && <TransferReviewForm key={'source-' + request.revision} id={request.id} revision={request.revision} side="source" />}
      {request.can_approve_destination && <TransferReviewForm key={'destination-' + request.revision} id={request.id} revision={request.revision} side="destination" />}
      {request.can_complete && <TransferReviewForm key={'complete-' + request.revision} id={request.id} revision={request.revision} side="super_admin" />}
      {request.can_reject && <TransferReviewForm key={'reject-' + request.revision} id={request.id} revision={request.revision} side="reject" />}
    </div>}
  </article>;
}
