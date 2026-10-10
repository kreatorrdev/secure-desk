'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import type { ProjectFormState } from '@/lib/organizations/projects';

const field = (form: FormData, name: string) => { const entries = form.getAll(name); return entries.length === 1 && typeof entries[0] === 'string' ? entries[0] : ''; };
const version = (value: string) => /^[1-9][0-9]{0,17}$/.test(value);
export async function saveProject(_state: ProjectFormState, form: FormData): Promise<ProjectFormState> {
  const access = await organizationAccess();
  if (access.kind !== 'allowed' || !['admin', 'super_admin', 'staff'].includes(access.role)) return { message: 'Your project-writing access is unavailable. Refresh the page.' };
  const organization = field(form, 'organization_id'), id = field(form, 'project_id'), intent = field(form, 'intent');
  const accessRevision = field(form, 'access_revision'), assignmentRevision = field(form, 'assignment_revision'), revision = field(form, 'revision');
  if (!organizationIdPattern.test(organization) || !organizationIdPattern.test(id) || !['create', 'update'].includes(intent) || !version(accessRevision) || (assignmentRevision !== '' && !version(assignmentRevision)) || (intent === 'update' && !version(revision))) return { message: 'This project form is invalid. Refresh the page.' };
  const name = field(form, 'name').trim(), description = field(form, 'description').trim();
  const values = { name: name.slice(0, 400), description: description.slice(0, 8000) };
  if (!name || [...name].length > 200 || !description || [...description].length > 4000) return { message: 'Enter a project name of 1 to 200 characters and a description of 1 to 4000 characters.', values };
  const args = { p_organization_id: organization, p_project_id: id, p_expected_access_revision: accessRevision, p_expected_assignment_revision: assignmentRevision || null, p_details: { name, description } };
  const result = intent === 'create'
    ? await access.supabase.rpc('create_organization_project', args)
    : await access.supabase.rpc('update_organization_project', { ...args, p_expected_revision: revision });
  if (result.error) return { message: (result.error.code === 'PT409' || result.error.code === '40001') ? 'This project or your permissions have changed. Reload before saving again.' : result.error.code === '22023' ? 'These details cannot be saved. General Support has a fixed name, and the company and project must be active.' : 'Your project-writing access is unavailable. Refresh the page.', values };
  const path = '/organizations/' + organization + '/projects';
  revalidatePath(path, 'layout');
  redirect(path + '/' + id + '?notice=' + (intent === 'create' ? 'created' : 'updated'));
}
