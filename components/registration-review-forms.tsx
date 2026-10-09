'use client';

import { useActionState, useId } from 'react';
import { submitReview } from '@/app/admin/requests/actions';
import type { ReviewOrganization, ReviewRequest, ReviewState } from '@/lib/registration/types';

const initial: ReviewState = {};
function Field({ name, label, state, initialValue, maxLength, multiline = false, optional = false, type = 'text' }: { name: string; label: string; state: ReviewState; initialValue?: string; maxLength: number; multiline?: boolean; optional?: boolean; type?: string }) {
  const id = useId(), error = state.errors?.[name];
  const props = { id, name, required: !optional, maxLength, defaultValue: state.values?.[name] ?? initialValue, 'aria-invalid': Boolean(error), 'aria-describedby': error ? id + '-error' : undefined, className: 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100' };
  return <div><label htmlFor={id} className="text-sm font-medium">{label}{optional && <span className="font-normal text-slate-500"> (optional)</span>}</label>{multiline ? <textarea {...props} rows={3} /> : <input {...props} type={type} />}{error && <p id={id + '-error'} className="mt-1 text-sm text-red-700">{error}</p>}</div>;
}
function Verified({ state }: { state: ReviewState }) {
  const id = useId();
  return <div><label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="verified" value="yes" required aria-describedby={state.errors?.verified ? id : undefined} className="mt-1 h-4 w-4 shrink-0 accent-blue-700" /><span>I checked the applicant and company details. This decision grants Client access to this company.</span></label>{state.errors?.verified && <p id={id} className="mt-1 text-sm text-red-700">{state.errors.verified}</p>}</div>;
}
function ReviewForm({ requestId, intent, label, danger = false, children }: { requestId: string; intent: string; label: string; danger?: boolean; children: (state: ReviewState) => React.ReactNode }) {
  const [state, action, pending] = useActionState(submitReview, initial);
  return <form action={action} data-review={intent} data-request={requestId} aria-busy={pending} className="space-y-4">
    <input type="hidden" name="request_id" value={requestId} /><input type="hidden" name="intent" value={intent} />
    {state.message && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">{state.message}</p>}
    {Object.keys(state.errors ?? {}).length > 0 && <p role="alert" className="text-sm text-red-700">Check the fields below. Nothing has been saved.</p>}
    {children(state)}
    <button type="submit" disabled={pending} className={'rounded-lg px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60 ' + (danger ? 'bg-red-700 hover:bg-red-800 focus-visible:outline-red-700' : 'bg-blue-700 hover:bg-blue-800 focus-visible:outline-blue-700')}>{pending ? 'Saving…' : label}</button>
  </form>;
}
function Choice({ state, organizations, selected }: { state: ReviewState; organizations: ReviewOrganization[]; selected: string | null }) {
  const id = useId(), error = state.errors?.organization_id;
  return <div><label htmlFor={id} className="text-sm font-medium">Verified existing company</label><select id={id} name="organization_id" required defaultValue={state.values?.organization_id ?? selected ?? ''} aria-invalid={Boolean(error)} aria-describedby={error ? id + '-error' : undefined} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-base"><option value="">Choose a company</option>{organizations.map(org => <option key={org.id} value={org.id}>{org.name} · {org.status}</option>)}</select>{error && <p id={id + '-error'} className="mt-1 text-sm text-red-700">{error}</p>}</div>;
}
export function RegistrationReviewForms({ request, organizations, superAdmin }: { request: ReviewRequest; organizations: ReviewOrganization[]; superAdmin: boolean }) {
  const canApprove = request.can_approve && (!request.target_organization_id || ['pending', 'active'].includes(request.organization_status ?? ''));
  return <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
    {superAdmin && <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Route to an existing company</summary><div className="mt-4 space-y-4"><p className="text-sm leading-6 text-slate-600">Routing lets the company&apos;s assigned administrators review this request. It does not approve access.</p><ReviewForm requestId={request.id} intent="route" label="Save company route">{state => <Choice state={state} organizations={organizations} selected={request.target_organization_id} />}</ReviewForm>{request.target_organization_id && <ReviewForm requestId={request.id} intent="unroute" label="Return to the unrouted queue">{() => null}</ReviewForm>}</div></details>}
    {canApprove && request.target_organization_id && <details className="rounded-xl border border-blue-200 bg-blue-50/40 p-4"><summary className="cursor-pointer text-sm font-semibold">Approve for {request.organization_name}</summary><div className="mt-4 space-y-4"><p className="text-sm leading-6 text-slate-600">Approval activates the Client membership and ensures one General Support project. A pending company becomes active.</p><ReviewForm requestId={request.id} intent="approve" label="Approve Client access">{state => <><input type="hidden" name="organization_id" value={request.target_organization_id!} /><Verified state={state} /></>}</ReviewForm></div></details>}
    {superAdmin && canApprove && !request.target_organization_id && <details className="rounded-xl border border-blue-200 bg-blue-50/40 p-4"><summary className="cursor-pointer text-sm font-semibold">Approve with a new company</summary><div className="mt-4 space-y-4"><p className="text-sm leading-6 text-slate-600">Verify these company details first. Approval creates the active company, Client membership and General Support project together.</p><ReviewForm requestId={request.id} intent="approve-new" label="Create company and approve">{state => <><Field name="name" label="Company name" initialValue={request.company_name_text} maxLength={200} state={state} /><Field name="address" label="Company address" maxLength={1000} state={state} /><div className="grid gap-4 sm:grid-cols-2"><Field name="email" label="Company email" type="email" maxLength={254} state={state} /><Field name="phone" label="Company phone" type="tel" maxLength={40} state={state} /></div><Field name="description" label="Company description" multiline maxLength={4000} state={state} /><div className="grid gap-4 sm:grid-cols-2"><Field name="industry" label="Industry" optional maxLength={200} state={state} /><Field name="contact_person" label="Contact person" optional maxLength={120} state={state} /></div><Verified state={state} /></>}</ReviewForm></div></details>}
    {!canApprove && <p className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">Approval is currently unavailable. The applicant must have a confirmed, eligible account and the company must be pending or active. You can still review a rejection.</p>}
    <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-red-800">Reject this request</summary><div className="mt-4"><ReviewForm requestId={request.id} intent="reject" label="Reject request" danger>{state => <Field name="reason" label="Reason shown to the applicant" multiline maxLength={2000} state={state} />}</ReviewForm></div></details>
  </div>;
}

