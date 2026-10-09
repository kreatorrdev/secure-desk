import Link from "next/link";

export function AuthShell({ title, description, children, wide = false }: { title: string; description: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:py-12">
      <a href="#auth-content" className="auth-skip-link">Skip to content</a>
      <main id="auth-content" tabIndex={-1}>
      <div className={"mx-auto " + (wide ? "max-w-2xl" : "max-w-md")}>
        <Link href="/" className="mb-8 inline-flex items-center gap-3 text-lg font-bold tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white" aria-hidden="true">SD</span>
          SecureDesk
        </Link>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="page-title">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-7 mt-3 leading-6 text-slate-600">{description}</p>
          {children}
        </section>
        <p className="mt-5 text-center text-sm text-slate-500">Email verification comes first. Company access requires approval.</p>
      </div>
      </main>
    </div>
  );
}
