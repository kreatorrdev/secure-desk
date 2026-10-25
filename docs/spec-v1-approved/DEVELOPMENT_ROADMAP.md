# SecureDesk — Development Roadmap (v1.0 APPROVED)

**Basis:** original project plan, 62 concluded business decisions, and five subsequently confirmed alignments from `DECISIONS.md`. UI+backend may be developed in parallel in small vertical features per preference (**decision 30C**), but security checks run before moving to the next feature. No implementation in this documentation phase.

## Phase 0 — joint alignment (COMPLETE)

1. `DECISIONS.md`, `PROJECT_BRIEF.md`, `USER_STORIES.md`, `PERMISSIONS_MATRIX.md`, `DATABASE_SCHEMA.md`, and `THREAT_MODEL.md` are mutually aligned.
2. Five additional business rules were confirmed and embedded in all documents.
3. Remaining technical points T-01–T-03 are delegated to phases where they are implemented and do not block core relations/authz.
4. Documents are marked `v1.0 APPROVED`; future changes must have a recorded reason and new version.

**Gate 0: PASSED.** Specification is approved to begin Phase 1.

## Phase 1 — project skeleton and secure development foundations

- Verify current official Next.js/Supabase recommendations; create Next.js App Router + TypeScript + Tailwind.
- Git/GitHub, ESLint/formatter, `.gitignore`, `.env.example` **without real secrets**, basic folders.
- Supabase development project and migration workflow; minimal read-only connection/configuration test.
- Initial README with purpose, MVP boundaries, and local run instructions.

**Gate 1:** project runs locally, repo has no secrets, initial commit is clean; explained what is public vs privileged key.

## Phase 2 — schema and authentication, no dashboard shortcuts

- Migrations for `profiles`, `organizations`, requests, assignments/memberships, and `General Support`; indexes/constraints from `DATABASE_SCHEMA.md`.
- Registration and email verification; Pending user sees only own status.
- Super Admin seed through secure development setup, without public registration of that role.
- Admin approves/rejects application, creates new organization, activates first Client membership.
- Client at most one active org.; separate staff/admin organization assignments; separate create-project permission.
- First RLS tests for privileges, tenant isolation, and pending status.

**Gate 2:** anonymous/pending/client/staff/org admin/super admin profiles have positive and negative tests, without self-escalation.

## Phase 3 — organizations and projects as first vertical module

- Pages for user status, Pending Requests, org profile, members/staff assignments.
- Shareable org code → membership request → admin approval; transactional organization transfer.
- Active projects, `General Support`, project proposal with attachments, staff reviewer, and admin decision.
- Implement readable empty/loading/error states and English text; dark/light tokens from the start.
- RLS + API tests: Client sees projects only of own org.; Staff sees projects of assigned orgs.; proposal only author/reviewer/admin.

**Gate 3:** client cannot create active project directly; staff without special permission cannot create project; transfer immediately revokes old access.

## Phase 4 — ticket vertical module

- `tickets` + tenant invariant, creation by Client and on behalf of Client (`created_by` vs `client_user_id`).
- Owner, additional staff collaborators, default priority `Medium`, six statuses and strict allowed transitions.
- Client sees only own tickets; Staff only owner/collaborator; OA only organizations they manage.
- Role-based dashboard: Client my tickets + projects; Staff assigned tickets; Admin pending work queues. No separate notification system.
- Comments and 15-minute revisions; proposal and approval of ticket sharing within same org.

**Gate 4:** automated negative IDOR test between A/B and between two Clients in same org.; staff does not see unassigned ticket; audit actor of on-behalf action is correct.

## Phase 5 — private Storage, Resolved/Closed automation, and audit

- Private Storage: images/PDF/TXT/CSV/DOCX, max 10 MB and concrete MIME/content allowlist; upload/download inherit parent permissions.
- Resolved flow with UTC time, client acceptance, 7-day justified request, owner approval, `Closed` final; only Admin has exceptional manual close with reason and audit.
- Periodic idempotent job automatically closes expired Resolved tickets **only when no Pending reopen request**. Logs actor=system, time, and reason.
- Business and security audit; view by tenant scope, Super Admin global, retention default 365 days.

**Gate 5:** test unauthorized attachment, upload validation, 15-min edit, edge around seventh day, pending reopen + concurrent scheduled job, approved/rejected reopen, no logged secrets.

## Phase 6 — hardening, testing, and documentation

- Systematic `SELECT/INSERT/UPDATE/DELETE` RLS tests per table, authz Server Actions/API, session and security headers, rate limiting, XSS/CSRF, IDOR/BOLA, hidden field/mass assignment, dependency scan.
- End-to-end flow for each business role, WCAG basics, mobile/responsive, loading/empty/error and keyboard.
- Write `SECURITY_REPORT.md`: scope, threats, tests, findings, fixes, residual risk; add architecture diagram and migration instructions.

**Gate 6:** all critical/high findings resolved or transparently marked; documented boundaries of demonstration application.

## Phase 7 — demo deployment and portfolio

- Separate demo/production-intended Supabase environment without real clients; Vercel deployment with safe env variables.
- Test accounts / demo data, without publicly listed permanent privileged credentials.
- GitHub README with architecture, features, tech stack, instructions, screenshots, and security notes.
- LinkedIn project + post, Upwork portfolio item, short CV description, and future case study.

**Gate 7:** public demo and repo verified; no secret/private data published; presentation does not promise unproven production security.

## Working method at each step

1. First explain what we build, which prior decisions it depends on, and how it is verified.
2. Write the smallest reasonable database/backend/UI part.
3. Run positive test and at least one relevant negative security test.
4. Record change in migration/code and short decision log; show result.
5. Request review/confirmation before next major unit. Do not add AI, payments, chat, mobile app, or advanced analytics until MVP is stable.

## Estimate and limitations

Original five-week schedule at 10–15 hours per week is a **rough initial estimate**, and with additionally defined codes, transfers, proposals, reopen requests, audit, and security tests it may be optimistic. Do not promise fixed deadlines until implementation level is assessed; progress measure is passing functional and negative tests, not just number of finished screens.

## Next joint micro-step

**Begin Phase 1: project skeleton and secure development foundations.** First verify current official recommendations and versions for Next.js/Supabase, then prepare local Next.js + TypeScript + Tailwind project, Git/GitHub base, `.env.example` without secrets, and Supabase development workflow. Do not start dashboard or business UI before Gate 1 passes.
