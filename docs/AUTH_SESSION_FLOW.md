# SecureDesk — forms, cookie sessions and practical trial

Date: October 6, 2026. Next.js registration/login, email confirmation, logout and display of own status implemented locally. 352 SQL checks, 38 real HTTP checks, ESLint, TypeScript and production build: PASS. Hosted database and approved documents were not changed. Gate 2 remains open.

## Steps for user trial

1. Open [registration](http://127.0.0.1:3000/register). Use fictional data and new address, e.g. ana@securedesk.example.invalid. Enter six agreed fields and your trial password of at least 8 characters; do not send password in conversation.
2. After Request access Check your email appears. In [local Mailpit](http://127.0.0.1:54324) find message for entered address. Trial messages are not sent to real recipients.
3. Open link, then Confirm email and continue. Opening link alone does not consume token.
4. Your access request page shows email, Pending and first pending request. Confirmed email does not yet grant company access.
5. Refresh page: session remains. Sign out removes current session; /account again requires login. Then you can sign in with same email and trial password.

Form is English per project rules. Error correction does not return password to display; other fields kept in form state. Resend confirmation available on Check your email and Sign in. Response does not reveal whether specific address has account.

## Implementation and decisions

- /register: validation in browser and on server, only six allowed fields. No role or status choice. Auth trigger from previous step creates client/pending profile and request in one transaction.
- /login: login through Server Action; wrong password gets generic response, unconfirmed email gets confirmation instructions. Password is not trimmed. Registration limits bcrypt input to 72 UTF-8 bytes; longer input gets readable error.
- /auth/confirm: GET shows button, POST verifies token via verifyOtp(type=email). Destination fixed /account; query next/redirect_to not used. This preserves token from ordinary email-link preview.
- /account: fresh getUser identity, confirmed email, no anonymous account. SELECT only own account_status and latest request status/reason, with RLS. No organization/ticket/project data.
- Sign out: POST, scope=local, router view refresh and redirect /login. Does not sign out all other devices.
- proxy.ts: new SSR client per request, getClaims and refreshed request/response cookies. Cache headers from setAll forwarded; all Auth/status responses private/no-store and no-referrer. No ISR or globally shared user session.

Cookies use SameSite=Lax and Secure for HTTPS/hosted Supabase. Local HTTP uses Secure=false. Per official Supabase SSR pattern cookies remain available to browser client, i.e. not HttpOnly. Server does not trust their user object or metadata; verifies Auth identity, database verifies permissions. Claiming cookie value alone is proof of identity would be wrong.

Next.js origin/host protection applies to Server Actions; allowedOrigins list not extended. Supabase Auth rate limits remain enabled and 429 gets message to wait. This is not complete production anti-abuse/CSRF/security audit; later phase adds its matrix and applicable protections.

## Local configuration

.env.local now contains local Supabase URL, public CLI anon key and SITE_URL=http://127.0.0.1:3000. Previous hosted configuration saved in .tools/env/hosted.env; both ignored. .env.example has three empty fields. CLI not cloud-linked.

CLI locally gives legacy anon JWT. config.ts allows that format only for exact local API origin and role=anon; that format-check is not signature verification. Real Auth/Data API validate token. Privileged service-role/secret/personal token not accepted as application key. Publishable format still used for hosted project.

SITE_URL is explicit origin for email links, with HTTPS requirement outside localhost; not derived from unverified Host header. Local Supabase site_url and template use same 127.0.0.1:3000 address. Use that address consistently; localhost and 127.0.0.1 have separate cookies.

For review production local server currently works. Do not run second server on another port, because email links target 3000. To change code stop existing preview server, then run npm run dev. For new preview: npm run build, then npm run start -- --hostname 127.0.0.1. Local Supabase/Docker should run.

## Repeatable check and its boundaries

    npm run lint
    npm run typecheck
    npm run build
    npm run check:supabase
    npm run db:test
    npm run check:auth:web -- --create-demo

Last script requires running local server and exact local .env target. Uses real HTML and native Server Action form POST, separate cookie jars, local Mailpit and read-only DB controls. Creates and retains two fictional accounts on each explicit run. All test passwords and session/email tokens stay in memory; SQL fixture reverts through ROLLBACK. If script stops after signup, earlier fictional account may remain. No reset or history deletion.

38 checks cover server validation without HTML limits, password non-reflection, CSRF, mass assignment, signup without session, invalid password/unconfirmed email, GET without confirmation, invalid/replayed token, fixed redirect, cookies/cache/referrer, Pending status, reload, refresh rotation, forged cookies, two parallel identities, logout/revoked-cookie replay and repeat password login. Refresh test intentionally changes expires_at in storage of legitimate trial session to trigger real refresh and verify new refresh token; does not wait natural one-hour JWT expiry.

Check is against local production Next.js build. That is proof of real HTTP/server/cookie flow; not complete JavaScript browser E2E, all device types, hosted email or all future roles. Browser appearance reviewed separately, and user practical flow remains useful for learning and UX feedback.

352 SQL checks passed again. 25 SDK Auth checks from AUTH_REGISTRATION.md document are previous backend result; that local helper now recognizes new app email template, but today's Next.js proof is separate 38 checks. check:supabase locally verifies Data API rejection of invalid token, because public Auth settings alone do not validate key. Node 24 on import config.ts in CLI script may show MODULE_TYPELESS_PACKAGE_JSON warning; checks pass and that does not change API rules.

## What follows

First local Super Admin development setup now completed and documented in [LOCAL_SUPER_ADMIN.md](LOCAL_SUPER_ADMIN.md), with 396 SQL and 5 setup-wrapper checks. Controlled backend approval/rejection/retry and consistent activation of new organization/first membership/General Support now implemented: [REGISTRATION_REVIEW.md](REGISTRATION_REVIEW.md), 565 SQL and 31 Auth/RPC checks. Rejected view reads reason; administrative and retry form are next steps. Dashboard and business modules wait their checks. For hosted transfer first review/apply migrations and email/redirect configuration; changing .env alone is not sufficient setup.

Business decision source: [US-01–02](spec-v1-approved/USER_STORIES.md), [decisions 06/07/09/33](spec-v1-approved/DECISIONS.md), [roadmap](spec-v1-approved/DEVELOPMENT_ROADMAP.md) and [threats](spec-v1-approved/THREAT_MODEL.md), unchanged. Technical sources: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [sessions/cache/cookies](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates) and installed Next.js 16.3.8 documentation for forms, cookies, proxy and Server Actions.
