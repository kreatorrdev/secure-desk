# SecureDesk — Project Handover

Updated: 25 October 2026

## What has been delivered

SecureDesk is a company support portal with client requests, scoped staff collaboration, project proposals, private attachments and administrative history. The agreed private demo verification is recorded in [Closed Demo Acceptance](PHASE7_CLOSED_DEMO_ACCEPTANCE.md).

- [Hosted application](https://secure-desk-eta.vercel.app/)
- [Portfolio case study](https://stackcipher.rollacatfull.chatgpt.site/projects/securedesk/)
- [Project documentation and walkthrough guide](SECUREDESK_DOCUMENTATION.md)

The published `/demo` page is an additional route within the same project. It provides an interactive fictional workspace without an account. The product introduction and demo are publicly accessible on the production address.

## Access

A Vercel account is not required to open the production address or the fictional walkthrough. Standard Protection still protects generated deployment URLs. Use the stable production address when sharing the project.

The real workspace requires a verified, approved SecureDesk account and appropriate company permissions. Earlier fictional test accounts were retired after verification. They should not be reused as public demo credentials.

The new walkthrough uses only in-memory fictional data. Its Client, Staff and Admin selector illustrates responsibilities and grants no access to the real workspace.

## Guided walkthrough

1. Open `/demo` and review the sample ticket.
2. Use Continue as Staff, then Assign to me and Start work.
3. Add a fictional reply and propose a solution.
4. Review as Client and accept the solution.
5. Expand Ticket history to see the preserved sequence.
6. Explore Projects and People & access.
7. Use Reset demo and Start over to restore the original sample state.

Demo changes disappear on reload. The checklist is sample text; there are no real uploads or account changes.

## Using the real workspace

After signing in, Your account shows the current access-request status. Approved users can follow the links available to their role, including Your dashboard, Your organizations, account review, access management and audit history.

Client requests move through Open, Assigned, In Progress, Waiting for Client, Resolved and Closed. Staff propose the solution; the original client makes the final acceptance decision. Qualifying continuation requests follow the existing seven-day review rules.

The detailed operational guide remains available in [Demo Owner Guide](DEMO_OWNER_GUIDE.md). It retains its historical wording and verification context.

## Files to retain

The application source is in `E:/portfolio/secure-desk`. Current project documentation is in `docs/SECUREDESK_DOCUMENTATION.md`. Local delivery material is in `E:/portfolio/work/securedesk-delivery`.

Keep private recovery material and verification reports local. Do not include environment files, database credentials, backend keys or private business screenshots in public project material. The dedicated presentation images use fictional content.

## Hosting and maintenance

The application remains on its existing Vercel project and address. The daily maintenance schedule is 08:30 UTC (`30 8 * * *`). The maintenance endpoint has its own server authorization.

The earlier code-only GitHub mirror retains a historical cron setting. Align its configuration before any future deployment from that mirror. Normal browser use does not require VS Code, PowerShell, Docker, database passwords or backend keys.

## Verification records

The Phase 7 records retain their original contents and names. The additional walkthrough is a presentation change, not a reason to repeat the old login, activation, backup or upload procedures. Any new hosted checks should be scoped to the current change and recorded separately.
