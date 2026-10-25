# Remaining actual Vercel daily call

**October 25, 2026 — complete:** [actual Vercel cron GET 200](PHASE7_VERCEL_DAILY_COMPLETION.md), `vercel-cron/1.0`, 09:45:49.11 GMT+1. No new window for repeated check or need for Run. [Closed demo acceptance](PHASE7_CLOSED_DEMO_ACCEPTANCE.md) is complete. All below old dates/descriptions of open J01 are history.

**Active schedule October 24:** approved change [deployed and confirmed](PHASE7_VERCEL_0900_COMPLETION.md). Now applies `30 8 * * *`, one enabled daily job. For October 25 authoritative is [new instructions 09:00–10:00 CET](PHASE7_VERCEL_LAST_CHECK.md). Previous 04:45/05:05 times and “not applied” status below are history before approved shift. No new manual Run or proof of actual scheduled call; J01 was open.

**Current next step:** [final 205 preservation confirmed](PHASE7_FINAL205_READONLY_COMPLETION.md). For availability around 09:00 [proposal to shift to 09:00–09:59 CET hour](PHASE7_VERCEL_0900_PROPOSAL.md) prepared. Proposal not approved or applied; local `vercel.json` and hosted deployment not changed. Below old morning window remains technical description of then-unchanged schedule.

**User availability:** October 25 around 09:00; computer off overnight. Below 04:45/05:05 times describe technical window of existing schedule, not agreed user steps. Later review at 09:00 may miss Hobby retention. Local overnight logging not feasible; schedule change/new deploy not yet approved or applied.

October 24, 2026. This is observation plan, not execution proof and not new automation. Existing `vercel.json` remains `30 3 * * *`, path `/api/maintenance/attachments`. Manual Run not used as scheduled proof.

Nominal next time is **October 25 03:30 UTC = 04:30 Europe/Budapest (CET)**. Clock goes back that night, so local time one hour earlier than October 24. Vercel for Hobby documents possible execution anytime within stated UTC hour; for observation October 25 that means approximately 04:00–04:59 CET. That is not promise of exact minute. [Cron precision](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Hobby runtime logs kept one hour. Two brief looks, around **04:45 and 05:05 CET October 25**, together cover stated hour if retention and Hobby plan unchanged. Alternatively Live view may stay open during that hour. No alarm, scheduler, new job, plan change or schedule created. [Retention](https://vercel.com/docs/logs/runtime).

1. In Vercel project SecureDesk open Settings → Cron Jobs → View Logs for stated path. Do not press Run.
2. Keep Production and exact path. Record time/time zone, status and available label that call comes from scheduler. Do not send keys, Cookies, Authorization, HAR or raw headers.
3. If call source absent in view, write that source not displayed. 200 alone or View Logs click alone does not prove scheduler. Empty list after retention expiry does not prove job did not run.

Official documentation also states cron does not follow redirects, and redirect/cached response may be omitted from function logs. Therefore empty view requires review of Vercel cron/protection state, without PASS/FAIL conclusion from emptiness alone. Disabling existing protection for log not approved.

J01 remained open until actual scheduled caller proof. Genuine Supabase pg_cron and earlier SQL auto-close audit are not substitute for this Vercel job.
