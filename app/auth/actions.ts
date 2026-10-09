"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteURL } from "@/lib/auth/site";
import { readText, validateAuthForm } from "@/lib/auth/validation";
import type { AuthFormState } from "@/lib/auth/types";
import { authenticationAttempt } from "@/lib/security/auth-attempts";

export async function register(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const result = validateAuthForm(form, true);
  if (!result.valid) return result.state;
  if (!authenticationAttempt("register", result.values.email)) return { values: result.values, message: "Too many attempts. Please wait and try again." };
  const supabase = await createClient();
  const current = await supabase.auth.getUser();
  if (current.data.user) redirect("/account");
  const { email, ...data } = result.values;
  const { error } = await supabase.auth.signUp({ email, password: result.password, options: { data, emailRedirectTo: getSiteURL() + "/auth/confirm" } });
  if (error) return { values: result.values, message: error.status === 429 ? "Too many attempts. Please wait and try again." : "We could not submit your registration. Please try again later." };
  // Identical destination for new and existing addresses; no account enumeration.
  redirect("/auth/check-email");
}

export async function login(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const result = validateAuthForm(form);
  if (!result.valid) return result.state;
  if (!authenticationAttempt("login", result.values.email)) return { values: result.values, message: "Too many attempts. Please wait and try again." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: result.values.email, password: result.password });
  if (error) return { values: result.values, message: error.code === "email_not_confirmed" ? "Confirm your email before signing in. You can request a new confirmation below." : error.status === 429 ? "Too many attempts. Please wait and try again." : "Sign-in failed. Check your email and password." };
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function resendConfirmation(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = readText(form, "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { errors: { email: "Enter a valid email address." }, values: { email } };
  if (!authenticationAttempt("resend", email)) return { values: { email }, message: "Too many attempts. Please wait and try again." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: getSiteURL() + "/auth/confirm" } });
  if (error?.status === 429) return { values: { email }, message: "Too many attempts. Please wait before requesting another email." };
  return { values: { email }, message: "If this address needs confirmation, an email will arrive shortly. Check your inbox and spam folder." };
}

export async function confirmEmail(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const tokenHash = readText(form, "token_hash");
  if (!/^[A-Za-z0-9_-]{20,256}$/.test(tokenHash)) return { message: "This confirmation link is invalid or expired. Request a new email below." };
  if (!authenticationAttempt("confirm", tokenHash)) return { message: "Too many attempts. Please wait and try again." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error) return { message: "This confirmation link is invalid or expired. Request a new email below." };
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signOut(): Promise<AuthFormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) return { message: "We could not sign you out. Please try again." };
  revalidatePath("/", "layout");
  redirect("/login");
}
