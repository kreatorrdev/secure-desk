# SecureDesk — new private copy preparation

12 October 2026. **Actual fresh hosted database + eight-file-byte backup/recovery are now PASS; independent review confirms archive, all eight originals, and cleanup. Phase 7 remains open.**

Before new access probes a fresh private copy of closed securedesk-dev demo and eight original attachments is required. Existing reviewed procedure uses already running local database as client. New separate procedure uses only new temporary environments; it does not start or reset existing local database.

## What was verified without user input

- 28 boundary protection tests passed without failure: rejection of wrong container/image, host network/ports/mounts, keys in persistent configuration, unexpected database start, changed data/functions/ACL/policies/files, and active session.
- Four JavaScript programs and PowerShell launcher passed syntax check. Error in new trial script discovered and fixed before execution; final check passed.
- Preparation mode actually executed: all 18 reviewed sources, 27 migrations, eight fixture contents, TLS certificate, and terminal maintenance checkpoint verified without Docker or hosted requests.
- Attempt without private data actually stopped at input step before Docker/hosted requests. That is protection check, not successful backup.
- Read-only runtime check on exact Docker Desktop Linux endpoint found service unavailable. Docker, local database, or container not started. This is initial historical NOT_READY; later successful local probe documented below. New hosted backup still not executed.
- Original backup/helpers, application, deployment, and approved specification not modified. Private procedures remain in ignored .tools folder; no Markdown sent to GitHub.

Tests use synthetic changes to copied structures. They do not replace actual Docker/SQL/API execution. Source pattern scan is not full guarantee of absence of every secret.

## Order before private prompts

Launcher first checks local sources, then Docker Linux service availability and already saved official images. It must then pass actual local probe of new client: access to TLS certificate, PostgreSQL 17.11 tools, and unchanged catalogue of existing private archive. That client removed by exact ID only after check of its ownership and limits. Does not connect to hosted database.

Only after those checks launcher asks for existing DATABASE password and existing backend sb_secret key in hidden prompts. Data passed only to process; not part of commands, saved container configuration, or reports. Keys or passwords not changed.

## Actual backup when Docker is ready

User opens Docker Desktop and waits until Linux service runs. Does not run SecureDesk db:start/db:reset. In existing PowerShell runs:

~~~powershell
& 'E:\portfolio\secure-desk\.tools\backup-hosted-demo-storage-standalone.ps1'
~~~

After successful local checks enter DATABASE password and backend sb_secret key only in their hidden prompts. During copy do not use SecureDesk application. After execution send only final PASS or error message, without private data or archive contents.

Hosted SQL connection uses verify-full TLS and read-only default transaction; Storage requests are GET only for eight exactly reviewed originals. Precheck requires preserved 24 non-Auth digests, 110 reviewed functions/ACL, 18 policies, original files/objects, and zero session/refresh rows. Auth history of personal login preserved in new copy, without matching old Auth digest.

Archive and eight byte copies saved privately on E:. Completely identical snapshot must stay unchanged during copying. Recovery goes only into new network-isolated temporary database without ports/host bind mounts, with scheduler disabled; then rows/functions/ACL/RLS and all files compared. Both temporary environments have separate checks before removal. Unexpected shape or failed removal aborts PASS and requires review, without deleting arbitrary container.

This verifies base archive and file bytes, not full operation of restored managed Supabase Auth/API/Storage services. Old empty-demo backup is not appropriate procedure for today’s populated demo.

## Evidence and next step

Private review: .tools/verification/phase7/standalone-backup-preparation-review-2026-10-12.json, with hashes of six new private files. PREPARED and NOT_READY have separate actual scopes; new hosted copy and local-only client probe not marked PASS.

After actual success of new copy continue [remaining runtime matrix](HOSTED_RUNTIME_SCENARIOS.md), with exact dedicated trial data and final shutdown of trial access. [Remaining work](PHASE7_REMAINING_WORK.md) and [Gate 7](GATE7_VERIFICATION.md) keep open status. Previous removal of one maintenance candidate not repeated.


