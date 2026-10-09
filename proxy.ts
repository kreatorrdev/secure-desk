import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSiteURL } from "@/lib/auth/site";
import { contentSecurityPolicy, responseContentSecurityPolicy } from "@/lib/security/headers";

export async function proxy(request: NextRequest) {
  const { url, publishableKey, cookieOptions } = getSupabaseConfig();
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = contentSecurityPolicy(nonce, url, getSiteURL(), process.env.NODE_ENV === 'development');
  const forwarded = new Headers(request.headers);
  forwarded.set('x-nonce', nonce);
  forwarded.set('Content-Security-Policy', csp);
  const next = () => NextResponse.next({ request: { headers: forwarded } });
  let response = next();
  const supabase = createServerClient(url, publishableKey, {
    cookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        forwarded.set('cookie', request.headers.get('cookie') ?? '');
        response = next();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  // Validate and refresh; page-level getUser and database RLS remain the access checks.
  await supabase.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set('Content-Security-Policy', responseContentSecurityPolicy(request.nextUrl.pathname, csp));
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
