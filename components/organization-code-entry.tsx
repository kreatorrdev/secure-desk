'use client';

import { useActionState } from 'react';
import { submitOrganizationCode } from '@/app/account/code-actions';
export function OrganizationCodeEntry() {
  const [state, action, pending] = useActionState(submitOrganizationCode, { message: '' });
  return <section className="mt-6 rounded-xl border border-slate-200 p-5">
    <h2 className="text-base font-semibold">Have an organization code?</h2>
    <p id="organization-code-help" className="mt-2 text-sm leading-6 text-slate-600">Use the code shared with you to send this request to the company administrator. You will remain pending until they approve your membership.</p>
    <form action={action} className="mt-4 space-y-4">
      <label className="block text-sm font-medium" htmlFor="organization-code">Organization code</label>
      <input id="organization-code" name="organization_code" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={256} required aria-describedby="organization-code-help" className="block w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-900 focus:outline-2 focus:outline-blue-700" />
      {state.message && <p role="alert" className="text-sm leading-6 text-red-800">{state.message}</p>}
      <button disabled={pending} className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{pending ? 'Submitting…' : 'Submit code for review'}</button>
    </form>
  </section>;
}
