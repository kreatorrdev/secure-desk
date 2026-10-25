# Projects and General Support — Phase 3

Date: October 7, 2026. Local application and Supabase, no cloud writes.

## What is available

Company profile has **Projects & General Support**. /organizations/[id]/projects shows active projects 25 records per page, with next/previous page and return to first empty page. General Support is first and marked **Default support project**. Click on name or View project opens /organizations/[id]/projects/[projectId], with description, status and UTC times.

General Support already created in existing transaction of company/first membership approval. This step adds its display, not new independent activation or second default project. Name remains General Support. Authorized writer may change description.

Client reads active projects of current company. Staff reads active projects of companies currently assigned. Creating and editing active project available only to responsible OA, global SA or Staff with separate can_create_project permission for that company. Staff assignment alone does not grant write rights.

OA/SA may filter existing inactive projects and read their history. For them no edit form or new update API. Inactive company per existing rules has historical review only for SA, with clear message and no writes. T-01 broader historical scope for other roles not changed.

Create form requires name and description; edit uses same business columns. No client create form or direct table write. Project proposals and decisions belong to next micro-step. Ticket project selection comes in Phase 4. Deletion, deactivation/reactivation through UI, dashboard or attachments on active project not added.

## Foundation and database

US-11, US-15, US-16, decisions 03/14/36/42/51/52 and PERMISSIONS_MATRIX projects/write define this scope. Seven approved sources preserved.

Fourteenth migration 20261007210000_organization_projects.sql adds projects.revision > 0, indexes for scoped display and creator FK, guard of immutable project identity and revision trigger. organization_id, id, created_by_user_id, created_at and is_general_support cannot change by UPDATE. Existing unique General Support and project/tenant constraints remain.

Four authenticated SECURITY DEFINER RPCs have empty search_path:

- organization_project_context returns name/status of only allowed company, live write capability and own access/assignment revisions.
- organization_projects returns minimal project columns, without author/profile, 26 rows with lookahead; General Support first, then name and UUID.
- create_organization_project verifies active confirmed Auth actor, live role, active company and concrete OA/Staff assignment/permission.
- update_organization_project repeats same checks and expected project revision, then changes only name/description of active project.

Private lock_project_writer not exposed to application. Order is existing identity lock, org lock, then assignment lock. Role change/ban or assignment revoke cannot silently pass between check and write. Project not moved to another company and creator remains real Auth actor.

Forms carry expected access/assignment/project revisions. Revoke and regrant permission or role restore do not revive old form. Stale response does not overwrite newer changes. Name is 1–200, description 1–4000 characters after trim. RPC accepts JSON object with only those two keys; system fields cannot be imposed.

Create form gets new submission UUID. Same actor/org/UUID and identical details return same project without additional audit. Different replay of same UUID rejected. UUID does not grant access and is not secret. Two edit calls of same revision have one winner.

Name General Support reserved for automatic default project; ordinary create cannot make it, nor ordinary edit rename project to that name. Existing General Support may change description with name/flag preserved.

Create and edit write audit with real actor/tenant/project UUID. Edit records previous and new revision, without copying description to audit. Project write and audit are joint transaction. Direct INSERT/UPDATE/DELETE grants remain forbidden to all application roles; existing SELECT/RLS remains additional protection of details and direct API access.

## UI protection

Each page repeats Auth and live account-role check. List/context additionally verify tenant scope. Details require both organization_id and project_id under existing RLS. Disallowed, mismatched, nonexistent or invalid project UUID gives same Organization not available display.

Server Action repeats identity/role, validates only specified scalar fields and passes decision to DB authorization. Foreign organization_id, copied form, changed role/actor/status/General Support fields do not expand permissions. Errors readable, without raw DB details. name/description values remain as draft after rejected form and display through React escaping.

Private routes inherit private/no-store, loading/error/not-found state and System/Light/Dark flow. Administrative history filter unavailable to Staff/Client; imposed web filter falls back to active, while direct RPC rejects that request.

