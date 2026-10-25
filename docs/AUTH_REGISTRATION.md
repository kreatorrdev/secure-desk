# SecureDesk — Auth registration and email confirmation

Date: October 5, 2026. Fourth migration applied locally only. 352 SQL checks, 25 real Auth/API checks and ESLint: PASS. Hosted database, .env.local and approved documents were not changed. Gate 2 remains open.

This document records the previous backend step of October 5. Current Next.js forms/cookie sessions, 38 HTTP checks and local application configuration are in [AUTH_SESSION_FLOW.md](AUTH_SESSION_FLOW.md). Count of fictional demo accounts grows with explicit practical checks.

## Registration in one transaction

Auth stores email, password and identity. AFTER INSERT trigger on auth.users validates data and creates profiles with same UUID, client/pending, then registration_requests with attempt 1/pending, without target organization or decision. Failure of any write rolls back entire registration, without incomplete account. Direct application business writes remain closed.

| Signup field | Local rule |
| --- | --- |
| email / password | Auth validates login; at least 8 password characters and mandatory email confirmation. |
| options.data.full_name | Non-empty text, at most 120 characters. |
| options.data.phone | Non-empty text, at most 40 characters; specific format not finalized yet. |
| options.data.company_name | Non-empty text, at most 200 characters; snapshot company_name_text. |
| options.data.message | Non-empty text, at most 4000 characters. |

Leading/trailing whitespace is trimmed. Length bounds are technical validation elaboration. Role, status, organization_id, attempt count and decision are not taken from user metadata. Identity comes from NEW.id. Later user_metadata changes do not overwrite profile or history.

Functions are in securedesk_private, with empty search_path and limited EXECUTE grants. Signup trigger uses SECURITY DEFINER without adding direct business INSERT permissions to Auth DB role. Real GoTrue signup proved its execution. Trigger covers every new Auth INSERT; future admin invite/creation must provide this data or have separately reviewed procedure. OAuth/invite not implemented yet.

## Email confirmation and approval

Login before email confirmation is rejected. After confirmation succeeds, but client/pending reads only own status and request history through allowed columns. Cannot self-assign role, activate profile or approve request.

Organization access requires confirmed, non-anonymous Auth email, active profile and matching membership/assignment. Super Admin also requires confirmed email and active profile. Confirmed email, company text or approved request label alone do not create membership.

## Evidence and boundaries

SQL: 33 profiles + 176 organization + 95 registration + 48 auth_registration = 352 / PASS. New portion verifies validation, fixed role/status, first request, rollback of entire signup on error and confirmed email as additional access condition. Earlier fixture accounts now created through enabled Auth trigger; test owner writes then set approved states. All SQL test changes revert through ROLLBACK.

Real API: 25 / PASS. Verified weak password, incomplete registration without Auth remainder, successful signup without session before confirmation, email in local Mailpit, invalid/valid token, login before/after confirmation, pending status/request and ban on self escalation. Auth metadata change does not change business role/status. Script does not display or write passwords, keys, tokens or confirmation link to files. Trial message alone remains in local Mailpit.

In real API test organization tables were empty, so empty HTTP read alone is not proof of tenant isolation. Positive/negative organization scopes verified by SQL tests with approved fixture accounts and companies. Real Client/Staff/Admin API scenarios come with controlled approval.

## Review of retained demo account

In [local Studio](http://127.0.0.1:54323) refresh Table Editor:

- profiles: SecureDesk Demo Client, app_role=client, account_status=pending.
- registration_requests: same user_id, attempt_number=1, status=pending, target_organization_id=NULL.
- Authentication → Users: securedesk-demo-7e744475@securedesk.example.invalid, confirmed email.

Retained: 1 Auth account, 1 profile and 1 request; four organization tables empty. Random password was discarded: account serves for review, and future form will be verified with new account. Studio is database administration; application permissions confirmed by separate tests. Message captured in [local Mailpit](http://127.0.0.1:54324), not sent to another person. Do not copy its confirmation link to Git or conversation.

## Repeating the check

SQL check preserves retained demo:

    npm run db:test

Real check intentionally creates and retains new fictional account on each run:

    npm run check:auth:local -- --create-demo

Script requires ready local Docker/Supabase and explicit --create-demo, rejects other API target, uses local public key and does not read hosted .env.local. DB control checks are read-only. If check stops after signup, fictional account may remain; script does not delete history.

## Next step

SDK sessions verified in memory only. Next.js forms, /auth/confirm route, proxy for cookie refresh and server-side checks not implemented yet. Allowlist callback address prepared; that is not proof callback page works. Backend check confirms email directly via Auth API.

Next portion first separates local application configuration from hosted, then introduces forms, callback and verified cookie sessions. Approval/rejection/retry, safe Super Admin development setup and activation of new organization/first membership/General Support still wait. Dashboard follows their checks. No new reset; stop/start with new Auth settings preserved database. Network limitations remain in [MIGRATIONS.md](MIGRATIONS.md).

Migration: supabase/migrations/20261005202205_auth_registration_bridge.sql. Test: supabase/tests/auth_registration.test.sql. API check: scripts/check-local-auth.mjs. Previously applied migrations were not changed.

## Sources

- [Approved decisions](spec-v1-approved/DECISIONS.md), [user stories](spec-v1-approved/USER_STORIES.md), [schema](spec-v1-approved/DATABASE_SCHEMA.md) and [roadmap](spec-v1-approved/DEVELOPMENT_ROADMAP.md), unchanged.
- [Supabase profile and signup trigger](https://supabase.com/docs/guides/auth/managing-user-data), [signup](https://supabase.com/docs/reference/javascript/auth-signup), [email OTP](https://supabase.com/docs/reference/javascript/auth-verifyotp) and [local configuration](https://supabase.com/docs/guides/local-development/cli/config).
- [Mailpit API](https://mailpit.axllent.org/docs/api-v1/).
