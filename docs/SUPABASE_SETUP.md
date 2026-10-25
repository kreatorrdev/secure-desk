# SecureDesk — Supabase connection

## Current status

The development project was created and read-only connection was verified on 5 October 2026. Next.js uses @supabase/ssr 0.12.7 and @supabase/supabase-js 2.117.2. Since 6 October the application uses local Supabase: ten migrations and eight business tables, signup/email/cookie flow, Super Admin setup, review/retry, General Support, and controlled roles/assignments. Manage Access forms are complete: 841 SQL/RLS and 76 new native Next.js form/cookie checks, lint, TypeScript, and build — PASS. Final Gate 2 matrix passed locally: 841 SQL/RLS, 362 actual API/cookie and 219 native web checks, lint, TypeScript, and build — PASS. See [GATE2_VERIFICATION.md](GATE2_VERIFICATION.md). Previous results remain recorded in each step’s documents. The hosted database does not have these migrations and was not changed. Rules are in [ACCESS_MANAGEMENT.md](ACCESS_MANAGEMENT.md); forms/read model/practical review in [ACCESS_MANAGEMENT_UI.md](ACCESS_MANAGEMENT_UI.md).

## Configuration and clients

- .env.local now has local Project URL, public CLI anon key, and SITE_URL. Git ignores it, as with the previous hosted configuration in .tools/env/hosted.env. .env.example has three empty fields.
- lib/supabase/config.ts reads public configuration. Privileged keys and personal access tokens are not accepted as the application publishable key.
- lib/supabase/client.ts creates the browser client.
- lib/supabase/server.ts creates a new client per server request and uses that request’s cookies. The module is marked server-only.

Cookies now allow login visible to server and browser. proxy.ts checks/refreshes the session and returns cookies and cache headers; /account additionally uses getUser for current identity confirmation. Data remains protected by RLS rules. Auth responses are private/no-store; the confirmation URL has no-referrer protection.

The publishable key identifies the application/project. Supabase Auth will confirm the user; our server checks and RLS determine which rows that user may access.

## Repeatable read-only check

From the project terminal run:

    npm run check:supabase

The check reads Auth settings. In local environment that endpoint alone does not confirm key validity: Data API with a valid public anon JWT denies profiles read (401/42501), and with an invalid token returns 401/PGRST301. For hosted configuration the previous valid/invalid publishable key check is retained. The script has no writes.

- Hosted result from the previous step: publishable key HTTP 200, invalid key HTTP 401.
- Current local result: valid anon token 401/42501 on profiles, invalid token 401/PGRST301.
- This checks connection/token and anonymous denial; membership and user scopes are checked by separate SQL/Auth tests.

Personal access token sent in chat was not used or saved in the project. You confirmed revocation. For CLI we will consider safe local login in the next step; secrets are not entered in chat.

## Next micro-steps

1. Git author is set only for this repository: kreatorrdev and your GitHub noreply address. Initial local project version is saved.
2. Supabase CLI 2.119.0 and local configuration are prepared. WSL and Docker Client/Server were verified after restart; program and actual Docker disks are on E:. Empty local database and Studio were started; Studio returned HTTP 200. Stop/start local database preservation was verified. Procedure and limits are in MIGRATIONS.md.
3. Ten migrations applied locally; Next.js forms, confirmation, and cookie sessions were introduced. Previous Auth step has 38 actual HTTP checks, see AUTH_SESSION_FLOW.md. Safe local Super Admin setup completed with then 396 SQL and 5 wrapper checks, see LOCAL_SUPER_ADMIN.md. Controlled backend approval/retry and General Support completed, see REGISTRATION_REVIEW.md. Pending Requests forms completed and verified, see REGISTRATION_REVIEW_UI.md. Own retry form completed, see REGISTRATION_RETRY_UI.md. Role/assignment backend and Manage Access forms completed and verified, see ACCESS_MANAGEMENT_UI.md. Local Gate 2 was later confirmed in GATE2_VERIFICATION.md; organizations/projects follow in Phase 3.
4. Build the basic identity, organizations, and membership model, Auth and RLS with positive and negative tests. Dashboard follows the approved roadmap.

Gate 1 passed. Backend signup/email, Next.js cookie flow, and current SQL/RLS scopes are verified. Controlled registration writes are verified; Pending Requests UI is verified; own retry form/history is complete and verified; role/assignment backend and forms are complete and verified; final Gate 2 matrix passed locally, see GATE2_VERIFICATION.md. Approved documents were not changed.

## Official sources

- [Supabase SSR clients and cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Local development and migrations](https://supabase.com/docs/guides/local-development/overview)

Local Studio is at http://127.0.0.1:54323. Eight tables contain active local Super Admin and trial Client profiles/requests; 16 saved active API/web companies have General Support and audit history (12 Client membership episodes total), and there are two pending UI fixture companies. Application .env.local uses local configuration. Test passwords are not saved: practical user trial creates a new account through /register. Optional local analytics stays off because of the Windows Docker log endpoint; minimal business review audit already exists; broader audit/retention/failure telemetry follow in their phase.
