"use client";

import { useActionState, useId } from "react";
import { register, login, resendConfirmation, confirmEmail, signOut } from "@/app/auth/actions";
import type { AuthFormState } from "@/lib/auth/types";

const initial: AuthFormState = {};
function Notice({ state }: { state: AuthFormState }) {
  return state.message ? <p role="status" aria-live="polite" className="rounded-lg bg-blue-50 p-3 text-sm leading-5 text-blue-900">{state.message}</p> : null;
}
function Field({ name, label, state, type = "text", autoComplete, maxLength, minLength, multiline = false }: { name: string; label: string; state: AuthFormState; type?: string; autoComplete?: string; maxLength?: number; minLength?: number; multiline?: boolean }) {
  const fieldId = useId();
  const error = state.errors?.[name];
  const props = { id: fieldId, name, required: true, maxLength, minLength, autoComplete, defaultValue: type === "password" ? undefined : state.values?.[name], "aria-invalid": Boolean(error), "aria-describedby": error ? fieldId + "-error" : undefined, className: "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" };
  return <div><label htmlFor={fieldId} className="text-sm font-medium">{label}</label>{multiline ? <textarea {...props} rows={3} /> : <input {...props} type={type} />}{error && <p id={fieldId + "-error"} className="mt-1 text-sm text-red-700">{error}</p>}</div>;
}
function Submit({ pending, children, waiting = "Please wait…" }: { pending: boolean; children: React.ReactNode; waiting?: string }) {
  return <button type="submit" disabled={pending} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60">{pending ? waiting : children}</button>;
}
export function RegisterForm() {
  const [state, action, pending] = useActionState(register, initial);
  return <form action={action} className="space-y-5" aria-busy={pending}>
    <Notice state={state} />
    <Field name="full_name" label="Full name" autoComplete="name" maxLength={120} state={state} />
    <Field name="email" label="Email address" type="email" autoComplete="email" maxLength={254} state={state} />
    <div><Field name="password" label="Password" type="password" autoComplete="new-password" minLength={8} maxLength={72} state={state} /><p className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p></div>
    <div className="grid gap-5 sm:grid-cols-2"><Field name="company_name" label="Company name" autoComplete="organization" maxLength={200} state={state} /><Field name="phone" label="Contact phone" type="tel" autoComplete="tel" maxLength={40} state={state} /></div>
    <Field name="message" label="Message to the administrator" multiline maxLength={4000} state={state} />
    <Submit pending={pending} waiting="Submitting…">Request access</Submit>
  </form>;
}
export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);
  return <form action={action} className="space-y-5" aria-busy={pending}><Notice state={state} /><Field name="email" label="Email address" type="email" autoComplete="email" maxLength={254} state={state} /><Field name="password" label="Password" type="password" autoComplete="current-password" maxLength={1024} state={state} /><Submit pending={pending} waiting="Signing in…">Sign in</Submit></form>;
}
export function ResendForm() {
  const [state, action, pending] = useActionState(resendConfirmation, initial);
  return <form action={action} className="mt-5 space-y-4" aria-busy={pending}><Notice state={state} /><Field name="email" label="Email for confirmation" type="email" autoComplete="email" maxLength={254} state={state} /><Submit pending={pending}>Send confirmation email</Submit></form>;
}
export function ConfirmForm({ tokenHash }: { tokenHash: string }) {
  const [state, action, pending] = useActionState(confirmEmail, initial);
  return <form action={action} className="space-y-5" aria-busy={pending}><input type="hidden" name="token_hash" value={tokenHash} /><Notice state={state} /><Submit pending={pending}>Confirm email and continue</Submit></form>;
}
export function SignOutForm() {
  const [state, action, pending] = useActionState(signOut, initial);
  return <form action={action} className="mt-7 space-y-3" aria-busy={pending}><Notice state={state} /><Submit pending={pending} waiting="Signing out…">Sign out</Submit></form>;
}
