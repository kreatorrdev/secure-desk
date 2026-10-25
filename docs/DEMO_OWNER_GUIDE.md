# SecureDesk — brief guide for the closed-demo owner

25 October 2026. Guide for the existing MVP, after [closed demo acceptance completion](PHASE7_CLOSED_DEMO_ACCEPTANCE.md). Planned runtime checks are complete; this description supports independent use and is not a new mandatory test or a requirement to activate trial accounts. When you start using the app is the owner’s choice. Public demo/repo and portfolio posts remain deferred until you request them separately.

For a shorter start, see [project handover](PROJECT_HANDOVER.md): four roles, a screen map, and one explained ticket flow.

## Sign-in and navigation

Open the production URL https://secure-desk-eta.vercel.app. Vercel outer protection and SecureDesk sign-in are two separate gates. Enter the application password only in the SecureDesk form. The Supabase DATABASE password and backend keys are not for this screen.

On Your account, check Active / Approved. Your account has Super Admin management of the closed demo. Pending Requests is for reviewing access requests; Manage Access for roles and company assignments; Your organizations for companies; Audit history for authorized history; Your dashboard for your working overview. Broad owner-account rights do not represent Client/Staff account rights.

## Registration and companies

A new user first confirms email and waits for an administrator decision. Request access is not automatic approval. An organization code routes the request to the matching company and does not grant membership on its own. Assign only to users you actually intend; trial walkthrough actions use fictional accounts.

For Client, active membership matters; for Staff, company and concrete business assignment; for Admin, current company scope. Super Admin sees a wider administrative scope. Changing or revoking an assignment changes the next access; a file copy someone already saved stays with whoever saved it.

## Tickets, comments, and attachments

From Your organizations, open a company and Tickets, then a specific ticket. Title/description describe the problem; assigned Staff leads the work. Comments have a separate history of prior versions and a 15-minute author edit window. Sharing with a Client in the same company requires a controlled request/approval.

Private attachments accept JPEG, PNG, WebP, PDF, UTF-8 TXT/CSV, and DOCX, up to exactly 10 MiB. Name and content must match the format. Choose a file and Upload private file; to download, click the ready name. A message about an unacceptable file does not mean you should change its extension. After a stale message, refresh the ticket and choose the file again so current rights/revisions apply.

Staff sets Resolved. The original Client can accept the solution and finally close the ticket or, within seven days, request continuation with a reason for the same problem. Pending continuation prevents automatic closure. Closed is final; regular reopen from Closed does not exist. A responsible Admin may exceptionally close Resolved with a reason and audit.

## Project proposals

Client submits a proposal; an assigned Staff reviewer gives a recommendation; scoped Admin or Super Admin approves/rejects. Approve creates a project in the same company. Review alone does not grant upload rights or final decision rights. Private files follow the specific proposal’s rights.

## Sign-out and maintenance

Sign out ends that session. To verify, use a new visit to account and a new private attachment link request; an old open page or an already downloaded file does not confirm new authorization.

Private maintaining helpers belong to their dated checks and are not needed for normal app opening. A completed maintenance check is not repeated. If a specially prepared maintaining procedure is ever needed, enter its private values only in a reviewed hidden local field, not in chat or the SecureDesk login form. Backup copies and provider log screens remain private evidence.

## Boundaries and next step

The demo is closed and uses fictional data. There is no decision on public opening, domain/custom SMTP purchase, or real clients. File validation is not antivirus; dated tests are not full production security certification.

Closed checks are complete. The next practical scenario is learning at the owner’s choice and does not open a new mandatory test group. After [handover](PROJECT_HANDOVER.md), choose portfolio presentation, guided use, or a separate pilot plan. [More detailed proposal](AFTER_PHASE7_PLAN.md).
