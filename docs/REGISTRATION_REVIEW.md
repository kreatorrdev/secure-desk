# SecureDesk — controlled approval, rejection and new attempt

Current Pending Requests screen, 606 SQL and 61 web checks documented in [REGISTRATION_REVIEW_UI.md](REGISTRATION_REVIEW_UI.md). This document preserves the previous backend step result.

Date: October 6, 2026. Backend flow implemented and applied locally only. 565 SQL/RLS checks, including 169 new, and 31 real Auth/API checks: PASS. New migration is 20261006120000_registration_review_workflow.sql. Approved sources and four previously applied migrations remain unchanged. Gate 2 still open for remaining flows and their practical UI verification.

## Business flow

- Confirmed email proves identity, and responsible administrator decision approves company access. Login does not choose role or organization. Client remains Client after approval.
- Super Admin processes unrouted applications and can route verified request to existing company. Routing alone does not grant membership. Company name from form does not automatically link account to existing organization.
- Organization Admin sees and processes only requests routed to organizations for which they have active assignment. Explicit assignment to pending organization enables its processing/activation. Unrouted request for entirely new company processed by Super Admin.
- Approving new company verifies its required data, then together creates active organization, first Client membership, General Support project, active profile and approved request with actor/decision time. For existing company route must match decision; pending company activated, General Support unique. Inactive company or inactive default project cannot receive this initial activation.
- Rejecting request records reason and together sets rejected profile and request with reviewer metadata. Reason visible to submitter. Rejection does not grant access and may cover still unconfirmed application; every Client approval requires confirmed, non-anonymous, non-blocked and non-deleted Auth identity.
- Confirmed rejected Client can submit new request on same Auth account. New UUID and next attempt number preserve old decisions and content. New company/phone/message validated, profile returns to pending, route/review data of new request start empty. Active Client does not use retry for company transfer.

All changes and record of successful decision in one DB transaction. Project, membership, request or audit error rolls back all writes. Two concurrent retry calls yield one new pending attempt; two concurrent approvals of same request yield one organization/membership/project/decision. Completed request cannot be reviewed again or overwritten.

## Database model and access boundaries

Added minimal projects and audit_logs tables. projects has tenant link, status, creator, unique General Support and RLS read: approved Client and assigned Staff see active projects of their organization, Admin in scope also inactive projects, Super Admin globally. Free project create/edit, proposals, tickets and dashboard come in their phases.

audit_logs stores actor, action, time, target, organization and outcome. metadata_redacted currently contains attempt number, without email, phone, message, password, token or rejection reason content. Raw audit seen by Super Admin globally and responsible Admin in currently allowed organization scope. Client/Staff do not read it. UPDATE/DELETE blocked by append-only trigger, and application INSERT forbidden. This is foundation of evidence for these writes, not completed security audit, failure telemetry, retention settings or archive scope: those portions follow roadmap. Failed transactions do not leave false success event.

New public RPC functions:

| Function | Allowed user / purpose |
| --- | --- |
| admin_registration_requests(p_limit,p_offset) | Active confirmed Admin; details and history in their scope, at most 100 results per page. |
| route_registration_request(p_request_id,p_organization_id) | Super Admin; trusted route or return pending request to global queue. |
| reject_registration_request(p_request_id,p_reason) | Responsible Admin; reason mandatory and limited to 2000 characters. |
| approve_registration_request(p_request_id,p_organization_id) | Responsible Admin; initial Client membership in exactly routed company. |
| approve_registration_new_organization(p_request_id,p_details) | Super Admin; unrouted request and verified name/address/email/phone/description, optional industry/contact_person. Other fields rejected. |
| resubmit_registration(p_company_name,p_phone,p_message) | Own confirmed rejected Client only; new attempt, without caller-supplied user ID/role/routing. |

Identity always from auth.uid(), and actual role/state from profiles and confirmed Auth account. User metadata do not grant privileges. Functions SECURITY DEFINER with empty search_path and explicit checks; only authenticated has EXECUTE on public RPCs. Anon/service_role and direct private helper calls forbidden. Direct INSERT/UPDATE/DELETE on business tables remain closed, including signed-in Super Admin session.

Actor/target advisory locks and row locks serialize decisions and protect verified states/assignments during transaction. active_actor_role now immediately rejects deleted or currently blocked Auth account, besides previous email/anonymous/profile check. Preliminary initial Client approval does not take over existing membership/privileged assignment history; membership management and transfer have their future workflow.

## Checks and retained examples

    npm run db:test
    npm run check:registration:local -- --create-demo
    npm run lint

SQL: six test files, 565 / PASS. New 169 verify permissions and tenant A/B/unassigned routes, actual identity state, role/field mass assignment, pagination, review/retry limits, required data, General Support uniqueness, audit isolation/append-only and complete rollback after injected error on last audit write. BEGIN/ROLLBACK restores fixture, and hash snapshots of all eight business tables confirm preserved stored data. Four old global Super Admin claims in organization_scopes.test.sql now count only their fixture organizations/links, so retained API examples do not require database reset. RLS implementation not weakened because of that.

API: scripts/check-registration-review.mjs uses real local signup, Mailpit confirmation, password login and Supabase RPC via public local key. 31 / PASS includes two concurrent resubmission operations and two concurrent approval operations with one success and one rejection, preserved history, changed access in same Client session, ignored role metadata and bans on direct writes/raw audit. This is Auth/PostgREST test, not Next.js administrator form.

Each explicit API test retains two fictional accounts and one approved fictional company with membership, project and history. Test reviewer gets owner fixture role only during check, then in finally returns to client/pending; no real user gets temporary test role. Passwords/tokens stay in memory. Confirmation session closed before separate password session, and final session signed out. On first check leftover confirmation sessions cleared exclusively for two new fixture accounts; second check of final helper passed with zero remaining sessions of all four API fixture accounts. History not deleted.

Current after two API probes: 10 profiles, 12 requests, 2 fictional active organizations, 2 memberships, 2 General Support projects and 6 audit events. One real local Super Admin remains active with approved request; two API reviewer profiles again client/pending. No SQL fixture, five migrations recorded. Next explicit probes may increase demo data count. These are not public demo credentials.

Previous 38 Next.js form/session HTTP checks, TypeScript and production build remain Auth step result; Next.js code not changed here. ESLint passed again. Hosted database not changed, CLI not cloud-linked and no reset.

## Next micro-step

Pending Requests screen now implemented and verified in next step: [REGISTRATION_REVIEW_UI.md](REGISTRATION_REVIEW_UI.md). /account gives administrators link to /admin/requests. Own retry form and remaining Gate 2 flows follow. Staff/admin role assignment, broader projects and other modules remain in approved order.

Decision sources: [US-04/05/16 and NFR-03](spec-v1-approved/USER_STORIES.md), [decisions 01/02/08/10/42](spec-v1-approved/DECISIONS.md), [matrix](spec-v1-approved/PERMISSIONS_MATRIX.md) and [roadmap](spec-v1-approved/DEVELOPMENT_ROADMAP.md). Technical sources: [Supabase DB functions](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [PostgreSQL locking](https://www.postgresql.org/docs/17/explicit-locking.html).
