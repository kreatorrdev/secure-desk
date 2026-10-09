export type TransferState = { message: string };
export type TransferRequest = {
  id: string; revision: string; status: 'pending' | 'approved' | 'rejected'; reason: string | null;
  rejection_reason: string | null; created_at: string; reviewed_at: string | null;
  full_name: string | null; email: string | null; source_name: string | null; destination_name: string | null;
  source_approved: boolean; destination_approved: boolean; can_approve_source: boolean;
  can_approve_destination: boolean; can_complete: boolean; can_reject: boolean;
};
export const transferDate = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
