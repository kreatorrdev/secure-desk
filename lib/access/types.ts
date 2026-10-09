export type AccessOrganization = { id: string; name: string; status: 'pending' | 'active' | 'inactive' };
export type AccessAssignment = { id: string; active: boolean; revision: string; can_create_project?: boolean };
export type AccessTarget = {
  id: string; full_name: string; email: string; app_role: 'client' | 'staff' | 'admin' | 'super_admin';
  account_status: 'pending' | 'active' | 'rejected'; auth_eligible: boolean; access_revision: string;
  latest_request: { id: string; attempt_number: number; company_name: string; message: string; phone: string; created_at: string } | null;
  has_active_membership: boolean; staff_assignment: AccessAssignment | null; admin_assignment: AccessAssignment | null;
  can_approve_privileged: boolean; can_change_role: boolean; can_grant_staff: boolean; can_revoke_staff: boolean;
  can_grant_admin: boolean; can_revoke_admin: boolean;
};
export type AccessState = { message?: string; values?: Record<string, string>; errors?: Record<string, string> };
export type AccessIntent = 'approve-role' | 'role' | 'staff-grant' | 'staff-revoke' | 'admin-grant' | 'admin-revoke';
