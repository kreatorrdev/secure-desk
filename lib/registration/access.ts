import 'server-only';
import { createClient } from '@/lib/supabase/server';

export async function reviewAccess() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email_confirmed_at) return { kind: 'signed-out' as const };
  const role = await supabase.rpc('current_account_role');
  if (role.error) return { kind: 'unavailable' as const };
  if (role.data !== 'admin' && role.data !== 'super_admin') return { kind: 'forbidden' as const };
  return { kind: 'allowed' as const, supabase, user, role: role.data as 'admin' | 'super_admin' };
}

