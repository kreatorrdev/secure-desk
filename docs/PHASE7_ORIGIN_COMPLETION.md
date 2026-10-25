# Origin protection — actual verification complete

October 24, 2026, **10:53:07–10:53:18 Europe/Budapest**. After explicit user approval of temporary Vercel login, new test key and its revocation, actual verification of four existing SecureDesk paths executed. This closes F05/P06 Origin sub-scope within stated boundaries. Completed test not repeated.

| Actual requests | Result |
| --- | --- |
| Ticket native and transfer; proposal native and transfer: foreign Origin | Four application 403, exactly expected generic body. |
| Same four paths: literal null Origin | Four application 403, same expected body. |
| Same four paths: fully absent Origin header | Four application 403, same expected body. |
| Same four paths: correct Origin, without SecureDesk session | Four application 404, exactly expected generic denial. |
| All 16 responses | private/no-store/nosniff, no redirect or download disposition. |

Instrument verified Origin in its actual Node request object and absence of application Cookie/Authorization headers. **Did not independently capture headers received on server.** Requests sent direct TLS to exact SecureDesk host, without redirect follow or retry. No Vercel login page declared application denial. No file, prepare/complete intent, Storage requests or new SecureDesk login. Business writes not expected per reviewed guards; new SQL postcheck not executed by this.

Vercel hostname API confirmed project SecureDesk and its team. Six API requests covered resolution, protection read, generation of dedicated key, verification, revoke and final read. New key confirmed absent; original key set and reviewed protection settings remained equal. Previous keys not used or revoked. New key value and API responses not saved. Temporary Vercel CLI session logged out, and its separate auth folder removed. CLI temporarily stored its own OAuth auth in that folder during run; existing user CLI configuration not read.

## Saved previous interruptions

First attempt stopped at project resolution: one API check, no key generation or application request. Second successfully resolved project, but stopped at generation request: zero application requests, finally confirmed original key set and protection. Both temporary CLI sessions logged out and folders removed. Original HTTP codes of those interruptions not saved, so their exact code not invented.

In second request preparation error found: preset secret. Official [Vercel SDK Generate model](https://github.com/vercel/sdk/blob/main/docs/models/generate.md) says secret not sent for OAuth2 flow. New r3 revision therefore sends only unique non-secret note; Vercel generates key. Cleanup identifies only new key with that note, including lost generate response. Eight local groups verify those cases and probe boundaries; those are preparation proof, separate from actual 16 responses.

Private actual result is `origin-vercel-oauth-r3-2026-10-24T08-52-15.771Z.json`, with result `ORIGIN_OBSERVED_NEW_ACCESS_RETIRED`. Original two REVIEW_REQUIRED reports remain without rewriting. Previous 760 signatures and 348 files of official CLI 65.2.0 verified before run.

## Remaining

Remain **two main pieces**: [actual scheduled Vercel call](PHASE7_VERCEL_DAILY_NEXT_WINDOW.md) and final preservation/closed-demo acceptance. Last 205/15 SQL and byte proof from October 23 20:21:54, before later owner UI cycle. New 205 full archive and new SQL result not claimed by this test. Gate7 still open. App/spec/deployment/schedule not changed; user maintenance change preserved. No commit/push.
