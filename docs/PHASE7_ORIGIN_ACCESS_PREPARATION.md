# Origin — preparation for allowed test access

**Complete October 24:** [actual 16 responses and revocation of new Vercel access confirmed](PHASE7_ORIGIN_COMPLETION.md). Plan below is historical preparation; explicit approval given October 24, and server-generated OAuth r3 replaced initial preparation. Test not repeated.

October 23, 2026. This is preparation, not hosted PASS. One earlier anonymous account GET at 20:31:09 Europe/Budapest returned 302 to vercel.com. Vercel gate does not prove application rejection of wrong Origin. Old browser no-cors instrument not repeated.

Reviewed public official npm package **vercel 65.2.0**: archive integrity matches npm SHA-512, 351 paths within package/, no symlinks or special entries. Code only unpacked and read. No dependency install, CLI run, Vercel login, read of existing CLI auth or key creation.

Official [vercel curl](https://vercel.com/docs/cli/curl) fetches existing automation secret or generates it. Reviewed `getOrCreateDeploymentProtectionToken` confirms that; debug may print value, and curl passes it through header argument. Therefore ordinary automatic curl not run. [Vercel documents](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) that such key enables access to all project deployments until revoked. It is not by itself short-lived nor limited to our paths; limitation requires procedure that also immediately revokes.

## Specifically prepared scope

New private `origin-protected-probe.mjs` has four exactly specified existing paths: ticket and proposal native attachments and their transfer. Each has three negative POST cases (foreign, literal null, fully absent Origin) and one control with correct Origin, without application session: **12 negative and four control requests, at most 16 total**. Negative response must be exact application 403, control 404, with expected generic body and private/no-store/nosniff. No file, prepare/complete intent, cookies, application Authorization or Storage requests. Reviewed code verifies Origin before authorization and body, and anonymous controls stop before reservation.

Instrument sends key only as `x-vercel-protection-bypass` header to exact SecureDesk host. No URL key, bypass cookie, redirect follow, retry or print of body/headers/secret. Stops on first unexpected response; each response has 12-second timeout and 4096-byte limit. Records only Origin comparison on client request object; does not claim independent observation of headers received on server. Local synthetic test is not hosted result nor SQL preservation proof.

## Step requiring approval

Separate new Vercel test key needed for this project and revocation of that same key immediately after probe, including failure. Do not use, change or revoke existing automation keys. Vercel protection stays enabled. No deploy, schedule change or business privileges. Owner confirms login in official Vercel form; secrets not sent in conversation. Concrete API/CLI/UI adapter for obtain and guaranteed revoke not run by this module, and before actual use must bind exact project/team and verify preservation of existing key set and protection.

Official [protection-bypass API](https://vercel.com/docs/rest-api/projects/update-protection-bypass-for-automation) supports separate generate and revoke with regenerate:false; actual cleanup must confirm absence of only new key. If project identity or safe revoke not confirmed, probe does not start. All secret responses stay in memory; new module does not read existing Vercel configurations. New Vercel login may require temporary local auth configuration, separately logged out and deleted after confirmed revoke of test key.

Approval requested because new automation access opens; not SKILL.md requirement nor new request that user repeat business flow. After actual probe and confirmed revoke remain genuine Vercel daily caller and final preservation/acceptance. Until then F05/P06 and Gate7 remain open.
