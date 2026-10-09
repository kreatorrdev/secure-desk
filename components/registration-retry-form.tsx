'use client';

import { useActionState, useId } from 'react';
import { resubmitRequest } from '@/app/account/actions';
import type { RetryDetails, RetryState, RetryValues } from '@/lib/registration/retry-types';

function Field({ name, label, state, limit, multiline = false }: { name: keyof RetryValues; label: string; state: RetryState; limit: number; multiline?: boolean }) {
  const id = useId(), error = state.errors?.[name];
  const props = { id, name, required: true, maxLength: limit, defaultValue: state.values?.[name], 'aria-invalid': Boolean(error), 'aria-describedby': error ? id + '-error' : undefined, className: 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100' };
  return <div><label htmlFor={id} className="text-sm font-medium">{label}</label>{multiline ? <textarea {...props} rows={4} /> : <input {...props} type={name === 'phone' ? 'tel' : 'text'} autoComplete={name === 'phone' ? 'tel' : 'organization'} />}{error && <p id={id + '-error'} className="mt-1 text-sm text-red-700">{error}</p>}</div>;
}

export function RegistrationRetryForm({ details }: { details: RetryDetails }) {
  const [state, action, pending] = useActionState(resubmitRequest, { values: { company_name: details.company_name, phone: details.phone, message: details.message } });
  return <section className="mt-6 border-t border-slate-200 pt-6" aria-labelledby="retry-title"><h2 id="retry-title" className="text-lg font-semibold">Submit a new access request</h2><p className="mt-2 text-sm leading-6 text-slate-600">Update your company and contact details, and explain the changes. This creates a new request on your existing account. Your earlier decision stays in the history below.</p>
    <form action={action} data-registration-retry="true" aria-busy={pending} className="mt-5 space-y-5">
      <input type="hidden" name="expected_request_id" value={details.request_id} />
      {state.message && <p role="status" aria-live="polite" className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">{state.message}</p>}
      <Field name="company_name" label="Company name" limit={200} state={state} />
      <Field name="phone" label="Contact phone" limit={40} state={state} />
      <Field name="message" label="Message to the administrator" limit={4000} state={state} multiline />
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60">{pending ? 'Submitting…' : 'Submit new request'}</button>
    </form>
  </section>;
}
