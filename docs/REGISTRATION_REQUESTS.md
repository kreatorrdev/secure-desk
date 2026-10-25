# SecureDesk — registration requests and history

Date: October 5, 2026. Third migration applied locally only. Added public.registration_requests. All 304 SQL checks passed (209 previous + 95 new); anonymous local API rejected with HTTP 401 / code 42501. After ROLLBACK no Auth users or rows in six business tables. Hosted database and .env.local were not changed.

This document records the previous step and results at that time. Latest signup bridge, email confirmation, 352 SQL + 25 real Auth checks and retained demo described in [AUTH_REGISTRATION.md](AUTH_REGISTRATION.md). Organization privileges now also require confirmed Auth email.

## Three separate things

Supabase Auth stores identity and login, profiles stores role and account status, and registration_requests stores what user requested and response to each attempt. Email and password are not copied to this table. Email confirmation proves control of email address; administrative approval and matching membership/assignment grant business access.

approved value in request alone does not change profiles, membership or RLS. Future controlled approval must make all needed changes in one transaction. Explicitly verified by negative test: profile that remained pending has no organization access although its test request has approved.

## New request data

| Field | Meaning |
| --- | --- |
| id / user_id | Separate attempt UUID and link to existing profiles row. |
| attempt_number | Positive attempt number per user; first default 1, unique together with user_id. |
| company_name_text / message / phone | Non-empty data user submitted; phone is request snapshot. Not verified company data from organizations. |
| target_organization_id | Optional trusted routing to existing company for Admin review; does not represent membership. |
| status | pending, approved or rejected; initially pending. |
| reviewed_by / reviewed_at | Who and when decided; required for completed decision, empty for pending. |
| rejection_reason | Required non-empty reason for rejected, NULL for pending/approved. |
| created_at / updated_at | UTC times; controlled pending routing change refreshes updated_at. |

FK does not delete history cascade. Review time cannot precede request creation. Full length/format validation and target role/approver authorization come through dedicated Auth/admin routines; ordinary FK on reviewed_by only confirms profile exists.

## Technical elaboration T-02: retry

Each attempt is new row. Partial unique index allows at most one pending request per user. Attempt number clearly orders history even when timestamps match.

Example model, not permanently inserted in database:

| Attempt | Status | Response |
| --- | --- | --- |
| 1 | rejected | Missing proof of company affiliation. |
| 2 | pending | New request awaits decision; old response remains. |

Trigger prevents overwriting submitted content, author, identifiers, attempt number and creation time. Completed decision is not rewritten or reopened. Direct row DELETE blocked to preserve history. Pending target_organization_id may change by future verified administrative routine; after decision that value also remains in history.

Database constraints do not represent permission to retry. Future controlled flow must tie request to confirmed Auth identity, lock user profile, verify previous attempt rejected and no pending request, then add next attempt_number and return profile to pending in same transaction. Already approved user for company change uses separate transfer flow. That Auth/retry API not open yet.

## Access in this step

Authenticated has SELECT only on id, user_id, attempt_number, status, rejection_reason, created_at and reviewed_at. Submitted message/phone/company text, private routing and reviewed_by not exposed by this initial table API, nor to administrative application session. Detailed responsible Admin review added with controlled approval flow.

RLS then limits rows: user reads own history; active organization Admin reads statuses routed to their active organizations; active Super Admin reads all statuses, including unrouted requests. Staff and Client membership alone do not grant reading others' registrations. Pending Admin, forged role in user_metadata, missing identity and anonymous Auth do not grant administrative scope. Revoking Admin assignment immediately removes that read scope.

Unrouted request not visible to arbitrary organization Admin. Routing will be trusted server/admin action, without automatic approval by company name text or user organization_id.

Anon has no access. Direct INSERT/UPDATE/DELETE for anon/authenticated/service_role closed; this includes business Super Admin through ordinary application API. Registration form, automatic profile/request creation on signup, retry function or administrative decision not implemented.

## Checks and result boundaries

95 new pgTAP checks cover initial values, one pending, unique attempts, required data, FK, consistent decision and time, preserved content/reason, own/foreign request, all roles, forged metadata, anonymous Auth, limited columns, routing, Admin revocation and fact that request status does not activate account or membership. All three files passed via npm run db:test: 304 checks, PASS.

Test Auth rows and JWT context fictional. SQL simulation not yet test of real registration, email confirmation or cookie session. Local email confirmation included and verified in next Auth step before real signup test; existing CLI Auth default not proof verification works. reviewed_by record not full approver authorization check until controlled routine introduced.

Valid local public key gives Auth settings HTTP 200, and anon status read HTTP 401 / 42501. No key displayed in checks. All trial data removed through ROLLBACK; after tests confirmed 0 Auth users and 0 rows in all six tables. No new reset. First profiles reconstruction is evidence of previous step.

Gate 2 remains open. Next: controlled linking Auth to pending profile and first request, email confirmation, session refresh/verification and administrative flow with membership/assignment. For new organization activation, first Client membership and General Support must arise consistently. No dashboard or business pages.

## Practical review

In local Studio refresh Table Editor, then public → registration_requests. View user_id, attempt_number, status and rejection_reason. No rows because trial changes removed. Studio is administrative tool and shows all columns; user permissions confirmed by tests.

Migration: supabase/migrations/20261005193034_registration_requests_foundation.sql. Test: supabase/tests/registration_requests.test.sql. Applied migrations not rewritten; new SQL verified and applied via migration up --local.

## Sources

- [Approved decisions 06–10, 33 and T-02](spec-v1-approved/DECISIONS.md), [request schema](spec-v1-approved/DATABASE_SCHEMA.md), [US-01–05](spec-v1-approved/USER_STORIES.md) and [permissions matrix](spec-v1-approved/PERMISSIONS_MATRIX.md), preserved unchanged.
- [Supabase RLS and column grants](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [PostgreSQL 17 constraints](https://www.postgresql.org/docs/17/ddl-constraints.html) and [trigger functions](https://www.postgresql.org/docs/17/plpgsql-trigger.html).
