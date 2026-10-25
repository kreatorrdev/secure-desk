# SecureDesk — Phase 5: database and private ticket attachments screen

**October 8, 2026: steps 1 and 2 completed locally. Phase 5 is in progress; Gate 5 has not been executed yet.**

The first step prepared the database and RLS. The second connected real files, protected server routes, and the English ticket screen. The next major part is the Resolved/Closed flow.

## Step 1 — baseline verification

[GATE4_VERIFICATION.md](GATE4_VERIFICATION.md) was read, its saved results were checked, and the current state of the local database was verified. Before changes, all 1717 SQL/RLS checks in 16 files pass again. The documented 684 Auth/API/native HTTP ticket checks were confirmed from the saved result; that matrix and browser review were not re-run in this step.

Database before this step: 20 migrations, 233 profiles, 56 companies, 88 projects, 74 tickets, and seven proposal attachments. Existing uncommitted Phase 3/4 work was saved as the initial state. The Gate 4 report was not modified.

Decisions come from unchanged approved sources: [DEVELOPMENT_ROADMAP.md](spec-v1-approved/DEVELOPMENT_ROADMAP.md), Phase 5; [PERMISSIONS_MATRIX.md](spec-v1-approved/PERMISSIONS_MATRIX.md), ticket attachments; [DATABASE_SCHEMA.md](spec-v1-approved/DATABASE_SCHEMA.md), one parent and tenant FK; [THREAT_MODEL.md](spec-v1-approved/THREAT_MODEL.md), privacy and file validation.

## What was added

The new, twenty-first migration is `20261008120000_ticket_attachments.sql`. Previously applied migrations remained unchanged.

The existing `attachments` table now supports **exactly one** parent: `project_proposal_id` or `ticket_id`. The composite foreign key requires the ticket to belong to the same company as the attachment. The database chooses the canonical path as `organization/ticket/attachment`; the browser does not choose an arbitrary path or actor. The previous seven proposal attachments retain the same data.

RLS shows only `ready` records, with current read permission on the corresponding proposal or ticket. Client sees their own or explicitly approved shared ticket; Staff current owner/collaborator ticket; organizational Admin their scope; Super Admin global. Uploader identity alone does not grant access after revocation or transfer.

A separate private bucket `ticket-attachments` was added: at most 10485760 bytes per file and seven MIME types for JPG/JPEG, PNG, WebP, PDF, TXT, CSV, and DOCX. Application roles have no Storage object policies for direct upload, download, or signing. The server route from step 2 first verifies the user and parent; the privileged Storage key stays on the server.

| Function | Who calls | Purpose |
| --- | --- | --- |
| `reserve_ticket_attachment` | Authorized authenticated user | Verifies actor, company, ticket, versions and metadata bounds; at most five live uploads per actor. |
| `complete_ticket_attachment` | Trusted server only, service role | After validation and upload, re-checks rights, ticket and deadline; writes `ready`, SHA-256 and audit together. |
| `abort_ticket_attachment` | Trusted server only, service role | Returns path only for removed incomplete reservations of that actor; published attachment is never a compensation target. |
| `ticket_attachments` | Authorized authenticated user | Paginated list of ready metadata, without storage paths and internal snapshots. |
| `ticket_attachment` | Authorized authenticated user | Verifies all three IDs and current parent access to prepare protected download. |

Service role has no direct grants on the business table nor can it use user reservation/list/download RPC. Unexposed helper for live scope is not executable by application roles. Proposal completion/cleanup endpoints were extended to reject ticket parent.

## Why upload has reservation and publish

The database and Storage do not share one transaction. Reservation has `uploading` state and is not visible to readers. The server must verify actual content and upload the file. Only trusted completion publishes metadata and audit together.

Reservation remembers access revision, ticket version, and the specific membership/assignment/sharing episode. Transfer or revoke/regrant during upload prevents publishing an old request. The 15-minute reservation deadline is measured by the server; that is a technical upload deadline, separate from the business deadline for editing comments.

Repeated successful completion with the same hash does not add another audit. After a lost response, cleanup does not get the path of a published attachment. If audit fails, the `ready` change is rolled back. The route from step 2 uses the returned cleanup path to compensate incomplete Storage bytes.

SHA-256 is a content fingerprint, not encryption. The database verifies hash shape; content is verified by the existing server validator: size, name, extension/MIME and content structure. Its 36 checks pass again. This is structural validation, without a separate antivirus service.

