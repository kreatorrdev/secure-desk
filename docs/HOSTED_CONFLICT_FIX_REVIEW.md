# SecureDesk — fix for stale requests on the hosted API

October 10, 2026. **Fix applied locally and on the closed demo project, code deployed. Repeated reviewed hosted Auth/API matrix is now 182 PASS / 0 FAIL. Gate 7 is not complete.** Approved specification was not changed.

## What happened

The actual first test started at 09:02:49 UTC. 167 checks passed; one failed: rejection of edit with old ticket revision. Controlled Admin edit Medium → High succeeded once. Interruption did not occur during password check.

All seven fictional accounts were banned in the end, business privileges/sessions/refresh tokens revoked. Old JWTs no longer saw tickets and refresh was rejected. Existing owner remained the only Super Admin/Active, profile and Approved request unchanged. History of two test companies, two projects and three tickets preserved.

The first helper did not save the transport response for the failed stale request. Therefore we do not claim to have seen a specific timeout or status from that response. Subsequent read-only review showed about 2.000 repetitions of the same 40001 in provider logs, one priority audit change and ticket at revision 2. No active repeating request remained; restart/interrupt of other processes was not needed.

## Cause and decision

Business conflict used SQLSTATE 40001, code for transient serialization failure. The provider may retry it automatically. [Official Supabase explanation](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b) describes a loop in PostgREST 14 and recommends PT409 for HTTP conflict. Local API actually uses PostgREST v16.4; exact hosted version was not determined. Conclusion on cause is based on repeated logs, same function definitions and documented provider issue.

Stale form must still be rejected. PT409 expresses the same business conflict without marking the transaction as eligible for automatic retry. Privileges and business rules remain the same.

## Actually executed change

New, 27th migration: 20261010093000_stale_conflicts_http409.sql. Changes only 32 explicit errcode sites in 22 pre-listed functions. Verifies exact signatures and old/new source hashes, rejects unknown drift and allows safe re-application. Compares owner, ACL, SECURITY DEFINER, search_path and other pg_proc properties. Previous 26 migrations were not overwritten.

Six Server Action files accept new PT409 and previous 40001 for existing refresh messages. Affected tests expect PT409. No new tables, policies, grants, roles, product functions or new costs.

Before local application a private pg_dump was saved. Application without reset preserved all 6.777 rows in 25 compared tables. In isolation migration was applied twice; old revision rejected with PT409, without additional edit/audit.

Hosted application at 09:25:53 UTC used reviewed transaction with PG 17.11, exact ledger and hash guards. Before it, definitions/catalog of 22 functions were saved locally. Subsequent read-only check confirms 27 migrations, 22 expected PT409 functions, zero remaining custom 40001 bodies, preserved 47 rows in 25 tables and unchanged owner. Saved function preimage is not a full copy of the current database.

## Checks and deployment

| Check | Result and boundary |
| --- | --- |
| Isolated change, metadata and repeated application | PASS; SQL, no network/ports/bind mounts |
| Local application with private backup | PASS; existing data preserved |
| Full SQL/RLS regression | 4.204 checks / 23 files — PASS after migration |
| ESLint, TypeScript and production build | PASS |
| Hosted application and subsequent catalog/data | PASS; not full user API matrix |
| GitHub code-only history | beec078; 4 commits, 226 files, 0 Markdown |
| Recognized private patterns in full code history | 243 blobs, 0 hits; limited pattern check |
| Vercel Production | 5MyBiZ6C6XM4Nq81nufLoWYq5DAV, Ready, 30 s, exact beec078 |
| Three addresses without login | 302 to Vercel authentication, no cookies/secrets |
| Continuation Auth/API and repeated revocation | PASS actual hosted; 182 checks, PT409/409 for 66 ms and immediate revocation |

Automatic deploy after push was not visible. Through existing Vercel project main was resolved to exact beec078 and Production deploy was started. Existing production and branch addresses assigned; protection was not weakened. GitHub receives code only; this document, private helpers, snapshots and results remain local.

## Safe continuation

New script `.tools/resume-hosted-role-api.ps1` verifies exactly seven previously deactivated identities. It does not create new accounts/companies/projects/tickets. Before reactivation it makes a fresh private full copy of the current hosted database. Old memberships remain ended; new Client memberships represent new historical episodes. Pending stays Pending, actual owner is not changed.

Repeats matrix, verifies actual PT409/HTTP 409 and no duplicate edits, then revocation/regrant in the same Staff session. At the end independently re-bans seven accounts and revokes their sessions/privileges. Private passwords/tokens are in memory only. Absent inputs and wrong local target rejected before hosted writes. Isolated test preserved old rows, rejected duplicate setup and cleaned up access.

Do not run old create helper again: its precondition is one-owner empty database, which is no longer current state. Original FAIL and checkpoint remain saved. Actual continuation must produce separate hosted-role-api-resume.json and hosted-role-resume-checkpoint.json. Creating copy alone does not prove restore; subsequent isolated test separately confirmed restore of pre-resume data, while Storage bytes remain.

## Private proofs

Under `.tools/verification/phase7/`: hosted-role-api.json, hosted-role-fixture-checkpoint.json, hosted-role-failure-readonly.json, hosted-role-retry-diagnosis.json; stale-conflict-isolated.json, stale-conflict-local-apply.json, stale-conflict-sql-regression.log; stale-conflict-hosted-functions-before.json, stale-conflict-hosted-apply-reviewed.sql, stale-conflict-hosted-apply.json, stale-conflict-hosted-after.json; stale-conflict-code-commit.json, stale-conflict-code-export.json, stale-conflict-vercel-ready.json/png, stale-conflict-outer-protection.json; hosted-role-resume-isolated.json and resume guard results.

Reviewed hosted Auth/Data API matrix is now successful. Gate 7 still requires HTTPS sessions/forms/logout and attachments, controlled maintenance outcomes, populated DB/Storage recovery and final risk/proof review.

## Subsequent actual proof of fix

Actual continuation executed October 10 at 11:25:06–11:25:52 UTC: **182 PASS / 0 FAIL**, full reviewed Auth/Data API matrix completed. Stale edit received PT409 / HTTP 409 for 66 ms, without additional ticket edit or audit. Same Staff JWT immediately lost access after revocation; after regrant old privilege revision remained stale. All seven test identities banned, with zero active business privileges/sessions/refresh tokens. Owner profile/Approved request preserved; exactly one Super Admin. No saved credentials or resets.

New private archive before reactivation (11:25:10 UTC, 873.627 bytes / 1.151 catalog entries) was trial-restored at 11:29:36 UTC. PASS: all 25 compared tables / 47 rows match pre-resume checkpoint, exact ledger 27 migrations, 22 public and 1 private RLS table, 18 policies, 3 private buckets and 22 corrected functions with preserved owner/ACL/security settings. Network=none, no ports/bind mounts, scheduler off; temporary container removed, archive unchanged. This is the copy before the repeated test, not after it. No Storage objects/bytes; populated-byte recovery still remains.

Private proofs: `.tools/verification/phase7/hosted-role-api-resume.json`, hosted-role-resume-checkpoint.json, hosted-role-resume-backup-isolated-restore.json and https-fixtures/manifest.json. Original FAIL and initial checkpoint remain saved.
