# SecureDesk — Pending Requests screen

Current own retry UI, 659 SQL and 44 retry web checks are in [REGISTRATION_RETRY_UI.md](REGISTRATION_RETRY_UI.md). This document preserves the result of the previous review screen.

Date: 6 October 2026. Local administrative screen implemented per US-04/05 and verified: 606 SQL/RLS checks and 61 real Next.js form/cookie checks — PASS. ESLint, TypeScript and production build — PASS. User logged in with own Super Admin account, confirmed button and reviewed row and history. History display was also visually reviewed in browser. Gate 2 remains open for own retry form and remaining controlled flows.

## User trial

1. Open http://127.0.0.1:3000/login and log in with own local Super Admin account. Password stays in application.
2. On /account choose **Open Pending Requests**. Screen is /admin/requests.
3. **Pending** shows requests awaiting decision. **Decision history** shows completed requests. Approved/Rejected are business access decisions; they do not represent currently logged in/out session status.
4. Each application shows name, email, email confirmation, phone, attempt number, time, message and trusted company route. Text from application is shown as text, without executing HTML.
5. **Route to an existing company** is Super Admin only. Choosing pending/active company routes review to responsible administrator, without membership or account activation. Company search changes choices in routing forms, not request list. At most 100 choices; if more, narrow by name.
6. **Approve with a new company** is Super Admin only and unrouted, confirmed Client request. Verify name, address, email, phone and description; industry/contact person optional. Confirm data verified, then submit decision.
7. **Approve for …** approves membership in exact previously routed company. **Stored company details** shows its saved data even when routing choice search is narrowed. Pending company is activated, and General Support stays unique.
8. **Reject this request** requires reason up to 2000 characters visible to submitter on /account. History keeps earlier decisions and attempts. Completed requests have no review forms.

Decisions are sent only by explicit submit button. While sending button is disabled; errors preserve text fields and show message. After success list refreshes and shows confirmation. List has 10 rows per page, with server filter before pagination and Previous/Next links. Times are marked UTC. Loading, unavailable/error and empty displays exist.

## Rights and server boundary

Active, confirmed Super Admin has global queue and routing/new-company controls. Organization Admin sees only currently active assignments to pending/active companies and can approve existing company or reject request in their scope. Pending/Rejected Client, active Client and Staff do not get administrative link or data of this screen. Anonymous user goes to /login; logged-in user without active admin rights goes to /account.

reviewAccess checks getUser and own real active role from database. Each submitReview Server Action repeats that check, validates intent/UUID/text bounds and calls existing atomic RPC under cookies identity of user. Actor, app_role, status and next from form never determine identity, privileges or redirect. Authority over concrete request and company is re-checked by DB routine; hidden fields and button visibility are not authorization.

proxy.ts now covers /admin/:path*, refreshes cookies and returns private/no-store and no-referrer. Next.js Origin/Host check remains default; allowedOrigins was not extended. Responses do not return raw DB diagnostics. Application and browser still use only local public key, without service_role or personal access token.

Sixth migration **20261006143000_registration_review_screen.sql** adds only three read-only public functions:

| Function | Purpose |
| --- | --- |
| current_account_role() | Own real active role; null for inactive/ineligible account. No caller-supplied user ID. |
| admin_registration_organizations(p_search) | Scoped pending/active companies and verifiable data; literal search and at most 101 rows for narrow-choice signal. |
| admin_registration_queue(p_view,p_limit,p_offset) | Scoped pending or reviewed row, email confirmation, eligibility and saved company data; filter before limit/offset. |

SECURITY DEFINER, empty search_path, authenticated check and real active_actor_role; EXECUTE authenticated only. Anon/service_role have no EXECUTE. No tables or direct write grants added/extended, and profile app_role column is still not publicly SELECT available. Previous five applied migrations and seven approved sources were not reworked. Stored company data comes from same scoped queue routine, so choices/search do not remove data needed to verify already routed request.

## Checks

    npm run db:test
    npm run check:registration:web -- --create-demo
    npm run lint
    npm run typecheck
    npm run build

SQL: seven files, 606 / PASS, including 41 new UI read function checks. Covered are anon/service bans, own role, pending/Staff bans, assigned/foreign/unrouted scopes, pending organization without extending ordinary table RLS, confirmation/eligibility, filter/pagination/search, assignment pull and banned/deleted/unconfirmed identity. Tests use SQL identity fixture, not real browser login. Check repeated after retained web trial: 606 / PASS. One global SA test assertion now counts actual page of its fixture request, instead of assuming it is among first 11 rows; pagination and RLS were not changed. Hash of all eight tables confirmed preservation and new retained web data. BEGIN/ROLLBACK restores all SQL fixture; hash snapshots of eight business tables confirmed unchanged stored data after migration and tests.

Web: scripts/check-registration-review-web.mjs runs real signup/Mailpit confirmation, native Next.js login and multipart Server Action POST with separate account cookies. 61 / PASS: anon/Client/Staff bans, copied forms, forged role/actor/redirect fields, foreign Origin, UUID/reason/company/confirmation validation beyond HTML, rejection and own reason, history, new attempt via previously verified RPC, new-company and assigned existing-company approval, exact reviewer, unique General Support, repeated/old decision, cross-tenant UUID and role/assignment revocation in same session. Script walks Next/Previous pages when searching for its fixture request and sends form on URL where it was actually rendered. Does not use user credentials or process their existing applications.

Temporary SA/Admin/Staff fixture roles and assignments were set by local DB owner write only for newly created fictional accounts, because general role-assignment UI is not built yet. finally returns two reviewer profiles to client/pending, deactivates their assignments and closes all four test sessions. Passwords/tokens stay in memory. Script rejects target outside exact local configuration/Docker workspace and requires explicit --create-demo.

One web trial retained four fictional accounts, one approved company with two Client memberships/one General Support project and one pending company for assignment fixture; two assignment links are inactive. All history retained. After verification: 14 profiles, 17 requests, 4 organizations (3 active, 1 pending), 4 memberships, 3 projects and 12 audit events; six migrations. Zero active fixture admin assignments and zero sessions of new web fixture accounts; only persistent Super Admin is user account. Counts grow on new explicit trials.

31 Auth/RPC checks of backend review step and 38 HTTP checks of earlier Auth step remain separate historical results; not re-run for additional demo data. UI/RPC approval keeps atomic transaction from previous migration. Full audit/failure telemetry/retention, membership transfer, Staff/admin assignment workflow, archive scope and other modules were not completed in this step.

Hosted database was not changed, CLI not cloud-linked and reset/business history deletion was not done. Git commit keeps local code/SQL/tests/documentation, not Supabase data or secrets. No GitHub push. Production server with new screen runs at http://127.0.0.1:3000; before later npm run dev stop existing server on that port.

## Next micro-step

Own retry form on /account was completed in next step: [REGISTRATION_RETRY_UI.md](REGISTRATION_RETRY_UI.md). Next are controlled role/assignment flows and final checks toward Gate 2, before dashboard.

Decision sources: [US-04/05](spec-v1-approved/USER_STORIES.md), [approved decisions](spec-v1-approved/DECISIONS.md), [matrix](spec-v1-approved/PERMISSIONS_MATRIX.md) and [roadmap](spec-v1-approved/DEVELOPMENT_ROADMAP.md). During implementation local Next.js 16.3.8 guides forms.md/server-actions.md from node_modules/next/dist/docs/01-app/02-guides/ were read. Backend details: [REGISTRATION_REVIEW.md](REGISTRATION_REVIEW.md).
