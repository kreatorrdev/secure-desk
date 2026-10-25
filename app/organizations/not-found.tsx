import Link from 'next/link';

export default function OrganizationNotFound() {
  return <section className="org-panel">
    <p className="org-eyebrow">Organization access</p>
    <h1 className="mt-2 text-2xl font-semibold">Organization not available</h1>
    <p className="mt-3 text-[var(--org-muted)]">This organization could not be found or you no longer have access to it.</p>
    <Link href="/organizations" prefetch={false} className="org-link mt-6 inline-block">Back to your organizations</Link>
  </section>;
}
