import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { organizationAccess } from '@/lib/organizations/access';
import { OrganizationUnavailable } from '@/components/organization-state';
import { TransferRequestForm } from '@/components/organization-transfer-forms';
import { TransferCard } from '@/components/organization-transfer-card';
import type { TransferRequest } from '@/lib/organizations/transfers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your organization transfer | SecureDesk' };
export default async function TransferPage({ searchParams }: PageProps<'/organizations/transfer'>) {
  const access = await organizationAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <OrganizationUnavailable />;
  if (access.role !== 'client') notFound();
  const query = await searchParams, page = typeof query.page === 'string' && /^[1-9][0-9]{0,3}$/.test(query.page) ? Number(query.page) : 1;
  const [context, list] = await Promise.all([access.supabase.rpc('own_organization_transfer_context'), access.supabase.rpc('organization_transfer_requests', { p_status: 'all', p_offset: (page - 1) * 25 })]);
  if (context.error || list.error) return <OrganizationUnavailable />;
  const current = context.data?.[0] as { organization_name: string; can_request: boolean } | undefined;
  const requests = (list.data ?? []) as TransferRequest[];
  return <article>
    <Link href="/organizations" className="org-link text-sm">← Your organizations</Link>
    <p className="org-eyebrow mt-8">Company membership</p><h1 className="mt-2 text-3xl font-semibold">Your organization transfer</h1>
    {current && <p className="mt-4 break-words text-[var(--org-muted)]">Current company: {current.organization_name}</p>}
    {(query.notice === 'submitted' || query.notice === 'pending') && <p role="status" className="org-panel mt-5 text-sm">Your transfer request is pending. Your current company access continues until the transfer is approved.</p>}
    {current?.can_request ? <TransferRequestForm /> : <p className="org-panel mt-7 text-sm leading-6">{current ? 'You already have a pending transfer. The company administrators will review it.' : 'An active company membership is required to request a transfer.'}</p>}
    <section className="mt-8 space-y-5"><h2 className="text-xl font-semibold">Your transfer history</h2>
      {requests.length === 0 && <p className="org-panel text-sm">No transfer requests on this page.</p>}
      {requests.slice(0, 25).map(request => <TransferCard key={request.id} request={request} />)}
    </section>
    <nav aria-label="Transfer history pages" className="mt-6 flex items-center justify-between text-sm"><span>{page > 1 && <Link href={'/organizations/transfer?page=' + (page - 1)} className="org-link">Previous page</Link>}</span><span>Page {page}</span><span>{requests.length > 25 && page < 9999 && <Link href={'/organizations/transfer?page=' + (page + 1)} className="org-link">Next page</Link>}</span></nav>
  </article>;
}
