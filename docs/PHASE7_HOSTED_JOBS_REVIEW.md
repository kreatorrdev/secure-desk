# SecureDesk — actual hosted jobs and final preservation

12 October 2026. **Actual scheduled closure of one new trial ticket confirmed; Phase 7 remains open.** No new application/deployment change or public publishing.

## Result

Existing pg_cron at **15:37:00.064900 UTC** closed only new marked Resolved ticket whose seven-day deadline expired. Job run 4446 succeeded, and closed_at is within its start/end range. Positive hosted worker was not manually invoked. Exactly one system ticket.auto_closed audit entry added, actor_user_id null. Runs 4447 and 4448 repeated successfully; state remains same and no duplicate close audit. Return_message '1 row' represents SQL result row count, not number of closed tickets.

Two controls remain unchanged: recently Resolved / revision 1 and Open / revision 1. Pending reopen and inactive-company hosted cases were not tested by this. Synthetic historical times belong only to new rows; original times were not changed.

Before this, read-only hosted permission trial at **15:17:24.431894 UTC** gave **8 real SQLSTATE 42501 denials + 6 checks without EXECUTE grant**. anon, authenticated, service_role and direct owner with business JWT claims cannot invoke these two private workers. This is SQL permission/context evidence, without application HTTP/RPC transport claim. Persistent grants/roles were not changed.

## Exact new data and originals

- Due ticket: e67428ee-ff6a-4995-8cb9-93eba94188c1, now Closed / revision 2.
- Recent ticket: 833da068-58be-4b57-b3e0-6e64abf586ea, remains Resolved / revision 1.
- Open ticket: 86c90374-4ec1-42b0-a54b-f5982b901189, remains Open / revision 1.
- Marked setup audit: 7d87f333-08b3-40ed-9908-b94b7f9669c2.
- System close audit: 89f6b692-f605-4267-a928-a7ab5da05383.

In setup only stated set of three new tickets and one setup audit was added. Owner, fake Auth/profiles/memberships, two original companies/projects and original files were not changed. Setup replay rejected in new isolated copy; no duplicate write. **5 plan guard tests + 23 real isolated preflight checks** passed on 85-row archive copy, with preserved originals, network=none, cron off and removed container.

Observation at 15:39 UTC confirms byte-equivalent JSON digests of original **three tickets and 14 then-current audit rows**. Later full BEGIN READ ONLY / ROLLBACK at **16:17:56.485730 UTC** confirms:

- All **27 other tables**, including four Auth tables, have same full digests as before setup.
- Entire catalogue/inventory payload, except intentionally new ticket IDs, remains same: 27 migrations, 110 whole functions/ACL, 18 policies, owner/Approved, original eight file/object sets and private buckets.
- Seven fictional identities remain banned; rights retired; all sessions and refresh rows zero.
- Current state has **29 tables / 90 rows**: previous 85 + three tickets + two audits. tickets=6, audit_logs=16.

## Recovery of current state without new private input

**Composite private copy** made: unchanged real pg_dump with 85 rows from 14:57 UTC + exact five new business rows read at 16:17 UTC. This is not new pg_dump. Guard proves all other 27 tables and catalogue match source dump; delta contains no Auth credential values.

Real new network-isolated recovery trial has **35 PASS / 0 FAIL**: restored source dump, added exact new row JSON records, compared whole 90-row snapshot/all functions/ACL/policies/retirement, copied and re-hashed eight original files (10.488.380 bytes). Duplicate delta replay rejected, and recovered state remains same. Scheduler off, no network/ports/bind mount, container removed. Hosted and original local database not restore/reset meta.

This copy remains private due to original Auth hashes. Does not prove running entire managed Auth/API/Storage service. New standalone **full hosted 90-row backup** script separately prepared: six guard tests, Node/PowerShell syntax, offline source/file precheck and real missing-input stop before Docker/hosted request. Not yet executed with private inputs. [Procedure and boundaries](PHASE7_STANDALONE_BACKUP_PREPARATION.md).

## Audit retention: prepared, without hosted deletion

