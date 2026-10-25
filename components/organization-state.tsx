import Link from 'next/link';

export function OrganizationUnavailable() {
  return <section role="alert" className="org-panel">
    <h1 className="text-2xl font-semibold">Organizations unavailable</h1>
    <p className="mt-3 text-[var(--org-muted)]">We could not load your organizations. Please try again.</p>
    <div className="mt-6 flex flex-wrap gap-5">
      <a href="" className="org-button">Reload page</a>
      <Link href="/account" className="org-link self-center">Back to your account</Link>
    </div>
  </section>;
}

export function OrganizationStatus({ status }: { status: string }) {
  return <span className={'org-status ' + (status === 'active' ? 'org-status-active' : '')}>{status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Inactive'}</span>;
}
