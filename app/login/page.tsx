import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm, ResendForm } from "@/components/auth-forms";
export const dynamic = "force-dynamic";
export default function LoginPage() {
  return <AuthShell title="Welcome back" description="Sign in to check the status of your access request."><LoginForm /><p className="mt-6 text-center text-sm text-slate-600">New to SecureDesk? <Link href="/register" className="font-semibold text-blue-700 underline underline-offset-4">Request access</Link></p><details className="mt-7 border-t border-slate-200 pt-5"><summary className="cursor-pointer text-sm font-medium text-slate-700">Need another confirmation email?</summary><ResendForm /></details></AuthShell>;
}