## Actual local probe after Docker start — 12 October

User started Docker Desktop. Read-only readiness confirms exact local Linux endpoint and already saved verified image. Actual local-only client probe is PASS: client limits, transfer/read of same TLS certificate, psql/pg_dump/pg_restore 17.11 and same catalogue of previous private archive. Client removed; independent review finds zero remaining containers with that probe label. No hosted requests, private inputs, or start of original local database by helper.

First local probe stopped in broader owned_client step, second with precise certificate_copy label; both clients removed. Certificate transfer changed to stdin write only in owner’s /tmp, with preserved read-only root protection. Original helper untouched; later PASS does not overwrite earlier FAIL evidence. Actual hosted copy awaits DATABASE password and sb_secret in user hidden prompt.

Private composite review: .tools/verification/phase7/standalone-backup-client-result-review-2026-10-12.json, with actual PASS path and refreshed hashes of six private files. This is successful local client probe, not new database/file-byte recovery or Gate 7 PASS.


## Actual new backup and independent review — 12 October

User execution passed all six steps. Saved source report from 12:35 UTC and independent review confirm archive 933.411 B / 1.151 catalogue entries and all eight files / 10.488.380 identical bytes. Compared were 29 tables, 110 functions/ACL and 18 policies; owner/original files preserved, retired-7 without permissions/sessions, Auth sessions/refresh=0. Both new temporary environments removed, live databases not reset/restored, keys not saved. Archive contains private Auth hashes and remains private. Source: hosted-standalone-backup-storage-restore-2026-10-12T12-35-16-370Z.json; review: hosted-standalone-recovery-result-review-2026-10-12.json.

[Next controlled session probe](PHASE7_SESSION_REFRESH_REVIEW.md) has 19 guard and 16 isolated SQL PASS; actual Auth/API still awaits hidden user input. Gate 7 not complete.

## Copy of new reviewed state — 12 October, prepared

After 41 Auth refresh checks one completed fictional membership and one marked audit remain, with Client revision +2. Then owner 107 GET + 275 post-logout checks and independent live SQL at 14:43:32.596795 UTC confirm fully preserved new state, 25 non-Auth digests/entire catalogue, all eight originals, owner, retired-7 and sessions/refresh=0. Earlier 12:35 copy has 83 rows in 29 compared tables; new state has 85. Old copy is valid historical evidence, but not identical to new probe history.

New reviewed runtime database did not overwrite maintenance checkpoint. Separate backup-current-reviewed-demo-storage.ps1/.mjs uses entire strict new snapshot, fresh reviewer timestamp, same source/27-migration/8-file/TLS/Docker isolation guard and unchanged transfer/restore code. New plan has six positive/negative guard tests, source syntax PASS, actual offline PREPARED, input-stage stop without network/containers, and Docker READY. First test harness expected stop message on stdout; helper correctly wrote to stderr and saved input FAIL. Harness fixed and separate expected-input guard PASS confirmed. Earlier FAIL not deleted.

User step, from E:/portfolio/secure-desk:

~~~powershell
& './.tools/backup-current-reviewed-demo-storage.ps1'
~~~

Enter existing DATABASE password and existing backend sb_secret only in hidden prompts. Stay logged out and do not use application during copy; leave Docker running. Procedure reads demo, saves private copy, recovers only new network=none database and eight actual bytes then removes only its containers. Original local/hosted database not restore/reset targets. This new actual copy still awaits user input; PREPARED is not new recovery PASS. Archives contain private Auth hashes; entered credentials not saved. Phase 7 remains open, without Markdown push.

## New copy of new state actually complete — 12 October, 14:57 UTC

User-executed new procedure has **PASS on all six steps**. Independent review confirms entire live snapshot against reviewed 14:43 checkpoint, **29 tables / 85 rows**, 110 functions/ACL, 18 policies and 1.151 archive entries. New database.dump archive has **936.269 bytes**, SHA-256 826da583a045ad5b81c86c2e2e4f060e62ddd5a2b19298c289e941234c3fc5a1. Manifest and all eight private copies/restored files have same original bytes/hashes; sum 10.488.380 bytes.