Exact next plan foresees **one new expired fictional audit and one new fresh control**, existing retention=365 and bounded purge(1). Rejects every pre-existing expired audit entry and old completed SecureDesk cron logs; preserves all earlier original audit rows, owner/files and other 28 table digests. Repeat should return zero, with exactly one system purge audit. Does not change retention setting or original times.

**7 guard tests + 38 real isolated checks** passed on current 90-row copy. In trial rollback transaction only new expired row removed, fresh control preserved, system audit has removed_count=1. After rollback whole 90-row snapshot and catalogue match pre-probe state. Container removed. Candidate SQL for later action-time confirmation saved privately, but **not executed nor expired hosted candidate created in advance**.

Fresh live read-only precheck at **16:30:27.333975 UTC**: retention=365/revision 1, audit=16, ticket=6, pre-existing expired audit=0, completed managed cron logs older than 30 days=0. Before real execution same guard must pass again; any change or stale six-hour database stops procedure.

At this dated review, permanent hosted deletion through the browser UI required separate confirmation immediately before the action. Earlier approval covered one 82-byte Storage object, not this audit scenario. The Computer Use skill at `C:/Users/rcf11/.codex/plugins/cache/openai-bundled/computer-use/26.1007.21434/skills/computer-use/SKILL.md` required reading `C:/Users/rcf11/.codex/plugins/cache/openai-bundled/computer-use/26.1007.21434/docs/confirmations.md`, which stated **“Always Confirm at Action-Time (Even If Pre-Approved)”** and **“Delete data (cloud and local)”**. These are historical local paths for the version used during that review; they are not files distributed with this repository. The browser policy at that review required action-time confirmation for permanent deletion. Isolated local execution is not hosted deletion.

## Scenario status

| Scenario | New evidence / remaining boundary |
| --- | --- |
| J01 | Genuine pg_cron business caller confirmed for auto-close; Vercel daily maintenance caller still separately pending. |
| J02 | PASS actual hosted: exactly one new eligible ticket closed, one system audit. |
| J03 | Recent/Open controls actual PASS; Pending reopen/inactive company actual still open. |
| J04 | Actual successful repeated scheduled runs without new close/audit changes; configured batch 100. Batch 1/idempotency additionally isolated. |
| J05 | Exact current-state isolated preflight PASS; hosted deletion awaits action-time confirmation and fresh guard. |
| J06 | Actual SQL role/context boundary PASS; application HTTP/RPC scope remains separate. |

New source/snapshot/SQL/result/recovery files private in .tools/verification/phase7. Original maintenance checkpoint, helpers, backups and earlier FAIL records remain preserved. One new internal harness first asked for wrong missing-input message name; actual helper correctly stopped at input step. Fixed one verifies actual safe message and absence of client/backup/isolation fields. That is not hosted failure or database change.

Relevant private results: hosted-scheduler-boundary-result-2026-10-12.json, hosted-autoclose-three-fixture-observation-result-2026-10-12.json, hosted-autoclose-final-capture-result-2026-10-12.json, hosted-autoclose-scheduled-composite-review-2026-10-12.json, current-job-composite-recovery-isolated-2026-10-12T16-21-46-795Z.json, current-audit-retention-isolated-2026-10-12T16-26-14-154Z.json and hosted-retention-readonly-precheck-result-2026-10-12.json. Screenshots remain private; raw archives/logs not public-safe.

**Phase 7 not finished.** Remaining role/proposal/native-form/server-content/upload replay/practical UI trials and final acceptance remain open; [next steps](PHASE7_NEXT_PRIVATE_STEPS.md). No Markdown push, new public/domain/SMTP/social work, protection change or paid upgrade.


## Final local integrity review

Review at 16:43 UTC confirms all 18 relevant source/spec fingerprints and 11 unchanged existing helper files, same terminal maintenance checkpoint, source archive and all eight original byte copies. New preflight/recovery containers independently confirmed absent. Code-only export remains clean at beec078, without Markdown paths in history. All 68 local documents / 368 local links verified, zero missing links. Pattern scan of nine new sanitized JSON evidences has no recognized credential patterns; this does not declare raw archive/log/screenshot content safe for public. Private record: autonomous-handoff-integrity-review-2026-10-12.json. Unrelated user change PHASE7_PRE_MAINTENANCE_REVIEW.md remains preserved and outside this commit.