## Executed checks and boundaries

| Check | Result |
| --- | --- |
| Baseline full SQL regression | 1717 / 16 files — PASS |
| New attachment SQL set | 261 — PASS |
| Final full SQL regression | 1978 / 17 files — PASS |
| Existing server content validator | 36 — PASS |
| Previous rows: ID/hash comparison in 22 tables, 1690 rows | PASS; new is only one Storage bucket |
| Previous files before documentation supplement | 209 initial files have the same SHA-256 values |
| Approved sources vs original ZIP archive | Seven of seven identical |

SQL checks use fictional fixture accounts in a transaction that is rolled back. They cover 15 states/roles, tenant and peer IDOR, unassigned Staff/on-behalf creator, ready/uploading RLS, direct mutation and internal columns, forged/stale parameters, bounds, FK/parent/path, idempotent completion, actor-bound cleanup, transfer/return, revoke/regrant, expiry and late-audit rollback. They do not send real Storage bytes. Hash baseline projection omits keys `ticket_id`, `ticket_revision` and `actor_ticket_scope`; new parent FK and XOR conditions were tested separately.

The first trial run had two wrong expected error codes: the existing Auth eligibility helper returns `22023`, and tests expected `42501`. Both actions were correctly rejected. Test expectations were aligned; the next trial run and final regression pass.

In step 1 there was no new Next/React code, so no new build/browser pass was run then. SQL tests verified state and replay completion/cleanup. Real upload/download, Storage API attempts, multipart bounds and concurrent sessions were executed in step 2, described below.

Evidence is in ignored `.tools/verification/phase5/`: initial worktree/DB baseline, `sql-before.log`, trial SQL log, `migration-local.log`, `sql-after.log`, `foundation-result.json` and `approved-sources-result.json`.

After step 1: **21 migrations; 233 profiles, 56 companies, 88 projects, 74 tickets, and seven existing proposal attachments.** No permanent new fixture accounts, ticket attachment rows/bytes or audit fault triggers. No reset, hosted writes, commit or push.

## Step 2 — real private upload/download and screen

On ticket detail, before the Comments section, there is now **Private attachments**. The list has 25 results per page, file name as download link, size, author and UTC time. Pagination preserves position of other lists on the ticket. In the active company an English form **Choose attachment → Upload private file** is shown, with messages for success, invalid file, stale rights and temporary unavailability. Inactive company has read-only view.

New POST route `/organizations/[id]/tickets/[ticketId]/attachments` verifies real session, all parent IDs, active company and same Origin as the application. Reads limited multipart body: up to 10 MiB file and 64 KiB technical overhead. Accepts exactly one file and three versions; unknown, duplicate and invalid fields are rejected. Existing validator verifies name, extension/MIME, size and actual byte structure. Browser accept list is a selection aid; the server decides.

After user-bound reservation an isolated server Storage client uploads bytes, then trusted completion re-checks current rights and publishes metadata/audit together. Failure first requests DB abort of incomplete reservation and removes bytes only on the returned identical path. If completion succeeded but response was lost, published attachment cannot become the target of this cleanup. In case of prolonged network/Storage unavailability compensation is best effort; a separate periodic reconciliation was not added in this step.

New GET route `/organizations/[id]/tickets/[ticketId]/attachments/[attachmentId]` verifies all three IDs and live parent rights before download, size and SHA-256 of downloaded bytes, then rights again immediately before response. Returns forced download, `private/no-store`, `nosniff` and sandbox headers. No persistent or signed Storage link in the browser. Unavailable, foreign and corrupted file have the same generic 404 response. Privileged Storage key stays server-only and was not found in the production browser bundle.

Existing validator, Storage server client, approved sources and all 21 migrations remained unchanged. New UI and routes use the already verified database foundation. Previous comment, owner, priority and sharing patterns were preserved.

### Step 2 checks

| Check | Result |
| --- | --- |
| Final SQL/RLS regression | 1978 / 17 files — PASS |
| Real Auth/JWT/SSR cookie/API/Storage/native HTTP pass | 342 — PASS |
| Content validator | 36 — PASS |
| ESLint | PASS, no warnings |
| TypeScript and production build | PASS |
| Browser: existing local SA session, attachments second page, full upload form | PASS |
| Responsive 390 × 844 and 1280 × 900, existing System/Light display | No horizontal overflow |
| Keyboard: file chooser → upload button | PASS, visible focus |
| Browser warn/error messages on reviewed screen | 0 |
| Initial rows from step 1 | 1691 rows / 22 tables — unchanged |
| Full JSON hash of previous business rows before final web probe | 20 tables — unchanged |
| Protected files: 21 migrations, seven approved sources, both env files | 30 / 30 unchanged |
| Server key in browser bundle | Not present |

