# SecureDesk — preparation for hosted verification of access to existing attachments

October 10, 2026. **EXECUTED AND INDEPENDENTLY REVIEWED — 244 PASS / 0 FAIL for actual Auth/Data API file-access/Storage-denial/revocation attempt. Preparation 18/18 and 142/142 results remain separate. Gate 7 is not complete.**

Fresh copy of database and eight actual Storage files was previously successfully restored in isolation and independently reviewed. The next test verifies privileges on those eight existing attachments. New helper uses previously approved seven fictional identities from exact namespace; it does not create new users, companies, projects or tickets.

## Reviewed flow

1. Confirm exact securedesk-dev/ref/PG 17.11, verify-full TLS, ledger 27 and original migration hashes. Read-only snapshot must have eight known ready owner attachments and eight exactly linked private Storage objects, same function/policy definitions as verified copy, unchanged owner and fully deactivated test accounts. Verify saved archive and make new private database.dump copy before changing test accounts.
2. With existing backend key temporarily change password/unban only exact seven fictional accounts, with new random passwords in memory, without email. SQL transaction re-verifies exact users/companies/projects/tickets and full snapshot of all eight file/object links; changed file or active previous test aborts setup. Reactivation creates new Client membership episodes and retains old history; existing test Staff/Admin assignments are activated.
3. Log in seven accounts through actual hosted Auth. Ticket owner (Client A), their Staff owner and assigned organizational Admin may see all eight metadata rows. Pending, other Client of same company, Client of other company and unassigned Staff may not. Anonymous access, changed company/ticket/file ID and service-only completion/cleanup user calls should be rejected.
4. User and anonymous direct Storage GET of known CSV must be rejected; users cannot create signed download URL on their own. Positive bytes are already confirmed by separate owner-download and actual backend backup proofs. New helper does not send or remove Storage files.
5. Separately revoke Client membership, Staff assignment and Admin assignment. Repeat RLS/list/detail requests with same original JWT: known read link must stop working immediately. This is replay read request after revocation, not upload-token replay test.
6. In finally block ban exact seven known accounts, deactivate their business assignments/memberships and remove only their sessions/refresh tokens, even when test stops earlier. Repeat retirement after refresh denial probe. Final snapshot must confirm zero test privileges/sessions, one unchanged owner Super Admin, preserved existing files/tickets/projects/organizations/requests and unchanged functions/policies. Failed cleanup confirmation means FAIL and request for review.

## Actual local preparation verification

- 18/18 guard tests PASS: foreign/owner identity, duplicates/missing identities, other namespace/checkpoint, wrong parent/uploader/bucket/path/hash, extra/missing/uploading file and mismatched version evidence rejected. Cleanup also requires reviewed exact identity set.
- Node/PowerShell syntax PASS; actual helper rejects missing private inputs before network. Read-only read of existing local database was correctly rejected as hosted meta, without hosted contact.
- On NEW network=none copy of actual archive: **142/142 SQL checks PASS**, seven roles/all eight metadata files, wrong-parent denial, forbidden service-only attestation/cleanup, changes and repeated revocation of test privileges. Atomic setup rejected intentionally changed file snapshot and left original files unchanged; active setup replay rejected.
- All original file/Storage/bucket/ticket/project/org/request digest values, functions/policies and owner preserved. Copied Auth ban status simulated with SQL only in isolated container; actual Auth/API/Storage was not tested by this probe.
- Temporary container was verified removed; independent Docker review confirms absence. Original private archive unchanged; live databases were not changed.

Private proofs are hosted-file-access-helper-preparation.json, hosted-file-access-isolated-rehearsal.json, hosted-file-access-local-guard.json and hosted-file-access-missing-input-guard.json in `.tools/verification/phase7`. Actual hosted attempt uses separate timestamp result and separate file-access checkpoint; earlier role/backup proofs are not overwritten.

## Private user input

```powershell
& 'E:\portfolio\secure-desk\.tools\check-hosted-file-access.ps1'
```

Enter saved Supabase DATABASE password and existing backend sb_secret key saved in Vercel, each through hidden local prompt. No new approvals needed for already approved test; these values are not available to the agent. Application password is not entered here. Send only status in conversation, without credentials. Script does not store passwords, backend key or JWT/refresh tokens; random test passwords remain only in process (Auth retains their hashes). Wrapper restores earlier process environment values and releases SecureString/BSTR.

## Boundaries

This test is reviewed Auth/Data API file-metadata/parent/revocation matrix and real direct Storage denial for known CSV. It does not confirm Vercel application HTTPS cookie/header/browser flow for all roles, positive browser download after regrant, proposal attachments, content server-bypass or upload-token replay. Those remain separate remaining checks. Previously reported download after logout remains recorded with unconfirmed cause; later direct fresh account/CSV requests were rejected, without code change.

Everything is in private `.tools/` and local documentation. No new application migration, deploy change, weakening Vercel protection or Markdown on GitHub.

## Actual hosted file-access result — October 10, 15:47–15:48 UTC

**244 PASS / 0 FAIL** in actual securedesk-dev Auth/Data API/Storage attempt. Seven fictional accounts logged in with actual Auth passwords; all eight existing file metadata rows/list/detail RPCs were available to Client A, assigned Staff owner and Admin A. Pending, peer Client, Client B and unassigned Staff had zero rows/denied metadata. Anonymous access and changed company/ticket/file IDs were rejected.

Direct private Storage GET of known CSV rejected for anonymous and all seven user sessions; user signed download URL, injected completion/cleanup and direct attachment update/delete failed. These are actual API results; positive file bytes have separate owner download/backup proofs.

Client membership, Staff assignment and Admin assignment were separately revoked. Same original JWT immediately lost attachment SELECT/list/detail access, including repeated request for known attachment. Final revocation: all seven accounts banned; zero active profiles/memberships/assignments/sessions/refresh tokens; old JWT read and refresh rejected. One existing owner Super Admin and Approved request remained unchanged.

All original attachments, storage.objects/buckets, tickets, projects, organizations and registration_requests rows preserved before/after probe; functions/policies not changed. Earlier membership history retained, new test episodes ended. No new Storage upload/delete, company/project/ticket or assignment to real person.

Independent review verified all 244 individual statuses, seven expected role rows, same-JWT revocation and final retirement proofs, exact eight-file set, hashes of reviewed helpers and new private pre-test dump archive: **881.362 bytes, SHA-256 ae5f3f8e6684cc3b7db3afd4e610ee06445ca54bdf90cca08d1a652fa27b5d3b**. That new archive was not separately restored; earlier database + eight-file isolated restore remains dated PASS. Credentials not saved. Private proofs: hosted-file-access-2026-10-10T15-48-27-614Z.json, hosted-file-access-checkpoint.json and hosted-file-access-result-review.json.

Reviewed hosted metadata/parent/direct-Storage-denial/current-revocation whole is complete. Vercel application HTTPS cookies/header/browser flow, content server-bypass, upload-capability replay, proposal access and controlled maintenance/schedule outcomes remain separate. Previously reported download after logout has unconfirmed cause; later manual direct denials and this API result do not erase its history. **Gate 7 remains open.** Application code/deployment were not changed; Markdown remains local.
