import { getSupabaseConfig } from "../lib/supabase/config.ts";

let config;
try { config = getSupabaseConfig(); } catch { console.error("Configure the Supabase URL and public application key in .env.local."); process.exit(1); }
const { url, publishableKey: key } = config;

async function check() {
  const endpoint = new URL("/auth/v1/settings", url);
  const valid = await fetch(endpoint, {
    headers: { apikey: key },
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (valid.status !== 200) {
    throw new Error("Publishable key connection check failed (HTTP " + valid.status + ").");
  }
  await valid.arrayBuffer();
  console.log("PASS: Supabase Auth settings are reachable (HTTP 200).");

  const local = new URL(url).origin === 'http://127.0.0.1:54321' || new URL(url).origin === 'http://localhost:54321';
  if (local) {
    // Local Auth settings are public; Data API JWT validation is the meaningful key check.
    const anonymous = await fetch(new URL('/rest/v1/profiles?select=id&limit=1', url), {
      headers: { apikey: key, Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(15000),
    });
    const denied = await anonymous.json();
    if (anonymous.status !== 401 || denied.code !== '42501') throw new Error('Expected local anonymous profile denial.');
    console.log('PASS: Local public key reaches Data API; anonymous profile access is denied (401 / 42501).');
    const invalid = await fetch(new URL('/rest/v1/profiles?select=id&limit=1', url), {
      headers: { apikey: key, Authorization: 'Bearer invalid-public-key' }, signal: AbortSignal.timeout(15000),
    });
    const body = await invalid.json();
    if (invalid.status !== 401 || body.code !== 'PGRST301') throw new Error('Local invalid public token was not rejected.');
    console.log('PASS: Local Data API rejects an invalid public token (401 / PGRST301).');
  } else {
    const invalid = await fetch(endpoint, {
      headers: { apikey: 'sb_publishable_invalid_connection_test' }, redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    await invalid.arrayBuffer();
    if (![401, 403].includes(invalid.status)) throw new Error('Invalid key was not rejected (HTTP ' + invalid.status + ').');
    console.log('PASS: Supabase rejected an invalid key (HTTP ' + invalid.status + ').');
  }
  console.log("Connection/token checks and local anonymous denial passed. Full user authorization is tested separately.");
}

check().catch((error) => {
  console.error(error instanceof Error ? error.message : "Supabase connection check failed.");
  process.exitCode = 1;
});
