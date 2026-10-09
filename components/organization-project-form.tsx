'use client';

import { useActionState } from 'react';
import { saveProject } from '@/app/organizations/[id]/projects/actions';
import type { OrganizationProject, ProjectContext } from '@/lib/organizations/projects';

const input = 'block w-full rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-3 text-sm text-[var(--org-text)]';
export function OrganizationProjectForm({ organization, id, context, project }: { organization: string; id: string; context: ProjectContext; project?: OrganizationProject }) {
  const [state, action, pending] = useActionState(saveProject, { message: '' });
  const prefix = 'project-' + id;
  return <form action={action} data-project-form={project ? 'update' : 'create'} data-project-id={id} className="org-panel mt-7 space-y-4">
    <h2 className="text-xl font-semibold">{project ? 'Edit project' : 'Create a project'}</h2>
    <p className="text-sm leading-6 text-[var(--org-muted)]">{project?.is_general_support ? 'General Support is created automatically. Its name stays fixed; you can update its description.' : 'An active project is available to the approved Clients and assigned Staff in this company.'}</p>
    <input type="hidden" name="organization_id" value={organization} /><input type="hidden" name="project_id" value={id} />
    <input type="hidden" name="intent" value={project ? 'update' : 'create'} /><input type="hidden" name="revision" value={project?.revision ?? ''} />
    <input type="hidden" name="access_revision" value={context.access_revision} /><input type="hidden" name="assignment_revision" value={context.assignment_revision ?? ''} />
    <label htmlFor={prefix + '-name'} className="block text-sm font-semibold">Project name</label>
    <input id={prefix + '-name'} name="name" required maxLength={200} defaultValue={state.values?.name ?? project?.name ?? ''} readOnly={project?.is_general_support} className={input} />
    <label htmlFor={prefix + '-description'} className="block text-sm font-semibold">Description</label>
    <textarea id={prefix + '-description'} name="description" required maxLength={4000} rows={5} defaultValue={state.values?.description ?? project?.description ?? ''} className={input} />
    {state.message && <p role="alert" className="text-sm leading-6">{state.message}</p>}
    <button disabled={pending} className="org-button disabled:opacity-60">{pending ? 'Saving…' : project ? 'Save project' : 'Create project'}</button>
  </form>;
}
