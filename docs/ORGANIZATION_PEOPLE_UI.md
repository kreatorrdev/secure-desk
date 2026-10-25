# SecureDesk — organization members and assignments / Phase 3

**Date: 7 October 2026. Result: second Phase 3 micro-step passed local SQL/API/HTTP checks and subsequent browser review.** Gate 3 is not yet complete.

## What was added

On organization profile active OA/SA gets **Members & assignments**, which opens `/organizations/[id]/people`. The screen has three categories: **Client memberships**, **Staff assignments** and **Admin assignments**. Default filter is Active; Ended/Revoked and All records are available. Up to 25 rows per page. Empty category and empty later page have a message and return to available records.

Display returns name, email, status of the specific link, dates and effective access through that link. Staff row includes effective create-project permission. An active record is not by itself proof of access: current role, business status, confirmed email, Auth ban/deletion/anonymous state and company status are considered. Global role change can invalidate old assignment; display does not reveal new global role or assignments to other companies. SA global access is not an additional row in company Admin assignment list.

Link **Manage Staff access** (OA) or **Manage Access** (SA) goes to existing verified forms with selected company. New screen is read-only; it does not introduce new membership decisions, transfer or privilege writes.

Uses existing English texts, dark/light tokens and organization module theme. Added own loading display; nonexistent and unavailable company share same not-found view, and errors use existing safe state and error boundary.

## Database and access control

Eleventh migration `20261007130000_organization_people_screen.sql` adds only `admin_organization_people(uuid,text,text,integer)`. It does not change previous migrations, existing table grants or write routines.

Function is STABLE SECURITY DEFINER with empty search_path and fully qualified tables. Execution allowed only to authenticated callers, and every execution checks confirmed identity, current active administrative role and `can_administer_organization`. OA reads only their active companies. SA keeps already approved global scope. Does not use broader helper for revocation forms on inactive companies, so T-01 historical rules were not extended.

Authorization precedes filter and people lookup. Missing, foreign and null organization UUID give same scope denial. Function accepts only known categories/status and bounded offset. Returns at most 26 rows (25 for display + next page signal), deterministically sorted by name, user and membership episode/assignment UUID.

Returned columns are exactly: link id, full_name, email, link_status, since, ended_at, updated_at, can_create_project and has_current_access. Phone, application message/reason, global role, other company scopes, Auth tokens and other private details are not in the response. Direct access to profiles/Auth tables was not extended.

Each page repeats server identity/role, reads company through RLS, then RPC repeats scope. Client/Staff have no link and cannot open page or call RPC. Pending/Rejected return to own status; anonymous to login. Existing proxy already covers new subpath, with cookie check/refresh and private/no-store headers.

## Executed checks

| Set | Result |
| --- | --- |
| SQL/RLS, 11 test files | 907 / PASS (66 new + 841 existing) |
| New real Auth/API/HTTP-cookie matrix | 279 / PASS |
| ESLint, final pass | PASS, no warnings |
| TypeScript and production build | PASS |
| Git diff whitespace check | PASS |

SQL covers positive OA/SA scope, all forbidden roles and anon/service_role, cross-company UUID, forged JWT metadata, minimal columns, active and ended membership episodes, revoked Staff/Admin assignments, currently invalid role/account, ban/deletion/email/anonymous conditions, revocation with same claims, inactive companies, filters, limit and pagination stability and preserved ban on direct writes.

New command is `npm run check:organizations:people:web -- --create-demo`. Checks exclusively local origin/Docker project and public local key. Creates six fictional accounts and two companies per full run; real signup/email/login gives sessions for all roles. Controlled decisions and revocations use existing JWT RPCs; DB owner serves only temporary bootstrap and explicit fixture simulations.

HTTP matrix checks three categories in both companies for anonymous, Pending, two Clients, Staff, OA and SA; exact rows, absence of foreign names/emails, navigation, empty display, filtering, XSS escaping of names, RSC response, forged metadata/query parameters, history and immediate revocation with same token/cookies.

First trial passed 98 checks, then stopped on literal comparison of empty state. React inserted invisible HTML separator between sentence parts. Test now removes HTML comments only for those two visible text comparisons; scope and undisclosed identity checks were not weakened. Final set passed 279 checks.

Old Gate 2 script now checks presence of its ten concrete baseline migrations instead of forbidding existence of later migrations. That query verified returned 10. Full historical Gate 2 API set was not re-run in this micro-step; its SQL base is part of 907 / PASS.

## Visual check and boundaries

Subsequent check 7 October 2026 succeeded in real local application, through already logged-in Super Admin session and fictional trial company. Earlier automatic tool approval limit no longer blocked browser access.

Verified were:

- organization list pagination and profile → Members & assignments navigation;
- all three categories, empty Active views, Ended membership, Revoked Staff assignment and All records for Admin history;
- literal display of trial name with script tags, dates, Not available access and No for project permission of revoked Staff assignment;
- confirming filter with Enter on Apply filter button;
- System/Light/Dark choice, both themes at 390 px width and desktop layout 1280 × 900; no horizontal overflow;
- Light theme preserved after refresh;
- Manage Access opens exactly selected company, without submitting access change form;
- browser console without recorded error/warn messages during review.

After completion System theme and previous browser size were restored. Saved JPEG evidence in ignored .tools/verification/: people-browser-mobile-dark.jpg, people-browser-mobile-light.jpg and people-browser-desktop-light.jpg. Review did not require application, database or user permission changes.

This is visual and navigation check through existing SA session. Fresh login, complete browser flow for every role, multi-page people list and intentionally triggered load error were not repeated in browser. Earlier 907 SQL/RLS and 279 Auth/API/HTTP-cookie checks remain separate access control evidence; not re-run because of documentation-only changes. Earlier saved HTML snapshots from people-preview were not used as substitute for this review.

## Preserved data

Hash check of all eight existing business tables before migration and after SQL ROLLBACK trials confirms unchanged business rows. Both API/HTTP trials separately confirm unchanged earlier rows against initial UUIDs.

Two runs total retained 12 fictional accounts and four companies with history. New privileged roles: 0; active trial Staff/Admin assignments and create-project permissions: 0; their Auth sessions: 0. Only permanent Super Admin remains earlier user account. Final state: 81 profiles, 26 companies and 11 migrations.

No reset, cloud write or change to .env.local or seven approved sources. Results are in ignored `.tools/verification/organization-people-result.json`. Local production preview runs at `http://127.0.0.1:3000`.

## User review and next step

1. Refresh local application and log in as responsible Admin/SA.
2. Open **Your organizations → View profile → Members & assignments**.
3. Change category and status. **All records** includes preserved history; trial Staff/Admin assignments are finally revoked, so they appear under **Revoked** or **All records**.
4. For existing controlled assignment changes use **Manage Staff access / Manage Access**.

Next micro-step introduces organization codes, with rule that only responsible Admin issues/rotates/revokes code, and code entry starts request without automatic membership. Requests and transactional transfer then get their checks. Projects/proposals continue Phase 3, and tickets/dashboard remain in Phase 4.