## Check results

| Set | Result |
| --- | --- |
| New rollback SQL test | 85 / PASS |
| Full SQL/RLS set, 14 files | 1180 / PASS (1095 earlier + 85 new) |
| Real Auth/API/native Next.js form/cookie test | 385 / PASS |
| Final ESLint | PASS, no warnings |
| TypeScript and production build | PASS |
| Browser SA: navigation, filter, pagination, General Support save, both themes | PASS |

SQL covers anonymous and service_role bans, all business roles, ineligible/unconfirmed/banned/anonymous identities, Staff without separate permission, A/B scope, General Support, direct-write bans, JSON/name validation, idempotency, project/permission revision, creator/tenant immutability, role/regrant/revocation and Client membership change. Forced error on final audit INSERT proves rollback of create and edit: no partial project/audit and old state/revision remain.

Dry-run test during preparation corrected to read revisions from allowed context RPC instead of forbidden profile/assignment columns; SQL test expressions also fixed. All probes remained in rollback transaction. TypeScript found and fixed error in navigation JSX record and nullable result check. Final results above refer to corrected code.

Command npm run check:organizations:projects:web -- --create-demo verifies local Docker project/workspace/origin, then creates nine confirmed fictional accounts and two companies. All business decisions use Auth RPCs/native forms; owner access serves only fixture bootstrap, simulation of inactive state of new fixture records and final revocation of privileges. No service key in script.

385 checks cover real signup/email/login, role/scope list/detail/context, no-store, direct bans, copied forms, actor/status/tenant forgery, foreign Origin, XSS escaping, OA create, permitted Staff edit/create, idempotent create, concurrent edit, General Support description and forbidden rename/duplicate, pagination, inactive read-only, Staff revoke/regrant, OA scope revocation and real Client transfer with same JWT/cookie. Project authorship does not grant access after assignment revoke. Intentional foreign-Origin test rejected without mutation; expected Next server log message does not mark regular flow error.

Browser review executed through existing SA session and new fictional companies: profile link, list, General Support details, real Save project with confirmed description change, second list page and Inactive filter, SA historical banner of inactive company. Dark 390 × 844 and Light 1280 × 900 have no horizontal overflow. Browser error/warn list empty. Theme/viewport restored to System/default.

JPEG evidence projects-browser-mobile-dark.jpg, projects-browser-desktop-light.jpg and projects-browser-preview.jpg in ignored .tools/verification/. Browser new login of all roles, create click, intentional server error/retry and empty later page not repeated in browser; native HTTP/API verify those accesses and empty pagination. Browser save does not change rights or real user projects: changes only description of new fixture General Support.

## Preserved state and boundaries

Count/hash/UUID control of all 12 earlier business tables confirms preservation of earlier rows after migration/SQL rollback and after API/browser probe. Control hash for migration excludes revision column; original projects have new revision=1 and none changed. API test uses full hash of all earlier columns/UUIDs after migration.

Retained nine new fictional accounts, two companies and 31 projects (including two automatic General Support and 26 pagination fixture projects), with history. Final **142 profiles, 38 companies, 65 projects and 14 migrations**. One previous permanent SA. New trial privileged roles, active Staff/Admin assignments/project permissions and Auth sessions: 0. Active codes: 0.

No reset, cloud write, change to .env.local/approved sources or rewrite of previously applied migrations. Role/assignment/organization approval remain in previous controlled flows. Deactivation/reactivation and broader T-01 historical rights not introduced in this step.

## Next step

Active projects and General Support micro-step completed. Next project proposals with attachments, assigned Staff reviewer/recommendation and OA/SA decision. After their positive and negative tests follows final Gate 3.

Gate 3 remains open. User will be notified when whole Phase 3 and final verification complete. Phase 4 is ticket module and role-based dashboard.
