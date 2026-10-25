import Link from 'next/link';
import { OrganizationCodeEntry } from '@/components/organization-code-entry';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthShell } from '@/components/auth-shell';
import { SignOutForm } from '@/components/auth-forms';
import { RegistrationRetryForm } from '@/components/registration-retry-form';
import type { RetryDetails } from '@/lib/registration/retry-types';

export const dynamic = 'force-dynamic';
const dates = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
const historySize = 5;
const notices: Record<string, string> = {
  'code-submitted': 'Your request has been sent for company review. You remain pending until an administrator approves it.',
  resubmitted: 'Your new request has been submitted. Your account is pending administrator review.',
  'retry-unavailable': 'This form is no longer available. Check your current status and latest request before submitting again.',
};

export default async function AccountPage({ searchParams }: PageProps<'/account'>) {
  const supabase = await createClient();
  // A fresh server-verified identity; cookies and user metadata grant no permissions.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email_confirmed_at) redirect('/login');
  const params = await searchParams;
  const rawPage = typeof params.history === 'string' ? params.history : '1';
  const historyPage = /^[1-9][0-9]{0,4}$/.test(rawPage) ? Math.min(Number(rawPage), 10001) : 1;
  const [profile, request, role] = await Promise.all([
    supabase.from('profiles').select('account_status').eq('id', user.id).maybeSingle(),
    supabase.from('registration_requests').select('id,attempt_number,status,rejection_reason').eq('user_id', user.id).order('attempt_number', { ascending: false }).limit(1).maybeSingle(),
    supabase.rpc('current_account_role'),
  ]);
  const canReview = !role.error && ['admin', 'super_admin'].includes(role.data);
  const unavailable = Boolean(profile.error || !profile.data || request.error || !request.data);
  const status = profile.data?.account_status;
  const [retry, history, codeEntry] = await Promise.all([
    !unavailable && status === 'rejected' && request.data?.status === 'rejected'
      ? supabase.rpc('own_registration_retry_details') : Promise.resolve({ data: null, error: null }),
    request.data && !unavailable
      ? supabase.from('registration_requests').select('id,attempt_number,status,rejection_reason,reviewed_at')
        .eq('user_id', user.id).neq('id', request.data.id).in('status', ['approved', 'rejected'])
        .order('attempt_number', { ascending: false }).range((historyPage - 1) * historySize, (historyPage - 1) * historySize + historySize)
      : Promise.resolve({ data: null, error: null }),
    !unavailable && status === 'pending' ? supabase.rpc('own_organization_code_entry') : Promise.resolve({ data: null, error: null }),
  ]);
  const details = (retry.data as RetryDetails[] | null)?.[0];
  const description = unavailable ? 'We could not load your request status. Please try again later.'
    : status === 'pending' ? 'Your email is confirmed. An administrator will review your access request.'
      : status === 'rejected' ? 'Your request was declined. Read the response and update your request below.' : 'Your account has been approved.';
  const notice = typeof params.notice === 'string' ? notices[params.notice] : undefined;

  return <AuthShell title="Your access request" description={description}>
    <p className="break-all text-sm text-slate-600">Signed in as <span className="font-medium text-slate-900">{user.email}</span></p>
    {notice && <p role="status" className="mt-5 rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-900">{notice}</p>}
    {!unavailable && request.data && <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account status</p><p className="mt-2 text-lg font-semibold capitalize">{status}</p>
      <p className="mt-3 text-sm text-slate-600">Request #{request.data.attempt_number}: <span className="font-medium capitalize">{request.data.status}</span></p>
      {request.data.rejection_reason && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administrator response</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{request.data.rejection_reason}</p></div>}
    </div>}
    {codeEntry.data === 'available' && <OrganizationCodeEntry />}
    {codeEntry.data === 'submitted' && <p className="mt-5 rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-900">Your organization code has been submitted. An administrator must review your request before you receive access.</p>}
    {codeEntry.error && <p role="alert" className="mt-5 text-sm text-amber-900">We could not check the organization code form. Refresh to try again.</p>}
    {retry.error && <p role="alert" className="mt-5 text-sm text-amber-900">We could not load the new request form. Refresh to check your current eligibility.</p>}
    {details && <RegistrationRetryForm key={details.request_id} details={details} />}
    {history.error ? <p role="alert" className="mt-5 text-sm text-amber-900">We could not load your previous decisions. Please refresh.</p> : ((history.data?.length ?? 0) > 0 || historyPage > 1) && <details open={historyPage > 1} className="mt-6 rounded-xl border border-slate-200 p-4">
      <summary className="cursor-pointer text-sm font-semibold">Previous decisions</summary><div className="mt-4 space-y-4">
        {history.data?.length === 0 && <p className="text-sm text-slate-600">No earlier decisions on this page.</p>}
        {history.data?.slice(0, historySize).map(earlier => <article key={earlier.id} data-own-decision={earlier.id} className="rounded-lg bg-slate-50 p-4"><h2 className="text-sm font-semibold">Request #{earlier.attempt_number} · <span className="capitalize">{earlier.status}</span></h2>{earlier.reviewed_at && <p className="mt-1 text-xs text-slate-500">{dates(earlier.reviewed_at)}</p>}{earlier.rejection_reason && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{earlier.rejection_reason}</p>}</article>)}
        <nav aria-label="Your decision history pages" className="flex items-center justify-between gap-3 text-sm"><div>{historyPage > 1 && <Link href={'/account?history=' + (historyPage - 1)} className="text-blue-700 underline">Newer decisions</Link>}</div><span className="text-slate-500">Page {historyPage}</span><div>{(history.data?.length ?? 0) > historySize && historyPage < 10001 && <Link href={'/account?history=' + (historyPage + 1)} className="text-blue-700 underline">Older decisions</Link>}</div></nav>
      </div>
    </details>}
    {canReview && <Link href="/admin/requests" className="mt-6 block rounded-lg bg-blue-700 px-4 py-3 text-center font-semibold text-white hover:bg-blue-800">Open Pending Requests</Link>}
    {canReview && <Link href="/admin/audit" prefetch={false} className="mt-3 block rounded-lg border border-blue-700 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50">Audit history</Link>}
    {canReview && <Link href="/admin/access" className="mt-3 block rounded-lg border border-blue-700 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50">Manage Access</Link>}
    {!role.error && ['client', 'staff', 'admin', 'super_admin'].includes(role.data) && <Link href="/organizations" prefetch={false} className="mt-3 block rounded-lg border border-blue-700 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50">Your organizations</Link>}
    {!role.error && role.data === 'client' && <Link href="/organizations/transfer" prefetch={false} className="mt-3 block rounded-lg border border-blue-700 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50">Your organization transfer</Link>}
    {canReview && <Link href="/organizations/transfers" prefetch={false} className="mt-3 block rounded-lg border border-blue-700 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50">Review transfers</Link>}
    {!role.error && ["client", "staff", "admin", "super_admin"].includes(role.data) && <Link href="/dashboard" prefetch={false} className="mt-3 block rounded-lg border border-blue-700 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50">Your dashboard</Link>}<SignOutForm />
  </AuthShell>;
}
