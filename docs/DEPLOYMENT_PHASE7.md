# SecureDesk — Phase 7: closed demo and deployment verification

Updated 10 October 2026. Phase 7 is in progress. Business specification v1.0 APPROVED was not changed. Results and their limits are in [GATE7_VERIFICATION.md](GATE7_VERIFICATION.md).

## Where things live

GitHub stores code in the private kreatorrdev/secure-desk repository. Vercel runs the HTTPS application at https://secure-desk-eta.vercel.app. Supabase securedesk-dev holds the separate demo database, Auth, and private files. Local users/data stay on the computer.

By user decision no Markdown file goes to GitHub, including old history. Therefore .tools/github-code has an independent code-only history, and the original local Git remains without a remote. Current code-only HEAD is beec078, 226 files / 4 commits / 0 Markdown in the entire history. Local documentation is still saved and committed.

## Schema, registration, and first administrator

Before migrations the database was empty on PostgreSQL 17.11. Standard psql 17.11 verified the password over a verify-full TLS connection; the password was not saved. A private backup was made and the exact read-only list of 26 migrations verified. Migrations were applied on 9 October at 13:33:50 UTC, without local accounts/data, seed/custom-role/Vault changes. Catalogue and five SQL permission smoke checks are PASS. Fresh-empty migration helper is not a general tool for re-application.

The user completed actual hosted registration, email receipt/confirmation, and login. Email confirmation left the Client account Pending. Four protected pages returned them to their own status, and anonymous public-key API calls could not read 22 business tables.

After read-only suitability check and concrete confirmation the first administrator assignment was applied: SecureDesk Demo Owner is Super Admin/Active, first request Approved. Fresh SQL and Chrome checks are PASS. Temporary setup helper was not left exposed; company membership was not added. [Assignment review](FIRST_HOSTED_ADMIN_REVIEW.md) keeps exact scope, and private evidence UUID/address. This does not confirm other hosted roles.

## Private attachments up to 10 MiB

Business limit of 10 MB is implemented as 10 MiB / 10.485.760 bytes. Vercel Functions payload limit is 4.5 MB; Next.js configuration does not increase it.

1. Server checks login, ticket/proposal, and rights revisions; database reserves the attachment.
2. Issues capability for one private attachment-quarantine path.
3. Browser sends bytes directly there.
4. Server checks content, format, size, and checksum.
5. Creates non-overwritable copy in private permanent bucket. Trusted completion rechecks rights/revisions and together saves ready state/audit.
6. Download checks current rights and streams bytes with sandbox, attachment, nosniff, and no-store.

Provider upload token lasts two hours, only for sending to quarantine. Business reservation has a shorter deadline; replay cannot replace published file or extend publish right. Local transfer/format/revocation tests are PASS, including 10 MiB bytes. **First small TXT browser upload confirmed by user screenshot; downloaded file is identical to original (82 bytes). Rest of HTTPS matrix remains open.**

Native multipart is local fallback. Large Vercel attachments require JavaScript; the form explains when it is disabled.

## Vercel values and closed access

| Value | Role |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Public address of separate demo project |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Client/server with RLS |
| SITE_URL | Exact HTTPS origin of application |
| SUPABASE_STORAGE_SECRET_KEY | Secret/Production, server only for Storage/trusted RPC |
| CRON_SECRET | Secret/Production, at least 32 random characters |

Values are saved for Production only. Secrets were entered by the user directly in Vercel and values were not read. Preview/Development are not linked to demo database. .vercelignore excludes env, .tools, Git metadata, and build/cache.

All Deployments Vercel Authentication is kept. Standard Protection does not cover production domain and is insufficient for this choice. Actual HTTP check without cookies/credentials on all three addresses of new deployment returns Vercel authentication; access is not open. No automation bypass, exceptions, or paid add-on.

First Ready deployment was 3165615. Diagnostics code was then sent as 563d276. After user correction of server Storage key a new Ready deployment Axu7MY6aGy3ertug3E7io3197b8e (31 s) was made. Git commit stays the same; redeploy loaded new setting. Already published version does not automatically pick up secret change.

Auth Site URL is https://secure-desk-eta.vercel.app, sole redirect https://secure-desk-eta.vercel.app/auth/confirm. Both are exactly approved, no wildcard.

## Maintenance and fixed error

Daily job selects only old quarantine/orphan files and long-expired uploading reservations: at least 24 hours, at most 100 candidates. Ready files are protected. Vercel Hobby runs daily in a flexible time window; schedule is 03:30 UTC.

First actual manual Cron Run returned 503. Limited phase logging and allowed error codes were added; no provider message, secret, path, or identity enters the log. Nine dedicated route tests, ESLint, and production build/TypeScript are PASS. Log revealed batch-selection / 42501. SQL service_role check confirmed correct privilege/function execution.

The user re-saved existing backend sb_secret key in SUPABASE_STORAGE_SECRET_KEY, Secret/Production. New deployment loaded setting. Call on 9 October at 20:56:48.865 UTC returned **200** and actually invoked hosted cleanup RPC. Before test 0 attachments / 0 Storage objects were verified; nothing was deleted. We do not identify old unread value as a specific wrong key type. Observed problem is resolved, but daily scheduled call and controlled candidate removal are not yet proven.

