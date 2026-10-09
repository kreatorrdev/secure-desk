'use client';
import Link from 'next/link';
export default function WorkspaceError({ retry }: { retry: () => void }) { return <section className="org-panel" role="alert"><h1 className="text-2xl font-semibold">Workspace unavailable</h1><p className="mt-3 text-[var(--org-muted)]">We could not load this page. Please try again.</p><div className="mt-5 flex flex-wrap gap-5"><button onClick={retry} className="org-button">Try again</button><Link href="/account" className="org-link self-center">Your account</Link></div></section>; }
