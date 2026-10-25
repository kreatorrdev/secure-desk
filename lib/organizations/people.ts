export const peopleKinds = ['client', 'staff', 'admin'] as const;
export const peopleStatuses = ['active', 'inactive', 'all'] as const;
export type PeopleKind = typeof peopleKinds[number];
export type PeopleStatus = typeof peopleStatuses[number];
export const peoplePageSize = 25;

export type OrganizationPerson = {
  id: string;
  full_name: string;
  email: string | null;
  link_status: 'active' | 'ended' | 'revoked';
  since: string;
  ended_at: string | null;
  updated_at: string;
  can_create_project: boolean | null;
  has_current_access: boolean;
};

export const peopleLabels: Record<PeopleKind, string> = {
  client: 'Client memberships',
  staff: 'Staff assignments',
  admin: 'Admin assignments',
};
