'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { proposalField as field, proposalVersion as version, type ProposalState } from '@/lib/organizations/proposals';

export async function saveProposal(_state: ProposalState, form: FormData): Promise<ProposalState> {
 const access = await organizationAccess();
 if (access.kind !== 'allowed') return { message: 'Your proposal access is unavailable. Refresh the page.' };
 const org = field(form, 'organization_id'), id = field(form, 'proposal_id'), intent = field(form, 'intent'), actorVersion = field(form, 'access_revision'), scopeVersion = field(form, 'assignment_revision'), revision = field(form, 'revision');
 if (!organizationIdPattern.test(org) || !organizationIdPattern.test(id) || !version(actorVersion) || (scopeVersion !== '' && !version(scopeVersion)) || !['submit', 'assign', 'recommend', 'approve', 'reject'].includes(intent) || (intent !== 'submit' && !version(revision))) return { message: 'This form is invalid. Refresh the page.' };
 const base = { p_organization_id: org, p_proposal_id: id, p_expected_access_revision: actorVersion, p_expected_assignment_revision: scopeVersion || null };
 let result;
 const values: Record<string, string> = {};
 if (intent === 'submit') {
  for (const name of ['title', 'description', 'reason', 'desired_deadline', 'proposed_priority']) values[name] = field(form, name).trim();
  if (!values.title || [...values.title].length > 200 || !values.description || [...values.description].length > 4000 || !values.reason || [...values.reason].length > 4000 || !/^\d{4}-\d{2}-\d{2}$/.test(values.desired_deadline) || !['Low', 'Medium', 'High', 'Critical'].includes(values.proposed_priority)) return { message: 'Enter the title, description, reason, desired deadline and estimated priority.', values: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.slice(0, 4000)])) };
  result = await access.supabase.rpc('submit_project_proposal', { ...base, p_details: values });
 } else {
  const reviewer = field(form, 'reviewer_id'), text = field(form, 'text').trim();
  if (reviewer && !organizationIdPattern.test(reviewer)) return { message: 'Select an eligible Staff reviewer.' };
  if (text.length > 4000 || (['recommend', 'reject'].includes(intent) && !text)) return { message: 'Enter a recommendation or rejection reason of 1 to 4000 characters.' };
  result = await access.supabase.rpc('review_project_proposal', { ...base, p_expected_revision: revision, p_intent: intent, p_reviewer_id: intent === 'assign' ? reviewer || null : null, p_text: intent === 'assign' ? null : text || null });
 }
 if (result.error) return { message: result.error.code === '40001' ? 'This proposal or your permissions have changed, or an upload is in progress. Reload before trying again.' : result.error.code === '22023' ? 'These details cannot be saved. Check the fields, reviewer and company status. Final decisions cannot change.' : 'Your proposal access is unavailable. Refresh the page.', ...(intent === 'submit' ? { values: Object.fromEntries(Object.entries(values).map(([k,v]) => [k,v.slice(0,4000)])) } : {}) };
 const path = '/organizations/' + org;
 revalidatePath(path + '/proposals', 'layout'); revalidatePath(path + '/projects', 'layout');
 redirect(path + '/proposals/' + id + '?notice=' + intent);
}
