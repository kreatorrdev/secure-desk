import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
export default function Home() {
  return <AuthShell title="Support starts here" description="Request access to SecureDesk for your company, or sign in to check your request."><div className="space-y-3"><Link href="/register" className="block rounded-lg bg-blue-700 px-4 py-3 text-center font-semibold text-white hover:bg-blue-800">Request access</Link><Link href="/login" className="block rounded-lg border border-slate-300 px-4 py-3 text-center font-semibold hover:bg-slate-50">Sign in</Link></div></AuthShell>;
}
