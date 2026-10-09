import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { organizationAccess } from '@/lib/organizations/access';
import { OrganizationUnavailable } from '@/components/organization-state';
import { TransferCard } from '@/components/organization-transfer-card';
import type { TransferRequest } from '@/lib/organizations/transfers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Review organization transfers | SecureDesk' };
const notices: Record<string, string> = { consent: 'Your company approval is recorded. The transfer still requires a valid approval from the other company.', approved: 'Transfer completed. The previous company access has ended.', rejected: 'Transfer rejected. Membership has not changed.' };
export default async function TransfersPage({ searchParams }: PageProps<'/organizations/transfers'>) {
  const access = await organizationAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <OrganizationUnavailable />;
  if (!['admin', 'super_admin'].includes(access.role)) notFound();
  const query = await searchParams;
  const view = typeof query.view === 'string' && ['pending', 'reviewed', 'all'].includes(query.view) ? query.view : 'pending';
  const page = typeof query.page === 'string' && /^[1-9][0-9]{0,3}$/.test(query.page) ? Number(query.page) : 1;
  const result = await access.supabase.rpc('organization_transfer_requests', { p_status: view, p_offset: (page - 1) * 25 });
  if (result.error) return <OrganizationUnavailable />;
  const requests = (result.data ?? []) as TransferRequest[], notice = typeof query.notice === 'string' ? notices[query.notice] : undefined;
  return <article>
    <Link href="/organizations" className="org-link text-sm">← Your organizations</Link>
    <p className="org-eyebrow mt-8">Organization administration</p><h1 className="mt-2 text-3xl font-semibold">Review organization transfers</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--org-muted)]">Review transfers involving your companies. Both companies must approve, or a Super Admin can approve the complete transfer. A pending request keeps the current membership in place.</p>
    {notice && <p role="status" className="org-panel mt-5 text-sm">{notice}</p>}
    <form className="mt-6 flex flex-wrap items-end gap-3"><label className="text-sm">Status<select name="view" defaultValue={view} className="mt-2 block rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-3"><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="all">All requests</option></select></label><button className="org-button">Apply filter</button></form>
    <section className="mt-7 space-y-5">
      {requests.length === 0 && <div className="org-panel"><h2 className="text-lg font-semibold">No matching transfers</h2><p className="mt-2 text-sm text-[var(--org-muted)]">No requests match this status in your company scope.</p></div>}
      {requests.slice(0, 25).map(request => <TransferCard key={request.id} request={request} review />)}
    </section>
    <nav aria-label="Transfer review pages" className="mt-6 flex items-center justify-between text-sm"><span>{page > 1 && <Link href={'/organizations/transfers?view=' + view + '&page=' + (page - 1)} className="org-link">Previous page</Link>}</span><span>Page {page}</span><span>{requests.length > 25 && page < 9999 && <Link href={'/organizations/transfers?view=' + view + '&page=' + (page + 1)} className="org-link">Next page</Link>}</span></nav>
  </article>;
}
