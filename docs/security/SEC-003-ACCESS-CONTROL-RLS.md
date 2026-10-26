# SEC-003 — Access Control, Row Level Security & Tenant Isolation

**Project:** SecureDesk  
**Category:** Application Security / Database Security / Authorization  
**Assessment Type:** Developer-Led Security Validation  
**Technology Stack:** Next.js, TypeScript, Supabase, PostgreSQL, pgTAP  
**Historical Verification:** Gate 6 — October 2026  
**Recorded Result:** PASS  
**Documentation Status:** Selected SQL privileges, row-filter assertions and application tests reviewed; historical execution retained, current deployment not reverified.

**Documentation Review:** October 26, 2026 — source, test-definition and saved-result review; no test suites or runtime requests executed.  
**Revision Boundary:** Current HEAD `b623dafabca9fcdea6fd8d582bb3b69c8394c5c6` plus pre-existing uncommitted changes. **Historical Gate 6 verification — exact tested Git revision not established.** See [evidence provenance](SECURITY_EVIDENCE_INDEX.md#3-consolidated-historical-verification-results).

---

## 1. Security Objectives

This assessment evaluates SecureDesk's authorization architecture and selected controls protecting users, organizations, and application data.

The primary objectives are to:

- Enforce role-based and organization-scoped access.
- Prevent vertical and horizontal privilege escalation.
- Restrict direct database operations.
- Verify Row Level Security (RLS) configuration and selected behaviors.
- Protect data belonging to other organizations.
- Prevent unauthorized changes to roles and assignments.
- Enforce permission revocation during existing sessions.
- Reject replayed or stale authorization requests.
- Protect privileged database functions and internal information.
- Preserve authorization-related audit integrity.

The assessment documents historical test evidence rather than claiming that every possible authorization vulnerability has been eliminated.

## 2. Security Architecture

SecureDesk uses multiple authorization layers.

### 2.1 Application-Level Authorization

The application distinguishes business roles, including:

- Super Admin
- Admin
- Staff
- Client

Permissions depend on the user's stored role, account status, organization assignments, and operation-specific authorization requirements.

A successfully authenticated user is not automatically authorized to access every organizational resource.

### 2.2 Organization-Scoped Permissions

Organizational access is explicitly assigned.

An Admin's company scope and a Staff member's organizational permissions are separate from their global business roles.

The recorded tests verify that Staff access to one company does not automatically grant access to other companies.

Project creation permissions are also assigned separately rather than being automatically inherited from Staff membership.

### 2.3 PostgreSQL Row Level Security

SecureDesk uses PostgreSQL RLS to restrict access to records through database policies.

The Gate 6 verification report records coverage of 22 public business tables.

RLS is complemented by table privileges, column privileges, function execution restrictions, and application-level authorization.

RLS being enabled is not, by itself, proof that every policy is correctly configured. Effective authorization requires verification of permitted and denied operations for relevant identities.

Table privileges decide whether an operation is available; column grants can further restrict selectable fields. RLS then filters eligible rows for permitted operations. Application checks and RPC authorization add separate business boundaries. Neither SQL error `42501` nor a query that merely executes successfully identifies the complete tenant-isolation outcome.

### 2.4 Privileged Database Functions

Selected application operations are implemented through controlled database functions.

The security matrix includes checks of SECURITY DEFINER functions, execution privileges, and configured `search_path` values.

These controls are intended to reduce the risk of unauthorized invocation or unsafe privileged-function behavior.

## 3. Testing Methodology

The historical assessment combined three relevant groups of tests.

| Evidence Group | Recorded Checks | Result |
|---|---:|---|
| Local Access Management | 49 | PASS |
| Web Access Management | 76 | PASS |
| Complete SQL/RLS Regression | 4,177 | PASS |

The SQL/RLS regression included 22 test files.

The Gate 6 report attributes 1,833 additional checks to the new `security_matrix` tests.

The systematic matrix is documented as covering 22 public tables, four direct CRUD operations, and 17 caller states, with additional tenant, column, schema, and privileged-function checks.

These counts describe historical test assertions. They should not be interpreted as the number of discovered vulnerabilities or as independent penetration tests.

The 49 and 76 access checks belong to the historical 4,390 Auth/API/native HTTP total. The 4,177 SQL checks are the separate top-level SQL category; the reported 1,833 matrix checks are included within it. No subset is added again to the 8,618 consolidated total.

### 3.1 Test Environment

Testing used controlled local fixtures, including fictional users, organizations, projects, memberships, assignments, and tickets.

The reviewed SQL script begins a transaction and constructs test identities and records.

The Gate 6 report states that SQL fixtures were rolled back.

### 3.2 Positive and Negative Tests

The assessment included:

- Successful operations performed by authorized users.
- Rejected operations attempted by unauthorized users.
- Direct SQL access attempts.
- Forged role and organization identifiers.
- Concurrent permission changes.
- Permission revocation during active sessions.
- Replayed and outdated authorization forms.
- Database privilege and function-access checks.

## 4. SEC-003-A — Role-Based Access Control

### Objective

Verify that users cannot access privileged functions or obtain elevated business roles without appropriate authorization.

### Test Scenarios

The historical tests include:

- Anonymous requests attempting privileged approval.
- Pending Clients attempting self-approval.
- Staff attempting administrative access.
- Forged Super Admin role values.
- Attempts to modify business permissions through editable Auth metadata.
- Copied administrative forms submitted by unauthorized users.
- Role changes between Staff and Admin.
- Demotion of privileged users to Client.

### Recorded Results

The local and web logs report that the tested unauthorized operations were rejected.

They also record that changing editable Auth metadata did not elevate the user's stored business role.

### Security Interpretation

Business authorization must not rely solely on user-controlled fields, navigation visibility, or client-provided role values.

The recorded scenarios support the tested separation between authenticated identity and stored business permissions.

## 5. SEC-003-B — Tenant Isolation & Organization Scope

### Objective

Verify that an authorized user cannot automatically read or modify another organization's resources.

### Test Scenarios

The historical tests include:

- An Organization Admin attempting to assign Staff to another company.
- Cross-company manipulation of hidden organization identifiers.
- Attempts to view another company's assignment identifiers.
- Staff assigned to two companies with explicitly controlled access.
- Revocation of Staff access to one company while preserving an independent assignment to another.
- Attempts to use foreign user or company identifiers to obtain unauthorized access.

### Recorded Results

The access management logs report that cross-company administrative requests were rejected in the tested scenarios.

They also report that access to multiple companies required explicit assignments and that permissions remained scoped to the relevant organization.

### Security Interpretation

These tests provide evidence of selected application-level tenant isolation and protection against unauthorized object access.

The results are relevant to IDOR/BOLA testing, but do not constitute proof that every application endpoint and database policy is immune to such vulnerabilities.

## 6. SEC-003-C — Immediate Permission Revocation

### Objective

Verify that previously granted permissions cannot continue to authorize operations after revocation.

### Test Scenarios

The historical tests covered:

- Revoking an Admin's organization scope.
- Revoking Staff access to a company.
- Using an existing authenticated session after revocation.
- Replaying forms created before access was revoked.
- Changing a user's global role.
- Restoring a previous role without automatically restoring old organization assignments.

### Recorded Results

The logs report that:

- Existing sessions lost the relevant organization access after revocation.
- A revoked Admin could not perform another company-scoped write.
- A revoked Staff user could no longer access the affected company's projects.
- Previously captured forms could not recreate revoked access.
- Restoring a Staff role did not restore historical organization assignments.

### Security Interpretation

An authenticated session and a currently valid business authorization are distinct concepts.

The tested behavior demonstrates the importance of evaluating current permissions rather than assuming that permissions remain valid throughout a session's lifetime.

These are historical observations from specific local scenarios.

## 7. SEC-003-D — Concurrency, Replay & Assignment Integrity

### Objective

Prevent simultaneous or outdated requests from causing inconsistent authorization states.

### Test Scenarios

The recorded tests included:

- Concurrent privileged approvals.
- Concurrent modifications of assignment permissions.
- Submission of stale assignment revisions.
- Replaying earlier role-change forms.
- Regranting permissions after a Staff/Admin/Staff role cycle.
- Attempting to reuse previously valid assignment forms after revocation.

### Recorded Results

The local and HTTP logs report:

- One successful approval and one stale-response rejection during simultaneous approval.
- One audit event for the concurrent approval.
- Rejection of outdated assignment revisions.
- Rejection of forms from earlier role or permission states.
- Requirement for fresh revisions before permissions could be explicitly regranted.

### Security Interpretation

Version-aware authorization workflows can help prevent stale requests from overwriting newer decisions.

The recorded tests demonstrate this behavior for the exercised workflows, not universal protection against every possible race condition.

## 8. SEC-003-E — PostgreSQL RLS & Direct SQL Permissions

### Objective

Verify that public database tables have RLS enabled and that direct operations are appropriately restricted for selected caller states.

### 8.1 RLS Configuration Checks

The reviewed `security_matrix.test.sql` source contains assertions against PostgreSQL system metadata.

For example:

```sql
select extensions.ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.tickets'::regclass
  ),
  'tickets: RLS enabled'
);
```

Similar checks appear for tables including attachments, profiles, projects, organizations, tickets, ticket comments, assignments, and audit-related records.

These assertions establish whether RLS is enabled on the tested tables.

They do not independently establish the correctness of every RLS policy.

### 8.2 Anonymous Direct Access Checks

The matrix sets the local SQL role to `anon` and defines an anonymous request context.

It then attempts direct CRUD operations against protected tables.

Representative example:

```sql
select extensions.throws_ok(
  'select id from public.attachments limit 1',
  '42501',
  null,
  'anonymous SELECT attachments is closed'
);
```

The expected PostgreSQL error `42501` indicates insufficient privilege.

A passing result shows that the tested query was rejected with the expected error.

This example demonstrates SQL privilege enforcement; it is not, by itself, proof of row filtering by an RLS policy.

### 8.3 Authenticated Caller Checks

The matrix also simulates authenticated PostgreSQL request contexts with fictional JWT subject identifiers.

A representative test uses:

```sql
set local role authenticated;
```

The caller's JWT claims are then configured for the selected fictional identity.

The reviewed block includes:

```sql
select extensions.lives_ok(
  'select id from public.attachments limit 1',
  'fixture-actor-1 SELECT attachments uses RLS'
);
```

The same section expects direct INSERT, UPDATE, and DELETE attempts against selected tables to fail with `42501`.

### Interpretation

`lives_ok` verifies successful execution without an SQL exception.

It does not prove that the resulting row set is correctly restricted.

Tenant isolation requires assertions about returned rows as well as successful execution. The matrix contains concrete row-count assertions, reviewed below; these should not be confused with the preceding `lives_ok` example.

### 8.4 Concrete Row-Filtering Assertions

The fixture creates three organizations with IDs beginning `f9200000-`. Actor 2 is an active Admin assigned to Company 1; Actor 10 has a pending profile. Under `authenticated`, the source asserts:

```sql
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"f9100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select extensions.is(
  (select count(*)::integer from public.organizations
   where id::text like 'f9200000-%'),
  1,'Actor 2 exact seeded company read scope'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"f9100000-0000-4000-8000-000000000010","role":"authenticated"}',true);
select extensions.is(
  (select count(*)::integer from public.organizations
   where id::text like 'f9200000-%'),
  0,'Actor 10 exact seeded company read scope'
);
reset role;
```

These assertions test returned-row counts: exactly one seeded organization for Actor 2 and none of the three for Actor 10. The zero-row assertion is concrete negative row-filtering evidence. The one-row assertion does **not** compare the returned organization's ID, so it alone does not prove that the visible row is specifically Company 1. These examples concern seeded organizations, not all rows in all tables.

The reviewed matrix file matches its saved Phase 6 SHA-256. The historical SQL output reports the matrix file `ok` and the full 4,177-check run PASS; this audit did not execute SQL or independently reproduce either assertion.

## 9. SEC-003-F — SECURITY DEFINER & Function Privilege Hardening

### Objective

Verify selected protections around privileged PostgreSQL functions.

### Reviewed Checks

The SQL security matrix includes checks that SECURITY DEFINER functions in the relevant schemas:

- Have a pinned empty `search_path`.
- Do not grant execution to `PUBLIC`.
- Are not executable by `anon` where explicitly restricted.

The matrix also checks selected RPC and internal helper functions for expected execution privileges.

### Security Interpretation

SECURITY DEFINER functions execute with privileges associated with their owner and must be carefully designed.

Restricting function execution and controlling object resolution are important hardening measures.

These checks do not independently prove that every privileged function's internal authorization logic is correct.

## 10. Column-Level Information Protection

The reviewed SQL tests check that the `authenticated` database role lacks direct SELECT privilege on selected internal columns of `ticket_reopen_requests`, including:

- `requester_membership_id`
- `ticket_revision`

This illustrates an additional information-protection layer separate from row filtering.

The recorded checks concern specific columns and do not establish a complete column-level audit of the database.

## 11. Audit Integrity

The application-level access logs include checks confirming that:

- Concurrent approvals create only one audit event.
- Relevant authorization decisions retain their original request content.
- Organization-level administrators do not receive unrelated global role-change metadata.
- Cross-company audit information remains restricted in the tested scenarios.

These checks support the documented integrity and confidentiality of selected authorization audit workflows.

## 12. Evidence References

| Evidence | Project Path |
|---|---|
| SQL security matrix | [supabase/tests/security_matrix.test.sql](../../supabase/tests/security_matrix.test.sql) |
| Saved SQL execution summary (private) | `.tools/verification/phase6/sql-attempt1.log` |
| Source fingerprint manifest (private) | `.tools/verification/phase6/final-source-hashes.json` |
| Local access test implementation | [scripts/check-access-management.mjs](../../scripts/check-access-management.mjs) |
| Native HTTP access test implementation | [scripts/check-access-management-web.mjs](../../scripts/check-access-management-web.mjs) |
| Application identity/role boundary | [lib/organizations/access.ts](../../lib/organizations/access.ts) |
| Local access-management results | `.tools/verification/gate6/access-local.log` |
| HTTP access-management results | `.tools/verification/gate6/access-web.log` |
| Complete verification summary | [docs/GATE6_VERIFICATION.md](../../docs/GATE6_VERIFICATION.md) |
| Existing security assessment | [docs/SECURITY_REPORT.md](../../docs/SECURITY_REPORT.md) |
| Architecture reference | [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) |
| Migration and verification procedures | [docs/MIGRATION_RUNBOOK.md](../../docs/MIGRATION_RUNBOOK.md) |

Selected SQL matrix sections reviewed for this document include fixture roles/assignments, RLS enablement, table/column privileges, privileged-function checks, anonymous CRUD denial, authenticated query execution and explicit seeded-organization row counts.

The full set of 4,177 SQL/RLS checks is supported by the historical Gate 6 report rather than a line-by-line review of every assertion.

## 13. Residual Risks & Limitations

The following limitations apply:

- Historical PASS results do not establish the current security of a deployed system.
- RLS enabled on a table does not guarantee that its policies correctly restrict every row.
- SQL privilege-denial tests and RLS row-filtering tests measure different protections.
- Successful SELECT execution does not prove correct tenant isolation.
- Only selected sections of the SQL matrix have been directly reviewed for this document.
- Application-level tenant-isolation tests do not cover every possible API endpoint or query.
- Privileged functions require internal authorization review beyond execution-grant checks.
- Service-role credentials and privileged database access remain sensitive operational risks.
- Tested concurrency behavior does not eliminate all possible race conditions.
- No independent penetration-test certification is claimed.

## 14. Lessons Learned

**Authentication and authorization are separate controls.** A valid identity does not automatically imply permission to access a business resource.

**Tenant isolation requires layered verification.** Application checks and database policies must be evaluated separately and together.

**SQL privileges and RLS are different mechanisms.** A rejected SQL statement may demonstrate a privilege restriction without exercising an RLS filter.

**Authorization must remain current.** Permission revocation should affect subsequent operations even when a session remains authenticated.

**Concurrency can affect authorization integrity.** Stale or simultaneous requests must not silently overwrite current decisions.

**Privileged functions enlarge the security responsibility.** Database functions executing with elevated privileges need restricted access and carefully validated internal logic.

**Evidence quality matters more than test counts.** Accurate conclusions require traceable source code, recorded test results, and explicit limitations.

## 15. Conclusion

SecureDesk's historical Gate 6 verification reports 4,177 passing SQL/RLS checks across 22 SQL test files.

Separate access-management verification logs report 49 passing local checks and 76 passing HTTP checks.

Together, these records document extensive testing of selected role restrictions, organization-scoped access, permission revocation, stale authorization requests, database privileges, and RLS-related controls.

The reviewed SQL source provides direct examples of RLS configuration, restricted CRUD operations, column/function privileges, simulated authenticated contexts and explicit row-count assertions with stated limits.

This assessment demonstrates practical experience with application authorization, PostgreSQL security testing, access-control regression, and multi-tenant security validation.

**Final status:** Documentation audit complete for the stated scope, including concrete positive/negative row-count examples. Full policy/row-identity coverage and current deployment verification remain unestablished.
