# SEC-001 — Content Security Policy & HTTP Security Headers

**Project:** SecureDesk  
**Category:** Application Security / Security Hardening  
**Assessment Type:** Developer-Led Security Validation  
**Technology Stack:** Next.js, TypeScript, Supabase, Node.js  
**Historical Test Date:** October 8, 2026  
**Recorded Result:** PASS  
**Documentation Status:** Source, historical unit tests and selected local HTTP evidence reviewed; comprehensive production enforcement not established.

**Documentation Review:** October 26, 2026 — source, test-definition and saved-result review; no test suites or runtime requests executed.  
**Revision Boundary:** Current HEAD `b623dafabca9fcdea6fd8d582bb3b69c8394c5c6` plus pre-existing uncommitted changes. **Historical Gate 6 verification — exact tested Git revision not established.** See [evidence provenance](SECURITY_EVIDENCE_INDEX.md#3-consolidated-historical-verification-results).

---

## 1. Security Objective

The objective of this assessment is to evaluate the implementation and testing of SecureDesk's Content Security Policy (CSP) and HTTP security headers.

The assessment focuses on:

- Restricting unauthorized script execution.
- Validating request-specific CSP nonces.
- Preventing unsafe CSP configuration.
- Applying appropriate HTTP security headers.
- Protecting private file download responses.
- Differentiating development and production security configurations.

The purpose is to verify specific implemented security controls, not to claim that the entire application is free from vulnerabilities.

## 2. Security Architecture

SecureDesk implements HTTP security controls through three primary components.

| Component | Responsibility |
|---|---|
| [lib/security/headers.ts](../../lib/security/headers.ts) | Security header definitions and CSP generation |
| [proxy.ts](../../proxy.ts) | Request nonce generation, CSP application, and session processing |
| [next.config.ts](../../next.config.ts) | Common HTTP security headers and conditional HSTS configuration |

### 2.1 Content Security Policy

The CSP implementation includes:

- Nonce-based script authorization.
- The `strict-dynamic` directive.
- Restricted connection origins.
- `object-src 'none'`.
- `base-uri 'none'`.
- `frame-ancestors 'none'`.
- `form-action 'self'`.
- `script-src-attr 'none'`.

Production mode does not add `unsafe-eval`, while development mode permits it for framework debugging requirements.

### 2.2 Request Nonce Generation

The Next.js Proxy generates a nonce with `crypto.randomUUID()` and Base64-encodes the UUID string using `Buffer.from(...).toString('base64')`.

The Proxy overwrites incoming `x-nonce` and `Content-Security-Policy` request headers with server-generated values, forwards them to the rendering layer, and selects the response CSP. Its matcher excludes framework static/image paths and the favicon; [next.config.ts](../../next.config.ts) separately declares common headers for `/:path*`.

`contentSecurityPolicy` rejects nonces outside `^[A-Za-z0-9+/]{20,}={0,2}$`. This is a character/length check, not Base64 decoding or an entropy test. Configured API/site URLs must use HTTP(S) and contain no embedded username or password.

The format validation alone does not prove nonce unpredictability; nonce generation and propagation must be considered separately.

### 2.3 HTTP Security Headers

The application defines the following headers:

| Header | Security Purpose |
|---|---|
| X-Content-Type-Options | `nosniff`; prevent MIME type sniffing |
| X-Frame-Options | `DENY`; restrict framing |
| Referrer-Policy | `no-referrer`; restrict referrer disclosure |
| Permissions-Policy | Disables camera, microphone, geolocation, payment and USB |
| Cross-Origin-Opener-Policy | `same-origin`; browsing-context isolation |
| Cross-Origin-Resource-Policy | `same-origin`; cross-origin resource restrictions |
| Strict-Transport-Security | Conditional `max-age=31536000`; prefer HTTPS |

HSTS is emitted as `max-age=31536000` only when the configured `SITE_URL` uses HTTPS; the fallback is local HTTP. No `includeSubDomains` or `preload` directive is defined. This configuration decision does not inspect the actual deployment's TLS delivery.

### 2.4 Private File Download Protection

SecureDesk applies a separate restrictive CSP to designated private attachment download routes.

The selected policy is:

`sandbox; default-src 'none'`

This policy is intended to reduce the risk of downloaded content being interpreted as active application content.

The policy complements, but does not replace, file authorization, content validation, and other download response protections.

## 3. Testing Methodology

Security controls were validated using automated tests implemented with the Node.js Test Runner.

The tests evaluate the output of security-related functions using predefined configuration values, valid and invalid inputs, and expected security properties.

The reviewed suite includes tests for:

1. Production CSP restrictions.
2. Development CSP behavior.
3. Invalid nonce and origin rejection.
4. HTTP security header configuration.
5. HTTPS-dependent HSTS generation.
6. Authentication attempt-limiting boundaries.
7. Rate limiter capacity and subject isolation.
8. Duplicate authentication field rejection.
9. Password exclusion from validation state.
10. Private download CSP selection.

These are unit-level checks of selected functions and behaviors. They are not equivalent to a complete browser penetration test.

## 4. Recorded Test Results

**Evidence source:** `.tools/verification/gate6/security-controls.log`

**Historical execution:** October 8, 2026

| Metric | Recorded Result |
|---|---|
| Total tests | 10 |
| Passed | 10 |
| Failed | 0 |
| Skipped | 0 |

All ten tests in the saved execution log were reported as passing.

The CSP and HTTP header tests validated the expected behavior of the reviewed security functions under their defined test conditions.

These historical results do not independently establish the behavior of the currently deployed application.

### 4.1 Selected Local HTTP Evidence

The historical attachment suite recorded 341 checks; its current test source explicitly asserts `no-store` and `nosniff` on allowed and unavailable downloads, and octet-stream, attachment disposition and the exact sandbox CSP on allowed downloads. The Gate 6 report records actual download-header regression after the CSP fix. These are HTTP integration checks, separate from the ten unit tests.

[scripts/check-security-web.mjs](../../scripts/check-security-web.mjs) also defines selected local HTTP checks on nine paths for fresh response nonces, script-tag nonce attributes, common headers and client nonce spoof rejection. Its bytes match the saved Phase 6 source manifest, and `security-web.log` records 241 aggregate checks; that total includes authentication and authorization checks as well as headers. This is HTTP/HTML inspection, not a comprehensive browser CSP enforcement assessment.

**Local HTTP tests provide evidence for selected private-download security headers. Comprehensive production header coverage, nonce propagation and browser-level CSP enforcement have not been independently established.**

## 5. Security Finding — CSP Header Conflict

### 5.1 Background

During Phase 6 security verification, a conflict was identified between the application's general Proxy Content Security Policy and the restrictive response policy intended for private document downloads.

### 5.2 Investigation

The issue was identified during security validation and documented in the Gate 6 verification report.

The investigation focused on how CSP headers were selected and applied to private attachment download responses.

### 5.3 Remediation

The CSP response-handling logic was adjusted to preserve the restrictive download policy for designated attachment routes.

The implementation selects:

`sandbox; default-src 'none'`

for the relevant private download paths.

The Gate 6 report also documents related download protections, including attachment disposition, MIME sniffing prevention, and cache-control restrictions.

### 5.4 Regression Verification

Following the documented correction, the relevant verification sets were repeated.

The Gate 6 report records:

- 355 successful proposal checks.
- 341 successful ticket attachment checks.

These numbers represent the recorded verification sets and should not be interpreted as 696 individual CSP tests.

### 5.5 Outcome

The historical verification report records the CSP conflict as reproduced, corrected, and regression-tested.

The precise security impact and any remaining deployment-specific limitations should be assessed separately from the fact that the regression checks passed.

## 6. Evidence References

| Evidence Type | Source |
|---|---|
| CSP implementation | [lib/security/headers.ts](../../lib/security/headers.ts) |
| Request-level CSP handling | [proxy.ts](../../proxy.ts) |
| Next.js header configuration | [next.config.ts](../../next.config.ts) |
| Security unit tests | [scripts/security-controls.test.mjs](../../scripts/security-controls.test.mjs) |
| Selected local HTTP/HTML checks | [scripts/check-security-web.mjs](../../scripts/check-security-web.mjs) |
| Private download HTTP assertions | [scripts/check-ticket-attachments-web.mjs](../../scripts/check-ticket-attachments-web.mjs) |
| Native security aggregate output | `.tools/verification/gate6/security-web.log` |
| Attachment aggregate output | `.tools/verification/gate6/attachments.log` |
| Historical test output | `.tools/verification/gate6/security-controls.log` |
| Gate 6 results | [docs/GATE6_VERIFICATION.md](../../docs/GATE6_VERIFICATION.md) |
| Security report | [docs/SECURITY_REPORT.md](../../docs/SECURITY_REPORT.md) |

Evidence paths reference the SecureDesk project repository.

Raw local verification files should remain private until reviewed for sensitive information.

## 7. Security Limitations

The reviewed tests provide evidence for specific security controls, but several limitations remain.

- Passing unit tests does not prove that every HTTP response includes the expected headers.
- The review does not establish protection against every possible XSS vulnerability.
- Runtime nonce propagation and browser enforcement require separate evidence.
- HSTS behavior depends on correct production configuration and actual HTTPS delivery.
- Download CSP restrictions do not replace authorization checks or malware inspection.
- Historical test results do not automatically establish the security state of later deployments.

No comprehensive independent penetration-test certification is claimed.

## 8. Lessons Learned

This assessment highlights several important application security principles.

**Defense in depth:** CSP, HTTP security headers, access controls, and file download restrictions provide different protective layers.

**Security testing must include negative cases:** Testing deliberately invalid nonce values, origins, and authentication inputs helps verify defensive behavior.

**Secure defaults require contextual exceptions:** Development debugging, production scripts, and private file downloads have different requirements.

**Regression testing matters:** Security changes should be followed by tests that verify intended behavior and help identify unintended consequences.

**Evidence must support conclusions:** Automated test results should be connected to implementation details, recorded outcomes, and clearly stated limitations.

## 9. Conclusion

SecureDesk implements structured HTTP security header configuration, nonce-based Content Security Policy generation, and dedicated restrictions for private file download responses.

The historical Gate 6 security controls suite recorded 10 passing tests with zero failures.

The Gate 6 verification report also documents the identification, remediation, and regression verification of a Content Security Policy conflict affecting private download responses.

This assessment demonstrates application security implementation, automated control validation, and documented remediation within the SecureDesk development process.

**Final status:** Documentation audit complete for the stated scope. Source, unit-test and selected historical local HTTP evidence are distinguished; comprehensive current production CSP/header enforcement remains unverified.
