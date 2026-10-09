'use client';

import { useActionState, useId } from 'react';
import { submitAccess } from '@/app/admin/access/actions';
import type { AccessIntent, AccessState, AccessTarget } from '@/lib/access/types';

function Reason({ state }: { state: AccessState }) {
  const id = useId();
  return <div><label htmlFor={id} className="text-sm font-medium">Business reason</label><textarea id={id} name="reason" required maxLength={2000} rows={3} defaultValue={state.values?.reason ?? ''} aria-invalid={Boolean(state.errors?.reason)} aria-describedby={state.errors?.reason ? id + '-error' : undefined} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />{state.errors?.reason && <p id={id + '-error'} className="mt-1 text-sm text-red-700">{state.errors.reason}</p>}</div>;
}
function RoleChoice({ target, state, initial }: { target: AccessTarget; state: AccessState; initial: boolean }) {
  const id = useId(), options = initial ? ['staff', 'admin'] : ['client', 'staff', 'admin'].filter(role => role !== target.app_role && (target.auth_eligible || role === 'client'));
  return <div><label htmlFor={id} className="text-sm font-medium">{initial ? 'Approved role' : 'New role'}</label><select id={id} name="new_role" required defaultValue={state.values?.new_role ?? ''} aria-invalid={Boolean(state.errors?.new_role)} aria-describedby={state.errors?.new_role ? id + '-error' : undefined} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"><option value="">Choose a role</option>{options.map(role => <option key={role} value={role}>{role === 'admin' ? 'Organization Admin' : role === 'staff' ? 'Staff' : 'Client'}</option>)}</select>{state.errors?.new_role && <p id={id + '-error'} className="mt-1 text-sm text-red-700">{state.errors.new_role}</p>}</div>;
}
function AccessForm({ target, organizationId, intent, label, effect }: { target: AccessTarget; organizationId: string | null; intent: AccessIntent; label: string; effect: string }) {
  const [state, action, pending] = useActionState(submitAccess, {});
  const verifiedId = useId(), permissionId = useId();
  const assignment = intent.startsWith('staff-') ? target.staff_assignment : target.admin_assignment;
  const danger = intent.endsWith('revoke') || intent === 'role';
  return <form action={action} data-access={intent} data-user={target.id} aria-busy={pending} className="mt-5 space-y-4 border-t border-slate-200 pt-5">
    <h3 className="font-semibold">{label}</h3><p className="text-sm leading-6 text-slate-600">{effect}</p>
    <input type="hidden" name="intent" value={intent} /><input type="hidden" name="email" value={target.email} /><input type="hidden" name="user_id" value={target.id} /><input type="hidden" name="organization_id" value={organizationId ?? 'none'} /><input type="hidden" name="access_revision" value={target.access_revision} />
    {intent === 'approve-role' && <input type="hidden" name="request_id" value={target.latest_request!.id} />}
    {intent.includes('grant') || intent.includes('revoke') ? <input type="hidden" name="assignment_revision" value={assignment?.revision ?? 'none'} /> : null}
    {state.message && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{state.message}</p>}
    {Object.keys(state.errors ?? {}).length > 0 && <p role="alert" className="text-sm text-red-700">Check the fields below. Nothing has been saved.</p>}
    {(intent === 'role' || intent === 'approve-role') && <RoleChoice target={target} state={state} initial={intent === 'approve-role'} />}
    {intent === 'staff-grant' && <div><label htmlFor={permissionId} className="text-sm font-medium">May create projects in this company</label><select id={permissionId} name="can_create_project" defaultValue={state.values?.can_create_project ?? (target.staff_assignment?.active && target.staff_assignment.can_create_project ? 'yes' : 'no')} aria-invalid={Boolean(state.errors?.can_create_project)} aria-describedby={state.errors?.can_create_project ? permissionId + '-error' : undefined} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"><option value="no">No</option><option value="yes">Yes</option></select>{state.errors?.can_create_project && <p id={permissionId + '-error'} className="mt-1 text-sm text-red-700">{state.errors.can_create_project}</p>}</div>}
    <Reason state={state} />
    <div><label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="verified" value="yes" required aria-invalid={Boolean(state.errors?.verified)} aria-describedby={state.errors?.verified ? verifiedId : undefined} className="mt-1 h-4 w-4 shrink-0 accent-blue-700" /><span>I checked this account and understand the change described above.</span></label>{state.errors?.verified && <p id={verifiedId} className="mt-1 text-sm text-red-700">{state.errors.verified}</p>}</div>
    <button disabled={pending} type="submit" className={'rounded-lg px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60 ' + (danger ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-700 hover:bg-blue-800')}>{pending ? 'Saving…' : label}</button>
  </form>;
}
export function AccessManagementForms({ target, organizationId }: { target: AccessTarget; organizationId: string | null }) {
  return <>
    {target.can_approve_privileged && <AccessForm target={target} organizationId={organizationId} intent="approve-role" label="Approve Staff or Admin access" effect="Approves this registration and its chosen role. Company access requires a separate assignment. No Client membership or company is created." />}
    {target.can_change_role && <AccessForm target={target} organizationId={organizationId} intent="role" label="Change global role" effect="Changing the role revokes all existing Staff and Admin company assignments, including project creation permission. A Client role has no company membership until separately approved." />}
    {organizationId && <>
      {target.can_grant_staff && <AccessForm target={target} organizationId={organizationId} intent="staff-grant" label={target.staff_assignment?.active ? 'Update Staff permissions' : 'Assign Staff to this company'} effect="Gives Staff access to active projects in the selected company. Project creation is a separate permission. Ticket access will require an explicit ticket assignment." />}
      {target.can_revoke_staff && <AccessForm target={target} organizationId={organizationId} intent="staff-revoke" label="Revoke Staff access" effect="Removes this company's Staff access and project creation permission immediately. Assignments in other companies remain in place." />}
      {target.can_grant_admin && !target.admin_assignment?.active && <AccessForm target={target} organizationId={organizationId} intent="admin-grant" label="Assign Admin to this company" effect="Gives this approved Admin administrative scope for the selected company. It does not grant global Super Admin privileges." />}
      {target.can_revoke_admin && <AccessForm target={target} organizationId={organizationId} intent="admin-revoke" label="Revoke Admin access" effect="Removes administrative scope for this company immediately. The global Admin role and other company assignments remain in place." />}
    </>}
  </>;
}
