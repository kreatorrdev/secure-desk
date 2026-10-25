# SecureDesk — Project Documentation

Updated: 25 October 2026

## Overview

SecureDesk is a company support portal that connects client requests, team responsibilities, project context and private attachments in one workspace. Clients follow their requests, support staff work within assigned scopes, and administrators manage access and project decisions.

The application is built with Next.js, React, TypeScript, Supabase and PostgreSQL row-level security. Its interface and introductory page use a dark navy and ice-blue visual identity.

## Project links

- [Product introduction](https://secure-desk-eta.vercel.app/)
- [Portfolio case study](https://stackcipher.rollacatfull.chatgpt.site/projects/securedesk/)
- [Interactive walkthrough — no account needed](https://secure-desk-eta.vercel.app/demo)

The product name is SecureDesk. The hosting address and repository folder retain the original `secure-desk` identifier. Historical specifications and verification records retain their original names.

## Access and demo modes

### Interactive walkthrough

The additional `/demo` page is designed for visitors who want to explore the product without creating an account. It contains a fictional company, Northstar Studio, with sample people, tickets and project details.

Visitors can:

1. Open the sample request or create a fictional ticket.
2. Continue as Staff, take ownership and start work.
3. Reply to the conversation and propose a solution.
4. Return to Client, review the solution and close the ticket.
5. Inspect the preserved conversation and event history.
6. Explore Projects and People & access views.
7. Reset the walkthrough to its original sample data.

Demo changes are held in the current page and disappear on reset or reload. The role selector changes the presentation view. It does not sign in as a real user or grant application permissions. The walkthrough does not create accounts, upload files, send messages or write to the live database. Visitors should use fictional details in demo forms.

### Live company workspace

The live workspace uses Supabase authentication, account approval and company membership. Access to tickets, project proposals and attachments is checked on the server and in the database.

**Current hosting status:** the production address, product introduction and fictional walkthrough are publicly accessible without a Vercel account. The project uses Standard Protection; generated deployment URLs remain behind Vercel Authentication. The real company workspace continues to require SecureDesk authentication and the appropriate permissions. This follows Vercel's [production-domain protection model](https://vercel.com/docs/deployment-protection).

## Roles and responsibilities

| Role | Responsibility |
| --- | --- |
| Client | Follow permitted company projects, create support requests, view own and explicitly shared tickets, and review proposed solutions. |
| Staff | Work within assigned company and ticket scopes, reply to requests and propose solutions. |
| Organization Admin | Manage people, access and project decisions within assigned companies. |
| SuperAdmin | Manage global administration and delegated administrative access. |

Company assignment and access to an individual ticket are separate decisions. Pending or rejected registration does not grant company access. The responsible Staff member on a ticket is distinct from the owner of the application.

## Support workflow

The live ticket lifecycle includes Open, Assigned, In Progress, Waiting for Client, Resolved and Closed.

1. A client opens a request in the relevant company context.
2. A responsible Staff member is assigned.
3. Participants exchange replies and permitted attachments.
4. Staff propose a solution and mark the ticket Resolved.
5. The original client can accept the solution, closing the ticket.
6. A qualifying continuation request can be submitted during the seven-day review window. Pending continuation requests prevent automatic closure.
7. Eligible resolved tickets close automatically after the review window. Closed tickets do not have a normal reopening action.

The interactive walkthrough focuses on the shorter request-to-closure path. It does not reproduce every live business rule, scheduled operation or administrative action.

## Company and project context

Company workspaces group projects, proposals, tickets and relevant people. Project proposals have a separate review and administrative decision process. Comments, status changes and administrative decisions retain their context in the history.

The walkthrough's project and people screens illustrate these relationships using sample content. They are not connected to live company records.

## Private attachments and permissions

The live application validates supported file content and uses private Storage with controlled upload and download paths. Downloads check the current user's access to the relevant company and parent ticket or proposal. Server checks and PostgreSQL row-level security enforce access beyond the visible interface.

The walkthrough includes a fictional checklist preview. It does not accept real file uploads or expose live attachment links.

## Technology

| Technology | Purpose |
| --- | --- |
| Next.js, React, TypeScript | Application pages, interactive UI and server routes |
| Tailwind CSS and custom CSS | Workspace styling and product presentation |
| Supabase Auth | User identity and sessions |
| PostgreSQL and row-level security | Business data and scoped authorization |
| Private Supabase Storage | Controlled attachments |
| Vercel | Hosting and scheduled maintenance |

## Presentation and accessibility

The product introduction uses a photographic laptop with automatically scrolling fictional tickets. The portfolio presents the project in its shared case-study layout, with an actual introduction screenshot and locally hosted Inter and Space Grotesk fonts. Presentation artwork is illustrative; it is not live security monitoring.

The introduction's motion respects the system reduced-motion preference. The walkthrough uses labeled forms, keyboard-operable controls, visible focus styles and status announcements. Its layout adapts to narrow screens.

## Validation and scope

The reviewed private hosted demo covered role and company boundaries, ticket and proposal workflows, private attachment access, scheduled maintenance and isolated backup recovery. These records describe the agreed scope and are not a security certification.

The application and portfolio passed production builds and type checking. The walkthrough's three model tests cover its complete request-to-closure path, role-specific actions, invalid transitions, new tickets and reset behavior. Browser review covered the complete fictional ticket lifecycle, ticket creation, project and people views, and reset.

Nine hosted checks made without cookies or authorization confirmed public access to the introduction, walkthrough, sign-in page and artwork; application-login gates for account and dashboard pages; a generic denial for a private attachment; rejection of an unauthorized maintenance request; and Vercel protection on the generated deployment URL. No real application login or business write was performed by these checks.

Historical specification and verification files are retained. The interactive walkthrough is a presentation feature; it does not replace the authorization checks or test evidence for the live application.

## Repository guide

| Location | Contents |
| --- | --- |
| `app/` | Application routes, including `/demo` |
| `components/securedesk-landing.*` | Product introduction |
| `components/securedesk-demo.*` | Interactive fictional workspace |
| `lib/presentation/demo-model.ts` | In-memory walkthrough data and transitions |
| `lib/presentation/` | Presentation animation helpers |
| `public/securedesk/` | Optimized laptop artwork |
| `docs/` | Project documentation, approved specifications and dated verification records |
| `supabase/` | Database migrations and access-control tests |

## Operations

The existing maintenance schedule is `30 8 * * *`, at 08:30 UTC. Its endpoint requires server-side authorization. Routine application use does not require database passwords or backend keys.

Private environment files, privileged credentials, local verification reports and recovery material remain outside published presentation content. The earlier code-only GitHub mirror has a different historical cron setting; align it with the current schedule before using that mirror for a future deployment.

## Short project description

SecureDesk is a company support portal connecting client requests, scoped team access and private attachments in one auditable workflow. Built with Next.js, React, TypeScript and Supabase, it combines reviewed access, company and project context, ticket collaboration and client confirmation of the solution. A separate interactive walkthrough lets visitors explore the workflow with fictional data and no application account.
