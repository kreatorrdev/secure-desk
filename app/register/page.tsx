import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/auth-forms";
export const dynamic = "force-dynamic";
export default function RegisterPage() {
  return <AuthShell wide title="Request access" description="Tell us who you are and which company you belong to. Confirm your email, then wait for an administrator to review your request."><RegisterForm /><p className="mt-6 text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-semibold text-blue-700 underline underline-offset-4">Sign in</Link></p></AuthShell>;
}