Fresh read-only check on 10 October confirms successful first audit-retention call at 03:15 UTC and last ten auto-close runs at 07:54–08:03 UTC. In that historical 08:03 UTC checkpoint there were not yet trial hosted tickets/attachments; this confirms the actual schedule, not business outcomes of deletion/closure. Later Auth/API test added 3 tickets; in that pre-upload checkpoint there were no attachments. Subsequent user screenshot confirms small TXT attachment. Vercel nightly maintenance call cannot be confirmed afterwards from morning logs: Hobby keeps only one hour of logs. Earlier manual 200 remains separate evidence. Plan, schedule, or protection were not changed.

## Email and user choice

The user chose closed demo without domain/custom SMTP purchase. Mailpit remains local service. Hosted default Supabase sender allows only project team addresses with a small limit (currently two messages per hour); actual owner received and confirmed message. Confirm email is not disabled.

Default provider callback compatibility leads to fixed /login without creating session; user signs in with password. Custom token_hash + POST flow remains supported. For upstream default GET link we do not claim protection from email preview consumption. Public registration/custom sender are later, separately approved work.

## Backup and isolated restore

Archive of initial empty database (364.884 bytes / 559 entries) was successfully restored with ownership/ACL in separate PostgreSQL 17.11 space, without network/ports/bind mount. Archive unchanged, temporary container removed, live databases untouched. This is initial backup, not today’s schema/owner state.

.tools/backup-current-hosted-demo.ps1 was prepared for **historical checkpoint from 9 October**: 26 migrations, one confirmed active owner and approved first request, without companies/tickets/attachments/Storage bytes. User enters DB password privately. Helper only reads hosted database over verify-full TLS, makes private backup on E:, verifies stable snapshot, restore runs in new network=none container without ports/bind mount and disables cron in that trial. Compares 25 table digests and ledger/RLS/bucket/owner criteria, then removes only its own temporary space. User ran script and entered password privately. Actual backup/restore is PASS: archive 850.600 bytes / 1.151 entries, all 25 digests and ledger/RLS/owner criteria match. Snapshot and archive unchanged; temporary container removed. Evidence: .tools/verification/phase7/hosted-current-backup-restore.json.

Syntax, missing-input guard, and rejection of actual populated local database passed. Password does not go to file/argument/URL/log. Backup contains private Auth and business data and must stay local/outside Git. It does not contain Storage files; in historical empty checkpoint there were no bytes to return. After fictional attachments a separate trial of recovering their bytes is needed. Helper expecting empty attachments must not be run blindly after adding fixtures.

## Actual role verification and conflict fix

27 hosted migrations. Local code commit 7b1d505; GitHub code-only beec078, 4 commits / 226 files / zero Markdown in every commit. Vercel Production 5MyBiZ6C6XM4Nq81nufLoWYq5DAV is Ready (30 s). All three addresses actually return Vercel authentication without login. First hosted Auth/API attempt has 167 PASS / 1 FAIL on stale write; all seven fictional accounts were banned and their business access/sessions shut down. Owner and Approved request unchanged. Cause, new PT409 migration, and prepared resume: [HOSTED_CONFLICT_FIX_REVIEW.md](HOSTED_CONFLICT_FIX_REVIEW.md). Actual resume is 182 PASS / 0 FAIL with proven re-revocation of all trial rights/sessions.

First create helper was executed and is not repeated on populated database. New .tools/resume-hosted-role-api.ps1 checks exact retired checkpoint and current ledger, makes new private full copy and uses same identities/companies/projects/tickets. Previous completed memberships retained, adds new episodes and finally revokes trial access again. Parser, actual missing-input/local-target guard and isolated SQL reactivation/double-setup denial/retirement are PASS. Hosted Auth/Data API result is now separately PASS; Vercel browser HTTP/forms/files remain open. [Exact procedure and private input](HOSTED_ROLE_VERIFICATION_REVIEW.md).

PT409 forward migration applied with exact source/metadata/table hashes; previous 26 files not overwritten. All 4.204 local SQL/RLS tests and lint/build/TypeScript are PASS. Fresh hosted read-only check confirms unchanged 47 rows and owner. GitHub receives code only. Vercel main through Create Deployment resolved to exact beec078; new Ready production release on 10 October at 09:42:16 UTC. Automatic release after push was not visible; cause not determined. Three unauthenticated addresses checked at 09:43:28 UTC and return 302 to Vercel login. No change to secrets, protection, or paid plan.

## Provider review and remaining risks

Security Advisor: 0 errors / 61 warnings / 5 info. Authenticated SECURITY DEFINER warnings relate to dedicated workflow RPCs with authz checks and empty search_path. Catalogue match is PASS, but warnings are not dismissed and complete hosted role matrix still follows. Leaked-password protection is off and requires paid plan; upgrade not approved.

