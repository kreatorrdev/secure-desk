export type ProposalContext = { organization_name: string; organization_status: string; can_submit: boolean; can_administer: boolean; access_revision: string; assignment_revision: string | null };
export type ProposalSummary = { id: string; title: string; status: 'pending' | 'approved' | 'rejected'; proposed_priority: string; desired_deadline: string; created_at: string };
export type Proposal = ProposalSummary & { revision: string; description: string; reason: string; author_name: string; reviewer_name: string | null; reviewer_staff_user_id: string | null; recommendation: string | null; decision_reason: string | null; project_id: string | null; can_upload: boolean; can_recommend: boolean };
export type ProposalState = { message: string; values?: Record<string, string> };
export const proposalField = (form: FormData, name: string) => { const values = form.getAll(name); return values.length === 1 && typeof values[0] === 'string' ? values[0] : ''; };
export const proposalVersion = (value: string) => /^[1-9][0-9]{0,17}$/.test(value);
