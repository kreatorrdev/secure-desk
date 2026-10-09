import type { AuthFormState } from "./types";

export function readText(form: FormData, name: string, trim = true) {
  const entries = form.getAll(name);
  const value = entries.length === 1 ? entries[0] : null;
  return typeof value === "string" ? (trim ? value.trim() : value) : "";
}

export function validateAuthForm(form: FormData, registration = false) {
  const values: Record<string, string> = { email: readText(form, "email") };
  const password = readText(form, "password", false);
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254) errors.email = "Enter a valid email address.";
  if (!password || password.length > 1024) errors.password = "Enter your password.";
  if (registration) {
    if ([...password].length < 8) errors.password = "Use at least 8 characters.";
    if (new TextEncoder().encode(password).length > 72) errors.password = "This password is too long. Use a shorter password.";
    for (const [name, label, max] of [["full_name", "Full name", 120], ["phone", "Phone", 40], ["company_name", "Company name", 200], ["message", "Message", 4000]] as const) {
      values[name] = readText(form, name);
      if (!values[name] || [...values[name]].length > max) errors[name] = label + " is required and must be at most " + max + " characters.";
    }
  }
  const state: AuthFormState = { errors, values, message: "Please check the highlighted fields." };
  return { valid: Object.keys(errors).length === 0, values, password, state };
}
