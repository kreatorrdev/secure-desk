import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createChunks, combineChunks } from '@supabase/ssr';

// Real native form POSTs against Next.js. Two fictional accounts are intentionally retained.
class CheckError extends Error {}
const root = fileURLToPath(new URL('../', import.meta.url));
const site = 'http://127.0.0.1:3000';
const inbox = 'http://127.0.0.1:54324';
let checks = 0;
let stage = 'setup';
function assert(condition, label) {
  if (!condition) throw new CheckError(label);
  checks++;
  console.log('PASS: ' + label);
}
const q = value => "'" + value.replaceAll("'", "''") + "'";
function sql(sql) {
  const result = spawnSync(process.platform === 'win32' ? 'docker.exe' : 'docker', ['exec', 'supabase_db_secure-desk', 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', '-Atc', sql], { encoding: 'utf8', cwd: root });
  if (result.status !== 0) throw new CheckError('Local DB verification failed; private output withheld.');
  return JSON.parse(result.stdout.trim());
}
class Browser {
  cookies = new Map();
  async request(path, options = {}) {
    const headers = new Headers(options.headers);
    if (this.cookies.size) headers.set('cookie', [...this.cookies].map(([k,v]) => k + '=' + v).join('; '));
    const response = await fetch(new URL(path, site), { ...options, headers, redirect: 'manual', signal: AbortSignal.timeout(30000) });
    for (const set of response.headers.getSetCookie()) {
      const pair = set.split(';')[0], at = pair.indexOf('='), name = pair.slice(0, at), value = pair.slice(at + 1);
      if (!value || /max-age=0(?:;|$)/i.test(set)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    const html = await response.text();
    const location = response.headers.get('location') ?? html.match(/<meta[^>]*http-equiv="refresh"[^>]*content="[^"]*url=([^"]*)"/i)?.[1] ?? null;
    return { status: response.status, location, headers: response.headers, html };
  }
  async post(path, fields, origin = site) {
    const page = await this.request(path);
    const forms = [...page.html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/gi)];
    const match = path === '/account' ? forms.find(entry => entry[1].includes('Sign out</button>')) : forms[0];
    if (!match) throw new CheckError('Expected rendered form is missing.');
    const data = new FormData();
    const unescape = value => value.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
    for (const tag of match[1].matchAll(/<input\b[^>]*>/gi)) {
      const attrs = Object.fromEntries([...tag[0].matchAll(/([\w$:-]+)="([^"]*)"/g)].map(entry => [entry[1], unescape(entry[2])]));
      if (attrs.type === 'hidden' && attrs.name) data.set(attrs.name, attrs.value ?? '');
    }
    if (![...data.keys()].some(key => key.startsWith('$ACTION_'))) throw new CheckError('Native action reference is missing.');
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return this.request(path, { method: 'POST', headers: { origin }, body: data });
  }
  async session() {
    const name = [...this.cookies.keys()].find(key => /^sb-.*-auth-token(?:\.\d+)?$/.test(key))?.replace(/\.\d+$/, '');
    if (!name) return null;
    const raw = await combineChunks(name, part => this.cookies.get(part));
    if (!raw?.startsWith('base64-')) throw new CheckError('Unexpected session encoding.');
    return { name, data: JSON.parse(Buffer.from(raw.slice(7), 'base64url').toString('utf8')) };
  }
  replaceSession(name, data) {
    for (const key of this.cookies.keys()) if (key === name || key.startsWith(name + '.')) this.cookies.delete(key);
    for (const chunk of createChunks(name, 'base64-' + Buffer.from(JSON.stringify(data)).toString('base64url'))) this.cookies.set(chunk.name, chunk.value);
  }
}
function registration(email) {
  return { email, password: randomBytes(20).toString('base64url') + 'aA8!', full_name: 'SecureDesk Web Demo', phone: '+12025550402', company_name: 'Fictional Web Company', message: 'Local form and cookie session demonstration.' };
}
async function emailLink(email) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const list = await (await fetch(inbox + '/api/v1/messages')).json();
    const message = (list.messages ?? []).find(item => (item.To ?? []).some(to => to.Address === email));
    if (message) {
      const mail = await (await fetch(inbox + '/api/v1/message/' + encodeURIComponent(message.ID))).json();
      const content = [mail.HTML, mail.Text].filter(Boolean).join(' ').replaceAll('&amp;', '&');
      for (const link of content.matchAll(/https?:\/\/[^\s<>"']+/g)) {
        const url = new URL(link[0]);
        if (url.origin === site && url.pathname === '/auth/confirm' && url.searchParams.get('type') === 'email' && url.searchParams.get('token_hash')) return url.pathname + url.search;
      }
      throw new CheckError('Expected local confirmation link is missing.');
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new CheckError('Local confirmation message did not arrive.');
}
async function run() {
  if (!process.argv.includes('--create-demo')) throw new CheckError('Add --create-demo to create and retain two fictional local accounts.');
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  if (!/^NEXT_PUBLIC_SUPABASE_URL=http:\/\/127\.0\.0\.1:54321\s*$/m.test(env) || !/^SITE_URL=http:\/\/127\.0\.0\.1:3000\s*$/m.test(env)) throw new CheckError('Refusing to test a non-local application environment.');
  const anonymous = new Browser();
  const account = await anonymous.request('/account');
  assert([200, 307].includes(account.status) && account.location === '/login' && !account.html.includes('Signed in as'), 'Anonymous status page requires sign-in.');
  assert(account.headers.get('cache-control')?.includes('no-store'), 'Protected redirects disable response caching.');
  assert((await anonymous.request('/dashboard')).location === '/login', 'Anonymous dashboard requires login.');
  const registerPage = await anonymous.request('/register');
  assert(registerPage.status === 200 && registerPage.html.includes('Message to the administrator'), 'Registration renders all required fields.');

  stage = 'server validation';
  const suffix = randomUUID().slice(0, 8);
  const invalidEmail = 'securedesk-invalid-web-' + suffix + '@securedesk.example.invalid';
  const fields = registration(invalidEmail);
  const invalid = await anonymous.post('/register', { ...fields, company_name: '   ', password: 'short' });
  assert(invalid.status === 200 && invalid.html.includes('Please check the highlighted fields.') && invalid.html.includes('Use at least 8 characters.'), 'Server validation catches invalid fields without relying on HTML constraints.');
  assert(!invalid.html.includes('value="short"'), 'Validation does not send the password back to rendered fields.');
  assert(sql('select count(*)::integer from auth.users where email=' + q(invalidEmail)) === 0, 'Rejected server validation leaves no Auth account.');
  const csrf = await anonymous.post('/register', fields, 'https://foreign-origin.example.invalid');
  assert(csrf.status >= 400 && !csrf.location, 'Cross-origin form POST is rejected by Next.js.');
  assert(sql('select count(*)::integer from auth.users where email=' + q(invalidEmail)) === 0, 'Rejected cross-origin action creates no Auth account.');

  stage = 'registration';
  const a = new Browser();
  const first = registration('securedesk-web-a-' + suffix + '@securedesk.example.invalid');
  const signup = await a.post('/register', { ...first, app_role: 'super_admin', account_status: 'active', attempt_number: '99', target_organization_id: randomUUID() });
  assert(signup.status === 303 && signup.location === '/auth/check-email', 'Native registration form directs to email confirmation instructions.');
  assert((await a.request('/account')).location === '/login', 'Registration does not issue an authenticated cookie session before confirmation.');
  const state = sql("select json_build_object('role',p.app_role,'state',p.account_status,'request',r.status,'attempt',r.attempt_number,'unrouted',r.target_organization_id is null) from public.profiles p join auth.users u on u.id=p.id join public.registration_requests r on r.user_id=p.id where u.email=" + q(first.email));
  assert(state.role === 'client' && state.state === 'pending' && state.request === 'pending' && state.attempt === 1 && state.unrouted, 'Extra form fields cannot promote, approve or route the real registration.');
  const wrong = await a.post('/login', { email: first.email, password: 'WrongPassword8!' });
  assert(wrong.status === 200 && wrong.html.includes('Sign-in failed. Check your email and password.'), 'Invalid credentials display a generic sign-in error.');
  const before = await a.post('/login', { email: first.email, password: first.password });
  assert(before.status === 200 && before.html.includes('Confirm your email before signing in.'), 'The sign-in form refuses an unconfirmed email.');

  stage = 'email confirmation';
  const path = await emailLink(first.email);
  const preview = await a.request(path + '&next=https://foreign-origin.example.invalid');
  assert(preview.status === 200 && preview.html.includes('Confirm email and continue'), 'Email opens a confirmation page with an explicit button.');
  assert(sql('select to_json(email_confirmed_at is not null) from auth.users where email=' + q(first.email)) === false, 'GET or email-link preview does not consume the token.');
  const bad = await a.post('/auth/confirm?type=email&token_hash=' + randomBytes(32).toString('hex'), {});
  assert(bad.status === 200 && bad.html.includes('This confirmation link is invalid or expired.'), 'An invalid confirmation token cannot sign in.');
  const confirmed = await a.post(path + '&next=https://foreign-origin.example.invalid', {});
  assert(confirmed.status === 303 && confirmed.location === '/account', 'Confirmation creates a cookie session and uses a fixed local destination.');
  const cookies = confirmed.headers.getSetCookie();
  assert(cookies.some(value => /-auth-token/.test(value) && /samesite=lax/i.test(value)), 'Authentication cookies use SameSite=Lax in local development.');
  assert(confirmed.headers.get('referrer-policy') === 'no-referrer', 'Confirmation responses do not forward the token URL as a referrer.');
  const current = await a.request('/account');
  assert(current.status === 200 && current.html.includes(first.email) && current.html.includes('An administrator will review your access request.') && current.html.includes('Request #'), 'Confirmed cookie session renders only its own pending request.');
  assert(current.headers.get('cache-control')?.includes('no-store'), 'Signed-in status responses are not shared or cached.');
  assert((await a.request('/account')).status === 200, 'Session survives a full page reload.');
  const replayToken = await anonymous.post(path, {});
  assert(replayToken.status === 200 && replayToken.html.includes('invalid or expired'), 'Consumed confirmation tokens cannot create another session.');

  stage = 'session refresh';
  const session = await a.session();
  assert(Boolean(session), 'Session is actually stored in cookies.');
  a.replaceSession(session.name, { ...session.data, expires_at: 1 });
  const refreshed = await a.request('/account');
  const updated = await a.session();
  assert(refreshed.status === 200 && updated?.data.refresh_token !== session.data.refresh_token, 'Proxy refreshes an expired stored session and sends rotated cookies back.');
  assert(refreshed.html.includes(first.email), 'Refresh preserves the verified user identity.');

  stage = 'cookie forgery';
  const forged = new Browser();
  forged.replaceSession(session.name, { ...updated.data, access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQifQ.invalid-signature', refresh_token: 'invalid-refresh-token', expires_at: Math.floor(Date.now()/1000)+3600 });
  assert((await forged.request('/account')).location === '/login', 'Forged session cookies do not authenticate a user.');

  stage = 'second user isolation';
  const b = new Browser();
  const second = registration('securedesk-web-b-' + suffix + '@securedesk.example.invalid');
  const signupB = await b.post('/register', second);
  assert(signupB.status === 303 && signupB.location === '/auth/check-email', 'A second independent browser registers its own account.');
  const secondPath = await emailLink(second.email);
  stage = 'default provider confirmation';
  const fabricated = await anonymous.request('/auth/confirm?code=' + randomUUID() + '&next=https://foreign-origin.example.invalid');
  assert([200, 307].includes(fabricated.status) && fabricated.location === '/login', 'A fabricated provider code uses the fixed sign-in destination.');
  assert((await anonymous.session()) === null && (await anonymous.request('/account')).location === '/login', 'A provider code URL alone cannot create a session or grant access.');
  const malformed = await anonymous.request('/auth/confirm?code=short');
  assert(malformed.html.includes('Confirmation link unavailable') && !malformed.location, 'Malformed provider callbacks offer a new confirmation instead of authenticating.');
  const duplicate = await anonymous.request('/auth/confirm?code=' + randomUUID() + '&code=' + randomUUID());
  assert(duplicate.html.includes('Confirmation link unavailable') && !duplicate.location, 'Ambiguous repeated provider codes are rejected.');
  const verifyURL = new URL('http://127.0.0.1:54321/auth/v1/verify');
  verifyURL.searchParams.set('token', new URL(secondPath, site).searchParams.get('token_hash'));
  verifyURL.searchParams.set('type', 'signup');
  verifyURL.searchParams.set('redirect_to', site + '/auth/confirm');
  const upstream = await fetch(verifyURL, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  const providerRedirect = new URL(upstream.headers.get('location') ?? '', site);
  assert(upstream.status === 303 && providerRedirect.origin === site && providerRedirect.pathname === '/auth/confirm' && Boolean(providerRedirect.searchParams.get('code')), 'The real Auth verify endpoint returns the default-template PKCE code callback.');
  assert(sql('select to_json(email_confirmed_at is not null) from auth.users where email=' + q(second.email)) === true, 'The provider endpoint confirms the second fictional email.');
  const landing = await b.request(providerRedirect.pathname + providerRedirect.search + '&next=https://foreign-origin.example.invalid');
  assert([200, 307].includes(landing.status) && landing.location === '/login', 'The real default-template callback redirects to sign-in without forwarding the code.');
  assert(landing.headers.get('referrer-policy') === 'no-referrer' && landing.headers.get('cache-control')?.includes('no-store'), 'Default callback responses prevent caching and referrer disclosure.');
  assert((await b.session()) === null && (await b.request('/account')).location === '/login', 'Default email confirmation does not issue an application session by itself.');
  const defaultLogin = await b.post('/login', { email: second.email, password: second.password, account_status: 'active', app_role: 'super_admin' });
  assert(defaultLogin.status === 303 && defaultLogin.location === '/account', 'The confirmed default-template user signs in with the password form.');
  const defaultState = sql("select json_build_object('role',p.app_role,'state',p.account_status,'request',r.status) from public.profiles p join auth.users u on u.id=p.id join public.registration_requests r on r.user_id=p.id where u.email=" + q(second.email));
  assert(defaultState.role === 'client' && defaultState.state === 'pending' && defaultState.request === 'pending', 'Default provider confirmation and forged login fields cannot approve or promote the user.');
  stage = 'second user isolation';
  const [viewA, viewB] = await Promise.all([a.request('/account?user_id=another-user'), b.request('/account')]);
  assert(viewA.html.includes(first.email) && !viewA.html.includes(second.email), 'Browser A cannot select browser B identity through query parameters.');
  assert(viewB.html.includes(second.email) && !viewB.html.includes(first.email), 'Concurrent server rendering does not share browser A session with browser B.');

  stage = 'sign-out and password login';
  const old = new Browser(); old.cookies = new Map(a.cookies);
  const logout = await a.post('/account', {});
  assert(logout.status === 303 && logout.location === '/login', 'Sign-out is a native POST action and redirects to sign-in.');
  assert((await a.request('/account')).location === '/login', 'After sign-out a fresh status request needs authentication.');
  assert((await old.request('/account')).location === '/login', 'Replaying the revoked session cookie cannot access the status page.');
  const again = await a.post('/login', { email: first.email, password: first.password });
  assert(again.status === 303 && again.location === '/account', 'Confirmed email can sign in again using the password form.');
  assert((await a.request('/account')).html.includes(first.email), 'Password sign-in writes a working server-readable cookie session.');
  assert((await a.post('/account', {})).location === '/login' && (await b.post('/account', {})).location === '/login', 'Both fictional test browsers finish signed out.');
  console.log('Web Auth check: ' + checks + ' passed. Retained fictional accounts: ' + first.email + ', ' + second.email);
  console.log('Passwords, confirmation links and session tokens stayed in memory; no hosted writes.');
}
run().catch(error => { console.error('FAIL during ' + stage + ': ' + (error instanceof CheckError ? error.message : 'Private test output withheld.')); process.exitCode = 1; });
