import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { OrganizationUnavailable, OrganizationStatus } from '@/components/organization-state';
import { OrganizationProjectForm } from '@/components/organization-project-form';
import type { OrganizationProject, ProjectContext } from '@/lib/organizations/projects';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Organization projects | SecureDesk' };
export default async function OrganizationProjectsPage({ params, searchParams }: PageProps<'/organizations/[id]/projects'>) {
  const access = await organizationAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <OrganizationUnavailable />;
  const { id } = await params;
  if (!organizationIdPattern.test(id)) notFound();
  const contextResult = await access.supabase.rpc('organization_project_context', { p_organization_id: id });
  if (contextResult.error?.code === '42501' || (!contextResult.error && !contextResult.data?.length)) notFound();
  if (contextResult.error) return <OrganizationUnavailable />;
  const context = contextResult.data[0] as ProjectContext, query = await searchParams;
  const admin = ['admin', 'super_admin'].includes(access.role);
  const status = admin && typeof query.status === 'string' && ['active', 'inactive', 'all'].includes(query.status) ? query.status : 'active';
  const page = typeof query.page === 'string' && /^[1-9][0-9]{0,3}$/.test(query.page) ? Number(query.page) : 1;
  const list = await access.supabase.rpc('organization_projects', { p_organization_id: id, p_status: status, p_offset: (page - 1) * 25 });
  if (list.error?.code === '42501') notFound();
  if (list.error) return <OrganizationUnavailable />;
  const projects = (list.data ?? []) as OrganizationProject[], path = '/organizations/' + id + '/projects';
  const href = (number: number) => path + '?' + new URLSearchParams({ status, page: String(number) });
  return <article>
    <Link href={'/organizations/' + id} prefetch={false} className="org-link text-sm">← Organization profile</Link>
    <p className="org-eyebrow mt-8">Company workspace</p><h1 className="mt-2 text-3xl font-semibold">Projects</h1>
    <p className="mt-3 break-words text-[var(--org-muted)]">{context.organization_name}</p>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--org-muted)]">Browse the active projects available in this company. General Support is the default project for support that does not belong to another project.</p>
    {context.organization_status !== 'active' && <p role="status" className="org-panel mt-5 text-sm leading-6">This company is not active. Projects are available for administrator history; new projects and edits are unavailable.</p>}
    <Link href={"/organizations/" + id + "/proposals"} prefetch={false} className="org-button mt-6 inline-block text-sm">Project proposals</Link>
    {admin && <form className="mt-6 flex flex-wrap items-end gap-3"><label className="text-sm">Status<select name="status" defaultValue={status} className="mt-2 block rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-3"><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All projects</option></select></label><button className="org-button">Apply filter</button></form>}
    <section aria-label="Company projects" className="mt-7 grid gap-5 md:grid-cols-2">
      {projects.slice(0, 25).map(project => <article key={project.id} data-project-record={project.id} className="org-panel">
        <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 break-words text-lg font-semibold"><Link href={path + '/' + project.id} prefetch={false} className="org-link">{project.name}</Link></h2><OrganizationStatus status={project.status} /></div>
        {project.is_general_support && <p className="org-eyebrow mt-3">Default support project</p>}
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--org-muted)]">{project.description}</p>
        <Link href={path + '/' + project.id} prefetch={false} className="org-link mt-5 inline-block text-sm">View project</Link>
      </article>)}
      {projects.length === 0 && <div className="org-panel md:col-span-2"><h2 className="text-lg font-semibold">No matching projects</h2><p className="mt-2 text-sm text-[var(--org-muted)]">No projects match this page and status.</p>{page > 1 && <Link href={href(1)} prefetch={false} className="org-link mt-4 inline-block text-sm">Go to first page</Link>}</div>}
    </section>
    <nav aria-label="Project pages" className="mt-6 flex items-center justify-between text-sm"><span>{page > 1 && <Link href={href(page - 1)} prefetch={false} className="org-link">Previous page</Link>}</span><span>Page {page}</span><span>{projects.length > 25 && page < 9999 && <Link href={href(page + 1)} prefetch={false} className="org-link">Next page</Link>}</span></nav>
    {context.can_create && <OrganizationProjectForm organization={id} id={randomUUID()} context={context} />}
    {!context.can_create && access.role === 'client' && <p className="mt-7 text-sm leading-6 text-[var(--org-muted)]">Your company administrators manage active projects.</p>}
  </article>;
}
