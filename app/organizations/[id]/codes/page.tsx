import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { OrganizationUnavailable } from '@/components/organization-state';
import { OrganizationCodeManager } from '@/components/organization-code-manager';
import type { CodeMetadata } from '@/lib/organizations/codes';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Organization code | SecureDesk' };

export default async function OrganizationCodePage({ params }: PageProps<'/organizations/[id]/codes'>) {
  const access = await organizationAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <OrganizationUnavailable />;
  if (!['admin', 'super_admin'].includes(access.role)) notFound();
  const { id } = await params;
  if (!organizationIdPattern.test(id)) notFound();
  const organization = await access.supabase.from('organizations').select('id,name,status').eq('id', id).maybeSingle();
  if (organization.error) return <OrganizationUnavailable />;
  if (!organization.data) notFound();
  const result = await access.supabase.rpc('organization_access_code_state', { p_organization_id: id });
  if (result.error?.code === '42501') notFound();
  if (result.error) return <OrganizationUnavailable />;
  return <article>
    <Link href={'/organizations/' + id} prefetch={false} className="org-link text-sm">← Organization profile</Link>
    <p className="org-eyebrow mt-8">Organization administration</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-tight">Organization code</h1>
    <p className="mt-3 break-words text-[var(--org-muted)]">{organization.data.name}</p>
    <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--org-muted)]">A code lets a colleague send their pending access request to this company for review. It never grants access by itself. Codes expire after seven days and can be replaced or revoked earlier.</p>
    <OrganizationCodeManager organizationId={id} current={(result.data as CodeMetadata[])?.[0] ?? null} canIssue={organization.data.status === 'active'} />
    <Link href="/admin/requests" prefetch={false} className="org-link mt-6 inline-block text-sm">Review Pending Requests →</Link>
  </article>;
}
