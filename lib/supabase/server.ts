import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

// A client is created per request. The proxy refreshes before Server Components read.
export async function createClient() {
  const { url, publishableKey, cookieOptions } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write; proxy.ts persists session refresh cookies.
        }
      },
    },
  });
}
