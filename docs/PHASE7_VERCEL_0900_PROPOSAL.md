# Vercel schedule proposal for review around 09:00

**Applied and confirmed October 24 at 11:51:47:** [new production version and daily schedule are active](PHASE7_VERCEL_0900_COMPLETION.md). User explicitly approved change; both temporary CLI sessions logged out and folders removed. Proposal text below preserves history. Actual scheduled call not yet proven; [latest user instructions](PHASE7_VERCEL_LAST_CHECK.md) apply for October 25 09:00–10:00 CET.

October 24, 2026. This is a concrete, still **unapplied proposal**. User available October 25 around 09:00 Europe/Budapest, computer will be off overnight. Final [205 read-only preservation](PHASE7_FINAL205_READONLY_COMPLETION.md) now confirmed; Vercel daily caller remains last runtime piece.

Proposed change is only one schedule value in `vercel.json`:

```diff
-      "schedule": "30 3 * * *"
+      "schedule": "30 8 * * *"
```

Same path `/api/maintenance/attachments` remains one daily job. That moves daily maintenance five hours later. In standard time nominal time would be 09:30 local, but Hobby may invoke job anytime in that hour. For October 25 expected documented window would be **09:00–09:59 CET = 08:00–08:59 UTC**. That is not a promise of exact minute. In daylight saving same UTC configuration would correspond to hour 10:00–10:59 local. [Schedule rules and changes](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Change requires new production deployment to take effect. Current schedule is still old 03:30 UTC; local `vercel.json` and hosted schedule not changed. Prepared JSON is private `vercel-0900-proposed-2026-10-24.json`, not active configuration. No new CLI login, token or project API request used and Run not started.

After approved application and separate confirmation of active schedule, user may October 25 around 09:00 open Production → Cron Jobs → View Logs. Live view during 09:00–10:00 or brief looks around 09:45 and 10:05 cover documented hour with usual Hobby retention. Vercel log times per documentation are UTC; record displayed zone and actual time/status. Hobby keeps runtime logs one hour. [View and retention](https://vercel.com/docs/logs/runtime).

For J01 proof of actual scheduled call source and response required. HTTP 200 alone, manual Run or empty view insufficient proof. If UI does not show call origin, record as limitation and review available cron execution evidence. Do not change application protection or send secret headers for this review.

Before application user must confirm wanting this schedule and production deploy of exact change. That confirmation not yet given. This document does not promise tomorrow's job will already use new schedule; applies only after actual application and confirmation of active configuration. No overnight local automation, new daily job, alarm or billing plan change.
