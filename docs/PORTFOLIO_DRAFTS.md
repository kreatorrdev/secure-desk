# SecureDesk — portfolio drafts

Updated 10 October 2026; not published or sent. Local implementation is verified and a private, access-protected hosted demo is deployed; remaining hosted role/file/recovery criteria are in progress. Do not attach private owner/contact screenshots. Public links/publication need a separate user decision, and Markdown stays off GitHub. No production certification or customer outcome is claimed.

## LinkedIn project

SecureDesk is a client support portal built with Next.js, TypeScript and Supabase. I developed organization and ticket workflows around explicit database permissions: pending registration, scoped approval, Staff assignments, controlled ticket sharing, private files and audited resolution/reopen decisions.

The project includes PostgreSQL migrations, RLS and negative access tests, an English interface with light/dark themes, and documentation separating local verification from hosted deployment requirements. A private hosted demo is deployed; remaining hosted runtime verification is in progress.

## LinkedIn post

I've been building SecureDesk, a support portal for an IT agency, starting with the database and access rules before the dashboard.

A useful lesson: a user role alone does not establish company access. Membership, Staff assignment, ownership and shared participation require their own checks. I tested direct links and copied forms, including revocation in an existing session.

Deployment preparation brought another lesson: a 10 MiB file exceeds the hosting platform's request limit. The browser now transfers it to private quarantine; the server validates content and current permissions before publishing an immutable attachment.

The local implementation covers registration approval, proposals, tickets, private files, reopen decisions, scheduled closure and scoped audit. The latest schema regression passes 4,204 assertions; affected attachment workflows pass 789 real Auth/API/Storage/HTTP assertions.

Actual hosted owner email confirmation, closed deployment, schema checks, scheduled database job execution and isolated database backup/restore have passed within their recorded scope. Hosted multi-role/file/recovery checks remain in progress; public access is deferred. The security report documents these boundaries and a remaining development dependency advisory.

## Upwork portfolio

**Title:** SecureDesk — client support portal with scoped access and private files

**Role:** Full-stack development and access-control verification

Built a Next.js/Supabase portal with email-confirmed pending registration, administrative approval, organization assignments, proposals, ticket ownership/sharing and private attachments. Implemented PostgreSQL migrations, RLS, transactional business functions and audit history. Added real Auth/API/HTTP tests for cross-company access, peer isolation, stale forms and permission revocation. Prepared large-file transfer and guarded streaming for Vercel.

**Skills:** Next.js, TypeScript, React, Tailwind CSS, PostgreSQL, Supabase, RLS, API authorization and integration testing.

**Evidence:** Local gate reports and security documentation; actual closed deployment/owner email/database recovery evidence, with remaining hosted role/file verification in progress.

## CV

Built SecureDesk, a Next.js/TypeScript support portal with Supabase Auth, PostgreSQL RLS, private attachments and audited business workflows. Verified tenant and parent authorization using SQL and real Auth/API/HTTP tests; documented deployment boundaries and residual risks.

## Case study outline

Problem and scope; role/membership/assignment model; transactional decisions; private file boundaries; negative access tests; hosted evidence once completed; limits and lessons.
