'use client';
import { useActionState } from 'react';
import { saveAuditRetention } from '@/app/admin/audit/actions';
import type { RetentionSettings, RetentionState } from '@/lib/audit/types';
export function AuditRetentionForm({ setting }: { setting: RetentionSettings }) {
 const [state, action, pending] = useActionState<RetentionState, FormData>(saveAuditRetention, {});
 return <form action={action} data-audit-retention className="mt-5 space-y-5">
 <input type="hidden" name="setting_revision" value={setting.revision}/><input type="hidden" name="access_revision" value={setting.access_revision}/>
 {state.message && <p role="alert" className="org-notice">{state.message}</p>}
 <label className="org-field" htmlFor="audit-retention-days">Days to keep audit records<input id="audit-retention-days" name="days" type="number" min={1} max={3650} step={1} required defaultValue={state.days ?? String(setting.days)} className="org-input" aria-invalid={Boolean(state.error)} aria-describedby="audit-retention-help audit-retention-error"/></label>
 <p id="audit-retention-help" className="text-sm leading-6 text-[var(--org-muted)]">Default: 365 days. Choose 1–3650 days. Daily maintenance permanently removes records older than this period. Increasing it cannot restore records already removed. Tickets, comments and files are retained.</p>
 <p id="audit-retention-error" className="text-sm" role={state.error ? 'alert' : undefined}>{state.error}</p>
 <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="verified" value="yes" required className="mt-1"/><span>I understand how this affects audit history.</span></label>
 <button className="org-button" disabled={pending}>{pending ? 'Saving…' : 'Save retention policy'}</button>
 </form>;
}
