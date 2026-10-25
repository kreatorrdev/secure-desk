# Approved Vercel schedule — deployed and confirmed

**Addendum October 25:** [actual scheduled call confirmed](PHASE7_VERCEL_DAILY_COMPLETION.md): GET 200, `vercel-cron/1.0`, 09:45:49.11 GMT+1. [Closed demo acceptance](PHASE7_CLOSED_DEMO_ACCEPTANCE.md) is complete. Sentences below about “not yet observed” refer to publication date October 24.

October 24, 2026. Deploy and active schedule confirmed at **11:51:47 Europe/Budapest**, and review of saved proofs completed later same day. User had previously explicitly approved schedule change and production deploy.

Active production version is `dpl_GpApVbzHThLneXnMytDogtLQLdCf`, Ready, with assigned existing address [SecureDesk](https://secure-desk-eta.vercel.app). Project API confirms one enabled daily job: `/api/maintenance/attachments`, schedule `30 8 * * *`, host of new version `secure-desk-1ctscvh9s-kreatorrdev.vercel.app`. Schedule is no longer treated as proposal.

All 136 application/config files from saved code-only deployed version and local reviewed Git source match same Git blobs. Only new content change is approved schedule in working `vercel.json`. No functionality, dependency, migration or approved specification change. Build reached Ready; existing production address resolved to exact new deployment.

Project API confirms preserved protection settings, existing bypass keys and build settings. One anonymous GET `/account` returned expected redirect to Vercel protection. That verifies protected availability; does not claim new SecureDesk login or new review of all application screens. No manual Cron Run, SQL or Storage requests in this instrument.

First preparation attempt stopped before sending deployment because it requested code-only commit in separate local documentation repository. That original FAIL is saved. Corrected continuation uses actual code-only copy and compares all 136 blobs. Both temporary Vercel CLI sessions logged out, and both exactly specified auth folders independently confirmed absent. Credential values and raw API/CLI responses not saved in reports.

Private actual proof is `vercel-schedule-deploy-2026-10-24T09-49-36-723Z.json`; review is `vercel-0900-completion-review-2026-10-24.json`, and active reference `reviewed-current-vercel-schedule-2026-10-24.json`. Manifest `vercel-0900-completion-source-pins-2026-10-24.json` freezes 813 signatures, previous 797 unchanged. Direct API GET counter does not include internal network requests of official CLI. Final review did not send new hosted requests.

Last SQL preservation remains October 24 **11:33:21 Europe/Budapest**, 205 rows/15 metadata/objects/stable credentials/retired test privileges/zero all sessions/refresh. This deploy is not new SQL postcheck, new hosted byte read or full 205 copy. Earlier 201 recovery deadline not extended.

Deploy executed via direct CLI flow, without GitHub push or local commit. Code-only GitHub source still contains previous schedule; before future deploy from that source `vercel.json` must be aligned so old schedule does not return. Public repo/publication steps remain previously deferred and are not new user test.

For October 25 after clock change documented Hobby window is **09:00–09:59 CET = 08:00–08:59 UTC**; nominally 09:30 local. That does not guarantee exact minute. In daylight saving same UTC schedule corresponds to hour 10:00–10:59 local. [Vercel rules](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Actual scheduled caller not yet observed on publication date. [Last Vercel check](PHASE7_VERCEL_LAST_CHECK.md) remains only open runtime piece; then final alignment of [acceptance record](PHASE7_FINAL_ACCEPTANCE_DRAFT.md). Gate7 not closed on deployment Ready or new schedule alone.
