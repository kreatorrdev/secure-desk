import Link from 'next/link';
import { redirect } from 'next/navigation';
import { reviewAccess } from '@/lib/registration/access';
import { AccessManagementForms } from '@/components/access-management-forms';
import type { AccessOrganization, AccessTarget } from '@/lib/access/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Access | SecureDesk' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function AccessPage({ searchParams }: PageProps<'/admin/access'>) {
  const access = await reviewAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <main className="min-h-screen bg-slate-50 p-8 text-slate-900"><h1 className="text-2xl font-semibold">Access management unavailable</h1><p className="mt-3">We could not verify your administrator access. Please try again.</p><Link href="/account" className="mt-5 inline-block text-blue-700 underline">Back to your account</Link></main>;
  const params = await searchParams, superAdmin = access.role === 'super_admin';
  const email = typeof params.email === 'string' ? params.email.trim() : '';
  const rawCompany = typeof params.company === 'string' ? params.company : '';
  const invalidCompany = rawCompany !== '' && !uuid.test(rawCompany), companyId = rawCompany && !invalidCompany ? rawCompany : null;
  const search = typeof params.search === 'string' ? [...params.search.trim()].slice(0, 200).join('') : '';
  const [choices, selected] = await Promise.all([
    access.supabase.rpc('admin_access_organizations', { p_search: search }),
    companyId ? access.supabase.rpc('admin_access_organizations', { p_search: '', p_organization_id: companyId }) : Promise.resolve({ data: [], error: null }),
  ]);
  const company = (selected.data as AccessOrganization[] | null)?.[0], available = (choices.data ?? []) as AccessOrganization[];
  const options = available.slice(0, 100);
  if (company && !options.some(option => option.id === company.id)) options.unshift(company);
  const invalidEmail = email !== '' && (![...email].length || [...email].length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const missingCompany = !superAdmin && !companyId;
  const unavailable = Boolean(choices.error || selected.error);
  const invalidSelection = invalidCompany || Boolean(companyId && !company);
  const lookup = email && !invalidEmail && !missingCompany && !unavailable && !invalidSelection
    ? await access.supabase.rpc('admin_access_target', { p_email: email, p_organization_id: companyId }) : null;
  const target = (lookup?.data as AccessTarget[] | null)?.[0];
  const formKey = target ? [target.id, target.access_revision, companyId, target.staff_assignment?.revision, target.admin_assignment?.revision].join(':') : '';
  const anyOperation = target && [target.can_approve_privileged, target.can_change_role, target.can_grant_staff, target.can_revoke_staff, target.can_grant_admin, target.can_revoke_admin].some(Boolean);
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12"><div className="mx-auto max-w-3xl">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4"><Link href="/account" className="font-semibold">SecureDesk</Link><nav aria-label="Administration" className="flex gap-5 text-sm font-medium text-blue-700 underline"><Link href="/admin/requests">Pending Requests</Link><Link href="/account">Your account</Link></nav></header>
    <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{superAdmin ? 'Super Admin · all companies' : 'Organization Admin · assigned companies'}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Manage Access</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">{superAdmin ? 'Approve Staff or Admin registrations, change roles and manage company assignments.' : 'Manage existing Staff assignments and project creation permission for your companies.'} Look up the account by its exact email address.</p>
    {params.notice === 'saved' && <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Access decision saved. The details below show the current access.</p>}
    {unavailable ? <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">We could not load your available companies. Reload to check your current access.</p> : <>
      <form method="get" className="mt-6 rounded-xl border border-slate-200 bg-white p-5"><label htmlFor="access-company-search" className="text-sm font-medium">Find a company</label><input type="hidden" name="email" value={email} />{companyId && <input type="hidden" name="company" value={companyId} />}<div className="mt-2 flex flex-wrap gap-3"><input id="access-company-search" name="search" defaultValue={search} maxLength={200} placeholder="Company name" className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3" /><button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Find companies</button>{search && <Link href={'/admin/access?' + new URLSearchParams({ email, ...(companyId ? { company: companyId } : {}) })} className="self-center text-sm text-blue-700 underline">Clear company search</Link>}</div>{available.length > 100 && <p className="mt-2 text-xs text-slate-600">More than 100 matches. Refine the company name to see other choices.</p>}</form>
      <form method="get" className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5"><input type="hidden" name="search" value={search} /><div><label htmlFor="access-company" className="text-sm font-medium">Company {superAdmin && <span className="font-normal text-slate-500">(optional for global roles)</span>}</label><select id="access-company" name="company" required={!superAdmin} defaultValue={company?.id ?? ''} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"><option value="">{superAdmin ? 'Global roles only' : 'Choose an assigned company'}</option>{options.map(option => <option key={option.id} value={option.id}>{option.name} · {option.status}</option>)}</select>{options.length === 0 && <p className="mt-2 text-sm text-slate-600">{search ? 'No companies match this search.' : superAdmin ? 'There are no companies yet. Global role review is available.' : 'You have no assigned companies. Ask a Super Admin to assign your scope.'}</p>}</div><div><label htmlFor="access-email" className="text-sm font-medium">Exact account email</label><input id="access-email" type="email" name="email" required maxLength={254} defaultValue={email} autoComplete="off" className="mt-2 w-full rounded-lg border border-slate-300 p-3" /></div><button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Look up account</button></form>
    </>}
    {(invalidSelection || invalidEmail || (email && missingCompany)) && <p role="alert" className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{invalidSelection ? 'The selected company is unavailable. Choose a company from your current options.' : invalidEmail ? 'Enter one exact email address, up to 254 characters.' : 'Choose one of your assigned companies before looking up a Staff account.'}</p>}
    {lookup?.error && <p role="alert" className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">We could not load this account in your current scope. Reload and choose the company and account again.</p>}
    {lookup && !lookup.error && !target && <p role="status" className="mt-5 rounded-xl border border-slate-200 bg-white p-5">No available account matches that exact email in this scope.</p>}
    {target && <section data-access-target={target.id} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="break-words text-xl font-semibold">{target.full_name}</h2><p className="mt-2 break-all text-sm text-slate-600">{target.email}</p><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase text-slate-500">Global role</dt><dd className="mt-1 capitalize">{target.app_role.replaceAll('_', ' ')}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Account status</dt><dd className="mt-1 capitalize">{target.account_status}</dd></div>{company && <><div><dt className="text-xs font-semibold uppercase text-slate-500">Selected company</dt><dd className="mt-1 break-words">{company.name} · {company.status}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Company assignment</dt><dd className="mt-1">{target.app_role === 'staff' ? target.staff_assignment?.active ? 'Staff assigned' : 'Staff not assigned' : target.app_role === 'admin' && superAdmin ? target.admin_assignment?.active ? 'Admin assigned' : 'Admin not assigned' : 'No editable assignment'}</dd></div></>}</dl>
      {!target.auth_eligible && <p className="mt-4 text-sm text-amber-900">This account is not eligible for new access grants. Existing privileges can be revoked where available.</p>}
      {superAdmin && target.has_active_membership && <p className="mt-4 text-sm text-slate-600">This Client has active company membership. Handle its membership transition before changing the global role.</p>}
      {target.latest_request?.id && <details open className="mt-5 rounded-lg bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-semibold">Latest registration · attempt {target.latest_request.attempt_number}</summary><dl className="mt-3 space-y-3 text-sm"><div><dt className="font-medium">Submitted company</dt><dd className="break-words">{target.latest_request.company_name}</dd></div><div><dt className="font-medium">Contact phone</dt><dd className="break-words">{target.latest_request.phone}</dd></div><div><dt className="font-medium">Applicant message</dt><dd className="whitespace-pre-wrap break-words">{target.latest_request.message}</dd></div></dl></details>}
      {!anyOperation && <p className="mt-5 text-sm leading-6 text-slate-600">No access changes are available for this account and company. Initial privileged approval requires a confirmed, unrouted Pending request; active company membership and Super Admin accounts have separate controlled workflows.</p>}
      <AccessManagementForms key={formKey} target={target} organizationId={companyId} />
    </section>}
  </div></main>;
}
