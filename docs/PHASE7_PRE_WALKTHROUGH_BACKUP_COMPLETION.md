# Full 188/15 backup before practical UI test — complete

18 October 2026. User procedure and independent review confirm **new full database with 188 rows and all 15 actual Storage files, 10.488.951 bytes**. Full captured Auth, all 29 table digests, ownership/ACL/RLS, 110 functions, 18 policies, 1151 archive entries, and byte contents were restored identically in a new isolated container. The backup command is not repeated.

Actual read-only SQL clock is **20:01:40 Europe/Budapest**, and second unchanged live snapshot **20:02:10**. New precheck required exact [J06 current 188 reference](PHASE7_AUTHENTICATED_JOB_REST_COMPLETION.md), including its current full Auth. New copy therefore includes legitimate Pending runtime timestamp/ban changes from the completed J06 cycle. No old Auth overlay, historical reference change, or fictional digest.

All 15 files were actually read from private Storage, stored privately, and restored in isolated filesystem with same parent/file/bucket links, sizes, and SHA-256. That is new byte proof, separate from earlier P08 read. Private archive is 1.116.654 bytes, SHA-256 86563a780a4bf1d9333fd8335e5a789640a5f760a4f829c599c3a95ea83348e9. Storage manifest SHA-256 46513bf3fc29b3bd1824393b03b8d09857c1d9400190bf5f1b134ae981dd74af. Archive contains expected protected Auth/business data, without storing entered DATABASE password or backend key.

Restore container had network=none, no ports and host bind mounts, with scheduler off. Live database was not restored/reset. All seven test accounts remain retired; sessions/refresh are zero. There was no activation, login, upload, email, business write, or schedule change. Actual client and restore container were removed, and five known preparation/actual containers total independently absent.

Final manifest has **546 source/evidence hashes**, 537 prior unchanged. Independent review again checked archive/manifest/catalog and all 15 saved byte files, without new hosted request. User maintenance change remains preserved.

Private sources, outside Git:

- pre-walkthrough-backup-current-2026-10-18T18-01-38-372Z.json — actual terminal PASS.
- hosted-pre-walkthrough-backup-storage-restore-2026-10-18T18-01-38-372Z.json — actual copy and isolated restore.
- pre-walkthrough-backup-completion-review-2026-10-18.json — independent review.
- reviewed-current-full188-backup-retired-reference-2026-10-18.json — new full 188/15 reference, SHA-256 c9792c4916c0c3ec1a7d2ed98bd1a050248559c26ffbd5239a8d762b7791ac38.
- pre-walkthrough-backup-completion-source-pins-2026-10-18.json — 546 signatures.

Original six-hour window of new copy ends **19 October at 02:01:40 Europe/Budapest**. Review does not extend it; each next business package requires its exact guard and must stay within that window. Copy is prerequisite for practical group, not an additional completed UI probe. Practical Client/Staff flow has not yet run. Four workstreams remain per [current matrix](PHASE7_CURRENT_SCENARIO_COVERAGE.md): Origin, practical UI, genuine Vercel daily, and final acceptance. Gate 7 stays open; application/spec/deployment/protection/schedule were not modified and there is no push.
