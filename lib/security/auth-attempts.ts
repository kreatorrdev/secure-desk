import 'server-only';
import { createHmac, randomBytes } from 'node:crypto';
import { AttemptLimiter } from './rate-limit';
const limiter = new AttemptLimiter();
const processSalt = randomBytes(32);
const rules = { login: [10, 600000], register: [3, 600000], resend: [1, 60000], confirm: [5, 300000] } as const;
export function authenticationAttempt(kind: keyof typeof rules, subject: string) {
  // No raw email, token or caller-controlled forwarding header is stored or logged.
  const key = createHmac('sha256', processSalt).update(kind + ':' + subject.trim().toLowerCase()).digest('hex');
  const [maximum, windowMs] = rules[kind];
  return limiter.take(key, maximum, windowMs).allowed;
}
