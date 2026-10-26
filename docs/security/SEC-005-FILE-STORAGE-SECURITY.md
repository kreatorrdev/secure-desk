# SEC-005 — File Upload, Attachment Authorization & Storage Security

**Project:** SecureDesk  
**Category:** Application Security / File Security / Storage Security  
**Assessment Type:** Developer-Led Security Validation  
**Technology Stack:** Next.js, TypeScript, Supabase Auth, Supabase Storage, PostgreSQL  
**Historical Verification:** Gate 6 — October 2026  
**Recorded Result:** 341 checks / PASS  
**Documentation Status:** Historical 341-check result and current attachment sources reviewed separately; quarantine additions are later than Gate 6.

**Documentation Review:** October 26, 2026 — source, test-definition and saved-result review; no test suites or runtime requests executed.  
**Revision Boundary:** Current HEAD `b623dafabca9fcdea6fd8d582bb3b69c8394c5c6` plus pre-existing uncommitted changes. **Historical Gate 6 verification — exact tested Git revision not established.** See [evidence provenance](SECURITY_EVIDENCE_INDEX.md#3-consolidated-historical-verification-results).

---

## 1. Security Objectives

This assessment documents the security controls tested for private ticket attachments in SecureDesk.

The objectives are to:

- Validate uploaded files before publication.
- Prevent unauthorized access to private attachments.
- Restrict direct access to Supabase Storage.
- Protect attachment access across users and organizations.
- Detect changes to published file content.
- Prevent unauthorized attachment metadata manipulation.
- Apply restrictive download response headers.
- Enforce current permissions when accessing files.
- Validate safe handling of concurrent uploads and failures.
- Preserve relevant audit records.

This assessment describes the behavior observed in selected local tests. It does not constitute independent penetration testing or a guarantee that all malicious file content can be detected.

## 2. Attachment Security Architecture

SecureDesk implements private ticket attachments with application authorization, controlled database operations, storage restrictions, and server-side validation.

The current test source defines two upload workflows; the quarantine transfer adaptation is documented under Phase 7 on October 9, after the Gate 6 run:

1. Native multipart upload through the application.
2. A temporary quarantine transfer workflow using a scoped signed-upload capability.

### 2.1 Native Multipart Upload

The native multipart workflow submits a file to the application's ticket attachment endpoint.

The tested workflow validates the requester, ticket context, form revisions, file metadata, and content before making the attachment available.

### 2.2 Quarantine Transfer Workflow

The transfer workflow separates temporary file upload from final publication.

Its tested stages include:

1. Request a temporary upload reservation.
2. Receive a capability restricted to a quarantine bucket and path.
3. Transfer bytes to temporary storage.
4. Submit a completion request.
5. Validate the stored bytes on the server.
6. Publish the validated attachment.
7. Restrict later downloads through the application's authorization controls.

The current script asserts that bytes awaiting successful validation are not downloadable through the private attachment endpoint. This is a reviewed test definition; the historical 341-check Gate 6 log does not independently establish the later quarantine workflow.

### 2.3 Private Attachment Downloads

Published attachments are served through guarded application routes.

The tested download flow evaluates the current requester's access to the parent ticket and attachment.

It also applies restrictive response headers intended to reduce unwanted browser execution, caching, and content interpretation.

The current GET handler validates route IDs, obtains metadata through the caller's `ticket_attachment` RPC, checks size and SHA-256 after reading private Storage bytes, and repeats the authorization/metadata RPC before streaming. It does not issue a reusable signed download URL. The streaming helper chunks already buffered and verified bytes; it is not evidence of bounded-memory retrieval from Storage.

## 3. Testing Methodology

The assessment uses the historical attachment verification script:

[scripts/check-ticket-attachments-web.mjs](../../scripts/check-ticket-attachments-web.mjs)

The test suite establishes fictional accounts, authenticated sessions, organizations, tickets, role assignments, and controlled file fixtures.

It then executes real application HTTP requests and Supabase Auth, RPC, and Storage interactions.

The saved Gate 6 result is:

| Metric | Recorded Result |
|---|---|
| Attachment checks | 341 |
| Suite result | PASS |
| Environment | Local Supabase and application |
| Primary test script | [scripts/check-ticket-attachments-web.mjs](../../scripts/check-ticket-attachments-web.mjs) |
| Result log | `.tools/verification/gate6/attachments.log` |

The count represents individual assertions executed by the script, not 341 distinct attack techniques.

### 3.1 Historical Result vs. Current Test Definitions

`attachments-result.json` dates the saved 341-check PASS to **2026-10-08T19:56:21.909Z**. Its aggregate log and role summary do not list every assertion. The current `check-ticket-attachments-web.mjs` differs from the Phase 6 source fingerprint; [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) explicitly dates quarantine transfer to the October 9 Phase 7 adaptation.

Sections below preserve the useful current test scenarios and implementation review. They are **source-defined expectations**, with historical aggregate support for the earlier attachment suite, not a claim that all current assertions ran as part of those 341 checks. In particular, the quarantine capability, replay and transferred-byte publication assertions cannot be attributed to the October 8 count. No fixture tests, HTTP requests, database changes or Storage operations were executed during this audit.

## 4. SEC-005-A — File Type & Content Validation

### Objective

Verify that accepted uploads satisfy the expected size, structure, and content requirements.

### Tested File Formats

The reviewed test suite includes successful upload and byte-round-trip checks for:

- TXT
- CSV
- PNG
- JPEG
- WebP
- PDF
- DOCX

The test also checks handling of Unicode filenames.

[lib/attachments/validation.ts](../../lib/attachments/validation.ts) requires an allowed extension and an exact matching MIME type, validates filename/size, and inspects bytes. Checks include PNG chunks/CRC, JPEG/WebP structure, selected PDF markers and forbidden action names, DOCX archive/part restrictions with decompression bounds, and UTF-8/control-character rules for TXT/CSV. These are targeted structural checks, not complete parsers, safe-rendering guarantees or antivirus analysis.

### Negative Test Cases

The reviewed script includes intentionally invalid files:

- Empty files.
- Oversized files.
- A fake PDF containing script-like text.
- A PNG with invalid content.
- A mismatch between declared MIME type and actual bytes.
- Unsupported SVG content.
- Missing file submissions.

### Recorded Results

The local test log reports that the complete suite passed.

The test source asserts that invalid native multipart submissions are rejected and do not produce attachment records or published Storage objects in the tested scenario.

The quarantine workflow also rejects a fake PDF during completion and removes the rejected temporary bytes.

### Size Boundary

The test suite verifies acceptance of a file containing exactly **10 MiB (10,485,760 bytes)**.

It also verifies rejection of a file exceeding that limit.

This distinguishes the tested binary size threshold from the decimal unit MB.

### Limitation

File signature and structural validation do not replace malware scanning.

The reviewed evidence does not demonstrate that SecureDesk includes antivirus scanning, comprehensive malicious-document analysis, or protection from every form of dangerous embedded content.

## 5. SEC-005-B — Attachment Authorization & IDOR/BOLA

### Objective

Verify that attachment access is bound to the requester's current permissions and the correct parent organization and ticket.

### Tested Scenarios

The reviewed script tests:

- Anonymous attachment access.
- Pending accounts.
- Users belonging to another organization.
- Peer Clients without approved sharing.
- Unassigned Staff.
- Authorized administrators.
- Ticket owners and collaborators.
- Manipulated organization identifiers.
- Manipulated ticket identifiers.
- Unknown and invalid attachment identifiers.

### Recorded Results

In the tested role matrix, authorized users receive the expected private file while unauthorized users receive an HTTP 404 response.

The source also checks that attachment identifiers cannot be successfully reused with a different organization or ticket path.

### Security Interpretation

These results provide evidence of selected protections against IDOR/BOLA-style access attempts.

They do not establish that every object reference throughout the application has been tested.

## 6. SEC-005-C — Supabase Storage Access Restrictions

### Objective

Prevent ordinary application users from bypassing the guarded attachment routes through direct Storage operations.

### Tested Scenarios

The reviewed script attempts:

- Direct Storage downloads.
- Direct creation of signed download URLs.
- Direct Storage uploads.
- Unauthorized access to temporary quarantine objects.
- Use of a signed-upload token with an unexpected path.
- Unauthorized overwriting through a signed-upload capability.

### Recorded Results

The current script asserts denial of the selected ordinary-user direct Storage operations. The saved Gate 6 suite reports aggregate PASS; it does not give a separate result for every current Storage assertion.

The quarantine workflow demonstrates that a signed-upload capability is restricted to its assigned temporary path.

The test also confirms that a successful quarantine upload does not automatically grant access to published attachments.

Migration `20261008120000_ticket_attachments.sql` declares the private permanent bucket and no application-role Storage policy; migration `20261009120000_attachment_transfer_storage.sql` adds the private quarantine bucket with a 10,485,760-byte limit. Privileged Storage clients remain server-only. These source declarations do not establish the currently deployed provider configuration.

### Important Capability Limitation

A comment in the current script documents a two-hour provider signed-upload token lifetime. The replay assertion reuses a token after publication but does not wait two hours or measure expiry. The claimed duration is therefore a documented provider assumption, not a measured lifetime in the 341-check run.

The current replay test expects the token to recreate only quarantine bytes while the published attachment remains unchanged. It also expects rejection of a request to enable overwrite on the signed path. The application creates the capability with `upsert: false`; a replay after removal can still create a new temporary object.

This is not equivalent to immediate revocation of the temporary token.

## 7. SEC-005-D — File Integrity Verification

### Objective

Prevent the application from delivering stored bytes that no longer match the expected published attachment content.

### Testing Method

The test suite creates a valid attachment and records its expected content.

A privileged local test fixture then deliberately replaces the stored bytes.

The application attempts to download the altered attachment.

### Expected Result

The download must be denied when the stored content fails the expected checksum or length validation.

### Recorded Result

The reviewed test asserts that the tampered attachment returns HTTP 404.

After restoration of the original bytes, the same download succeeds.

The test suite also validates server-derived SHA-256 attachment checksums and byte-preserving downloads.

### Security Interpretation

The tests demonstrate detection of selected content-integrity mismatches.

They do not establish protection against an attacker capable of modifying both stored bytes and trusted metadata, or against every possible storage compromise.

## 8. SEC-005-E — Secure HTTP Downloads

### Objective

Restrict how browsers and intermediaries process private downloaded files.

### Tested Response Protections

The reviewed test suite checks for:

| Protection | Tested Behavior |
|---|---|
| Cache-Control | Includes `no-store` |
| X-Content-Type-Options | `nosniff` |
| Content-Type | `application/octet-stream` for the tested download |
| Content-Disposition | Attachment disposition |
| Content-Security-Policy | `sandbox; default-src 'none'` |

The source also verifies that unauthorized responses retain selected private response headers.

These are real HTTP request assertions in the script, distinct from security-header unit tests. Gate 6 documents rerunning the affected attachment/proposal suites after the CSP conflict. This supports selected historical private-download headers; comprehensive current production header coverage, nonce propagation and browser-level CSP enforcement were not independently established.

### Historical Remediation Context

The Gate 6 report documents an earlier CSP conflict affecting private download responses.

Following remediation, attachment regression testing recorded 341 passing checks.

This issue is also documented in:

[docs/security/SEC-001-CSP-HTTP-HEADERS.md](SEC-001-CSP-HTTP-HEADERS.md)

### Limitation

HTTP security headers help constrain browser behavior but do not replace file validation, authorization, malware detection, or secure client software.

## 9. SEC-005-F — Request Tampering & Upload Validation

### Objective

Prevent clients from manipulating protected file metadata or bypassing server-side request requirements.

### Tested Scenarios

The reviewed script includes:

- Duplicate file fields.
- Duplicate revision fields.
- Invalid revision values.
- Missing authorization revision fields.
- Forged scope revisions.
- Injected uploader identifiers.
- Injected Storage paths.
- Malformed multipart bodies.
- Incorrect or absent Origin headers.
- Oversized request bodies.
- Copied forms used by a different identity.

### Recorded Results

The test source expects invalid requests to be rejected without publishing unauthorized files.

Selected foreign-origin requests are expected to receive HTTP 403.

The suite also checks that outdated form revisions produce a stale-request response.

### Security Interpretation

These tests support selected protections against mass-assignment-style input abuse, parameter tampering, and malformed upload requests.

They do not constitute an exhaustive assessment of every possible request format.

## 10. SEC-005-G — Live Permission Revocation

### Objective

Verify that attachment access depends on current authorization rather than solely on possession of an existing session or an old form.

### Tested Scenarios

The reviewed script includes:

- Peer Client access before and after sharing approval.
- Revocation of an approved peer Client.
- Removal and regranting of a collaborator.
- Reassignment of a ticket owner.
- Revocation and regranting of Organization Admin scope.
- Transfer of a Client to another organization.

### Recorded Results

The historical test source asserts that:

- Pending sharing does not grant file access.
- Approved sharing enables the authorized peer to access the attachment.
- Revoked sharing removes access to both existing files and the peer's own uploaded attachment.
- Removed collaborators lose file access with their existing session.
- Reassigned ticket owners lose access when no longer authorized.
- Revoked administrators lose attachment access.
- Organization transfer removes access to the old company's attachments.
- Previously captured forms remain invalid after relevant permission changes.

### Security Interpretation

These tests demonstrate the importance of reevaluating current business permissions during sensitive file operations.

A valid authenticated session does not independently grant permanent attachment access.

## 11. SEC-005-H — Concurrent Publication & Cleanup

### Objective

Verify that concurrent file completion, cancellation, and failure scenarios preserve consistent attachment state.

### Tested Scenarios

The reviewed script includes:

- Simultaneous completion of the same upload.
- Prevention of duplicate upload audit events.
- Cancellation racing against completion.
- Prevention of destructive cleanup after successful publication.
- Cleanup after a controlled audit-write failure.
- Prevention of publication when parent ticket state changes during a transfer.

### Recorded Results

The test source asserts that simultaneous completion requests refer to a single ready attachment and that only one corresponding audit event is created.

Completion-versus-abort tests check that failed or cancelled reservations cannot later publish unauthorized content.

The controlled audit-failure test checks that failed publication leaves neither an attachment database record nor the corresponding stored bytes for that fixture.

### Limitation

The scenarios demonstrate behavior under the specific concurrency schedules exercised.

They do not prove that every possible race condition or crash-recovery scenario has been tested.

The native upload handler compensates only after the database abort claims an unpublished path. The transfer helper preserves ready rows on retries and attempts quarantine cleanup. Storage/API failure can interrupt compensation; immediate cleanup is not guaranteed for every failure. The later maintenance route and migration define bounded cleanup of aged reservations/orphans (after a 24-hour grace), which depends on successful scheduled execution. That operational behavior was not reverified in this audit.

## 12. Filename Handling & Sensitive Information Protection

The reviewed script tests filenames containing Unicode characters and HTML-like markup.

It verifies that markup-like filenames are escaped when rendered into application HTML.

The script also checks that the application page does not expose:

- The privileged Storage secret key.
- Internal Storage paths.
- Attachment checksums.

These checks provide evidence of selected output encoding and sensitive information handling.

They do not constitute complete XSS or secret-exposure testing of the entire application.

## 13. Test Fixture Integrity

The reviewed script uses fictional local accounts and organizations.

It includes guards to reject unexpected nonlocal application or Docker targets.

The test suite also performs cleanup of temporary elevated permissions, sessions, and selected fixture state.

The source explicitly retains fictional accounts and organizations for local verification purposes rather than claiming complete deletion of all test data.

The historical suite recorded a passing result.

## 14. Evidence References

| Evidence | Source |
|---|---|
| Attachment security test implementation | [scripts/check-ticket-attachments-web.mjs](../../scripts/check-ticket-attachments-web.mjs) |
| Recorded attachment results | `.tools/verification/gate6/attachments.log` |
| Historical result timestamp and role summary | `.tools/verification/gate6/attachments-result.json` |
| Current native upload handler | [app/organizations/[id]/tickets/[ticketId]/attachments/route.ts](../../app/organizations/%5Bid%5D/tickets/%5BticketId%5D/attachments/route.ts) |
| Current guarded download handler | [app/organizations/[id]/tickets/[ticketId]/attachments/[attachmentId]/route.ts](../../app/organizations/%5Bid%5D/tickets/%5BticketId%5D/attachments/%5BattachmentId%5D/route.ts) |
| Current quarantine publication helper | [lib/attachments/transfer.ts](../../lib/attachments/transfer.ts) |
| Private responses and request body bounds | [lib/attachments/http.ts](../../lib/attachments/http.ts) |
| Verified-byte streaming helper | [lib/attachments/stream.ts](../../lib/attachments/stream.ts) |
| Server-only Storage client | [lib/supabase/storage-server.ts](../../lib/supabase/storage-server.ts) |
| Ticket attachment policy/bucket/functions | [supabase/migrations/20261008120000_ticket_attachments.sql](../../supabase/migrations/20261008120000_ticket_attachments.sql) |
| Later quarantine/cleanup definition | [supabase/migrations/20261009120000_attachment_transfer_storage.sql](../../supabase/migrations/20261009120000_attachment_transfer_storage.sql) |
| Later maintenance route | [app/api/maintenance/attachments/route.ts](../../app/api/maintenance/attachments/route.ts) |
| Dated Phase 7 adaptation | [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) |
| File validation implementation | [lib/attachments/validation.ts](../../lib/attachments/validation.ts) |
| Historical regression summary | [docs/GATE6_VERIFICATION.md](../../docs/GATE6_VERIFICATION.md) |
| Existing security report | [docs/SECURITY_REPORT.md](../../docs/SECURITY_REPORT.md) |
| CSP and HTTP headers case | [docs/security/SEC-001-CSP-HTTP-HEADERS.md](SEC-001-CSP-HTTP-HEADERS.md) |
| Authorization and RLS case | [docs/security/SEC-003-ACCESS-CONTROL-RLS.md](SEC-003-ACCESS-CONTROL-RLS.md) |

The current test script, selected route/helper/validator/migration sources and historical aggregate result have been reviewed; source version differences are explicitly retained.

Not every underlying application route, validator, database function, or Storage policy implementation has yet been independently examined.

## 15. Residual Risks & Limitations

The following limitations remain relevant:

- The 341 passing checks represent historical local verification, not deployment certification.
- No antivirus, malware-scanning service, DLP or content-disarm integration is present in the reviewed upload/validation path.
- Supported file formats may still contain dangerous content that passes structural validation.
- Temporary signed-upload capabilities remain usable within their validity and scope.
- Authorization is supported by selected negative tests but has not been exhaustively proven for all possible access paths.
- Integrity verification depends on protecting both stored content and trusted metadata.
- The reviewed tests do not establish protection against every denial-of-service, decompression, or resource-exhaustion scenario.
- Production Storage configuration and deployment-specific infrastructure require separate validation.
- Some test fixtures are intentionally retained locally.
- No independent penetration-test certification is claimed.

## 16. Lessons Learned

**A file upload is a security-sensitive workflow.** Validation must include file contents, metadata, authorization, and publication state.

**File access must be checked at download time.** Authorization can change after a file was originally uploaded.

**Storage access and application access are different security boundaries.** Private Storage policies should complement application authorization.

**Checksums provide useful integrity signals.** They detect selected unexpected content changes but do not replace secure metadata management.

**Temporary upload permissions require strict scoping.** A capability should not grant unrelated read, write, or overwrite privileges.

**Concurrent workflows need safe cleanup.** Publication, cancellation, and audit failures must not leave inconsistent or unintentionally accessible artifacts.

**Passing tests have boundaries.** Clear reporting distinguishes demonstrated control behavior from untested attack scenarios.

## 17. Conclusion

SecureDesk's historical Gate 6 verification recorded **341 passing attachment Auth/API/Storage/HTTP checks**.

The current test implementation defines authenticated workflows, file validation, Storage restrictions, object authorization, integrity checks, permission revocation, download headers and concurrency scenarios. Its later quarantine-transfer assertions are documented separately from the historical Gate 6 341-check result.

These results document practical application security validation and defensive engineering for private file handling in a multi-user SaaS system.

**Final status:** Documentation audit complete for the stated scope. The historical 341-check result is preserved; current source controls and later quarantine expectations are distinguished. Production validation and comprehensive malicious-content assessment remain outside scope.
