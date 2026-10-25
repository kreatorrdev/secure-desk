# Service REST boundary for private jobs — actually completed

17 October 2026,22:57:37 Europe/Budapest. User helper has **5 PASS /0 FAIL**, five GET requests and zero POST. Independent review of saved report, target/source hashes, deadline and exact status/code pairs confirms result. This package is not repeated.

| Actual request | Result |
| --- | --- |
| STABLE read-only service metadata control |200; exact reviewed fictional80-byte CSV metadata payload. Key, project and privileged read-only context confirmed first. |
| Public auto-close RPC name |404/PGRST202 |
| Private auto-close schema profile |406/PGRST106 |
| Public audit-retention RPC name |404/PGRST202 |
| Private audit-retention schema profile |406/PGRST106 |

Both worker names checked through public and securedesk_private profiles, with p_batch=0. Public call is not available to caller, and requested private schema is not exposed in REST. Not claimed that private functions do not exist. Invalid-batch response, authentication failure or some other status not accepted as successful denial. STABLE positive control passed before four negative probes.

Only apikey header used, without browser Cookie, login, Bearer session, upload, business batch or direct worker call. No new Docker/backup/SQL step. Credentials and raw provider bodies not saved. Earlier positive auto-close, J03 rollback, J05 purge, ticket/proposal business flows and their copies not repeated.

Latest real database and Storage byte preservation remains **separate J03 review at 22:44:07**:163 rows/29 protected subsets/13 files/10.488.781 bytes and retired-seven/zero sessions. SQL after these GETs not repeated and new SQL postcheck not claimed. Dates and source boundaries remain separate.

Private source: job-api-boundary-result-2026-10-17T20-57-37-640Z.json. Joint review: job-api-boundary-completion-review-2026-10-17.json. Manifest job-api-boundary-completion-source-pins-2026-10-17.json has **266 hashes**, previous 262 unchanged. Last SQL canonical reference not renamed nor re-dated.

Result covers **service-key GET REST sub-scope J06** with earlier real SQL role/context checks. Anonymous/authenticated REST requests, Next application HTTP and genuine Vercel daily caller remain separate. Application, deployment, approved specification, protection and schedule were not changed; no push. Gate7 remains open. [Next P07 procedure](PHASE7_PROPOSAL_UPLOAD_DECISION_PREPARATION.md) verifies decisions during upload reservation in rollback transaction.
