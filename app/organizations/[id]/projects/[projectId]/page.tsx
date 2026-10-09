import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { OrganizationUnavailable, OrganizationStatus } from '@/components/organization-state';
import { OrganizationProjectForm } from '@/components/organization-project-form';
import { projectDate, type OrganizationProject, type ProjectContext } from '@/lib/organizations/projects';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project details | SecureDesk' };
export default async function OrganizationProjectPage({ params, searchParams }: PageProps<'/organizations/[id]/projects/[projectId]'>) {
  const access = await organizationAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  if (access.kind === 'unavailable') return <OrganizationUnavailable />;
  const { id, projectId } = await params;
  if (!organizationIdPattern.test(id) || !organizationIdPattern.test(projectId)) notFound();
  const [contextResult, projectResult] = await Promise.all([
    access.supabase.rpc('organization_project_context', { p_organization_id: id }),
    access.supabase.from('projects').select('id,revision,name,description,status,is_general_support,created_at,updated_at').eq('organization_id', id).eq('id', projectId).maybeSingle(),
  ]);
  if (contextResult.error?.code === '42501' || (!contextResult.error && !contextResult.data?.length) || (!projectResult.error && !projectResult.data)) notFound();
  if (contextResult.error || projectResult.error) return <OrganizationUnavailable />;
  if (!projectResult.data) notFound();
  const context = contextResult.data[0] as ProjectContext, project = { ...projectResult.data, revision: String(projectResult.data.revision) } as OrganizationProject;
  const query = await searchParams, path = '/organizations/' + id + '/projects';
  return <article data-project-detail={project.id}>
    <Link href={path} prefetch={false} className="org-link text-sm">← Company projects</Link>
    <p className="org-eyebrow mt-8">{project.is_general_support ? 'Default support project' : 'Company project'}</p>
    <div className="mt-2 flex flex-wrap items-start justify-between gap-4"><h1 className="min-w-0 break-words text-3xl font-semibold">{project.name}</h1><OrganizationStatus status={project.status} /></div>
    <p className="mt-3 break-words text-[var(--org-muted)]">{context.organization_name}</p>
    {(query.notice === 'created' || query.notice === 'updated') && <p role="status" className="org-panel mt-5 text-sm">{query.notice === 'created' ? 'Project created. It is now available to this company.' : 'Project details saved.'}</p>}
    {context.organization_status !== 'active' && <p role="status" className="org-panel mt-5 text-sm leading-6">This company is not active. This project is available for administrator history.</p>}
    <section className="org-panel mt-7"><h2 className="text-lg font-semibold">About this project</h2><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--org-muted)]">{project.description}</p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-[var(--org-muted)]">Created</dt><dd className="mt-1">{projectDate(project.created_at)}</dd></div><div><dt className="text-[var(--org-muted)]">Last updated</dt><dd className="mt-1">{projectDate(project.updated_at)}</dd></div></dl>
    </section>
    {context.can_create && project.status === 'active' && <OrganizationProjectForm key={project.revision + '-' + context.access_revision + '-' + context.assignment_revision} organization={id} id={project.id} context={context} project={project} />}
  </article>;
}
