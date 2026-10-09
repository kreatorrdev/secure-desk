import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

// Never expose this key or reuse this client for user-scoped business reads.
export function createStorageClient() {
 const { url } = getSupabaseConfig();
 const key = process.env.SUPABASE_STORAGE_SECRET_KEY;
 if (!key) throw new Error('Private attachment storage is unavailable.');
 return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
