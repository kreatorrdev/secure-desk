# New 163/13 copy — completed by separate local recovery

18 October 2026. New real full 163-row database and all 13 private Storage files were saved, then verified by restore in network-isolated environment. Final composite review confirms same full captured Auth and all 29 table digests, 110 functions/ACL, 18 policies, parent/metadata links, and all **10.488.781 bytes**. All four relevant temporary containers independently confirmed removed. Business data and active rights were not changed.

## Original stop and exact cause

User terminal result remains **FAIL** on restore_verification/restore_comparison_failed; it was not overwritten nor marked as original PASS. Procedure before stop completed new live read-only precheck, real pg_dump, 13 Storage GET copies, second live SQL, and pg_restore into temporary database. Entire live state is identical between two SQL snapshots.

Error is in new private helper: const snapshotSql=capturedSnapshotSql saved the function instead of calling capturedSnapshotSql(). Restore comparison passed that function to psql as query. Separate local probe on **real new archive** reproduces SQLSTATE 42601 with same argument; then correctly called snapshotSql() via stdin returns expected full snapshot. Earlier isolated probe correctly called function and therefore did not cover wrong binding in generated core. No evidence of password error, application change, or data loss.

Original 335-source set, old helpers, and both original FAIL reports remain unchanged. Old user command is not repeated; its guard requires review of previous real attempt. New local continuation uses only already saved archive/manifest/bytes, without credentials, hosted requests, new copy, login, or activation.

## Real evidence and times

- Real pre-backup read-only SQL: **18 October 11:48:35 Europe/Budapest**, i.e. 2026-10-18T09:48:35.592056+00:00.
- Real post-backup read-only SQL: **11:49:18 Europe/Budapest**, i.e. 2026-10-18T09:49:18.769113+00:00. 163 rows/13 metadata and objects, 25 non-Auth/catalogue/stable Auth match previous reviewed state; all test rights retired, all sessions/refresh zero.
- New database.dump archive: 1.105.052 bytes, SHA-256 ed9c8a5019bb52c2756f4f2f1070b1cfa17f7c42918f4f4a3beed34245947210; 1151 catalogue entries.
- All 13 actually read files/10.488.781 bytes saved between those SQL snapshots. Manifest SHA-256 is 83084097315700ba6f7261bd735516354bf76e7015cf9a45ec0920e9f7aa360f.
- Separate new network=none restore returns full new archive without Auth replacement. Correct query confirms identical full captured snapshot and stable Auth; all 13 saved bytes restored to isolated filesystem and hashes identical. Scheduler off; no ports/host bind mounts.
- Three containers from user procedure and one new recovery container independently absent. Final manifest has 345 source/evidence hashes, previous 335 unchanged.

Backup window remains derived from **real first SQL time**: until 18 October **17:48:35 Europe/Budapest**. Local completion/review does not extend it. Before next business write its corresponding fresh guard is still required; this copy is not approval for arbitrary changes.

## Private sources and boundaries

Sources are in ignored .tools/verification/phase7 directory:

- hosted-next-browser-full-backup-storage-restore-2026-10-18T09-48-32-958Z.json and next-browser-full-backup-current-2026-10-18T09-48-32-958Z.json — original FAIL remains.
- next-full-backup-local-recovery-*.json — separate LOCAL_RECOVERY_OF_CAPTURED_FULL_BACKUP_PASS; original reports/archive/manifest unchanged.
- next-full-backup-recovery-completion-review-2026-10-18.json — CURRENT_FULL_163_ROW_THIRTEEN_FILE_BACKUP_COMPOSITE_COMPLETE.
- reviewed-current-full-backup-recovered-retired-reference-2026-10-18.json — new reviewed current reference with full source/recovery provenance.
- next-full-backup-recovery-completion-source-pins-2026-10-18.json — 345 signatures.

Private archive contains Auth hashes and business data. No new storage of credential values, business writes, live restore/reset, schedule change, deployment change, approved specification change, or user maintenance note change. This is not full managed Auth/API/Storage service restore. New local probe is not new cloud read; new real 13-file byte proof belongs to original copy between 11:48 and 11:49. No push.

User stays logged out. Copy and already completed owner/UI steps are not repeated. Remaining role/content/Origin/authenticated HTTP and practical Client/Staff scenarios, genuine Vercel daily, and final acceptance remain per [matrix](PHASE7_CURRENT_SCENARIO_COVERAGE.md). Gate7 is not declared complete.
