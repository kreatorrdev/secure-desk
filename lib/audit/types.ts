export type AuditEvent = { id: string; event_type: string; created_at: string; actor_name: string; details: { value?: string; on_behalf?: boolean; close_kind?: string; previous_days?: number; retention_days?: number; removed_count?: number }; organization_id?: string | null; organization_name?: string | null; target_type?: string; target_id?: string; outcome?: 'success' | 'failure' };
export type RetentionSettings = { days: number; revision: string; access_revision: string; updated_at: string };
export type RetentionState = { message?: string; days?: string; error?: string };
export function auditCursor(query: Record<string, string | string[] | undefined>, prefix = '') {
 const at = query[prefix + 'before'], id = query[prefix + 'cursor'];
 if (at === undefined && id === undefined) return { valid: true, at: null, id: null };
 const valid = typeof at === 'string' && at.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(at) && Number.isFinite(Date.parse(at)) && typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
 return valid ? { valid: true, at: at as string, id: id as string } : { valid: false, at: null, id: null };
}
