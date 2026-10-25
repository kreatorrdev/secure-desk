import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type OrganizationRole = 'client' | 'staff' | 'admin' | 'super_admin';

// Check each page request. Role allows entry; RLS decides which rows it may read.
export async function organizationAccess() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email_confirmed_at) return { kind: 'signed-out' as const };
  const role = await supabase.rpc('current_account_role');
  if (role.error) return { kind: 'unavailable' as const };
  if (!['client', 'staff', 'admin', 'super_admin'].includes(role.data)) return { kind: 'forbidden' as const };
  return { kind: 'allowed' as const, supabase, role: role.data as OrganizationRole };
}

export const organizationPageSize = 12;
export const organizationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
