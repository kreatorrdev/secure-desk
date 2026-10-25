# SecureDesk — migration and verification runbook

Current — October 10, 2026: 27 migrations applied locally and on the closed securedesk-dev. The latter changes custom stale-conflict 40001 to PT409 with source/metadata/data hash protection; no new rights. All 4,204 SQL/RLS checks pass after the change. Code beec078 is Ready on Vercel. The reviewed hosted Auth/Data API matrix resume is 182 PASS and the pre-resume populated DB restore is PASS. HTTPS forms/attachments and subsequent DB/Storage-byte recovery remain open. [Change review](HOSTED_CONFLICT_FIX_REVIEW.md), [Gate 7](GATE7_VERIFICATION.md).

Historical Phase 6 checkpoint — 8 October 2026; dated notes in MIGRATIONS.md are historical. Phase 6 adds security tests and application hardening, not a new schema migration. There are 25 immutable applied migrations, PostgreSQL major version 17, 22 public RLS tables and two private buckets. No hosted migration or deployment was performed.

## Continue this existing local workspace

Open E:\portfolio\secure-desk in VS Code and use a new project terminal with Node 24 and Docker available. Keep .env.local, .tools/, server-only keys and generated test evidence out of Git. Copy .env.example only on a new machine, fill values locally, and use the same exact local application origin for browser and email links.

```text
node --version
npm --version
npm ci
npm run db:start
npm run supabase -- migration list --local
npm run supabase -- migration up --local
npm run db:test
npm run lint
npm run typecheck
npm run build
npm run start -- --hostname 127.0.0.1
```

Do not start a second application server on port 3000. The existing Supabase data stays in Docker's volumes on E:. migration up applies only unapplied files. Review the exact target and pending files before executing a migration. Never edit an already applied migration; use a new timestamped forward migration with rollback-only permission tests.

For the existing populated workspace, do not use db:reset. A reset destroys local users, records and uploaded files. Use it only in a separate explicitly disposable project when establishing a fresh-install proof. Phase 6 tested the current applied history and new rollback-only tests without resetting it.

## Repeat Gate 6 on local fictional data

Run these against the production build, with the local Docker services and Mailpit available:

```text
npm run test:security:controls
npm run test:attachments
npm run test:admin:guards
npm run check:gate6:local -- --create-demo
npm audit --json
npm audit --omit=dev --json
```

The Gate 6 suite is sequential and performs real signup, confirmation, login, approval, assignment, transfer, proposal, ticket, file, resolution, scheduler and audit flows. It intentionally retains fictional accounts and business history for inspection; it revokes their privileged roles, assignments, active organization codes and sessions. It temporarily pauses only the local auto-close job while precise resolution fixtures run, restores it in finally, then tests the actual scheduler. Audit retention briefly runs each minute, then is restored to daily 03:15 GMT and 365 days. Do not run this fixture suite against hosted data or concurrently with another fixture suite.

The normal suite runs every check. Two documented developer-only resume variables may reuse PASS logs during a single interrupted local audit: SECUREDESK_GATE6_RESUME and SECUREDESK_GATE6_SQL_ALREADY_VERIFIED. They are not release commands and are not evidence by themselves: the final audit must check corresponding source hashes and record what was reused. Leave them unset for an independent repeat. Logs and credential-free results live under ignored .tools/verification/gate6/ and phase6/.

## New forward migration

1. Take a backup appropriate to the target and record the existing migration list.
2. Create one migration with npm run supabase -- migration new descriptive_name. Specify tables, permissions, invariants, transactional RPCs and audit effects before applying it.
3. Add positive and negative rollback-only pgTAP tests. Include anonymous, pending, Client A/B, same-company peer, assigned/unassigned Staff, scoped Admin and Super Admin, plus stale revision/permission and direct write denial cases.
4. Apply with migration up --local, then db:test and the affected actual Auth/native web flow. Finish code checks and rebuild before UI verification.
5. Preserve prior business rows and uploaded bytes, verify temporary test permissions were revoked and scheduled workers restored, and document the migration's result.

A rollback is a reviewed forward repair migration. Do not remove an applied file or erase migration history to disguise a failed change.

## Phase 7 hosted procedure and actual state

Use a separate demo target with fictional data. Record its project identity, current schema/migration history and PostgreSQL major version before linking. Do not assume the user's existing hosted project is empty or safe to overwrite. Back it up and inspect first. Review a dry-run migration plan before applying the exact approved files. Verify extensions and both scheduled workers on the hosted service; local cron success alone does not prove hosted operation.

Configure HTTPS application origin, precise Auth redirect allowlist, real SMTP and provider email/abuse limits, cookie/session behavior, secrets and private buckets on that target. Browser code gets only the publishable key; the private Storage key is server-only. Verify deployment headers, CSP nonces, downloads, revocation, each role and the current dependency advisory on the hosted build. Give demo accounts only the intended scope and do not publish permanent privileged credentials.

Resolve or explicitly accept the unpatched development-only braces advisory documented in SECURITY_REPORT.md before running automated tooling on untrusted source patterns. Check backup restoration and infrastructure exposure separately. Initial 26 hosted migrations, private code push and closed hosting were performed in the authorized Phase 7. Public access/publication remains deferred. Fresh-empty guards must not be reused against the now-populated demo.

## Migration 27 — stale business conflicts

Apply only the new immutable file, never rewrite the already-applied 26 files. The guarded function replacement permits only reviewed old/new bodies and preserves catalogue properties. Local application used migration up --local after a private full backup and preserved 6,777 existing rows; full 4,204 pgTAP assertions passed. Hosted application used a reviewed guarded transaction, saved function preimages and ledger recording; subsequent read-only proof preserved all 47 compared rows and the owner. No reset, RLS change, grant change or local-data transfer occurred.

Business stale conflicts now raise PT409; genuine database serialization failures keep their native meaning. The application still accepts legacy 40001 when showing refresh messages. SQL proof is complete; actual hosted PT409/HTTP 409 and the reviewed 182-check user-role resume are now PASS, recorded separately from SQL proof. Private source/metadata/table evidence is ignored under .tools/verification/phase7/. A compensating change, if needed, must be a separately reviewed forward migration.

## Recovery after the real role resume

A new private archive before reactivation (11:25:10 UTC, 873.627 bytes / 1.151 catalog items) was tentatively restored at 11:29:36 UTC. PASS: all 25 compared tables / 47 rows correspond to pre-resume checkpoint, correct ledger 27 migrations, 22 public and 1 private RLS tables, 18 policies, 3 private buckets and 22 corrected functions with preserved owner/ACL/security settings. Network=none, no ports/bind mounts, scheduler off; temporary container removed, archive unchanged. This is a copy before the retest, not after it. No Storage objects/bytes; populated-byte recovery still remains.

This isolated restore used the saved archive only; no live password or cloud connection was required. Never restore that archive into the live local/hosted project or label it as a post-resume snapshot.
