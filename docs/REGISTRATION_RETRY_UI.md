# SecureDesk — new request after rejection

Date: 6 October 2026. Own retry form and decision history on /account are implemented locally. 659 SQL/RLS checks (53 new), 44 real Next.js native form/cookie checks, ESLint and TypeScript/production build — PASS. Gate 2 still awaits controlled role/assignment management and final checks. Approved sources and six previously applied migrations remain unchanged.

## User flow

Confirmed Client whose latest request is rejected sees reason and **Submit a new access request**. Company name, Contact phone and Message to the administrator are filled from own last request, so user corrects data and sends **Submit new request**. Email, Auth account and password stay the same; form does not ask for new registration or password.

Success returns profile to pending and creates new UUID/next attempt number. New routing and reviewer data are empty. Client still awaits administrative decision. Earlier content/reason/routing are not overwritten. **Previous decisions** shows only own earlier decisions, five rows at a time, with Newer/Older links; times are marked UTC.

Pending and active Client, Staff/Admin and ineligible Auth account do not have retry form. No retry grants membership or privileged role. Server and DB repeat this check even when someone sends copied or altered form. Empty/invalid fields give messages with preserved text values; button is disabled during send. If decision changed or form is stale, user gets message to check current status.

Practical trial through application alone: log out from Super Admin account, register separate trial Client account, confirm email in Mailpit and keep password locally; log out Client and log in responsible Admin account to reject that request with reason. Then log out Admin. Logging in again with that Client account shows form. After correction/submit pending new attempt and old decision appear in Previous decisions. Super Admin on /account sees own status and administrative link; role alone does not give Client retry form.

## Implementation and boundaries

- app/account/page.tsx checks fresh getUser identity, own profile and latest request. Earlier history uses explicit user_id=verified user.id and existing RLS permissions for status/reason/time; max five rows + one for paging signal.
- components/registration-retry-form.tsx uses useActionState, label/error ID links, required/maxLength and pending state. Initial data comes from DB snapshot, not from variable Auth metadata.
- app/account/actions.ts re-checks identity, current eligibility and expected_request_id. Accepts only company_name/phone/message, one text input each, with bounds 200/40/4000. user_id, role/status, organization_id and next from form are not passed. Redirect is fixed /account with whitelist notice code. Cache invalidation covers own status and administrative row.
- Seventh migration 20261006170000_own_registration_retry.sql adds own_registration_retry_details(), read-only own snapshot only when confirmed rejected Client without active links, and resubmit_registration_form(expected UUID,company,phone,message).
- Wrapper locks same actor as previous controlled flow, atomically checks UUID of their latest attempt, then calls previously verified resubmit_registration. Thus first-attempt form cannot send third request even if second was rejected in between. Two simultaneous calls create one new attempt/audit.

Both functions are SECURITY DEFINER with empty search_path and check of real Auth/profile identity, without caller-supplied user ID. EXECUTE authenticated only; anon/service_role rejected. No new tables or extended direct table grants. Direct read of submitted columns remains forbidden; new read RPC gives only allowed own fields for rejected attempt. Real Auth anonymous/banned/deleted/unconfirmed states and active membership/staff/admin links close retry. Existing atomic retry routine keeps validations, index of one pending request and audit in same transaction.

## Verification evidence

    npm run db:test
    npm run check:registration:retry:web -- --create-demo
    npm run lint
    npm run build

SQL: eight files, 659 / PASS; own_registration_retry.test.sql has 53 new checks. Tests own/foreign draft, anon/service bans, role/state/assignment/real Auth/JWT anonymous gate, unextended table grants, wrong/null expected request, empty/boundary data, next number/UUID, unchanged old content/reason/route, new unrouted metadata, own unique audit and old form after later rejection. These are SQL identities in BEGIN/ROLLBACK, not real browser login. Hash of all eight tables after migration and tests confirmed preservation of then-existing records. After web trials all 659 SQL checks passed again, and new hash snapshots confirmed preservation and retained web history.

Web: scripts/check-own-registration-retry-web.mjs uses two new fictional accounts, real signup/Mailpit, native login cookies and multipart Next.js Server Action POST. 44 / PASS: pending/Staff/SA/active Client bans, role/user/route/redirect mass assignment, copied form/foreign expected UUID, foreign Origin, empty/too long/duplicate/File data, two truly simultaneous forms with one success and one stale response, attempt number/pending/no-membership/audit, history/old content, second rejection and permanent invalidity of old first form, third retry and real existing-company approval. Previous routing/approval UI were reused in this concrete flow.

First trial stopped after successful second login because test expected Request #2 without React HTML separator. Test was adapted for readable text; application rules were not changed. finally in that trial too restored test role and logged out sessions. Final trial passed all 44 checks. History of both trials retained, without reset/deletion.

Native HTTP checks execute real Next.js actions and cookies, but are not full test of hydrated browser/keyboard. Inert HTML/CSS examples from fictional rejected and pending accounts saved in ignored .tools/verification, without scripts/form submissions or session cookies. Automatic browser rejected file: protocol; those examples were not visually reviewed. Shared browser trial goes through normal HTTP login into application. That limitation was not bypassed.

Test reviewer gets temporary local owner fixture role only on new fictional account, then in finally returns to client/pending; all test sessions close, and passwords/tokens stay in memory. Real user logins and passwords were not used. Script rejects nonlocal env/Docker context/workspace and requires explicit --create-demo. Full trial retains two new accounts and three Client attempts; approved Client gets one membership in existing fictional company, without new General Support duplicate.

After two trials: 18 profiles, 24 requests, 4 organizations, 5 memberships, 3 General Support projects and 22 audit events; 7 applied migrations. Zero sessions of all four new retry fixture accounts; one real persistent Super Admin remains active. Retained incomplete demo Client is pending with second attempt; completed demo Client is active with approved third attempt. Counts grow on new explicit trials.

61 review UI web checks, 31 backend Auth/RPC and 38 original Auth HTTP checks remain separate results of earlier steps; their full scripts were not repeated. Hosted database was not changed, no reset, secrets/runtime not in Git. Production server with new /account code runs on 127.0.0.1:3000 with project Node 24. Git commit is local; GitHub remote/push not set up yet.

## Next micro-step

Controlled assignment of Staff/Admin roles through Super Admin and organization assignments in responsible scope, with immediate revocation and checks for all roles toward Gate 2. Organizations/projects and dashboard follow approved roadmap.

Sources: [US-02/04](spec-v1-approved/USER_STORIES.md), [decision 10](spec-v1-approved/DECISIONS.md), [roadmap](spec-v1-approved/DEVELOPMENT_ROADMAP.md), [backend](REGISTRATION_REVIEW.md) and [Pending Requests](REGISTRATION_REVIEW_UI.md). Before coding, local Next.js 16.3.8 guides forms.md/server-actions.md were read.
