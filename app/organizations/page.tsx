import Link from 'next/link';
import { redirect } from 'next/navigation';
import { organizationAccess, organizationPageSize, type OrganizationRole } from '@/lib/organizations/access';
import { OrganizationStatus, OrganizationUnavailable } from '@/components/organization-state';

export const dynamic = 'force-dynamic';

const descriptions: Record<OrganizationRole, string> = {
  client: 'View the company you belong to and its contact details.',
  staff: 'View the companies you are assigned to and their contact details.',
  admin: 'View the companies you administer and their contact details.',
  super_admin: 'View company profiles across SecureDesk.',
};

export default async function OrganizationsPage({ searchParams }: PageProps<'/organizations'>) {
  const access = await organizationAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <OrganizationUnavailable />;
  const params = await searchParams;
  const rawPage = typeof params.page === 'string' ? params.page : '1';
  const page = /^[1-9][0-9]{0,3}$/.test(rawPage) ? Number(rawPage) : 1;
  const start = (page - 1) * organizationPageSize;
  // A public-key client with the user's session. No privileged client or shared cache.
  const result = await access.supabase.from('organizations')
    .select('id,name,industry,status').order('name').order('id')
    .range(start, start + organizationPageSize);
  if (result.error) return <OrganizationUnavailable />;
  const organizations = result.data.slice(0, organizationPageSize);
  const hasNext = result.data.length > organizationPageSize && page < 9999;

  return <>
    <p className="org-eyebrow">Company directory</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your organizations</h1>
    <p className="mt-3 max-w-2xl text-[var(--org-muted)]">{descriptions[access.role]}</p>
    {organizations.length === 0 ? <section className="org-panel mt-8">
      <h2 className="text-xl font-semibold">{page > 1 ? 'No organizations on this page' : 'No organizations available'}</h2>
      <p className="mt-3 text-[var(--org-muted)]">{page > 1 ? 'Return to the first page to see your available organizations.' : 'You do not currently have access to a company. Contact your administrator if you expected to see one here.'}</p>
      {page > 1 && <Link href="/organizations" prefetch={false} className="org-link mt-5 inline-block">Go to first page</Link>}
    </section> : <ul aria-label="Available organizations" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {organizations.map(organization => <li key={organization.id} data-organization={organization.id} className="org-panel flex flex-col items-start">
        <OrganizationStatus status={organization.status} />
        <h2 className="mt-5 w-full break-words text-xl font-semibold">{organization.name}</h2>
        <p className="mt-2 text-sm text-[var(--org-muted)]">{organization.industry || 'Industry not provided'}</p>
        <Link href={'/organizations/' + organization.id} prefetch={false} className="org-link mt-7 inline-block text-sm font-semibold" aria-label={'View profile: ' + organization.name}>View profile <span aria-hidden="true">→</span></Link>
      </li>)}
    </ul>}
    {(page > 1 || hasNext) && <nav aria-label="Organization pages" className="mt-7 flex items-center justify-between gap-4 text-sm">
      <div>{page > 1 && <Link href={'/organizations?page=' + (page - 1)} prefetch={false} className="org-link">Previous page</Link>}</div>
      <span className="text-[var(--org-muted)]">Page {page}</span>
      <div>{hasNext && <Link href={'/organizations?page=' + (page + 1)} prefetch={false} className="org-link">Next page</Link>}</div>
    </nav>}
  </>;
}
