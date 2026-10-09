'use client';

import Link from 'next/link';
import { useSyncExternalStore, type ReactNode } from 'react';

type Theme = 'system' | 'light' | 'dark';
const themeKey = 'securedesk-theme';
let sessionTheme: Theme | undefined;

function readTheme(): Theme {
  try {
    const saved = sessionTheme ?? localStorage.getItem(themeKey);
    return saved === 'dark' || saved === 'light' ? saved : saved === 'system' ? 'system' : 'dark';
  } catch { return sessionTheme ?? 'dark'; }
}

function subscribe(onChange: () => void) {
  const storageChanged = () => { sessionTheme = undefined; onChange(); };
  window.addEventListener('storage', storageChanged);
  window.addEventListener('securedesk-theme', onChange);
  return () => {
    window.removeEventListener('storage', storageChanged);
    window.removeEventListener('securedesk-theme', onChange);
  };
}

export function OrganizationShell({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark' as Theme);
  function changeTheme(value: Theme) {
    sessionTheme = value;
    try { localStorage.setItem(themeKey, value); } catch { /* Keep the choice for this session. */ }
    window.dispatchEvent(new Event('securedesk-theme'));
  }

  return <div className="organization-shell min-h-screen px-4 py-6 sm:px-8 sm:py-8" data-theme={theme}>
    <div className="mx-auto max-w-5xl">
      <a href="#organization-content" className="org-skip-link">Skip to content</a>
      <header className="mb-10 flex flex-wrap items-center justify-between gap-5 border-b border-[var(--org-border)] pb-6">
        <Link href="/account" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg bg-[var(--org-accent-soft)] text-sm text-[var(--org-accent)]">SD</span>
          SecureDesk
        </Link>
        <div className="flex flex-wrap items-center gap-5">
          <nav aria-label="Main navigation" className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium">
            <Link href="/dashboard" prefetch={false} className="org-link">Dashboard</Link><Link href="/tickets" prefetch={false} className="org-link">Tickets</Link><Link href="/organizations" prefetch={false} className="org-link">Organizations</Link>
            <Link href="/account" prefetch={false} className="org-link">Your account</Link>
          </nav>
          <label className="flex items-center gap-2 text-sm text-[var(--org-muted)]">
            Theme
            <select value={theme} onChange={event => changeTheme(event.target.value as Theme)} className="rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-2 text-[var(--org-text)]">
              <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </header>
      <main id="organization-content" tabIndex={-1}>{children}</main>
      <footer className="mt-12 border-t border-[var(--org-border)] py-6 text-xs text-[var(--org-muted)]">SecureDesk · Company workspace</footer>
    </div>
  </div>;
}

