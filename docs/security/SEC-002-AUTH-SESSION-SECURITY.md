# SEC-002 — Authentication, Session Security & Registration Protection

**Project:** SecureDesk  
**Category:** Application Security / Identity & Access Management  
**Assessment Type:** Developer-Led Security Validation  
**Technology:** Next.js, TypeScript, Supabase Auth, PostgreSQL  
**Historical Test Period:** October 2026 — Phase 6  
**Recorded Result:** PASS  
**Documentation Status:** Authentication sources and historical results reviewed; current runtime and hosted settings not reverified.

**Documentation Review:** October 26, 2026 — source, test-definition and saved-result review; no test suites or runtime requests executed.  
**Revision Boundary:** Current HEAD `b623dafabca9fcdea6fd8d582bb3b69c8394c5c6` plus pre-existing uncommitted changes. **Historical Gate 6 verification — exact tested Git revision not established.** See [evidence provenance](SECURITY_EVIDENCE_INDEX.md#3-consolidated-historical-verification-results).

---

## 1. Security Objectives

This assessment documents SecureDesk's authentication, session management, registration, and account protection mechanisms.

The primary objectives are to:

- Verify secure registration and email confirmation workflows.
- Prevent unauthorized account activation and privilege escalation.
- Validate authentication cookies and session isolation.
- Examine session refresh and logout behavior.
- Verify server-side validation of authentication inputs.
- Evaluate local authentication attempt-limiting controls.
- Prevent unauthorized registration retries and request manipulation.
- Preserve the integrity of account approval decisions and audit records.

This assessment covers selected implemented controls and does not constitute a comprehensive independent penetration test.

## 2. Authentication Architecture

SecureDesk uses Supabase Auth for identity management and application-level business authorization for determining user permissions.

Newly registered users initially receive a pending business profile.

Email confirmation establishes a verified identity but does not automatically grant access to organizational resources.

Business roles, approval states, and organizational permissions are enforced separately from user-controlled authentication metadata.

### 2.1 Identity vs. Authorization

Authentication determines who the user is.

Authorization determines which resources and actions that user may access.

SecureDesk separates these responsibilities to prevent a valid authenticated session from automatically granting business privileges.

### 2.2 Registration Approval

The registration workflow includes:

1. User registration with required information.
2. Server-side input validation.
3. Creation of a `client` / `pending` profile and an unrouted first request in the Auth signup transaction.
4. Email confirmation.
5. Administrative review of the registration request.
6. Activation or rejection according to the implemented approval workflow.

Successful email verification alone does not authorize the user to access protected organizational data.

The signup trigger in [supabase/migrations/20261005202205_auth_registration_bridge.sql](../../supabase/migrations/20261005202205_auth_registration_bridge.sql) writes trusted role/status values rather than accepting them from Auth metadata. `organizationAccess` verifies the user and calls `current_account_role`, whose database definition requires an active, confirmed, non-anonymous account. Approval and organization membership/assignments remain separate decisions.

## 3. Testing Methodology

Historical Phase 6 testing combined local authentication workflows, native HTTP/browser interactions, and registration retry security checks.

The tests used fictional accounts, authenticated and unauthenticated sessions, intentionally invalid requests, and controlled authorization scenarios.

Both positive and negative test cases were included.

The web scripts use Node HTTP requests and separate cookie jars to simulate browser sessions and submit native form actions. Their session-isolation assertions are not evidence of a complete interactive-browser security assessment.

### 3.1 Recorded Test Summary

| Test Group | Recorded Checks | Result |
|---|---:|---|
| Local Authentication | 25 | PASS |
| Web Authentication | 38 | PASS |
| Registration Retry | 44 | PASS |
| **Total** | **107** | **PASS** |

These counts represent recorded checks in three test groups, not distinct vulnerabilities or independent penetration tests.

The separate security controls unit-test suite also contains relevant rate-limiting and input-validation checks, documented in SEC-001.

The 107 checks are a subset of the 4,390 historical Auth/API/native HTTP total. `auth-local.log`, `auth-web.log` and `registration-retry.log` contain 25, 38 and 44 individual PASS lines respectively. Current `check-auth-web.mjs` has later callback tests and does not match its Phase 6 source hash; the 38 count belongs to the saved run, not every assertion in today's script.

## 4. SEC-002-A — Registration & Email Confirmation Security

### Objective

Verify that registration and email confirmation cannot bypass required account approval or validation controls.

### Test Scenarios

The historical local and web authentication checks covered:

- Rejection of weak passwords.
- Rejection of incomplete registration information.
- Prevention of account creation after failed validation.
- Prevention of authenticated sessions before email confirmation.
- Rejection of invalid email confirmation tokens.
- Prevention of token consumption through ordinary email-link previews.
- Successful confirmation using a valid local test token.
- Continued restriction of confirmed but unapproved users.
- Ignoring injected business-role or approval metadata.

### Expected Results

Invalid registrations must not create usable accounts or bypass validation.

Unconfirmed users must not obtain an authenticated session through the tested registration workflow.

Confirmed but pending users must not gain unauthorized organizational access.

### Recorded Results

All 25 local authentication checks and all 38 web authentication checks were recorded as passing.

The reviewed logs report that weak credentials and invalid registration data were rejected, email confirmation was required, and unapproved users remained restricted.

### Evidence

- `.tools/verification/gate6/auth-local.log`
- `.tools/verification/gate6/auth-web.log`
- [docs/GATE6_VERIFICATION.md](../../docs/GATE6_VERIFICATION.md)

### Limitation

These results apply to the documented local test configuration and selected scenarios. They do not establish that all hosted authentication-provider settings are correctly configured.

## 5. SEC-002-B — Session Lifecycle & Browser Isolation

### Objective

Evaluate session creation, cookie handling, refresh behavior, account isolation, and logout enforcement.

### Test Scenarios

The recorded HTTP tests include:

- Creation of an authenticated cookie session after valid confirmation.
- Verification of SameSite=Lax cookies in local development.
- Preservation of authentication after a full page reload.
- Forced refresh by setting the cookie session's stored `expires_at` to `1`, followed by a changed refresh token and a successful identity check.
- Preservation of verified identity after refresh.
- Rejection of forged session cookies.
- Isolation of two independent browser sessions.
- Rejection of identity changes through query parameters.
- Isolation of concurrent server-rendering requests.
- Logout followed by denial of protected status-page access.
- Rejection of replayed revoked session cookies at the tested application endpoint.

### Recorded Results

The historical web authentication log reports successful results for all listed scenarios.

Source review confirms request-scoped Supabase clients in [lib/supabase/server.ts](../../lib/supabase/server.ts). The Proxy calls `getClaims()` and propagates refreshed cookies; protected business reads separately verify `getUser()`. [lib/supabase/config.ts](../../lib/supabase/config.ts) sets SameSite=Lax and sets Secure outside the recognized local HTTP Supabase origins. It does not set HttpOnly; these SSR cookies support the browser SDK. Hosted cookie delivery was not checked in this audit.

### Important Session Limitation

Application-level logout protection and provider access-token expiration are not identical.

The existing SecureDesk security report documents that a previously issued access token may remain usable against the direct Supabase API until its expiration, even after application logout.

[app/auth/actions.ts](../../app/auth/actions.ts) uses `signOut({ scope: 'local' })`, then revalidates the layout and redirects to `/login`; this targets the current provider session, not all devices. [supabase/config.toml](../../supabase/config.toml) sets local `jwt_expiry = 3600` seconds. The native security script explicitly checks that an issued JWT can still call `current_account_role` after logout while the application rejects the revoked cookie. The remaining token lifetime depends on issuance/expiry; current hosted provider settings were not read.

The assessment therefore does not claim immediate global invalidation of every issued JWT.

Fresh business authorization checks remain an important independent control.

### Evidence

- `.tools/verification/gate6/auth-web.log`
- [proxy.ts](../../proxy.ts)
- [docs/SECURITY_REPORT.md](../../docs/SECURITY_REPORT.md)

## 6. SEC-002-C — Privilege Escalation & Registration Retry Protection

### Objective

Verify that users cannot manipulate registration retries to alter identities, obtain additional permissions, bypass administrative approval, or corrupt request history.

### Test Scenarios

The historical registration retry checks covered:

- Cross-origin retry request rejection.
- Unauthorized use of copied registration forms.
- Submission attempts on behalf of another account.
- Manipulation of identity, role, route, and request identifiers.
- Server-side rejection of invalid or oversized fields.
- Rejection of duplicated input fields.
- Concurrent submission of the same registration retry.
- Replay of outdated forms.
- Protection against unauthorized account promotion.
- Preservation of previous decisions and immutable request history.
- Creation of correctly attributed audit records.
- Restriction of retry functionality to eligible users.

### Concurrency Validation

Two simultaneous native form submissions were tested.

The recorded result reported one successful submission and one stale-form response.

This demonstrates the expected behavior for the specific concurrency scenario exercised by the test.

### Replay Protection

The historical tests report that previously used or outdated registration forms could not create additional unauthorized pending requests.

### Audit Integrity

The concurrent retry scenario recorded exactly one audit event attributed to the appropriate actor.

### Recorded Result

**44 checks passed, 0 reported failures.**

### Evidence

- `.tools/verification/gate6/registration-retry.log`
- [docs/GATE6_VERIFICATION.md](../../docs/GATE6_VERIFICATION.md)

### Limitation

The recorded tests do not prove that all possible race conditions, authorization bypasses, or replay scenarios have been eliminated.

## 7. Authentication Rate Limiting

SecureDesk implements application-level attempt limiting for selected authentication-related operations.

Current [lib/security/auth-attempts.ts](../../lib/security/auth-attempts.ts) defines the same limits recorded in the Phase 6 report; [app/auth/actions.ts](../../app/auth/actions.ts) calls them after validating the relevant input:

| Operation | Configured Limit | Subject within that operation |
|---|---|---|
| Login | 10 attempts / 10 minutes | Normalized email |
| Registration | 3 attempts / 10 minutes | Normalized email |
| Resend confirmation | 1 attempt / minute | Normalized email |
| Confirmation | 5 attempts / 5 minutes | Normalized token hash |

The helper derives a hex HMAC-SHA-256 key from `kind + ':' + subject.trim().toLowerCase()` using a random 32-byte process salt. Raw emails/tokens and forwarding headers are not used as map keys. Counters are separate per operation and subject, not per IP, user population or deployment. Syntactically invalid input returns before counting; allowed calls count regardless of provider success.

The reviewed unit tests include checks for:

- Enforcement of attempt limits.
- Expiration of attempt windows.
- Non-extension of the limit window after denial.
- Separation of subject-specific limits.
- Capacity handling and cleanup of expired entries.

### Known Limitations

The application-level attempt limiter is process-local.

Its state resets when the process restarts and is not automatically shared across multiple running instances.

It does not replace Supabase provider-level rate limiting, hosted protections, CAPTCHA configuration, or infrastructure-level abuse controls.

These limitations are recorded in the existing security report.

`AttemptLimiter` uses `performance.now()`, fixed windows from the first counted call and a default capacity of 5,000 keys. A denial does not extend the window; capacity exhaustion rejects new keys until expired entries can be swept. Source review confirms these properties; the unit suite tests generic boundaries/capacity, while `check-security-web.mjs` defines actual login, resend and confirmation attempts. It does not separately exercise the exact registration quota at runtime. None of these tests were rerun.

## 8. Input Validation & Sensitive Data Protection

Additional unit and HTTP tests covered:

- Duplicate authentication fields.
- Server-side validation independent of browser constraints.
- Rejection of invalid form submissions.
- Prevention of password values being returned in validation state.
- Generic errors for invalid sign-in credentials.
- Rejection of selected cross-origin form POST requests.

These controls reduce exposure to selected input manipulation and data disclosure scenarios.

Successful validation tests do not establish protection from every form of injection or request forgery.

## 9. Test Data Integrity & Cleanup

Historical testing used fictional local accounts.

The reviewed logs report that passwords, confirmation links, and session tokens remained in memory and were not printed in the recorded output.

Sessions were closed after testing.

The registration retry tests also documented restoration of the original persistent Super Admin count and preservation of relevant request history.

Some fictional accounts and registration attempts were intentionally retained as test fixtures.

No hosted writes were reported for these test groups.

## 10. Evidence References

| Evidence | Source |
|---|---|
| Local authentication results | `.tools/verification/gate6/auth-local.log` |
| HTTP authentication results | `.tools/verification/gate6/auth-web.log` |
| Registration retry results | `.tools/verification/gate6/registration-retry.log` |
| Rate-limiting unit tests | [scripts/security-controls.test.mjs](../../scripts/security-controls.test.mjs) |
| Rate-limiting implementation | [lib/security/rate-limit.ts](../../lib/security/rate-limit.ts) |
| Operation policies and HMAC subjects | [lib/security/auth-attempts.ts](../../lib/security/auth-attempts.ts) |
| Auth action entry points | [app/auth/actions.ts](../../app/auth/actions.ts) |
| Request-scoped session client | [lib/supabase/server.ts](../../lib/supabase/server.ts) |
| Cookie configuration | [lib/supabase/config.ts](../../lib/supabase/config.ts) |
| Local provider configuration | [supabase/config.toml](../../supabase/config.toml) |
| Signup approval boundary | [supabase/migrations/20261005202205_auth_registration_bridge.sql](../../supabase/migrations/20261005202205_auth_registration_bridge.sql) |
| Local authentication test | [scripts/check-local-auth.mjs](../../scripts/check-local-auth.mjs) |
| HTTP session test | [scripts/check-auth-web.mjs](../../scripts/check-auth-web.mjs) |
| Retry test | [scripts/check-own-registration-retry-web.mjs](../../scripts/check-own-registration-retry-web.mjs) |
| Native auth limits and JWT replay | [scripts/check-security-web.mjs](../../scripts/check-security-web.mjs) |
| Input validation implementation | [lib/auth/validation.ts](../../lib/auth/validation.ts) |
| Session request processing | [proxy.ts](../../proxy.ts) |
| Phase 6 verification | [docs/GATE6_VERIFICATION.md](../../docs/GATE6_VERIFICATION.md) |
| Residual risk documentation | [docs/SECURITY_REPORT.md](../../docs/SECURITY_REPORT.md) |

The listed implementation files, relevant test sections and saved logs were reviewed. This is a static review of selected assertions, not a new execution or a line-by-line audit of every authentication dependency.

## 11. Residual Risks & Limitations

The reviewed evidence has several limitations:

- Historical PASS results are not proof of current deployment security.
- Application logout does not necessarily immediately invalidate previously issued provider access tokens.
- Application rate limits are process-local and do not replace shared infrastructure protections.
- Hosted authentication-provider limits and operational settings require separate review.
- The complete range of possible concurrency and session attacks has not been tested.
- The test evidence does not establish independent penetration-test certification.
- Current HTTP Auth test definitions include later changes; historical 38-check results do not certify those additions.

## 12. Lessons Learned

**Authentication is not authorization.** A confirmed identity must not automatically receive access to business resources.

**Negative testing is essential.** Rejected requests, manipulated fields, and unauthorized operations are important evidence of security control behavior.

**Session security is layered.** Browser cookies, application identity checks, provider tokens, and business permissions have different responsibilities.

**Concurrency matters.** Simultaneous requests can expose workflow weaknesses that sequential tests may not identify.

**Audit integrity matters.** Security-sensitive operations must preserve accurate and attributable records.

**Security limitations must be explicit.** A successful test establishes the behavior of the tested scenario, not universal protection against every possible attack.

## 13. Conclusion

SecureDesk's documented Phase 6 validation included 107 passing checks across local authentication, web authentication, and registration retry workflows.

The reviewed evidence supports the recorded behavior of selected registration, session, authorization, and replay-protection controls.

Additional security-control unit tests provide supporting evidence for local rate limiting and input validation.

This assessment demonstrates practical experience in authentication security testing, negative test design, session lifecycle verification, and registration workflow protection.

**Final documentation status:** Documentation audit complete for the stated scope. Exact limits, subject scope, approval boundaries and session limitations are source-verified; historical PASS results and hosted runtime behavior remain distinct.
