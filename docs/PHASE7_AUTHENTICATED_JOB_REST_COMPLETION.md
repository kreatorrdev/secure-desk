# J06 — authenticated REST for private jobs, completed

18 October 2026. Real Pending Auth-only cycle has **five REST PASS, zero FAIL**. Positive own-profile RLS control returns200, and four worker requests return exact rejecting status/code pairs. Final read-only SQL at **18:47:46 Europe/Budapest** confirms same 188 rows and15 file metadata/Storage objects, all same passwords and shut-down trial rights/sessions. Procedure is not repeated.

## Actual requests and evidence boundaries

REST trial at 18:47:44 uses public application key and authenticated JWT of existing fictional Pending account. Profile remains pending/client without business scopes; separate Auth getUser and JWT claims check confirm exact identity. Control is not empty200 or anon request.

| GET control | Actual result |
| --- | --- |
| Exact own Pending profile through RLS | 200, exact-authenticated-own-profile |
| public.auto_close_resolved_tickets | 404 / PGRST202, no-public-worker-route |
| securedesk_private.auto_close_resolved_tickets | 406 / PGRST106, private-schema-not-exposed |
| public.purge_expired_audit | 404 / PGRST202, no-public-worker-route |
| securedesk_private.purge_expired_audit | 406 / PGRST106, private-schema-not-exposed |

All four worker requests have exclusively p_batch=0; workers were not started. REST part has five GET/zero POST. Separate Auth part actually has six calls: admin GET, unban PUT, password-grant POST, user GET, global-logout POST and re-ban PUT. One existing trial password was used only in memory. There was no Chrome, owner login, password reset, new user or email. Auth runtime writes are expected; whole package is not presented as read-only.

## Preservation and shutdown

Precheck at 18:47:38 matches exact P08 current188 snapshot. Final independent repeated comparison of saved before/after results confirms all 29 protected subsets, entire owner Auth, all credential contents, catalogue, business rows and15 file metadata/objects. No new business, profile or scope rows. Only Pending ban/login/updated timestamp fields may reflect that controlled login.

Global API sign-out, re-blocking Pending account and guarded SQL retirement of its sessions/refresh passed. All seven trial accounts are retired again, no active trial membership/staff/admin scopes, and global sessions/refresh are zero. Not claimed that logout alone cryptographically revokes already issued stateless JWT; token values were not saved.

**No new Storage GET requests or new byte evidence.** Last real check of all 15 physical files/10.488.951 bytes remains separate [P08 result at 18:01:26](PHASE7_PROPOSAL_FINAL_HISTORY_COMPLETION.md). New cycle confirms database and file metadata/objects at later time. New full 188 copy was not made; Auth-only cycle used existing full 172 copy of exactly unchanged Pending Auth, within its original deadline23:11:54 that day. That deadline was not extended by review. Before new business writes new appropriate full copy is required.

## Independent evidence closure

Review of actual result, precise five REST responses and six Auth calls passed without new hosted requests. Four preparation containers and one real client independently absent. Final manifest has **517 signatures**, previous 512 unchanged. Earlier preparation with seven local and eleven isolated controls remains separate evidence; isolated172 archive is not presented as current188 restore.

Private sources, outside Git:

- authenticated-job-rest-current-2026-10-18T16-47-30-707Z.json — actual PASS.
- authenticated-job-rest-completion-review-2026-10-18.json — independent final review.
- reviewed-current-authenticated-job-rest-complete-retired-reference-2026-10-18.json — new current188/15 reference, SHA-256182b8671e7cfeea904074e1462d4bbd69761ca47a8fdcaeaa67fb8eaa55feab8.
- authenticated-job-rest-completion-source-pins-2026-10-18.json —517 source/evidence hashes.

Reference preserves new whole snapshot, protected subsets and stable Pending/owner content. Does not invent new uniform full-Auth digest: Pending ban/timestamp fields changed as expected. Passwords, keys, JWT/refresh values and raw provider responses were not saved. User maintenance change is preserved.

## Remaining scope

Together with earlier service and anonymous REST packages there are15 real REST GET checks and12 precise worker rejections, with positive control in each group. Earlier SQL role/context and owner/four-fictional-session application maintenance401 remain separate evidence. Thus reviewed **J06 SQL/REST/owner HTTP scope completed**; genuine Vercel scheduled caller remains J01.

Four areas remain: real foreign/missing Origin application denial, practical Client/Staff UI flow, genuine Vercel daily caller and final preservation/closed-demo acceptance. Those are not four promised commands or logins. P08 original terminal/browser FAIL of additional anonymous200 checks remains preserved and unclassified; completed historical-download scope is not repeated. Gate7 remains open. Application, specification, deployment, Vercel protection and schedule were not changed; no push or public publishing.