Web verification covers anonymous user and 11 states/roles with real sessions. All allowed formats pass real upload and exact byte download, including Unicode name and exactly 10485760 bytes. Invalid content, oversized body, copied/stale/forged multipart, foreign parent and company, foreign/missing Origin value, direct Storage read/upload/signing and forged completion/abort are rejected. Revocation of owner, collaborator, organizational Admin, shared Client access and Client transfer change rights in the same cookie/JWT session. Uploader alone has no permanent rights. Content change on Storage without matching hash yields generic 404.

Separate concurrent service RPC sessions verified completion/completion and three completion/abort races. Successful replay has one audit; published file stays saved or incomplete reservation belongs to cleanup. These are not claims about all possible network interruptions. Intentionally triggered audit error, limited only to the new fictional ticket, rolls back completion change; route removes reservation and its bytes. Fault trigger/function removed in finally block.

Browser reviewed the real Next screen with existing user local SA login. Second page has two attachments; chooser, button and previous page are readable and keyboard accessible. User session/theme preserved, temporary window size restored. Browser upload or login for every role was not repeated; upload, errors and rights covered by real HTTP/API pass. Dark theme was not specifically verified in this step.

First two web probes stalled on wrong test form parser: Next sent part of hidden input in a later streamed HTML fragment, so test did not send versions. Real PNG upload and browser DOM were correct. Parser now requires form and exactly one unique value of each version from the same ticket response. Validator and application upload were not changed due to this test issue. Third full probe passes; partial probes saved as evidence.

After three probes retained in total **33 new fictional accounts, six companies, six General Support projects, 13 tickets and 40 ticket attachments**. Total now: **266 profiles, 62 companies, 94 projects, 87 tickets, 47 attachments (seven previous proposal + 40 ticket), 21 migrations**. All trial privileged rights, Staff/Admin assignments, project permissions, active codes and Auth sessions are 0. One previous permanent SA remains. No incomplete ticket reservations, orphan ticket Storage objects, ready records without bytes or fault triggers. Previous history was not deleted. Foundation hash projection still omits the three listed keys; full business hash check in final web probe does not use that projection.

Evidence: ignored `.tools/verification/phase5-step2/` contains initial hash baselines, `build.log`, `sql.log`, `web.log`, `attachments-web-result.json`, both partial probes, `final-integrity-result.json`, `browser-result.json` and `attachments-mobile.jpg` / `attachments-desktop.jpg`. New verification tool is `scripts/check-ticket-attachments-web.mjs`; local command is `npm run check:tickets:attachments:web -- --create-demo`. Each new run intentionally retains new fictional accounts/data and finally revokes their privileges/sessions.

No reset, hosted writes, commit or push. Gate 4 historical report was not modified.

### Shared practical trial

1. On a local ticket find **Private attachments**. You can use a new fictional ticket in company Fictional Ticket Company A 497A605A, with existing local Super Admin account.
2. Create a small trial TXT file without personal data, select it via **Choose attachment**, then click **Upload private file**.
3. After success message on the list find the name and click it; if there are more than 25 attachments, open **More attachments**. Downloaded content should be the same. Existing trial TXT attachments can be downloaded immediately.
4. Difference to learn: file exists in private storage, but permission comes from the ticket and is re-checked for every request. Copied link alone does not grant permission.

Steps 1 and 2 are complete; full Gate 5 is not complete yet. Next rule we clarify together is acceptance of Resolved solution and reasoned reopen request within seven days.

## Remaining parts of Phase 5

The database part of Resolved/Closed and reopen flow is now complete and locally tested; details are in [TICKET_RESOLUTION_PHASE5.md](TICKET_RESOLUTION_PHASE5.md). Its English screen and real Auth/HTTP probe are the next small step.

1. Solution acceptance, reasoned reopen within seven days, owner/Admin decision and exceptional Admin close with reason.
2. Idempotent periodic auto-close without Pending reopen, time boundaries and concurrency.
3. Audit display in allowed scope and 365-day retention policy.
4. Final Gate 5 per approved roadmap.

This is a work breakdown for learning, not a change to approved scope. Before the next major part we explain the rule and verify understanding.
