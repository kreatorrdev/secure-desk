'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { reviewAccess } from '@/lib/registration/access';
import type { RetentionState } from '@/lib/audit/types';
export async function saveAuditRetention(_state: RetentionState, form: FormData): Promise<RetentionState> {
 const access = await reviewAccess();
 if (access.kind !== 'allowed' || access.role !== 'super_admin') return { message: 'Only an active Super Admin can change the retention policy.' };
 const allowed = new Set(['days', 'setting_revision', 'access_revision', 'verified']);
 for (const key of form.keys()) if (!key.startsWith('$ACTION_') && (!allowed.has(key) || form.getAll(key).length !== 1 || typeof form.get(key) !== 'string')) return { message: 'This form is invalid. Reload before trying again.' };
 const text = (key: string) => typeof form.get(key) === 'string' ? String(form.get(key)).trim() : '';
 const days = text('days'), revision = text('setting_revision'), actorRevision = text('access_revision');
 if (!/^[1-9][0-9]{0,3}$/.test(days) || Number(days) > 3650) return { days, error: 'Enter a whole number from 1 to 3650.' };
 if (!/^[1-9][0-9]{0,17}$/.test(revision) || !/^[1-9][0-9]{0,17}$/.test(actorRevision) || text('verified') !== 'yes') return { days, message: 'Confirm the effect and reload if the policy has changed.' };
 const result = await access.supabase.rpc('set_audit_retention', { p_days: Number(days), p_expected_revision: revision, p_expected_access_revision: actorRevision });
 if (result.error || result.data?.saved !== true) return { days, message: (result.error?.code === 'PT409' || result.error?.code === '40001') ? 'The policy or your permissions changed. Reload before trying again.' : 'We could not confirm this change. Reload and check the current policy.' };
 revalidatePath('/admin/audit');redirect('/admin/audit?notice=saved');
}
