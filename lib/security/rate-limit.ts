// Bounded local-process guard; Supabase Auth remains the provider-level limiter.
export class AttemptLimiter {
  private entries = new Map<string, { count: number; until: number }>();
  private nextSweep = 0;
  private capacity: number;
  constructor(capacity = 5000) { this.capacity = capacity; }
  take(key: string, maximum: number, windowMs: number, now = performance.now()) {
    if (!key || maximum < 1 || windowMs < 1) throw new Error('Invalid limiter policy');
    if (now >= this.nextSweep) {
      for (const [id, entry] of this.entries) if (entry.until <= now) this.entries.delete(id);
      this.nextSweep = now + 60000;
    }
    const prior = this.entries.get(key);
    if (prior && prior.until > now) {
      if (prior.count >= maximum) return { allowed: false, retryAfterSeconds: Math.ceil((prior.until - now) / 1000) };
      prior.count++;
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (!prior && this.entries.size >= this.capacity) return { allowed: false, retryAfterSeconds: 60 };
    this.entries.set(key, { count: 1, until: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
