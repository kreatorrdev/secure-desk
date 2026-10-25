# Last Vercel daily call — confirmed

October 25, 2026. **J01 confirmed in observed closed-demo scope.** Two user screenshots show same GET `/api/maintenance/attachments`: Request Logs row has HTTP **200**, and details show **User Agent `vercel-cron/1.0`** and request start **09:45:49.11 GMT+1**. That is 08:45:49.11 UTC, within planned 08:00–08:59 UTC hour for daily schedule `30 8 * * *`.

Displayed host starts with `secure-desk-1ctscvh9s-kreatorrdev.`, matching [previously confirmed active version](PHASE7_VERCEL_0900_COMPLETION.md). Full host value truncated in screenshot; that proof boundary remains saved. Request ID is `6b6dx-1792917949119-010a8e74add4`. Displayed Firewall is Allowed, Middleware has 200. Middleware duration not declared as duration of entire maintenance job.

Vercel documents GET on production path and `vercel-cron/1.0` as User Agent of its cron calls. [Official source, reviewed October 25](https://vercel.com/docs/cron-jobs). Origin accepted by combining actual Vercel display, expected path/time/host prefix, previously confirmed single enabled schedule and user statement that she will not press Run but leave log open. Agent did not send Run or new application request. User clicks not independently recorded and cryptographic scheduler confirmation not claimed; User Agent alone is not universal protection against spoofing.

Request Details explicitly shows GMT+1. Therefore this observed zone used instead of assumption from general documentation about UTC logs. Earlier Runtime Logs view without messages was not proof requests absent; successful row found in Request Logs. Live 30-minute range sufficient for already visible request.

Private proofs are `vercel-daily-2026-10-25/request-row-200.png`, `request-details-cron.png` and `observation.json`. Two original images saved unchanged; 817 signatures cover previous 813 unchanged sources and new record/images/instrument. Raw secret headers or credentials not stored.

Observed HTTP 200 is call result. Response body, count of removed files and lower function panel not read; specific count of processed objects or new SQL preservation after job not claimed. Last separate SQL 205/15/retired privileges/zero sessions proof remains October 24 11:33:21 Europe/Budapest. No new copy, hosted byte read, login, activation, migration, deployment or schedule change during today's review.

Last planned runtime verification complete. Log may be closed; manual Run or earlier successful business flows not repeated. [Final closed-demo record](PHASE7_CLOSED_DEMO_ACCEPTANCE.md) distinguishes this completion from deferred public roadmap scope.
