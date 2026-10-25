# SecureDesk — Phase 6 / Gate 6 final verification

**Phase 6 completed locally — PASS with transparently noted open development High finding, 8 October 2026.** Gate 6 criterion from approved roadmap allows resolved or transparently marked High/Critical findings. This is not confirmation of public production environment security. Phase 7 and deployment were not executed.

## What local production verification means

Production build is the optimized application version we ran on 127.0.0.1:3000. Real local flows were checked with that build. Public production verification additionally requires published hosting, HTTPS, hosted database, secrets, SMTP, attempt limits, private Storage, scheduled jobs and backup of that environment. Local evidence does not confirm those external settings. So previous Gate 5 explicitly did not promise completed deployment or production security; it did not mean its verification was skipped.

## Approved Phase 6 tasks

| Task | Observed result |
| --- | --- |
| Systematic CRUD/RLS per table | 22 public tables × SELECT/INSERT/UPDATE/DELETE × 17 caller states, plus tenant/column/schema and definer checks; full SQL regression 4177 PASS |
| Authorization Actions/API, IDOR/BOLA, mass assignment | 19 real Auth/API/native HTTP sets, all business roles, other company, peer Client, unassigned Staff, copied forms and stale permissions — PASS |
| Sessions, headers, rate limiting, XSS/CSRF | Nonce CSP, controlled attempts, duplicate auth fields, origin denial, literal stored HTML and revoked session; 241 additional native security checks — PASS with described boundaries |
| Flows for all roles, WCAG basics, responsive and states | Role flows through real Auth/cookies/native HTTP; additional browser review of keyboard, labels, contrast, two themes, 375/1280 px, loading/empty/unavailable/404 — PASS, not formal WCAG certification |
| Dependency scan | 0 known production findings; one unpatched High advisory through 5 development package entries, open and transparently documented |
| Security report and architecture/migrations | [SECURITY_REPORT.md](SECURITY_REPORT.md), [ARCHITECTURE.md](ARCHITECTURE.md), [MIGRATION_RUNBOOK.md](MIGRATION_RUNBOOK.md) |

Approved seven sources and Gate 2–5 historical reports were not changed. MVP was not expanded nor new schema migration added. There are 25 migrations, PostgreSQL 17.11 and 22 public RLS tables.

## Final results

- **4177 SQL/RLS checks / 22 files — PASS.** New security_matrix adds 1833 checks to previous regression. SQL fixtures roll back in a transaction.
- **4390 real Auth/API/native HTTP checks / 19 sets — PASS.** Check count is not request or user count; individual sets depend on retained history.
- **51 unit checks — PASS:** 36 content validator, 10 security controls and 5 bootstrap guard.
- ESLint, TypeScript, final Next.js production build and diff whitespace — PASS.
- Private key scan of sources, Git history, browser build, logs and audit metadata — PASS. Before final addition 254 candidates, 214 Git blobs and 29 browser assets reviewed; final review after addition recorded locally.

| Real runtime set | PASS checks |
| --- | --- |
| access-local | 49 |
| access-web | 76 |
| attachments | 341 |
| audit | 293 |
| auth-local | 25 |
| auth-web | 38 |
| autoclose | 188 |
| codes | 218 |
| organizations | 167 |
| people | 279 |
| projects | 385 |
| proposals | 355 |
| registration-local | 31 |
| registration-retry | 44 |
| registration-web | 61 |
| resolution | 553 |
| security-web | 241 |
| tickets | 682 |
| transfers | 364 |
| Total | 4390 |

One local audit continued across multiple attempts. First stale test assumptions were fixed: first form instead of Sign out, absent dashboard instead of login requirement, first 100 registrations instead of pagination, Windows command-line limit instead of stdin. Later a real CSP download conflict was found and fixed. Checks unaffected by the change were not unnecessarily repeated; proposals and attachments were repeated after fix and rebuild. Final native security matrix checked the new build. Then a small readable 404 view was added, final build made and real response/browser, code and types checked. SQL sources were not changed after their PASS result.

New negative test originally wrongly expected that rejected comment would not appear even as own returned form input and that Pending would not get redirect. Final check verifies explicit denial/status destination and **zero database writes**. That does not weaken authorization; user may see own failed input, and Pending may return to /account. New Windows guard before any fixture write rejected its own wrongly escaped path and was then fixed.

