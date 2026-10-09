import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Local-only test. It retains one fictional demo account; credentials stay in memory.
class CheckError extends Error {}
let stage = 'setup';
let checks = 0;
const root = fileURLToPath(new URL('../', import.meta.url));
const api = 'http://127.0.0.1:54321';
const inbox = 'http://127.0.0.1:54324';
const assert = (condition, label) => {
  if (!condition) throw new CheckError(label);
  checks++;
  console.log('PASS: ' + label);
};
const q = value => "'" + value.replaceAll("'", "''") + "'";
function sqlJSON(sql) {
  const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
  const result = spawnSync(docker, ['exec', 'supabase_db_secure-desk', 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', '-Atc', sql], { encoding: 'utf8', cwd: root, env: process.env });
  if (result.status !== 0) throw new CheckError('Local database verification failed; private output withheld.');
  return JSON.parse(result.stdout.trim());
}
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
async function run() {
  if (!process.argv.includes('--create-demo')) throw new CheckError('Add --create-demo to create and retain a fictional local account.');
  const config = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');
  if (!config.includes('project_id = "secure-desk"')) throw new CheckError('Expected the local SecureDesk project.');
  const status = spawnSync(process.execPath, ['node_modules/supabase/dist/supabase.js', 'status', '-o', 'json'], { encoding: 'utf8', cwd: root, env: process.env });
  if (status.status !== 0) throw new CheckError('Start the local Supabase stack first.');
  const local = JSON.parse(status.stdout); // Do not print: status also contains privileged local keys.
  if (local.API_URL !== api || !local.ANON_KEY) throw new CheckError('Refusing to test an unexpected API target.');
  const settings = await fetch(api + '/auth/v1/settings', { headers: { apikey: local.ANON_KEY }, signal: AbortSignal.timeout(15000) });
  const authSettings = await settings.json();
  assert(settings.ok && authSettings.mailer_autoconfirm === false, 'Local Auth requires email confirmation.');
  const client = createClient(api, local.ANON_KEY, clientOptions);
  const suffix = randomUUID().slice(0, 8);
  const email = 'securedesk-demo-' + suffix + '@securedesk.example.invalid';
  const password = randomBytes(24).toString('base64url') + 'aA8!';
  const metadata = { full_name: 'SecureDesk Demo Client', phone: '+12025550401', company_name: 'Fictional Demo Company', message: 'Local signup and email verification demonstration.', app_role: 'super_admin', account_status: 'active', attempt_number: 99, target_organization_id: randomUUID() };

  stage = 'weak password';
  const weakEmail = 'securedesk-weak-' + suffix + '@securedesk.example.invalid';
  const weak = await client.auth.signUp({ email: weakEmail, password: 'short', options: { data: metadata } });
  assert(Boolean(weak.error), 'Weak password is rejected by local Auth.');
  assert(sqlJSON('select count(*)::integer from auth.users where email=' + q(weakEmail)) === 0, 'Weak password leaves no Auth row.');

  stage = 'missing registration data';
  const invalidEmail = 'securedesk-invalid-' + suffix + '@securedesk.example.invalid';
  const missing = await client.auth.signUp({ email: invalidEmail, password, options: { data: { full_name: metadata.full_name, phone: metadata.phone, message: metadata.message } } });
  assert(Boolean(missing.error), 'Missing company data rejects the real signup transaction.');
  assert(sqlJSON('select count(*)::integer from auth.users where email=' + q(invalidEmail)) === 0, 'Invalid signup leaves no Auth identity.');

  stage = 'valid registration';
  const signup = await client.auth.signUp({ email, password, options: { data: metadata } });
  assert(!signup.error && Boolean(signup.data.user) && signup.data.session === null, 'Valid signup waits for email confirmation without issuing a session.');
  const id = signup.data.user.id;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new CheckError('Unexpected Auth identity format.');
  const snapshot = sqlJSON("select json_build_object('role',p.app_role,'state',p.account_status,'requests',(select count(*) from public.registration_requests r where r.user_id=p.id),'request_state',(select status from public.registration_requests r where r.user_id=p.id),'attempt',(select attempt_number from public.registration_requests r where r.user_id=p.id),'routed',(select target_organization_id is not null from public.registration_requests r where r.user_id=p.id)) from public.profiles p where p.id=" + q(id));
  assert(snapshot.role === 'client' && snapshot.state === 'pending' && snapshot.requests === 1 && snapshot.request_state === 'pending' && snapshot.attempt === 1 && snapshot.routed === false, 'Real Auth creates client/pending profile and one unrouted first request despite forged metadata.');
  const before = await client.auth.signInWithPassword({ email, password });
  assert(before.error?.code === 'email_not_confirmed' && !before.data.session, 'Password login is denied before email confirmation.');

  stage = 'local confirmation message';
  let messageId;
  for (let attempt = 0; attempt < 20 && !messageId; attempt++) {
    const response = await fetch(inbox + '/api/v1/messages', { signal: AbortSignal.timeout(5000) });
    const listing = await response.json();
    const messages = listing.messages ?? listing.Messages ?? [];
    const message = messages.find(item => (item.To ?? item.to ?? []).some(recipient => (recipient.Address ?? recipient.address) === email));
    messageId = message?.ID ?? message?.id;
    if (!messageId) await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(Boolean(messageId), 'Confirmation email is captured only in the local Mailpit inbox.');
  const message = await fetch(inbox + '/api/v1/message/' + encodeURIComponent(messageId), { signal: AbortSignal.timeout(5000) });
  const mail = await message.json();
  const content = [mail.HTML, mail.html, mail.Text, mail.text].filter(value => typeof value === 'string').join(' ').replaceAll('&amp;', '&');
  const links = [...content.matchAll(/https?:\/\/[^\s<>"']+/g)].map(match => match[0]);
  let tokenHash;
  for (const link of links) {
    const url = new URL(link);
    if (url.origin === 'http://127.0.0.1:3000' && url.pathname === '/auth/confirm' && url.searchParams.get('type') === 'email') tokenHash = url.searchParams.get('token_hash');
  }
  assert(Boolean(tokenHash), 'Local confirmation token is available without printing its link or body.');
  stage = 'email verification';
  const invalidToken = await client.auth.verifyOtp({ token_hash: randomBytes(32).toString('hex'), type: 'email' });
  assert(Boolean(invalidToken.error), 'An invalid email token is rejected.');
  const verified = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
  assert(!verified.error && Boolean(verified.data.session) && verified.data.user?.id === id, 'A valid local email token confirms the same identity and permits login.');
  const signedIn = createClient(api, local.ANON_KEY, clientOptions);
  const login = await signedIn.auth.signInWithPassword({ email, password });
  assert(!login.error && Boolean(login.data.session), 'Confirmed email permits password login.');

  stage = 'real authenticated RLS';
  const profile = await signedIn.from('profiles').select('id,account_status');
  assert(!profile.error && profile.data.length === 1 && profile.data[0].id === id && profile.data[0].account_status === 'pending', 'Confirmed user reads only its own pending profile status.');
  const requests = await signedIn.from('registration_requests').select('id,status,attempt_number');
  assert(!requests.error && requests.data.length === 1 && requests.data[0].status === 'pending' && requests.data[0].attempt_number === 1, 'Confirmed user reads only its own first pending request.');
  for (const table of ['organizations', 'organization_members', 'staff_organization_assignments', 'organization_admin_assignments']) {
    const rows = await signedIn.from(table).select('id');
    assert(!rows.error && rows.data.length === 0, 'Pending user has no ' + table + ' access.');
  }
  const promotion = await signedIn.from('profiles').update({ app_role: 'super_admin' }).eq('id', id);
  assert(promotion.error?.code === '42501', 'Real session cannot promote its own role.');
  const approval = await signedIn.from('profiles').update({ account_status: 'active' }).eq('id', id);
  assert(approval.error?.code === '42501', 'Real session cannot activate its own profile.');
  const selfReview = await signedIn.from('registration_requests').update({ status: 'approved' }).eq('id', requests.data[0].id);
  assert(selfReview.error?.code === '42501', 'Real session cannot approve its own request.');
  const changed = await signedIn.auth.updateUser({ data: { app_role: 'super_admin', account_status: 'active' } });
  assert(!changed.error, 'Auth user metadata can change without becoming business permissions.');
  const state = sqlJSON("select json_build_object('role',app_role,'state',account_status) from public.profiles where id=" + q(id));
  assert(state.role === 'client' && state.state === 'pending', 'Stored business role/status stay client/pending after metadata changes.');
  const signout = await signedIn.auth.signOut({ scope: 'local' });
  assert(!signout.error, 'Local test session signs out.');
  console.log('Local Auth check: ' + checks + ' passed. Retained fictional demo: ' + email);
  console.log('Demo credentials and tokens were kept only in memory. Hosted configuration was not used.');
}
run().catch(error => {
  console.error('FAIL during ' + stage + ': ' + (error instanceof CheckError ? error.message : 'Local check failed; private output withheld.'));
  process.exitCode = 1;
});
