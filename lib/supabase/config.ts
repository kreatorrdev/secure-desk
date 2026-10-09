export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Configure the Supabase URL and public application key in .env.local.");
  const target = new URL(url);
  const local = target.origin === "http://127.0.0.1:54321" || target.origin === "http://localhost:54321";
  let localAnon = false;
  if (local && /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(publishableKey)) {
    try {
      const payload = JSON.parse(atob(publishableKey.split(".")[1].replaceAll("-", "+").replaceAll("_", "/")));
      localAnon = payload.role === "anon";
    } catch { /* Invalid public-key format. Supabase validates actual keys. */ }
  }
  if (!publishableKey.startsWith("sb_publishable_") && !localAnon) {
    throw new Error("Use a publishable key, or the CLI anon key for local development. Privileged keys are not application keys.");
  }
  return { url, publishableKey, cookieOptions: { sameSite: "lax" as const, secure: !local } };
}
