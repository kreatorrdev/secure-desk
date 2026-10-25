import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { OrganizationStatus, OrganizationUnavailable } from '@/components/organization-state';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Organization profile | SecureDesk' };

export default async function OrganizationPage({ params }: PageProps<'/organizations/[id]'>) {
  const access = await organizationAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <OrganizationUnavailable />;
  const { id } = await params;
  if (!organizationIdPattern.test(id)) notFound();
  const result = await access.supabase.from('organizations')
    .select('id,name,description,industry,address,email,phone,contact_person,status')
    .eq('id', id).maybeSingle();
  if (result.error) return <OrganizationUnavailable />;
  // Missing and inaccessible IDs receive the same response; no existence lookup.
  if (!result.data) notFound();
  const organization = result.data;
  const contact = [
    ['Contact person', organization.contact_person],
    ['Email', organization.email],
    ['Phone', organization.phone],
    ['Address', organization.address],
  ];

  return <article data-organization-profile={organization.id}>
    <Link href="/organizations" prefetch={false} className="org-link text-sm">← All organizations</Link>
    <div className="mt-8 flex flex-wrap items-start justify-between gap-5">
      <div className="min-w-0 flex-1">
        <p className="org-eyebrow">Organization profile</p>
        <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">{organization.name}</h1>
        <p className="mt-3 text-[var(--org-muted)]">{organization.industry || 'Industry not provided'}</p>
      </div>
      <OrganizationStatus status={organization.status} />
    </div>
    <Link href={'/organizations/' + id + '/projects'} prefetch={false} className="org-button mt-6 inline-block text-sm">Projects &amp; General Support</Link>
    <Link href={"/organizations/" + id + "/proposals"} prefetch={false} className="org-button mt-6 ml-3 inline-block text-sm">Project proposals</Link>
    {(access.role === 'admin' || access.role === 'super_admin') && <Link href={'/organizations/' + id + '/people'} prefetch={false} className="org-button mt-6 inline-block text-sm">Members &amp; assignments</Link>}
    {(access.role === 'admin' || access.role === 'super_admin') && <Link href={'/organizations/' + id + '/codes'} prefetch={false} className="org-button mt-3 ml-3 inline-block text-sm">Organization code</Link>}
    {access.role === 'client' && <Link href="/organizations/transfer" prefetch={false} className="org-button mt-3 inline-block text-sm">Request organization transfer</Link>}
    {(access.role === 'admin' || access.role === 'super_admin') && <Link href="/organizations/transfers" prefetch={false} className="org-button mt-3 ml-3 inline-block text-sm">Review transfers</Link>}
    <Link href={"/organizations/" + id + "/tickets"} prefetch={false} className="org-button mt-3 ml-3 inline-block text-sm">Tickets</Link><p className="mt-5 text-sm leading-6 text-[var(--org-muted)]">Approved members can forward a valid organization code shared by their administrator. New colleagues must register, confirm their email and submit the code from their account page. Membership always requires approval.</p>
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <section className="org-panel">
        <h2 className="text-lg font-semibold">About the company</h2>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--org-muted)]">{organization.description}</p>
      </section>
      <section className="org-panel">
        <h2 className="text-lg font-semibold">Contact details</h2>
        <dl className="mt-5 space-y-5">
          {contact.map(([label, value]) => <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--org-muted)]">{label}</dt>
            <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6">{value || 'Not provided'}</dd>
          </div>)}
        </dl>
      </section>
    </div>
  </article>;
}

