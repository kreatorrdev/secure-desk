import Link from 'next/link';
import { AuditEvents } from '@/components/audit-events';
import type { AuditEvent } from '@/lib/audit/types';
export function TicketActivity({events,error,newest,older,hasCursor}:{events:AuditEvent[];error:boolean;newest:string;older:string;hasCursor:boolean}) {
 return <section className="org-panel mt-6" aria-labelledby="ticket-activity"><h2 id="ticket-activity" className="text-xl font-semibold">Ticket activity</h2><p className="mt-3 text-sm leading-6 text-[var(--org-muted)]">Business events for this ticket, available while you have access. This view follows the audit retention policy.</p>{error ? <p role="alert" className="org-notice mt-4">Activity is unavailable. Reload and check your current access.</p> : <>{!events.length && <p className="mt-4 text-[var(--org-muted)]">No retained activity on this page.</p>}<AuditEvents events={events}/><nav className="mt-6 flex flex-wrap justify-between gap-4" aria-label="Ticket activity pages">{hasCursor && <Link className="org-link" href={newest}>Newest activity</Link>}{events.length>25 && <Link className="org-link" href={older}>Older activity</Link>}</nav></>}</section>;
}
