# Practical Client/Staff flow — preparation for new full backup

**Complete:** [actual new 188/15 copy and independent review](PHASE7_PRE_WALKTHROUGH_BACKUP_COMPLETION.md) confirmed. Command and preparation below are history; do not repeat. User stays logged out until new practical instructions.


18 October 2026, after [completed J06 authenticated REST cycle](PHASE7_AUTHENTICATED_JOB_REST_COMPLETION.md). Current reviewed reference has 188 rows and 15 files, test rights off and zero sessions/refresh. Practical ticket/comment/Resolved/Client-decision UI flow still needs preparation; before its new business writes a full copy of current state is required. **This command only makes a copy and verifies its restore. It is not the fifth remaining business group.**

Stay logged out, with Docker running. In an existing free PowerShell window:

```powershell
& 'E:/portfolio/secure-desk/.tools/check-pre-walkthrough-backup.ps1'
```

After offline preparation and local client check follow two hidden inputs: existing Supabase DATABASE password, then existing backend sb_secret key. No test or owner password, Chrome, Snippet, or manual logout. Wait for all six steps and send only final PASS or error status. FAIL is not repeated before review.

## Exact planned scope

Strict precheck requires new current 188/15 snapshot, including **full current Auth**, all 29 digests, catalog, and retired rights/zero sessions. Reference after J06 has SHA-256 182b8671e7cfeea904074e1462d4bbd69761ca47a8fdcaeaa67fb8eaa55feab8. Older P08 snapshot with different Pending Auth timestamps and old 172 archive cannot replace that precheck. Uniform Auth digest from prior copy is not invented: new observation reads and stores digest again.

Procedure uses TLS verify-full read-only client and pg_dump. Reads exactly 15 existing private Storage files with id/parent/bucket/metadata/byte length/SHA-256 verification, 10.488.951 bytes total. New full database with full captured Auth and all 15 byte contents stored privately on E:, outside Git. Database restored only in new temporary container without network, ports, or host mounts, with scheduler off. Compare 29 digests/110 functions/18 policies/1151 archive entries, links, and actual saved bytes; both owned containers must be independently absent.

No activation, login, password reset, business writes, upload, email, schedule, or live database restore/reset. Raw errors, entered passwords, and backend key are not logged. Captured Auth inside private copy remains its expected protected content. Six-hour deadline of future copy starts at actual new SQL clock; this offline review does not extend old copy deadline.

## Completed preparation without private input

- Six local checks: exact 188 whole-Auth boundary, rejection of modified/old snapshots, fresh observation, all 15 hashes and bucket mapping, reviewed mocked GET transport and strict model of final backup proof. Mock key is fictional; no hosted requests.
- Seven isolated checks restore **actual existing 172 archive without overlay** and verify full captured Auth/29 digests, generated SQL string, 1151/110/18 and scheduler off. New 188 guard explicitly rejects. Local byte recovery uses 13 actual previously saved files and two clearly marked reproductions of known fictional final-history content with same hashes. This **is not actual 188 restore nor new hosted 15-file byte verification**.
- Nine Node source/PowerShell parser, offline prepare, exact owned TLS client, and missing-input stop before hosted requests pass. Two temporary containers independently absent. Final manifest has 537 signatures, 517 prior unchanged. User maintenance change is preserved.

Private review is pre-walkthrough-backup-preparation-review-2026-10-18.json, manifest pre-walkthrough-backup-source-pins-2026-10-18.json. **Actual new 188/15 copy has not yet run**, nor practical UI flow. Completed J06 and P08 historical-download scope are not repeated. Four workstreams remain per [current matrix](PHASE7_CURRENT_SCENARIO_COVERAGE.md): Origin, practical Client/Staff UI, genuine Vercel daily, and final acceptance. Gate 7 stays open; application/spec/deployment/protection/schedule were not modified, no push.
