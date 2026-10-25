'use client';
import Link from 'next/link';

export default function OrganizationsError({ retry }: { retry: () => void }) {
  return <section role="alert" className="org-panel">
    <h1 className="text-2xl font-semibold">Organizations unavailable</h1>
    <p className="mt-3 text-[var(--org-muted)]">We could not load this page. Please try again.</p>
    <div className="mt-6 flex flex-wrap gap-5">
      <button onClick={retry} className="org-button">Try again</button>
      <Link href="/account" className="org-link self-center">Back to your account</Link>
    </div>
  </section>;
}
