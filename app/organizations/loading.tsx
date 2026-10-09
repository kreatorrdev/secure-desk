export default function OrganizationsLoading() {
  return <section aria-busy="true" aria-label="Loading organizations">
    <p role="status" className="text-[var(--org-muted)]">Loading organizations…</p>
    <div aria-hidden="true" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map(item => <div key={item} className="org-panel h-48 motion-safe:animate-pulse"><div className="h-4 w-20 rounded bg-[var(--org-border)]" /><div className="mt-6 h-5 w-3/4 rounded bg-[var(--org-border)]" /></div>)}
    </div>
  </section>;
}