Repeatable normal command is **npm run check:gate6:local -- --create-demo**. Without development resume variables it runs all sets and SQL, records initial state, then verifies preservation and removes only access of its confirmed fictional accounts. Trial instructions and effects are in MIGRATION_RUNBOOK.md. Local aggregate PASS and raw credential-free results are in ignored .tools/verification/gate6/; additional source/bundle/browser evidence in phase6/.

## Fixes and their boundaries

Server creates new CSP nonce for each response; browser scripts must have matching nonce. User x-nonce/CSP header does not choose server value. Production has no unsafe-inline/unsafe-eval; development keeps only necessary framework evaluation. API connections use configured origin. Response policy for proposal/ticket download remains **sandbox; default-src 'none'**, with octet-stream, attachment, nosniff and no-store. Conflict between general Proxy header and download header was actually reproduced, fixed and confirmed with 355 proposal and 341 ticket attachment checks.

Auth attempts are counted per normalized, HMAC subject: login 10/10 min, registration 3/10 min, resend 1/min and confirmation 5/5 min. Memory has limit and monotonic clock; email case change or forged forwarding header does not bypass limit. That is single-process protection and resets on its restart. Direct Auth endpoints depend on provider limits. Multi-instance/SMTP/hosted review belongs to Phase 7.

Logout revokes provider session and application getUser rejects replay of its cookie. Verified that already issued JWT still keeps provider expiry on direct RPC. We do not claim instant revocation of all access tokens. Business permissions are checked from current database, so their change immediately revokes corresponding data/files and old forms.

Open is **one upstream High advisory in development-only braces**; no patched release at check time. Five npm findings represent the same chain, not five separate problems. Incompatible downgrade was not applied. Production audit has 0 known findings; full audit does not have 0. Details, primary sources and development measures are in SECURITY_REPORT.md.

## Browser and accessibility

Login: Tab → visible Skip to content → Enter focuses main. Registration: empty submit focuses required Full name with native message; visible fields have labels. Dashboard, ticket filters and audit filter work; loading, No matching tickets and No audit events have readable display. Unavailable ticket does not expose content and gives back/reload. Separate 404 view has main, title, skip and back links; its appearance works with strict policy.

Saved HTML/JS appearance in title, description and comment is shown literally. Real browser has no data-xss attribute or attacker img/script element; same title stays text in dashboard too. Controls are labeled; one main/h1. 375×812 and 1280×720 views have no horizontal overflow in reviewed screens. Four representative contrasts in both themes are above 4.5:1: Light minimum 5.80, Dark minimum 6.69. Theme restored to System, viewport reset. These are basics and samples, not test of every text, screen reader, browser or WCAG criterion. Flows for all roles have real native HTTP checks; not all manually repeated as separate React browser logins.

## Data, sources and access

From initial **3514 rows / 24 public and Storage tables, 3513 have the same full JSON hash**. Only controlled exception is platform setting for retention: test changed and restored 365 days, so revision legitimately is **19** instead of 13, with audit. No earlier business or Storage row was modified/deleted. **38 protected files have the same SHA-256.**

Retained **179 new fictional accounts and 41 companies**, including failed test attempts. Privileged roles, active Staff/OA assignments, create-project permissions, active codes, new Auth sessions and refresh tokens: **0**. Remain **1 previous user Super Admin and 3 previous sessions**. Fault/delay routines: 0; Closed with Pending reopen: 0; due auto-close candidates: 0. Initial read-only helper inventory command wrongly compared status with Pending instead of actual pending and reported 4 candidates; final check uses exact value. That was not a business worker error.

| Final local state | Count |
| --- | --- |
| Profiles | 577 |
| Companies | 127 |
| Projects | 191 |
| Tickets | 260 |
| Attachments / Storage objects | 111 / 111 |
| Comments / revisions | 13 / 7 |
| Reopen requests | 152 |
| Audit rows | 2351 |

Both local cron jobs restored to their active schedules: auto-close once per minute; retention daily **03:15 UTC**, cron timezone GMT. Separate runtime check confirmed real scheduled ticks. No reset, cloud write, Git commit/push or deployment.

## Next — Phase 7

Before publishing we choose a separate demo environment, verify its database and backup, review migration plan, set HTTPS/env/SMTP and repeat rights, download/session/CSP and scheduled jobs on real hosting. Only that review can give evidence for public demo. Documentation does not promise absolute production security. Instructions are prepared; Phase 7 did not start in this step.
