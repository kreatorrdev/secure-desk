# SEC-004 — API Security, IDOR/BOLA & Mass Assignment

**Project:** SecureDesk  
**Category:** Application Security / API Security / Authorization Testing  
**Assessment Type:** Developer-Led Security Validation  
**Technology Stack:** Next.js, TypeScript, Supabase, PostgreSQL  
**Historical Verification:** Gate 6 — October 2026  
**Recorded Result:** PASS  
**Documentation Status:** Historical counts and selected HTTP/RPC assertions traced to source; current endpoint coverage not reverified.

**Documentation Review:** October 26, 2026 — source, test-definition and saved-result review; no test suites or runtime requests executed.  
**Revision Boundary:** Current HEAD `b623dafabca9fcdea6fd8d582bb3b69c8394c5c6` plus pre-existing uncommitted changes. **Historical Gate 6 verification — exact tested Git revision not established.** See [evidence provenance](SECURITY_EVIDENCE_INDEX.md#3-consolidated-historical-verification-results).

---

## 1. Security Objectives

This assessment documents selected security tests performed against SecureDesk's API, authenticated workflows, and native HTTP form operations.

The assessment focuses on:

- Broken Object Level Authorization (BOLA).
- Insecure Direct Object References (IDOR).
- Cross-tenant resource access.
- Mass assignment and parameter tampering.
- Server-side input validation.
- Authentication and authorization enforcement.
- Replay and stale-request protection.
- Concurrent request integrity.
- Protection against unintended data disclosure.

The objective is to evaluate recorded control behavior in defined test scenarios, not to claim that every possible API vulnerability has been eliminated.

## 2. Application Security Context

SecureDesk is a multi-user application with organization-scoped resources and differentiated business roles.

Relevant resources include:

- Organizations and membership assignments.
- Projects and project proposals.
- Support tickets.
- User profiles and organizational people records.
- Registration and approval requests.
- Organization transfers and access codes.
- Attachments and related records.

The authorization model must consider both the identity of the requester and their current permission to perform an operation on a particular resource.

An authenticated user must not automatically gain access to arbitrary objects merely by knowing or modifying their identifiers.

## 3. Testing Methodology

The historical assessment included native HTTP requests, real authentication sessions, server-side form actions, and selected API/RPC operations.

Recorded tests used fictional accounts and multiple business roles.

Testing included both expected successful operations and intentionally unauthorized requests.

### 3.1 Recorded Test Results

| Test Group | Checks | Recorded Result |
|---|---:|---|
| Native Security | 241 | PASS |
| Projects | 385 | PASS |
| Tickets | 682 | PASS |
| Organizations | 167 | PASS |
| People | 279 | PASS |
| Proposals | 355 | PASS |
| Organization Transfers | 364 | PASS |
| Organization Codes | 218 | PASS |
| **Selected Groups Total** | **2,691** | **PASS** |

These counts represent eight selected historical verification groups.

The Gate 6 verification report records 4,390 Auth/API/native HTTP checks across 19 sets in total. The selected groups above are part of that broader total and must not be counted again as additional independent checks.

Several group logs provide only aggregate PASS counts. The corresponding scripts and selected assertions were inspected during this audit; the totals do not establish that every API endpoint or every assertion in the current script version was exercised historically.

### 3.2 Mapping Results to Test Implementations

| Historical group | Test implementation | Request/evidence type |
|---|---|---|
| Native Security — 241 | [scripts/check-security-web.mjs](../../scripts/check-security-web.mjs) | Local HTTP/HTML headers, native auth/comment actions, session/JWT checks |
| Projects — 385 | [scripts/check-organization-projects-web.mjs](../../scripts/check-organization-projects-web.mjs) | Authenticated RPCs and native project form POSTs |
| Tickets — 682 | [scripts/check-tickets-web.mjs](../../scripts/check-tickets-web.mjs) | Authenticated ticket RPCs, HTTP views and native actions |
| Organizations — 167 | [scripts/check-organizations-web.mjs](../../scripts/check-organizations-web.mjs) | Organization RPC/data and cookie-authenticated HTTP views |
| People — 279 | [scripts/check-organization-people-web.mjs](../../scripts/check-organization-people-web.mjs) | `admin_organization_people` RPC, scoped HTML and RSC responses |
| Proposals — 355 | [scripts/check-organization-proposals-web.mjs](../../scripts/check-organization-proposals-web.mjs) | Proposal RPCs/native actions and attachment HTTP checks |
| Transfers — 364 | [scripts/check-organization-transfers-web.mjs](../../scripts/check-organization-transfers-web.mjs) | Transfer RPCs, native requests/reviews and revocation |
| Organization Codes — 218 | [scripts/check-organization-codes-web.mjs](../../scripts/check-organization-codes-web.mjs) | Access-code RPCs and native code-management forms |

An assertion may combine a response check with an SQL state check; setup, identity and cleanup assertions are also counted. An API/RPC call, a native HTTP action, an assertion and a browser interaction are different units. These Node scripts use HTTP requests/cookie jars; browser JavaScript execution and interactive session behavior require separate evidence.

For example, the project script posts a copied native form with forged role fields and asserts no project was created. It also submits a foreign organization ID and separately checks that unauthorized actors cannot call `create_organization_project` successfully. The access-management script tests a mismatched hidden organization UUID and confirms that a revoked Admin's existing cookie session loses scope. These are concrete selected IDOR/BOLA-style scenarios, not a universal endpoint-coverage claim.

The Native Security, Organizations and People scripts match the saved Phase 6 source hashes. The other five current scripts differ at the byte level; a translation or formatting change can alter a hash without changing behavior, and current source must not automatically be equated with the historical run. The first post-Gate source commit also contains the cited project authorization assertions, but an exact whole tested revision is not established.

## 4. SEC-004-A — Object-Level Authorization (IDOR/BOLA)

### Objective

Determine whether unauthorized users can access or manipulate resources belonging to another account or organization by changing object identifiers.

### Reviewed Scenarios

Detailed historical access-management logs include tests for:

- Tampering with hidden organization UUID values.
- Attempting to select another company's assignment.
- Submitting a copied administrator form.
- Supplying an identifier that does not match the current exact-email lookup.
- Using foreign user parameters to access another identity.
- Attempting actions outside an assigned organization.

### Recorded Results

The reviewed logs report rejection of the tested cross-company and unauthorized object operations.

Organization administrators were not permitted to use the tested workflows to manage assignments outside their authorized company scope.

### Security Interpretation

These results provide evidence of object-level authorization checks in selected application workflows.

They are relevant to IDOR/BOLA testing but do not independently prove complete coverage of every project, ticket, attachment, or RPC endpoint.

### Evidence

- `.tools/verification/gate6/access-local.log`
- `.tools/verification/gate6/access-web.log`
- [docs/GATE6_VERIFICATION.md](../../docs/GATE6_VERIFICATION.md)

## 5. SEC-004-B — Cross-Tenant API Access

### Objective

Verify that organization-specific actions cannot be performed against resources outside the requester's authorized scope.

### Reviewed Scenarios

The historical access tests include:

- Organization Admin attempting to assign Staff to another company.
- Staff membership restricted to explicitly assigned organizations.
- Separate project creation permissions for different company assignments.
- Revocation of access to one organization without automatically removing unrelated assignments.
- Reuse of previously valid forms after organization access was revoked.

### Recorded Results

The logs report that the tested cross-company assignments were rejected.

They also record that Staff could access multiple companies only when explicitly assigned, and that revocation of one assignment did not automatically remove access to a separately authorized company.

### Related Aggregate Evidence

The historical verification includes:

- 167 organization checks.
- 279 organization-people checks.
- 385 project checks.
- 682 ticket checks.

These aggregate counts indicate successful regression execution but do not, by themselves, identify every individual cross-tenant assertion.

### Evidence

- `.tools/verification/gate6/organizations.log`
- `.tools/verification/gate6/people.log`
- `.tools/verification/gate6/projects.log`
- `.tools/verification/gate6/tickets.log`
- `.tools/verification/gate6/access-web.log`

## 6. SEC-004-C — Mass Assignment & Parameter Tampering

### Objective

Verify that unexpected, forged, or duplicated request fields cannot grant unauthorized permissions or alter protected business values.

### Reviewed Scenarios

The historical authentication and access logs include:

- Additional registration fields attempting to promote or approve an account.
- Forged Super Admin role values.
- Injected identity, role, and route fields.
- Duplicate form fields.
- File payloads submitted in place of required text fields.
- Forged assignment permission parameters.
- Hidden identifiers inconsistent with the authorized target.

### Recorded Results

The reviewed logs report that:

- Additional registration fields did not elevate accounts.
- Forged administrative roles were rejected server-side.
- Duplicate sensitive fields were rejected.
- Unauthorized role and route values were ignored or rejected in the tested workflows.
- Forged parameters could not restore previously revoked Staff permissions in the recorded scenario.

### Security Interpretation

A secure server must derive sensitive authorization decisions from trusted state rather than client-submitted role, approval, or organization values.

These tests demonstrate selected protections against parameter tampering and mass-assignment-style abuse.

They do not establish that every input model or request handler uses an explicit allowlist.

### Evidence

- `.tools/verification/gate6/auth-web.log`
- `.tools/verification/gate6/access-web.log`
- `.tools/verification/gate6/registration-retry.log`

## 7. SEC-004-D — Server-Side Input Validation

### Objective

Ensure that invalid or manipulated requests are rejected by the server independently of browser validation.

### Reviewed Scenarios

The recorded tests include:

- Rejection of invalid registration fields.
- Rejection of oversized text inputs.
- Rejection of duplicated fields.
- Rejection of unexpected file payloads.
- Rejection of selected cross-origin form POST requests.
- Prevention of password disclosure through returned validation state.
- Generic authentication failure messages.

### Recorded Results

The historical logs report passing checks for the reviewed scenarios.

In particular, rejected registration validation was recorded as creating no Auth account.

### Limitations

These tests do not establish complete protection against SQL injection, XSS, request forgery, or every malformed input.

Those risks require appropriately scoped tests of the relevant implementation and endpoints.

## 8. SEC-004-E — Request Replay & Concurrency

### Objective

Evaluate whether repeated, simultaneous, or outdated requests can bypass current authorization rules or produce inconsistent business state.

### Reviewed Scenarios

The recorded tests include:

- Two simultaneous privileged approval submissions.
- Two simultaneous registration retry submissions.
- Reusing an old registration retry form.
- Submitting stale assignment revisions.
- Replaying a pre-revocation form.
- Reusing old role-management forms after a role-change cycle.

### Recorded Results

The historical logs report:

- One successful operation and one stale-request rejection during the tested concurrent approval scenario.
- One corresponding audit event.
- Rejection of stale permission revisions.
- Rejection of attempts to recreate access using older forms.
- Preservation of the current authorization state after tested role changes.

### Security Interpretation

These outcomes support the behavior of selected concurrency and replay defenses.

The results do not establish that all possible race conditions have been eliminated.

### Evidence

- `.tools/verification/gate6/access-local.log`
- `.tools/verification/gate6/access-web.log`
- `.tools/verification/gate6/registration-retry.log`

## 9. SEC-004-F — Authentication & Session Enforcement

### Objective

Verify that protected endpoints and workflows enforce authentication and do not accept forged or revoked session state.

### Reviewed Scenarios

Historical web authentication tests include:

- Anonymous access to protected pages.
- Forged authentication cookies.
- Attempted identity selection through query parameters.
- Concurrent sessions belonging to different browsers.
- Logout followed by protected-resource denial.
- Replay of a revoked cookie against the tested application endpoint.

### Recorded Results

The reviewed logs report successful rejection of the tested unauthorized session scenarios.

### Security Interpretation

These findings support selected application-level authentication enforcement.

They do not prove immediate invalidation of all previously issued provider access tokens across every direct Supabase interface.

Additional session-specific limitations are documented in SEC-002.

## 10. SEC-004-G — Data Integrity Verification

### Objective

Evaluate the recorded final verification state and identify whether the regression process reported unexpected changes.

### Historical Result

The saved `integrity.log` records:

- Result: PASS.
- Reported faults: 0.
- Previous row count: 3,514.
- Unchanged rows: 3,513.
- Controlled policy change: true.
- Protected files: 38.

The report also records database object counts, test fixture state, and operational job information.

### Security Interpretation

The integrity verification reported no faults and identified one controlled policy change.

It would therefore be inaccurate to describe the verified state as entirely unchanged.

These results should not be interpreted as proof that no database write occurred or that every record in the environment was immutable.

Detailed operational identifiers and environment-specific information should be reviewed before publication.

### Evidence

- `.tools/verification/gate6/integrity.log`

## 11. Findings Summary

The reviewed historical evidence supports the following observations:

| Security Area | Historical Observation |
|---|---|
| API authorization | Selected unauthorized operations rejected |
| Object access controls | Cross-company and forged-object attempts rejected in reviewed workflows |
| Parameter tampering | Forged role, identity, and permission fields rejected or ignored as expected |
| Input validation | Selected malformed and invalid requests rejected |
| Replay protection | Stale and previously used forms rejected in reviewed scenarios |
| Concurrency | Selected simultaneous requests preserved expected authorization state |
| Authentication enforcement | Forged or revoked application sessions rejected in tested workflows |
| Integrity verification | PASS, zero reported faults, one controlled policy change |

**No confirmed exploitable vulnerability is claimed on the basis of these passing results alone.**

## 12. Evidence Index

| Source | Purpose |
|---|---|
| `.tools/verification/gate6/security-web.log` | Aggregate native security checks |
| `.tools/verification/gate6/projects.log` | Project API/native-form regression |
| `.tools/verification/gate6/tickets.log` | Ticket Auth/API/native regression |
| `.tools/verification/gate6/organizations.log` | Organization API/cookie regression |
| `.tools/verification/gate6/people.log` | Organization people API/cookie regression |
| `.tools/verification/gate6/proposals.log` | Proposal API/native-form/attachment regression |
| `.tools/verification/gate6/transfers.log` | Organization transfer regression |
| `.tools/verification/gate6/codes.log` | Organization code regression |
| `.tools/verification/gate6/access-web.log` | Detailed authorization and parameter-tampering cases |
| `.tools/verification/gate6/auth-web.log` | Detailed authentication and session cases |
| `.tools/verification/gate6/registration-retry.log` | Registration replay and tampering cases |
| `.tools/verification/gate6/integrity.log` | Historical integrity verification |
| [docs/GATE6_VERIFICATION.md](../../docs/GATE6_VERIFICATION.md) | Consolidated historical Gate 6 results |
| [scripts/check-access-management-web.mjs](../../scripts/check-access-management-web.mjs) | Specific copied-form, hidden-ID and revocation assertions |
| [scripts/check-own-registration-retry-web.mjs](../../scripts/check-own-registration-retry-web.mjs) | Specific retry concurrency, identity and replay assertions |
| `.tools/verification/phase6/final-source-hashes.json` | Private historical source fingerprints |
| [docs/SECURITY_REPORT.md](../../docs/SECURITY_REPORT.md) | Existing security assessment and residual risks |

## 13. Assessment Limitations

- Many API-related logs provide only total passing check counts.
- Selected request helpers and security assertions were reviewed; every assertion and application handler has not been audited line by line.
- Successful regression results do not demonstrate complete coverage of all API routes.
- Application-layer authorization tests and database RLS tests provide different forms of evidence.
- IDOR/BOLA testing is documented for selected scenarios, not every possible object reference.
- A PASS result does not imply that an exploitable vulnerability was discovered and remediated.
- Deployment-specific authentication, network, infrastructure, and abuse protections require separate assessment.
- Sensitive fixture and operational information should be excluded from public evidence.
- The historical verification is not an independent penetration-test certification.

## 14. Lessons Learned

**Authorization belongs on the server.** Client interfaces and hidden form controls cannot be trusted as security boundaries.

**Object identifiers are not permissions.** Knowing a resource ID must not automatically grant access to that resource.

**Multi-tenant applications require scoped checks.** Organization assignments and current permissions must be evaluated for every protected operation.

**Unexpected input must not control privileged state.** Roles, approvals, and organization scope must come from trusted authorization sources.

**Concurrency can create security problems.** Stale-request detection and version-aware updates help maintain consistent decisions.

**Security evidence needs context.** Aggregate PASS counts and individual exploit scenarios provide different levels of assurance.

## 15. Conclusion

SecureDesk's historical Gate 6 verification recorded 4,390 passing Auth/API/native HTTP checks across 19 sets.

Eight reviewed API-related groups account for 2,691 of those recorded checks.

Detailed authentication, access-management, and registration logs also provide concrete examples of denied cross-company requests, rejected forged parameters, controlled permission revocation, and stale-request handling.

The reviewed evidence documents practical security testing across API authorization, object-level access controls, input validation, request integrity, and multi-tenant workflows.

**Final status:** Documentation audit complete for the stated scope. Eight aggregate groups are mapped to their scripts and selected assertions; complete endpoint coverage and current deployment security are not claimed.
