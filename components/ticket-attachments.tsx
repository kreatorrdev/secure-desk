import Link from 'next/link';
import { PrivateAttachmentUpload } from './private-attachment-upload';
import { ticketDate, type TicketContext } from '@/lib/tickets/types';

export type TicketAttachment = {
  id: string; original_name: string; mime_type: string; size_bytes: number; created_at: string; uploader_name: string;
};
function fileSize(bytes: number) {
  return bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';
}
export function TicketAttachments({ path, revision, context, files, page, pageLink, error, notice }: {
  path: string; revision: string; context: TicketContext; files: TicketAttachment[]; page: number;
  pageLink: (page: number) => string; error: string | undefined; notice: boolean;
}) {
  const message = error === 'invalid' ? 'Choose one supported file up to 10 MB. Check its format and try again.'
    : error === 'stale' ? 'The ticket or your access changed. Reload this page, choose the file again and retry.'
    : error === 'unavailable' ? 'File storage is temporarily unavailable. Choose the file again and retry.' : null;
  return <section className="org-panel mt-6" aria-labelledby="ticket-attachments-heading" data-ticket-attachments="true">
    <h2 id="ticket-attachments-heading" className="text-lg font-semibold">Private attachments</h2>
    <p id="ticket-attachment-help" className="mt-3 text-sm leading-6 text-[var(--org-muted)]">JPEG, PNG, WebP, PDF, UTF-8 TXT or CSV, and DOCX. Maximum 10 MB per file. Only people with access to this ticket can download its files.</p>
    {notice && <p role="status" className="org-notice mt-4">Your private file was uploaded.</p>}
    {message && <p role="alert" className="org-notice mt-4">{message}</p>}
    {!files.length ? <p className="mt-4 text-sm text-[var(--org-muted)]">No attachments on this page.</p>
      : <ul className="mt-5 space-y-5">{files.slice(0, 25).map(file => <li key={file.id} className="min-w-0 text-sm">
        <a href={path + '/attachments/' + file.id} className="org-link break-words">{file.original_name}</a>
        <p className="mt-1 break-words text-[var(--org-muted)]">{fileSize(file.size_bytes)} · {file.uploader_name} · {ticketDate(file.created_at)}</p>
      </li>)}</ul>}
    <nav aria-label="Attachment pages" className="mt-5 flex flex-wrap gap-5 text-sm">
      <span className="text-[var(--org-muted)]">Page {page}</span>
      {page > 1 && <Link href={pageLink(page - 1)} prefetch={false} className="org-link">Previous attachments</Link>}
      {files.length > 25 && page < 10000 && <Link href={pageLink(page + 1)} prefetch={false} className="org-link">More attachments</Link>}
    </nav>
    {context.organization_status === 'active' ? <PrivateAttachmentUpload path={path} kind="ticket" revision={revision} accessRevision={context.access_revision} scopeRevision={context.scope_revision ?? ''} helpId="ticket-attachment-help"/> : <p className="mt-5 text-sm text-[var(--org-muted)]">This company is inactive. Attachment history is read-only.</p>}
  </section>;
}
