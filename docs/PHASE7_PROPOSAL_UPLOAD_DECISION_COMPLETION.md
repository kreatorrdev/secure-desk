# P07 — decisions during upload: completed SQL verification

17 October 2026, 23:19:58–23:20:07 Europe/Budapest. The actual hosted procedure passed. Review of the saved result confirms the exact previously tested SQL, all 276 preparation signatures, and the same final snapshot. This procedure is not repeated.

| Case | Actual result |
| --- | --- |
| Two valid pending upload reservations | Both block approve and reject: four PT409 rejections. Proposals, projects, and audit remain unchanged after rejected decisions. |
| Trusted SQL completion of first reservation | Succeeds; proposal revision becomes 2, then approve succeeds. |
| Expiry of second reservation | Only the new trial reservation gets past time within the transaction. Completion yields 42501 while proposal is still pending; then reject succeeds. |
| Completion | ROLLBACK undoes both proposals, temporary project, six audits, reservations, and temporary rights/role changes. |

Independent final read-only SQL confirms exactly the same **163 rows, all 29 table digests, catalogue, Auth/roles, owner, history, 13 file metadata, and 13 Storage objects**. Seven trial accounts remain retired, with no rights/sessions/refresh tokens. Exact SQL client and two containers from the prior copy again independently confirmed absent.

Actual full 163/13 J03 copy from 22:42:57 was used; its six-hour deadline was not extended. All 10.488.781 saved recovery bytes verified locally. Last actual hosted Storage byte read remains separate J03 source at 22:44. New SQL evidence does not claim repeated cloud byte read, physical upload, browser/native HTTP decision, or actual fifteen-minute wait.

Temporary eligibility and Admin role apply only to exact fictional accounts within the same uncommitted transaction. No external Auth activation, login, email, physical upload, or permanent rows. Password not saved.

Private source: proposal-upload-decision-current-2026-10-17T21-19-48-617Z.json. Review: proposal-upload-decision-completion-review-2026-10-17.json. New canonical reference: reviewed-current-proposal-upload-decisions-retired-reference-2026-10-17.json. Manifest proposal-upload-decision-completion-source-pins-2026-10-17.json has **281 signatures**, previous 276 unchanged.

P07 SQL business/expiry sub-scope is complete. [Remaining obligations](PHASE7_USER_REMAINING_CHECKS.md) have separate statuses; Gate 7 is not yet complete. Application, deployment, approved specification, and schedule were not changed; no push.
