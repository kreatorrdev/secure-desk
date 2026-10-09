import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
export default function NotFound() {
  return <AuthShell title="Page not available" description="This page could not be found. Choose a destination below to continue.">
    <div className="flex flex-wrap gap-5">
      <Link href="/account" className="text-blue-700 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Your account</Link>
      <Link href="/" className="text-blue-700 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Home</Link>
    </div>
  </AuthShell>;
}
