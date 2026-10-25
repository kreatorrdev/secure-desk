# SecureDesk — project proposals and private attachments

**Completed locally — October 7, 2026.** Client submits proposal; selected Staff reviewer gives recommendation; OA in their company or SA makes final decision. Approval atomically creates active project. This document describes implemented Phase 3 micro-step. Final result of whole phase in [GATE3_VERIFICATION.md](GATE3_VERIFICATION.md).

## Flow and visibility

Profile and Projects screens lead to Project proposals. Proposal requires title (1–200), description/reason (1–4000), desired deadline and Low/Medium/High/Critical estimated priority. Submission does not create project. Same ID and same content idempotent, with one audit event. Name General Support remains reserved for automatic default project.

| Actor | View | Actions |
| --- | --- | --- |
| Client | Own proposals in current active organization | Submit; private attachments while proposal awaits decision |
| Staff | Only specifically assigned proposals, with valid company assignment | Recommendation; download attachments; no final decision |
| OA | Proposals of organization they currently manage | Submit, reviewer choice, recommendation, attachments, approve/reject |
| SA | Global authorized view, including read-only history of inactive companies | Same controlled actions in active company |

Client does not see another Client's proposal even in same company. Staff can_create_project does not grant proposal access. Reviewer need not have that separate permission. Snapshot of their access/assignment revisions prevents revoke/regrant or role change from automatically restoring review access; responsible administrator must select them again. Changing or refreshing reviewer deletes earlier recommendation.

Approve/reject final. Rejection requires reason and does not create project. Approval copies name and description, keeps real administrator as project creator/decision actor and proposal→project link in same tenant. Reviewer optional data per adopted schema; approval not conditioned on mandatory Staff recommendation. Admin may also give recommendation.

List has 25 rows + lookahead, status filter and stable order. Details, new project, recommendation and decision have English text, empty/loading/error states and existing dark/light tokens. Reviewer search by name or full ID returns at most 25 eligible, actively assigned Staff accounts.

## Database and write protection

Migration 20261007230000_project_proposals.sql introduces project_proposals, attachments, RLS, identity/final-decision guard and controlled RPCs. Tenant link with resulting project and attachment parent verified by composite FK. Previous migrations not changed. Next, 20261008000000_proposal_attachment_completion.sql, tightens reviewer constraint and protection on uncertain completion response.

Business writes verify actually confirmed, eligible Auth identity, active profile, current role/tenant, actor/access/assignment/proposal revisions and active company. Lock order remains identity → company → assignment/proposal. Client transfer keeps existing shared transfer serialization. Reviewer target read without subsequent profile lock behind organization lock; stored revisions and live read check prevent stale grant without reverse lock order.

Direct INSERT/UPDATE/DELETE not granted to application roles, including service_role. Proposal SELECT and limited ready attachment columns follow parent RLS. Eight business/read/reservation RPCs have EXECUTE only for authenticated, and two trusted completion/compensation RPCs only for service_role. All ten definer functions with empty search_path; anon has no EXECUTE.

Recommendation, decision, project creation and successful attachment publish write audit in same DB transaction. Audit does not copy proposal content, recommendation, file, storage path or secrets. Late audit failure test proves approval does not leave partially created project.

## Private attachments

Bucket proposal-attachments private, with 10 × 1024 × 1024 byte limit and MIME allowlist. No authenticated/anon Storage policies: direct upload, download and user-generated signed URL cannot bypass application.

Upload is separate multipart POST after proposal submission. Author or scoped Admin uses own current revisions. Handler verifies exact Origin against SITE_URL, eligible session, parent access, body size ≤10 MiB +64 KiB, one file, name, extension, MIME and content. Next proxy buffer 11 MiB, so file of exactly 10 MiB with multipart fields not truncated; Server Actions remain on their standard limit.

Allowlist: JPEG/PNG/WebP, PDF, UTF-8 TXT/CSV and DOCX. PNG checks chunk length/CRC; JPEG and WebP structure/signature; PDF header/EOF and basic structural markers, rejecting known active/executable markers. DOCX checks ZIP structure, CRC, count/size/decompression and Office parts; rejects encryption, path traversal, macro/ActiveX/embedded executable parts, DTD/entity and external relationships. Unsupported type, misleading MIME, invalid content, control characters in name and oversized file do not become ready.

This is format/signature/structure validation, **not antivirus or full guarantee document is malware-free**. PDF/image validation not full rendering parser. Files not executed or displayed inline in SecureDesk: download is application/octet-stream + attachment, nosniff, sandbox CSP, no-referrer and private/no-store. No permanent signed URL.

Server-only SUPABASE_STORAGE_SECRET_KEY added to ignored local .env.local; public URL/key and SITE_URL unchanged. .env.example has only empty field. Client with that key used only for private file bytes and trusted completion/compensation; all business scope/read/reservation queries use user session. Key is privileged, not scoped publishable key, and must not reach browser, log or Git.

