# SecureDesk — first organization display / Phase 3

**Date: October 7, 2026. Result: first Phase 3 micro-step passed local checks.** This is not completed Gate 3.

## Functionality and decisions

Added `/organizations` and `/organizations/[id]`, and **Your organizations** link on `/account` for actually active account. List shows up to 12 organizations per page, with stable name/UUID order and next-page check. Profile shows name, status, description, industry, contact person, email, phone and address. Missing optional data has clear English messages.

Rules are existing: Client sees active company of active membership; Staff active companies of active assignments; OA active companies of administrative assignments; SA existing global scope, including pending/inactive companies. Pending/Rejected account returns to own status, unsigned to login. Colleague data, member and assignment lists not part of this display.

Each page re-verifies Auth identity and current role. Then user Supabase client reads only explicit columns through existing RLS. No new migration, grant extension or privileged client. UUID in address is query criterion, not proof of permission. Missing, invalid and disallowed identifiers give same **Organization not available** display, without additional query revealing company existence.

Proxy covers both new routes, refreshes session and sets private/no-store headers. List/profile render on demand; private results not in shared cache. Organization links do not prefetch. Revocation applies to next server/API request; previously displayed content on open screen not cleared by push mechanism.

UI uses separate dark/light tokens and System/Light/Dark choice. Choice saved locally; if local storage unavailable, choice remains for that page session. Loading display, empty list, empty page, unavailable profile, expected load error and unexpected error have separate messages. New error boundary uses `retry` per installed Next.js 16.3.8 documentation. Data text rendered as text.

T-01 unchanged: limited historical access to inactive companies for non-SA users finalized before deactivation/archive module. This step keeps already verified access boundary.

## Executed checks

| Check | Result |
| --- | --- |
| Existing SQL/RLS set, ten files | 841 / PASS |
| New real Auth/API/HTTP-cookie matrix | 167 / PASS |
| ESLint, final pass | PASS, no warnings |
| TypeScript and production build | PASS |
| Git diff whitespace check | PASS |

New command: `npm run check:organizations:web -- --create-demo`. Uses only verified local origin, public local key and local Docker project. Full probe retains six fictional accounts and two companies with history. Passwords, email tokens and sessions stay in memory.

Covered anonymous, Pending, two Clients, Staff, OA and SA; exact API rows and displayed pages; allowed contact data; hidden foreign profile; navigation on account; pagination and invalid parameters; escaped XSS text; forged metadata/query parameters and cookies; real RSC response without foreign data; pending/inactive boundaries; same token/cookies after revocation; empty scope and Rejected status.

First probe ended with 138 successful checks and failed RSC content-type expectation: Next.js correctly returned 307 for URL with `?_rsc`, before delivering content. Local framework code confirmed that behavior. Probe aligned with URL rule, and final RSC response and absence of foreign data verified in final 167 / PASS. That was not data leakage finding.

## Visual review and evidence boundaries

In Chrome reviewed HTML snapshots of real test responses with exclusively fictional data: list, profile, empty scope and unavailable profile. Loaded real build CSS/JS resources. System → Dark → Light switching works, and choice remained saved opening next snapshot. Profile also checked at viewport 390 × 844: measured document and content width equal, no horizontal overflow.

This is visual review of snapshots and theme control hydration, not complete browser E2E login and navigation flow. Real route authorization verified separately by API/HTTP matrix. Network error, retry click after intentionally caused error and loading display timing not separately triggered. Broader WCAG/mobile and complete browser flows remain in their phase.

Snapshots and result summary in ignored `.tools/verification/`; no cookies, passwords or tokens. Temporary server for visual review shut down. Real local production preview runs at `http://127.0.0.1:3000`.

## Preservation and local data

Both runs together retained 12 new fictional profiles and four companies. All new profiles have Client role, no active trial Staff/Admin assignments or create-project privileges, and 0 Auth sessions. One permanent Super Admin as before probes. Final: 69 profiles, 22 companies and same ten migrations.

Pre/post hash by initial UUIDs in both probes confirms no earlier business row changed. Previously applied migrations, approved specification and .env.local not changed. No reset or cloud write.

## User review and next micro-step

1. Sign in at `http://127.0.0.1:3000/login`.
2. On account open **Your organizations**.
3. Open **View profile** for available company and try **Theme**.

After reviewing this step follows display of members and assignments in administrative scope, with minimally needed data and positive/negative checks. Organization codes, requests/transfer and full projects/proposals implemented in separate steps. Tickets and dashboard belong to Phase 4.
