export type OrganizationProject = {
  id: string; revision: string; name: string; description: string; status: 'active' | 'inactive';
  is_general_support: boolean; created_at: string; updated_at: string;
};
export type ProjectContext = {
  organization_name: string; organization_status: string; can_create: boolean;
  access_revision: string; assignment_revision: string | null;
};
export type ProjectFormState = { message: string; values?: { name: string; description: string } };
export const projectDate = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