All new synthetic history from Auth probe included. Owner and originals preserved, all seven trial accounts retired, sessions/refresh=0. Client/restore containers independently confirmed removed; network=none and scheduler off on recovery. Original local or hosted database not restore/reset target. Entered credentials not saved; archive remains private due to Auth hashes and business data. This is not full managed Auth/API/Storage service recovery.

Private source: hosted-current-reviewed-backup-storage-restore-2026-10-12T14-57-39-181Z.json; independent review: current-reviewed-backup-result-review-2026-10-12.json. Earlier PREPARED/expected-input-FAIL/harness records remain history. Old helpers/copies and maintenance checkpoint not overwritten.

User now asks agent to finish everything remaining that can be done without them and report only when personal login, private input, or special approval remain. Next autonomous check is read-only hosted scheduler permission boundary and preparation of exact new business-job fixture scenarios with isolated probe. Phase 7 remains open for remaining matrix and final acceptance; no Markdown push.


## Autonomous hosted jobs and current copy — 12 October, 15:17–16:30 UTC

[Actual business-job review](PHASE7_HOSTED_JOBS_REVIEW.md) confirms 8 actual permission denials + 6 no-EXECUTE checks and genuine pg_cron close of one NEW due ticket at 15:37 UTC, with exactly one system audit. Recent/Open controls remain same; next two scheduled runs add no changes. Pending reopen/inactive-company actual cases, audit hosted deletion, and Vercel daily caller not confirmed by this.

Full live read-only SQL at 16:17 UTC confirms original three tickets/prior 14 audits, all 27 other table digests, catalogue/owner/original-eight and retired-seven/zero sessions/refresh. Now 29 tables / 90 rows: original 85 + three new tickets + setup/system audit. Composite recovery 85-row pg_dump + exact five-business-row delta + original-eight bytes has 35 actual isolated PASS; entire 90-row snapshot/catalogue/bytes matches live capture, container removed. This is not new pg_dump or full managed-service recovery.

Audit plan for one NEW expired fictional row and one fresh control has 7 guards + 38 current-state isolated PASS with rollback. Hosted read-only precheck at 16:30 UTC confirms retention 365/revision 1 and zero other expired audit / old completed managed cron logs. Candidate not hosted-inserted or deleted; actual deletion awaits separate action-time confirmation and fresh guard. New separate full 90-row backup helper has 6 guards/syntax/offline/missing-input PASS, without new hosted copy or private input. Old 85-row helper does not match current state.

[Exact remaining owner involvement and external window](PHASE7_NEXT_PRIVATE_STEPS.md): private hidden prompt, new login/manual browser where needed, and separate audit-deletion approval; genuine daily log depends on actual scheduled window too. Role/proposal/server-content/upload replay/native-form/authenticated UI and final acceptance remain open. No app/deployment/spec/security/schedule change, new assignment to real people, public publishing, or Markdown push.


## Fresh full 90-row copy and one guided next procedure — 12 October

[Separate review](PHASE7_GUIDED_AUDIT_PREPARATION.md) confirms actual fresh full 90-row backup at 18:20 UTC (940.844-byte archive / 1.151 entries / 29 tables / 110 functions / 18 policies / original-eight bytes), not only earlier composite. New guided PowerShell flow has 6 guard + 34 real fresh-copy isolated PASS, syntax/offline/missing-input/noninteractive stop and mandatory terminal DA confirmation before exact one new audit purge. User decline/timeout does not create hosted expired candidate. Hosted audit result not yet executed; template/actual UI not declared PASS.

Chrome request-header policy unavailable after documented recovery; browser controls/protection not changed. New terminal flow asks only for existing DATABASE password, runs read-only guard then user confirmation and independent postcheck, without backend API key. Dependent steps are sequential within one procedure; other scripts not run in parallel. Full Phase 7/native-form/role/proposal/upload/UI/daily/final acceptance remain open. No Markdown push.
