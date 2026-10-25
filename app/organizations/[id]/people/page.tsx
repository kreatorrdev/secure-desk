import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { peopleKinds, peopleLabels, peoplePageSize, peopleStatuses, type OrganizationPerson, type PeopleKind, type PeopleStatus } from '@/lib/organizations/people';
import { OrganizationUnavailable } from '@/components/organization-state';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Members & assignments | SecureDesk' };

const dates = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';

export default async function OrganizationPeoplePage({ params, searchParams }: PageProps<'/organizations/[id]/people'>) {
  const access = await organizationAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <OrganizationUnavailable />;
  if (access.role !== 'admin' && access.role !== 'super_admin') notFound();
  const { id } = await params;
  if (!organizationIdPattern.test(id)) notFound();

  const company = await access.supabase.from('organizations').select('id,name').eq('id', id).maybeSingle();
  if (company.error) return <OrganizationUnavailable />;
  if (!company.data) notFound();

  const query = await searchParams;
  const kind: PeopleKind = typeof query.kind === 'string' && peopleKinds.includes(query.kind as PeopleKind) ? query.kind as PeopleKind : 'client';
  const status: PeopleStatus = typeof query.status === 'string' && peopleStatuses.includes(query.status as PeopleStatus) ? query.status as PeopleStatus : 'active';
  const page = typeof query.page === 'string' && /^[1-9][0-9]{0,3}$/.test(query.page) ? Number(query.page) : 1;
  // The RPC repeats live role and company scope checks, including revocation.
  const result = await access.supabase.rpc('admin_organization_people', {
    p_organization_id: id, p_kind: kind, p_status: status, p_offset: (page - 1) * peoplePageSize,
  });
  if (result.error?.code === '42501') notFound();
  if (result.error) return <OrganizationUnavailable />;
  const records = (result.data ?? []) as OrganizationPerson[];
  const people = records.slice(0, peoplePageSize);
  const hasNext = records.length > peoplePageSize && page < 9999;
  const path = '/organizations/' + id + '/people';
  const href = (selectedKind: PeopleKind, selectedStatus: PeopleStatus, selectedPage = 1) =>
    path + '?' + new URLSearchParams({ kind: selectedKind, status: selectedStatus, page: String(selectedPage) });
  const inactiveLabel = kind === 'client' ? 'Ended' : 'Revoked';

  return <>
    <Link href={'/organizations/' + id} prefetch={false} className="org-link text-sm">← Organization profile</Link>
    <div className="mt-8 flex flex-wrap items-start justify-between gap-5">
      <div className="min-w-0 flex-1">
        <p className="org-eyebrow">Organization administration</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Members &amp; assignments</h1>
        <p className="mt-3 break-words text-[var(--org-muted)]">{company.data.name}</p>
      </div>
      <Link href={'/admin/access?' + new URLSearchParams({ company: id })} prefetch={false} className="org-button text-sm">
        {access.role === 'super_admin' ? 'Manage Access' : 'Manage Staff access'}
      </Link>
    </div>
    <nav aria-label="People categories" className="mt-8 flex flex-wrap gap-3">
      {peopleKinds.map(option => <Link key={option} href={href(option, 'active')} prefetch={false} aria-current={kind === option ? 'page' : undefined}
        className={'rounded-lg border px-4 py-3 text-sm font-semibold ' + (kind === option ? 'border-[var(--org-accent)] bg-[var(--org-accent-soft)] text-[var(--org-accent)]' : 'border-[var(--org-border)] text-[var(--org-muted)]')}>
        {peopleLabels[option]}
      </Link>)}
    </nav>
    <section aria-labelledby="people-title" className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 id="people-title" className="text-xl font-semibold">{peopleLabels[kind]}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--org-muted)]">An active record grants access only while the account and its company permissions remain valid.</p>
        </div>
        <form method="get" action={path} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="kind" value={kind} />
          <label className="text-sm font-medium">Status
            <select name="status" defaultValue={status} key={kind + status} className="mt-2 block rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-2.5">
              <option value="active">Active</option><option value="inactive">{inactiveLabel}</option><option value="all">All records</option>
            </select>
          </label>
          <button className="org-button text-sm">Apply filter</button>
        </form>
      </div>
      {people.length === 0 ? <div className="org-panel mt-5">
        <h3 className="font-semibold">No matching {kind === 'client' ? 'memberships' : 'assignments'}</h3>
        <p className="mt-2 text-sm text-[var(--org-muted)]">{page > 1 ? 'There are no records on this page. Return to the first page.' : 'No records match this category and status.'}</p>
        {(page > 1 || status !== 'all') && <Link href={href(kind, page > 1 ? status : 'all')} prefetch={false} className="org-link mt-4 inline-block text-sm">{page > 1 ? 'Go to first page' : 'Show all records'}</Link>}
      </div> : <ul aria-label={peopleLabels[kind]} className="mt-5 space-y-4">
        {people.map(person => <li key={person.id} data-person-record={person.id} className="org-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-semibold">{person.full_name}</h3>
              <p className="mt-1 break-all text-sm text-[var(--org-muted)]">{person.email || 'Email not available'}</p>
            </div>
            <span className={'org-status ' + (person.link_status === 'active' ? 'org-status-active' : '')}>{person.link_status === 'active' ? 'Active' : person.link_status === 'ended' ? 'Ended' : 'Revoked'}</span>
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-[var(--org-muted)]">Access through this record</dt><dd className="mt-1 font-medium">{person.has_current_access ? 'Available' : 'Not available'}</dd></div>
            {kind === 'staff' && <div><dt className="text-[var(--org-muted)]">Project creation through this assignment</dt><dd className="mt-1 font-medium">{person.can_create_project ? 'Yes' : 'No'}</dd></div>}
            <div><dt className="text-[var(--org-muted)]">{kind === 'client' ? 'Joined' : 'Record created'}</dt><dd className="mt-1">{dates(person.since)}</dd></div>
            {person.ended_at && <div><dt className="text-[var(--org-muted)]">Membership ended</dt><dd className="mt-1">{dates(person.ended_at)}</dd></div>}
            {kind !== 'client' && <div><dt className="text-[var(--org-muted)]">Last updated</dt><dd className="mt-1">{dates(person.updated_at)}</dd></div>}
          </dl>
        </li>)}
      </ul>}
      {(page > 1 || hasNext) && <nav aria-label="People pages" className="mt-6 flex items-center justify-between gap-4 text-sm">
        <div>{page > 1 && <Link href={href(kind, status, page - 1)} prefetch={false} className="org-link">Previous page</Link>}</div>
        <span className="text-[var(--org-muted)]">Page {page}</span>
        <div>{hasNext && <Link href={href(kind, status, page + 1)} prefetch={false} className="org-link">Next page</Link>}</div>
      </nav>}
    </section>
  </>;
}
