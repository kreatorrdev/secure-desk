export const ticketStatuses = ['Open', 'Assigned', 'In Progress', 'Waiting for Client', 'Resolved', 'Closed'] as const;
export const ticketPriorities = ['Low', 'Medium', 'High', 'Critical'] as const;
export type TicketStatus = typeof ticketStatuses[number];
export type TicketContext = { organization_name: string; organization_status: string; access_revision: string; scope_revision: string | null; can_create: boolean };
export type TicketChoice = { id: string; label: string };
export type TicketSummary = { id: string; organization_id: string; organization_name: string; project_name: string; title: string; status: TicketStatus; priority: string; revision: string; created_at: string; owner_name: string | null; is_own: boolean };
export type TicketComment = { id: string; body: string; author_user_id: string; author_name: string; revision: string; created_at: string; edited_at: string | null; can_edit: boolean; revisions: { id: string; previous_body: string; previous_revision: string; edited_at: string }[] };
export type TicketPerson = { id: string; name: string; available: boolean };
export type SharingRequest = { id: string; candidate_name: string; status: 'pending' | 'approved' | 'rejected'; revision: string; rejection_reason: string | null; created_at: string };
export type TicketDetail = { id: string; organization_id: string; project_id: string; title: string; description: string; status: TicketStatus; priority: string; revision: string; client_user_id: string; created_by_user_id: string; owner_staff_user_id: string | null; client_name: string; creator_name: string; owner_name: string | null; organization_name: string; project_name: string; created_at: string; resolved_at: string | null; closed_at: string | null; close_reason: string | null; can_manage: boolean; can_assign: boolean; can_comment: boolean; can_request_sharing: boolean; can_review_sharing: boolean; comments: TicketComment[]; collaborators: TicketPerson[]; participants: TicketPerson[]; sharing_requests: SharingRequest[] };
export type TicketFormState = { message: string; values?: { title?: string; description?: string; body?: string; reason?: string } };
export type DashboardData = { role: string; ticket_counts: Partial<Record<TicketStatus, number>>; queues: Record<string, number>; projects: number; project_preview: { id: string; organization_id: string; name: string; organization_name: string }[] };
export function nextTicketStatuses(status: TicketStatus): TicketStatus[] {
  return status === 'Assigned' ? ['In Progress'] : status === 'In Progress' ? ['Waiting for Client', 'Resolved'] : status === 'Waiting for Client' ? ['In Progress', 'Resolved'] : [];
}
export function pageNumber(value: string | string[] | undefined) { const parsed = typeof value === 'string' && /^[1-9][0-9]{0,3}$/.test(value) ? Number(value) : 1; return parsed <= 10000 ? parsed : 1; }
export const ticketPath = (organization: string, id: string) => '/organizations/' + organization + '/tickets/' + id;
export const ticketDate = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';

export type ResolutionRequest = { id: string; reason: string; status: 'pending' | 'approved' | 'rejected'; revision: string; resolved_at: string; created_at: string; reviewed_at: string | null; rejection_reason: string | null; requester_name: string; reviewer_name: string | null };
export type TicketResolutionData = { deadline: string | null; server_time: string; can_accept: boolean; can_request_reopen: boolean; can_review_reopen: boolean; can_admin_close: boolean; can_reassign_reopen: boolean; has_pending_reopen: boolean; requests: ResolutionRequest[] };
