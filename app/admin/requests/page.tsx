import Link from 'next/link';
import { redirect } from 'next/navigation';
import { reviewAccess } from '@/lib/registration/access';
import { RegistrationReviewForms } from '@/components/registration-review-forms';
import type { ReviewOrganization, ReviewRequest } from '@/lib/registration/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pending Requests | SecureDesk' };
const pageSize = 10;
const date = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
const notices: Record<string, string> = { approved: 'Client access approved. The company, membership and General Support project are ready.', rejected: 'Request rejected. The applicant can read your explanation.', routed: 'Company route updated. Access has not been approved.' };

export default async function RequestsPage({ searchParams }: PageProps<'/admin/requests'>) {
  const access = await reviewAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <main className="min-h-screen bg-slate-50 p-8 text-slate-900"><h1 className="text-2xl font-semibold">Review access unavailable</h1><p className="mt-3">We could not verify your review access. Please try again.</p><Link href="/account" className="mt-5 inline-block text-blue-700 underline">Back to your account</Link></main>;
  const params = await searchParams;
  const view = params.view === 'reviewed' ? 'reviewed' : 'pending';
  const rawPage = typeof params.page === 'string' ? params.page : '1';
  const page = /^[1-9][0-9]{0,4}$/.test(rawPage) ? Math.min(Number(rawPage), 10001) : 1;
  const search = typeof params.company === 'string' ? params.company.trim().slice(0, 200) : '';
  const [queue, companies] = await Promise.all([
    access.supabase.rpc('admin_registration_queue', { p_view: view, p_limit: pageSize + 1, p_offset: (page - 1) * pageSize }),
    access.supabase.rpc('admin_registration_organizations', { p_search: search }),
  ]);
  const unavailable = Boolean(queue.error || companies.error);
  const rows = (queue.data ?? []) as ReviewRequest[], organizations = ((companies.data ?? []) as ReviewOrganization[]).slice(0, 100);
  const url = (nextPage: number) => '/admin/requests?' + new URLSearchParams({ view, page: String(nextPage), ...(search ? { company: search } : {}) });
  const notice = typeof params.notice === 'string' ? notices[params.notice] : undefined;
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12"><div className="mx-auto max-w-4xl">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4"><Link href="/account" className="flex items-center gap-3 font-semibold"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-sm text-white">SD</span>SecureDesk</Link><nav aria-label="Administration" className="flex gap-5 text-sm font-medium text-blue-700 underline underline-offset-4"><Link href="/admin/access">Manage Access</Link><Link href="/account">Back to your account</Link></nav></header>
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{access.role === 'super_admin' ? 'Super Admin · all companies' : 'Organization Admin · assigned companies'}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Pending Requests</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Review the applicant and company details before granting access. Email confirmation verifies an address; your approval grants company access.</p></div>
    {notice && <p role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{notice}</p>}
    <nav aria-label="Request views" className="mb-6 flex gap-2"><Link href="/admin/requests" aria-current={view === 'pending' ? 'page' : undefined} className={'rounded-lg px-4 py-2.5 text-sm font-semibold ' + (view === 'pending' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700')}>Pending</Link><Link href="/admin/requests?view=reviewed" aria-current={view === 'reviewed' ? 'page' : undefined} className={'rounded-lg px-4 py-2.5 text-sm font-semibold ' + (view === 'reviewed' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700')}>Decision history</Link></nav>
    {access.role === 'super_admin' && view === 'pending' && <form method="get" className="mb-6 rounded-xl border border-slate-200 bg-white p-4"><label htmlFor="company-search" className="text-sm font-medium">Find existing companies for routing</label><div className="mt-2 flex flex-wrap gap-3"><input id="company-search" name="company" defaultValue={search} maxLength={200} placeholder="Company name" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5" /><button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Find companies</button>{search && <Link href="/admin/requests" className="self-center text-sm text-blue-700 underline">Clear</Link>}</div><p className="mt-2 text-xs leading-5 text-slate-500">This search changes company choices in the routing forms. It does not filter requests.{(companies.data?.length ?? 0) > 100 && ' More than 100 matches. Refine the company name.'}</p></form>}
    {unavailable ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">We could not load this review page. Refresh to recheck your current permissions and try again.</p> : <>
      <h2 className="sr-only">{view === 'pending' ? 'Requests awaiting a decision' : 'Reviewed requests'}</h2>
      {rows.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-8"><p className="font-semibold">{page > 1 ? 'No requests on this page' : view === 'pending' ? 'No pending requests in your scope' : 'No decisions in your scope yet'}</p><p className="mt-2 text-sm text-slate-600">{page > 1 ? 'Return to an earlier page.' : 'New requests or decisions will appear here.'}</p></div>}
      <div className="space-y-6">{rows.slice(0, pageSize).map(request => <article key={request.id} data-request-card={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-xl font-semibold">{request.company_name_text}</h3><p className="mt-2 break-words text-sm font-medium">{request.full_name}</p><p className="mt-1 break-all text-sm text-slate-600">{request.email}</p></div><span className={'rounded-full px-3 py-1 text-xs font-semibold capitalize ' + (request.status === 'pending' ? 'bg-amber-50 text-amber-800' : request.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800')}>{request.status}</span></div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submission</dt><dd className="mt-1">Attempt {request.attempt_number} · {date(request.created_at)}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email confirmation</dt><dd className="mt-1">{request.email_confirmed ? 'Confirmed' : 'Awaiting confirmation'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact phone</dt><dd className="mt-1 break-words">{request.phone}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company route</dt><dd className="mt-1 break-words">{request.organization_name ? request.organization_name + ' · ' + request.organization_status : 'Unrouted · Super Admin review'}</dd></div></dl>
        <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicant message</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{request.message}</p></div>
        {request.organization_details && <details className="mt-4 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Stored company details</summary><CompanyDetails company={request.organization_details} /></details>}
        {access.role === 'super_admin' && request.status === 'pending' && request.can_approve && !request.target_organization_id && <Link href={'/admin/access?' + new URLSearchParams({ email: request.email })} className="mt-4 inline-block text-sm font-semibold text-blue-700 underline">Review Staff or Admin access</Link>}
        {request.status === 'pending' && request.can_review && <RegistrationReviewForms request={request} organizations={organizations} superAdmin={access.role === 'super_admin'} />}
        {request.status === 'pending' && !request.can_review && <p className="mt-4 text-sm text-slate-500">This account is not eligible for the initial Client review workflow.</p>}
        {request.reviewed_at && <p className="mt-4 text-sm text-slate-600">Decision recorded {date(request.reviewed_at)}</p>}
        {request.rejection_reason && <div className="mt-4 rounded-lg bg-red-50 p-4"><p className="text-xs font-semibold uppercase text-red-800">Reason shared with applicant</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-red-900">{request.rejection_reason}</p></div>}
      </article>)}</div>
      <nav aria-label="Request pages" className="mt-6 flex items-center justify-between gap-4 text-sm"><div>{page > 1 && <Link href={url(page - 1)} className="font-medium text-blue-700 underline">Previous page</Link>}</div><span className="text-slate-600">Page {page}</span><div>{rows.length > pageSize && page < 10001 && <Link href={url(page + 1)} className="font-medium text-blue-700 underline">Next page</Link>}</div></nav>
    </>}
  </div></main>;
}


function CompanyDetails({ company }: { company: ReviewOrganization }) {
  const items = [['Address', company.address], ['Company email', company.email], ['Company phone', company.phone], ['Description', company.description], ['Industry', company.industry], ['Contact person', company.contact_person]];
  return <dl className="mt-4 space-y-3 text-sm">{items.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>;
}
