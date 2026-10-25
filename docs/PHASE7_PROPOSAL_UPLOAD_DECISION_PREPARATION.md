# P07 — upload reservation and final decision, prepared

17 October 2026. The next package covers the SQL business rules in P07: a live upload must block approval and rejection, while a properly completed or expired reservation changes whether a decision is allowed. The hosted trial has not been executed. The user remains signed out; no Chrome/Snippet steps, Auth API login, or backend key.

## One bounded procedure

**Already-made actual full 163/13 copy from J03**, its archive/catalogue/manifest, and 10.488.781 saved recovery bytes are reviewed again. No new copy is made. Source, recovery, and Docker/client conditions must pass before private prompt. Latest deadline is **18 October 04:42:57 Europe/Budapest**, six hours from actual backup clock; no timestamp shift or extension. Stale or unreviewed attempt stops the procedure.

After one hidden entry of existing **DATABASE password**, helper verifies fresh direct read-only state against exact 163 reference. New SQL trial stops if any original digest/catalogue/owner/file set changed.

Entire business trial is in **one ROLLBACK transaction**:

1. Only existing exactly marked fictional Client and fictional Admin receive temporary eligibility/rights within uncommitted transaction. Retired Admin profile is currently client; temporary admin role is therefore explicit and limited to their ID. No change to real owner, Auth API calls, session, email, or externally visible activation. All this eligibility/rights revert on rollback.
2. Actual proposal submit/reserve RPCs create two new fictional proposals and their pending reservations. **Four expected PT409 rejections** follow: approve and reject for each proposal while upload is in progress. Proposals, projects, and audit digest must stay the same after rejection.
3. One reservation completes through trusted SQL completion RPC, with known 73-byte fixture checksum. Ready metadata and parent revision 2 expected; that is controlled RPC input, **not new physical Storage upload or content/HTTP proof**.
4. Only the second new fixture reservation receives an expired timestamp within the transaction. Its completion must be rejected with 42501 **before the final decision**, while the parent is still pending/revision 1. The production 15-minute deadline and prior reservations are unchanged.
5. Approve then succeeds for completed proposal, and reject for the one whose reservation expired. Exactly one temporary project and six temporary business audits expected; Storage objects remain unchanged. Final ROLLBACK reverts all rows/changes.

Separate final read-only SQL compares **all 29 digests**, including full Auth/profiles/assignments tables, catalogue, owner, prior proposals/tickets, 13 file metadata, and 13 Storage objects. Fully identical 163/13 state, retired-seven/zero sessions, and zero new permanent rows expected. Client removed only with exact ownership/image/label check and independently confirmed absence.

Backend key not required and new hosted byte GET after this SQL trial is not part of procedure. Actual last Storage hashes remain separate J03 evidence; local 13-file recovery bytes verified against that copy. New report does not claim repeated actual hosted byte read.

## Locally completed preparation

- **7 guard/recovery/input tests PASS**: exact current 163/13 recovery, its unchanged deadline, changed originals/owner/Auth, changed target ID/rollback contract, disallowed COMMIT/DELETE/TRUNCATE, and invalid DATABASE input.
- **26 isolated checks PASS**, with two full actual RPC/rollback flows, intentionally triggered error after fixture setup, and changed-baseline rejection. All comparisons return same full 163 snapshot. This time actual **full 163-row Auth/business archive** returned, without historical Auth digest adjustment or business delta. Managed Auth/API/Storage services not started.
- Node/PowerShell syntax, missing-input stop before hosted access, offline recovery/source review, and exact hardened client/certificate rehearsal pass. Two new containers independently confirmed absent.
- Manifest proposal-upload-decision-source-pins-2026-10-17.json binds **276 sources/evidence**, previous 266 unchanged. Private review is proposal-upload-decision-preparation-review-2026-10-17.json; .tools/ and credentials remain out of Git.

## Next user step

In the existing PowerShell window, run only E:/portfolio/secure-desk/.tools/check-proposal-upload-decision.ps1. Remain signed out, with Docker running. Enter only the existing DATABASE password in the hidden prompt, then wait for the final PASS/error and send only that status. Do not rerun the old API/job/upload package or repeat a new FAIL before review.

This is not native browser pending-upload form, new physical file publish, or proof of real fifteen-minute wait. P07 coverage remains precisely SQL business/expiry fixture scoped. Other P/F role/content, Origin/session/native SSR, genuine daily caller, practical UI, and final acceptance sub-scopes remain open. Application, deployment, approved specification, security, and schedule were not changed; no push. Gate 7 not complete.
