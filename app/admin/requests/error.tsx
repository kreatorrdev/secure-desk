'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="min-h-screen bg-slate-50 p-8 text-slate-900"><h1 className="text-2xl font-semibold">Review page unavailable</h1><p className="mt-3">Please reload to check your current access and request status.</p><div className="mt-5 flex gap-5"><button onClick={reset} className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white">Try again</button><Link href="/account" className="self-center text-blue-700 underline">Back to your account</Link></div></main>; }

