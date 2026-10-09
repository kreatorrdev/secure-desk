'use client';

import { useActionState } from 'react';
import { manageOrganizationCode } from '@/app/organizations/[id]/codes/actions';
import type { CodeActionState, CodeMetadata } from '@/lib/organizations/codes';

const date = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
export function OrganizationCodeManager({ organizationId, current, canIssue }: { organizationId: string; current: CodeMetadata | null; canIssue: boolean }) {
  const [state, action, pending] = useActionState<CodeActionState, FormData>(manageOrganizationCode, { message: '' });
  const id = state.changed ? state.id : current?.id;
  const expiry = state.changed ? state.expires_at : current?.expires_at;
  return <section className="org-panel mt-8">
    <h2 className="text-lg font-semibold">Invitation code</h2>
    <p className="mt-3 text-sm leading-6 text-[var(--org-muted)]">{id ? 'A code has been issued for this company.' : 'No code is currently issued.'} {expiry && <>Expires: {date(expiry)}.</>}</p>
    {!state.changed && current && !current.is_usable && <p className="mt-3 text-sm">This code is expired or the company is inactive. It cannot accept new requests.</p>}
    {state.message && <p role="status" className="mt-4 text-sm leading-6">{state.message}</p>}
    {state.code && <div className="mt-5 rounded-lg border border-[var(--org-border)] p-4">
      <p className="text-sm font-semibold">Your new code</p>
      <code data-issued-code className="mt-3 block select-all break-all font-mono text-sm leading-7">{state.code}</code>
      <p className="mt-3 text-sm text-[var(--org-muted)]">Share it with an approved member or an intended colleague. They can forward it to request membership. Every request still requires administrator approval.</p>
    </div>}
    {(canIssue || id) && <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="organization_id" value={organizationId} />
      <input type="hidden" name="expected_code_id" value={id || 'none'} />
      <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="confirmed" value="yes" required className="mt-1 h-4 w-4 shrink-0" />I understand that replacing or revoking a code stops new requests using that code. Existing requests and memberships stay unchanged.</label>
      <div className="flex flex-wrap gap-3">
        {canIssue && <button name="intent" value="issue" disabled={pending} className="org-button disabled:cursor-wait disabled:opacity-60">{pending ? 'Saving…' : id ? 'Replace code' : 'Issue code'}</button>}
        {id && <button name="intent" value="revoke" disabled={pending} className="org-button disabled:cursor-wait disabled:opacity-60">Revoke code</button>}
      </div>
    </form>}
  </section>;
}
