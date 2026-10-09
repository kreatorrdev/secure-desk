'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { ticketPath, type TicketFormState } from '@/lib/tickets/types';
const field = (f: FormData, name: string) => { const all = f.getAll(name); return all.length === 1 && typeof all[0] === 'string' ? all[0] : ''; };
const version = (s: string) => /^[1-9][0-9]{0,17}$/.test(s);
export async function ticketAction(_state: TicketFormState, form: FormData): Promise<TicketFormState> {
  const access = await organizationAccess();
  if (access.kind !== 'allowed') return { message: 'Your ticket access is unavailable. Refresh the page.' };
  const org = field(form, 'organization_id'), id = field(form, 'ticket_id'), intent = field(form, 'intent');
  const accessVersion = field(form, 'access_revision'), scope = field(form, 'scope_revision');
  if (!organizationIdPattern.test(org) || !organizationIdPattern.test(id) || !version(accessVersion) || (scope !== '' && !version(scope) && !organizationIdPattern.test(scope))) return { message: 'This form is invalid. Reload the page.' };
  const common = { p_organization_id: org, p_ticket_id: id, p_expected_access_revision: accessVersion, p_expected_scope: scope || null };
  let result;
  const title = field(form, 'title').trim(), description = field(form, 'description').trim(), body = field(form, 'body').trim();
  const reason = field(form, 'reason').trim();
  const values = { title: title.slice(0, 400), description: description.slice(0, 10000), body: body.slice(0, 10000), reason: reason.slice(0, 4000) };
  if (intent === 'create') {
    const project = field(form, 'project_id'), client = field(form, 'client_user_id');
    if (!organizationIdPattern.test(project) || !organizationIdPattern.test(client) || !title || [...title].length > 200 || !description || [...description].length > 8000) return { message: 'Select a project and Client. Enter a title of 1 to 200 characters and a description of 1 to 8000 characters.', values };
    result = await access.supabase.rpc('create_ticket', { ...common, p_project_id: project, p_client_user_id: client, p_details: { title, description } });
   } else if (['accept_solution', 'request_reopen', 'approve_reopen', 'reject_reopen', 'admin_close'].includes(intent)) {
    const required = ['organization_id', 'ticket_id', 'intent', 'access_revision', 'scope_revision', 'revision'];
    if (intent === 'request_reopen') required.push('request_id', 'reason');
    if (intent === 'approve_reopen' || intent === 'reject_reopen') required.push('request_id', 'request_revision', intent === 'approve_reopen' ? 'owner_staff_user_id' : 'reason');
    if (intent === 'admin_close') required.push('reason');
    // Hidden values are untrusted. Reject duplicate/missing fields and added actor/status fields.
    if (required.some(name => form.getAll(name).length !== 1 || typeof form.get(name) !== 'string') || [...form.keys()].some(name => !name.startsWith('$ACTION_') && !required.includes(name))) return { message: 'This form is invalid. Reload the page.', values };
    const revision = field(form, 'revision'), request = field(form, 'request_id'), requestRevision = field(form, 'request_revision'), owner = field(form, 'owner_staff_user_id');
    if (!version(revision) || (['request_reopen', 'approve_reopen', 'reject_reopen'].includes(intent) && !organizationIdPattern.test(request)) || (['approve_reopen', 'reject_reopen'].includes(intent) && !version(requestRevision)) || (owner !== '' && !organizationIdPattern.test(owner))) return { message: 'This form is invalid. Reload the page.', values };
    const needsReason = ['request_reopen', 'reject_reopen', 'admin_close'].includes(intent), limit = intent === 'reject_reopen' ? 1000 : 2000;
    if (needsReason && (!reason || [...reason].length > limit)) return { message: 'Enter a reason of 1 to ' + limit + ' characters.', values };
    const fresh = { ...common, p_expected_revision: revision };
    if (intent === 'request_reopen') result = await access.supabase.rpc('request_ticket_reopen', { ...fresh, p_request_id: request, p_reason: reason });
    else if (intent === 'approve_reopen' || intent === 'reject_reopen') result = await access.supabase.rpc('review_ticket_reopen', { ...fresh, p_request_id: request, p_expected_request_revision: requestRevision, p_intent: intent === 'approve_reopen' ? 'approve' : 'reject', p_reason: intent === 'reject_reopen' ? reason : null, p_owner_staff_user_id: intent === 'approve_reopen' ? owner || null : null });
    else result = await access.supabase.rpc('close_resolved_ticket', { ...fresh, p_intent: intent === 'accept_solution' ? 'accept' : 'admin_close', p_reason: intent === 'admin_close' ? reason : null });
  } else if (intent === 'comment' || intent === 'edit_comment') {
    const comment = field(form, 'comment_id'), revision = field(form, 'comment_revision');
    if (!organizationIdPattern.test(comment) || (intent === 'edit_comment' && !version(revision)) || !body || [...body].length > 8000) return { message: 'Enter a comment of 1 to 8000 characters.', values };
    result = await access.supabase.rpc('write_ticket_comment', { ...common, p_comment_id: comment, p_expected_comment_revision: intent === 'edit_comment' ? revision : null, p_body: body });
  } else if (intent === 'request_sharing') {
    const request = field(form, 'request_id'), candidate = field(form, 'candidate_id');
    if (!organizationIdPattern.test(request) || !organizationIdPattern.test(candidate)) return { message: 'Select another Client in this company.' };
    result = await access.supabase.rpc('request_ticket_participant', { ...common, p_request_id: request, p_candidate_client_id: candidate });
  } else if (intent === 'approve_sharing' || intent === 'reject_sharing') {
    const request = field(form, 'request_id'), revision = field(form, 'request_revision'), reason = field(form, 'reason').trim();
    if (!organizationIdPattern.test(request) || !version(revision) || (intent === 'reject_sharing' && (!reason || [...reason].length > 1000))) return { message: 'Enter a rejection reason of 1 to 1000 characters.' };
    result = await access.supabase.rpc('review_ticket_participant', { ...common, p_request_id: request, p_expected_request_revision: revision, p_intent: intent === 'approve_sharing' ? 'approve' : 'reject', p_reason: intent === 'reject_sharing' ? reason : null });
  } else {
    const revision = field(form, 'revision'), value = field(form, 'value');
    if (!version(revision)) return { message: 'This form is invalid. Reload the page.' };
    if (intent === 'revoke_sharing') {
      if (!organizationIdPattern.test(value)) return { message: 'Select a Client participant.' };
      result = await access.supabase.rpc('revoke_ticket_participant', { ...common, p_expected_revision: revision, p_client_user_id: value });
    } else if (['owner', 'priority', 'status', 'add_collaborator', 'remove_collaborator'].includes(intent)) {
      if (['owner', 'add_collaborator', 'remove_collaborator'].includes(intent) && !(intent === 'owner' && value === '') && !organizationIdPattern.test(value)) return { message: 'Select an assigned Staff member.' };
      result = await access.supabase.rpc('manage_ticket', { ...common, p_expected_revision: revision, p_intent: intent, p_value: value });
    } else return { message: 'This form is invalid. Reload the page.' };
  }
  if (result.error) return { message: result.error.code === '40001' ? 'This record or your permissions changed. Reload before trying again.' : result.error.code === '22023' ? (intent === 'edit_comment' ? 'The comment cannot be edited. The 15-minute window may have ended.' : 'This change is not allowed. Check the current status and required fields.') : 'Your ticket access is unavailable. Refresh the page.', values };
  revalidatePath('/dashboard'); revalidatePath('/tickets'); revalidatePath('/organizations/' + org + '/tickets', 'layout');
  // Creating on behalf does not imply permission to read the new ticket.
  if (intent === 'create' && access.role === 'staff') redirect('/tickets?notice=created');
  const notices: Record<string, string> = { accept_solution: 'accepted', request_reopen: 'continuation_requested', approve_reopen: 'continuation_approved', reject_reopen: 'continuation_rejected', admin_close: 'admin_closed' };
  redirect(ticketPath(org, id) + '?notice=' + (notices[intent] ?? (intent === 'create' ? 'created' : 'saved')));
}
