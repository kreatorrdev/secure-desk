'use client';
import Link from 'next/link';
export default function AuditError({ reset }: { reset: () => void }) { return <section className="org-panel"><h1 className="text-2xl font-semibold">Audit history unavailable</h1><p className="mt-3">We could not load this view. Please try again.</p><div className="mt-5 flex gap-5"><button className="org-button" onClick={reset}>Try again</button><Link className="org-link" href="/account">Your account</Link></div></section>; }
