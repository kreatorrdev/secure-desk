# Ticket capability package — actually complete

17 October 2026, 22:18 Europe/Budapest. User procedure has **91 PASS / 0 FAIL**, and independent review of saved reports, full copy, metadata comparisons, and hashes confirms full result. This package is not repeated. Gate 7 remains open.

## Executed flow

New actual full copy **150 rows and eleven files** made and isolated restore/compared before activation. Disk review verifies archive, 1.151 catalogue items, manifest, all 11 saved bytes, and their restore proof. This is new actual pre-trial copy, separate from later final 163 state.

One trial Client login completed four exact generated files, with source/file/control/result nonce verification:

| Step | Actual result | Requirements |
| --- | --- | --- |
| Initial publish and capability boundaries | 43 PASS | 7 GET, 9 application POST, 7 Storage PUT |
| Same session after membership revocation | 10 PASS | 2 GET, 2 application POST |
| New membership, old scope/parent, and new publish | 31 PASS | 8 GET, 5 application POST, 1 Storage PUT |
| Native logout and fresh signed-out denial | 7 PASS | 3 GET, no POST/Storage |

Total is 36 application requests and 8 reported browser Storage requests. Controller’s separate benign quarantine upload and backend backup/preservation reads not included in those browser counts. No claim that browser observed raw wire Origin header.

Initial flow confirms missing-bytes retry, wrong parent/path/bucket, quarantine-only capability and replay/no-upsert, valid publish, completion retry, and unchanged published bytes. Harmless text posing as PNG rejected without publish. After revoking same membership, same session cannot read, complete reservation, or prepare new one.

Old membership separately rejected SQLSTATE 42501 in rollback check **while parent still revision 1**. Only after that proof, controller made separate reservation under new membership and changed priority only on new dedicated ticket, yielding revision 2. Browser confirms neither old membership nor old parent can publish their pending bytes. New reservation under valid scope yields second 73-byte publish; retry does not duplicate and first file stays identical.

## Final state and logout

Business steps completed at 22:13:43–22:15:51, and signed-out browser result at 22:17:40. Read-only SQL at **22:17:58–22:18:04** comes after logout and confirms:

- **163 rows / 29 protected subsets**, preserved originals, owner, prior Staff/Admin decisions, proposals, and history.
- **13 ready files / 13 permanent Storage objects**, total **10.488.781 actually verified bytes**. All 11 prior files identical; two additional have 73 bytes each and expected SHA-256.
- Only one new dedicated fictional ticket, two completed memberships, four marked fixture audits, two publishes, and one upload audit each. New ticket stays Open / High / revision 2; prior six tickets unchanged.
- All seven trial users banned; active profiles/memberships/Staff/Admin rights and all sessions/refresh zero. No uploading or quarantine leftovers.

All three exact containers — backup client, isolated restore, and final SQL client — independently confirmed absent. Last trial password preserved; credential/capability values not saved. No new user, email, application/deployment/specification/security/schedule change, or push.

Private source is ticket-capability-current-2026-10-17T20-10-36-199Z.json; review ticket-capability-completion-review-2026-10-17.json; new canonical reference reviewed-current-ticket-capability-complete-retired-reference-2026-10-17.json. Manifest ticket-capability-completion-source-pins-2026-10-17.json has **233 hashes**, including unchanged prior 223. Original PASS remains saved. New full 163/13 copy not yet executed.

[Next preparation](PHASE7_JOB_EXCEPTIONS_PREPARATION.md) checks two remaining auto-close exceptions in rollback transaction without browser login. Other uncovered file/role/decision, Origin/session/native SSR, genuine Vercel caller, and UI/final acceptance sub-scopes remain per matrix; 91 checks are not claim of entire Phase 7.
