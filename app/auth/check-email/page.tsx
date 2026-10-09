import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResendForm } from "@/components/auth-forms";
export const dynamic = "force-dynamic";
export default function CheckEmailPage() {
  return <AuthShell title="Check your email" description="If your registration needs confirmation, you will receive an email shortly. Open its link and confirm your email to continue."><p className="text-sm leading-6 text-slate-600">Check your inbox and spam folder. Email confirmation does not approve company access.</p><p className="mt-5"><Link href="/login" className="font-semibold text-blue-700 underline underline-offset-4">Go to sign in</Link></p><details className="mt-7 border-t border-slate-200 pt-5"><summary className="cursor-pointer text-sm font-medium">Send another confirmation</summary><ResendForm /></details></AuthShell>;
}
