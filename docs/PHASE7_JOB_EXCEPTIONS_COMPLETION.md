# Auto-close exceptions — actually verified and rolled back

17 October 2026,22:44 Europe/Budapest. User procedure has PASS for both remaining J03 exceptions: pending reopen request and inactive company. Independent local review of saved results, archive, manifest/bytes and container absence confirms result. Procedure is not repeated.

First **new real full163-row/13-file copy** made, with 1.151 catalogue item, isolated restore comparison of29 tables,110 functions/ACL and18 policies, and all **10.488.781 real Storage bytes**. This is no longer earlier150-row copy nor reconstruction from delta. Full managed Auth/API/Storage service startup not claimed thereby.

Fresh direct SQL precheck at 22:44:03 matches exact retired163 reference. One transaction created exclusively new uncommitted control rows: two otherwise due Resolved tickets, pending reopen request submitted within original deadline, temporary membership and new inactive company/project. User remains banned/pending; no Auth activation or login. These rows not visible to other sessions.

Private worker in direct postgres session with empty JWT claims returns **0 for batch100** and **0 on repeated batch1**. Pending-reopen and inactive-company controls remain unchanged; both otherwise due. Audit count and cron.job configuration remain same. Final ROLLBACK returns all temporary rows and changes.

Separate read-only SQL at 22:44:07 and real Storage reads after trial confirm:

- Exactly same 29 table digests and entire catalogue/inventory payload as before trial: **163 rows,13 ready files/objects,10.488.781 bytes**.
- Same owner, previous tickets/proposals/decisions/history and all previously completed file states.
- All seven trial users banned, rights retired, active sessions/refresh zero. **Zero new permanent rows.**
- Exact backup client, restore and final SQL client independently confirmed absent.

No login, upload, email, repetition of positive auto-close scenario or completed J05 purge. No application/deployment/spec/security/schedule change or push. Credential values not saved; .tools/ remains private.

Private source: job-exception-current-2026-10-17T20-42-56-857Z.json. New copy: hosted-current-thirteen-backup-storage-restore-2026-10-17T20-42-56-980Z.json. Joint review: job-exception-completion-review-2026-10-17.json. Current reference: reviewed-current-job-exceptions-complete-retired-reference-2026-10-17.json. Manifest job-exception-completion-source-pins-2026-10-17.json has **253 hashes**, previous 247 unchanged.

Evidence is **controlled direct SQL worker/rollback result**, not new genuine pg_cron run, Vercel daily caller or HTTP/RPC transport result. Earlier genuine pg_cron eligible closure and J05 remain completed. [Next GET-only REST preparation](PHASE7_JOB_API_BOUNDARY_PREPARATION.md) checks transport boundary exactly, with one hidden backend input. Gate7 and uncovered Origin/session/native SSR, file/role/decision, daily caller and UI/final sub-items remain open.