Provider Auth limits were reviewed, not stress-tested. Application limiter is per process; trusted IP forwarding is not enabled. Vercel has no custom project rate-limit rules, system bypass, or IP blocks; Bot Protection is Off. BotID installation/integration was not performed. For public or real user use these limits require new review. Closed access reduces exposure but is not proof of complete production security.

## Order before completion

1. Current private backup and actual isolated restore — complete for one-owner/empty-Storage checkpoint.
2. Fictional accounts/companies/tickets created and access revoked; reviewed resume helper finished actual matrix with 182 PASS, without permanent public privileged passwords.
3. Hosted role/tenant/peer/revocation/stale-form/session/logout/HTTP protections.
4. Actual HTTPS 10 MiB upload/download, allowed and forbidden formats, replay and rights revocation.
5. Actual daily jobs and controlled maintenance trial; populated DB + Storage recovery.
6. Final leak/risk/screenshot review and precise acceptance record.

Public demo/repo and GitHub README deferred by user decision. Local portfolio drafts exist; LinkedIn/Upwork post not approved. Phase 7 remains open. After completion the plan in AFTER_PHASE7_PLAN.md is reviewed together; not automatic permission for new features/costs/publications.

## Primary sources

- [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication), [payload limit](https://vercel.com/docs/errors/function_payload_too_large), [cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [backup](https://supabase.com/docs/guides/platform/backups), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Vercel runtime logs](https://vercel.com/docs/logs/runtime), [Auth createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [Auth updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid)
- [Supabase password security](https://supabase.com/docs/guides/auth/password-security), [upload capability](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl)

Current primary pages were verified during this phase. Concrete hosted PASS results come from actual private evidence, not from provider function description.

## Actual resume and restored populated copy

The actual resume ran on 10 October at 11:25:06–11:25:52 UTC: **182 PASS / 0 FAIL**, full reviewed Auth/Data API matrix complete. Stale write got PT409 / HTTP 409 for 66 ms, without additional ticket or audit change. Same Staff JWT immediately lost access after revocation; after regrant old rights revision stayed stale. All seven fictional identities banned, with zero active business rights/sessions/refresh tokens. Owner profile/Approved request preserved; exactly one Super Admin. No saved credentials or reset.

New private archive before reactivation (11:25:10 UTC, 873.627 bytes / 1.151 catalog entries) was trial-restored at 11:29:36 UTC. PASS: all 25 compared tables / 47 rows match pre-resume checkpoint, exact ledger 27 migrations, 22 public and 1 private RLS table, 18 policies, 3 private buckets and 22 corrected functions with preserved owner/ACL/security settings. Network=none, no ports/bind mount, scheduler off; temporary container removed, archive unchanged. This is copy before repeated test, not after. No Storage objects/bytes; populated-byte recovery still remains.

Next are actual HTTPS session/form and attachment checks. Six local fictional files prepared: small TXT, exact 10 MiB TXT, one byte over limit, CSV, fake PNG with textual content, and unsupported HTML. Preparation manifest records sizes/hashes/expectations from time before send; later user screenshot confirms small TXT upload. Chrome control connection did not respond even after documented recovery attempt. User was asked to open published /account and sign in personally; browser results not marked PASS.

Private evidence: .tools/verification/phase7/hosted-role-api-resume.json, hosted-role-resume-checkpoint.json, hosted-role-resume-backup-isolated-restore.json and https-fixtures/manifest.json. Original FAIL and initial checkpoint remain saved.

## First actual browser upload — 10 October, 11:47 UTC

User screenshot from 10 October (display 11:47 UTC) confirms message Your private file was uploaded., securedesk-small.txt, 82 B and author SecureDesk Demo Owner. PASS is limited to display of successful send of small TXT. Production ticket was intended destination, but URL not visible on crop; agent Chrome control unavailable. Original 82 bytes/SHA-256 verified against preparation manifest, which remains unchanged historical record. Download and comparison of actual downloaded bytes not yet verified. 10 MiB boundary, negative formats, role/replay/revocation, cookies/HTTP/logout and Storage byte recovery remain open. Current database/Storage inventory not re-read; earlier zero-file state applies only to dated checkpoints. Private evidence: .tools/verification/phase7/hosted-https-small-upload-user-proof.json/png.

## Downloaded small TXT — 10 October, 12:32 UTC

The user reported downloaded file C:/Users/rcf11/Downloads/securedesk-small.txt. File read from exact reported path and compared to prepared original: **PASS — both have 82 bytes, fully identical content and SHA-256 d5834e33cae9ac6d0e4e6d6f3870bca6a92d0f01642392442871e1f813e1debf**. Evidence: .tools/verification/phase7/hosted-https-small-download-byte-comparison.json. This confirms integrity of that user-downloaded file after previously documented upload. HTTP headers/cookies and browser request itself were not reviewed by agent. Exact 10 MiB, rejection of oversized/fake/unsupported file, other formats, role/replay/revocation and Storage-byte recovery remain open; Gate 7 is not complete. Preparation manifest and earlier upload evidence remain unchanged.