Reservation gets random path tied to organization/proposal/attachment, lasts 15 minutes, has at most five concurrent unfinished reservations per user and not visible as ready. Completion re-verifies user, company, proposal revision/status, OA assignment revision or original Client membership episode; stores SHA-256, publishes metadata and audit and increments proposal revision. Active reservation prevents approve/reject during upload.

Failure uses compensation that first in database removes only unfinished reservation of this request and returns its path. Ready attachment never returns path for deletion, even if response to successful completion lost. Storage deletion uses only confirmed random path. Storage cleanup failure or process crash may leave private orphan object; automatic maintenance not introduced in this step. Final local state has no unfinished reservations/orphans.

Download first verifies parent through user RPC, server fetches bytes, verifies size/SHA-256 and re-verifies live authorization before response. Transfer/removal/revocation disables next download in same session. Bytes already downloaded cannot be revoked.

For Phase 3 attachment parent is mandatory project_proposal_id. Ticket parent and XOR constraint added with ticket/storage module when tickets table exists. Ticket attachments, comments and scheduled job not introduced in this step.

## Executed checks

| Check | Result |
| --- | --- |
| New proposal SQL/RLS set | 103 checks — PASS |
| Full current SQL/RLS set | 1283 / 15 test files — PASS |
| Auth/API/native form/cookie/private HTTP matrix | 352 checks — PASS |
| Format/spoof/size/ZIP/CRC/double-extension validator | 36 — PASS |
| ESLint, TypeScript, final production build | PASS |
| Browser Admin review/approve/download and responsive review | PASS |
| Earlier business UUID rows and real key in source/browser output | Unchanged / no key |

Real-session script: npm run check:organizations:proposals:web -- --create-demo. Intentionally retains nine new fictional confirmed accounts/two companies per run. Uses local guards, SDK signup/email/login, same SSR cookie, real Next action references and multipart HTTP. Does not use privileged key for test business authorization; owner SQL serves only for new fixture bootstrap, inactive company simulation and removal of trial privileges.

Matrix covers all roles and A/B tenant, peer Client in same company, forged/copy/foreign-Origin forms, recommendation without active project, native approve/reject, real actor, concurrent approve/reject one winner, direct table/Storage/signing bans, unauthorized/invalid/oversize upload, valid TXT/CSV attachments, exactly 10 MiB upload **and full download**, stale upload/review/admin forms, reviewer revoke/regrant, real Client A→B transfer with same JWT/cookie, OA revoke/regrant, filter/pagination and inactive history. Other allowed formats verified by validator; not all repeated in HTTP/browser upload.

Two initial probes stalled on test error that did not wait for direct write response; problem fixed in harness. First full probe passed 349 checks. Then Next proxy limit discovered and real exact boundary test added; final full probe has 352 PASS. All probes cleaned their privileges and sessions. Intentional foreign-Origin test logs Next CSRF rejection; earlier streaming-abort record also retained. After final restart practical browser checks have empty server/browser error logs.

Existing real SA browser session verified Projects→proposals link, approved proposal→active project, new proposal with four private attachments, real save recommendation and final approve on mobile, and download evidence.txt (37 bytes) to C:\Users\rcf11\Downloads\evidence.txt. Assignment rights not changed in browser. Dark 390×844 and Light 1280×900 have scrollWidth=clientWidth; Theme restored to System, viewport to default. Multi-role React/browser upload not separately repeated; native HTTP and SQL provide stated access coverage.

## Final local state and evidence

Four Auth/API probes left 36 new fictional accounts/eight companies, with history. State after browser decision: 178 profiles, 46 organizations, 78 projects, 64 proposals, seven ready attachment metadata and seven private Storage objects, 16 migrations. Unfinished attachments: 0; new privileged role/Staff/Admin assignments/create permissions/Auth sessions: 0; active codes: 0; persistent SA: one previous.

Count/hash/UUID baseline of all 12 earlier business tables confirms their earlier rows not changed. API probes additionally verify all preexisting proposal/attachment rows of their baseline. Seven approved source files and previous migrations remained unchanged. No db reset, cloud write or commit/push.

Ignored local evidence: .tools/verification/proposals-sql-all.log, proposals-attachment-validation.log, organization-proposals-result.json, proposals-before-migration.json, proposals-final-state.json, proposals-rpc-grants.jsonl and proposals-browser-mobile-dark.jpg / proposals-browser-desktop-light.jpg / proposals-browser-preview.jpg. Source candidate and browser bundle scan of real storage key PASS.

Proposals/attachments/reviewer/decision micro-step completed. Result of whole Phase 3 and boundaries toward Phase 4 listed in [GATE3_VERIFICATION.md](GATE3_VERIFICATION.md).
