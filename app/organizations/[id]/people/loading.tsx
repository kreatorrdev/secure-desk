export default function OrganizationPeopleLoading() {
  return <section aria-busy="true" aria-label="Loading members and assignments">
    <p role="status" className="text-[var(--org-muted)]">Loading members and assignments…</p>
    <div aria-hidden="true" className="mt-6 space-y-4">
      {[0, 1, 2].map(item => <div key={item} className="org-panel h-40 motion-safe:animate-pulse"><div className="h-4 w-40 rounded bg-[var(--org-border)]" /><div className="mt-5 h-4 w-2/3 rounded bg-[var(--org-border)]" /></div>)}
    </div>
  </section>;
}
