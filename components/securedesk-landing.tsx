"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { startLaptop } from "@/lib/presentation/laptop";
import { startConnections } from "@/lib/presentation/connections";
import "./securedesk-landing.css";

type IconName = "access" | "messages" | "check" | "lock" | "building" | "tickets" | "file" | "history" | "grid";
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    access: <><circle cx="9" cy="7" r="3" /><path d="M3 20v-2a6 6 0 0 1 9-5m2 4 3 3 5-6" /></>,
    messages: <><path d="M20 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12l4-4h8" /><path d="M10 17v1a2 2 0 0 0 2 2h6l3 3V10h-1" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
    building: <><rect x="6" y="3" width="12" height="18" rx="1" /><path d="M6 8H3v13h18V8h-3M10 7h4m-4 4h4m-4 4h4m-4 6v-3h4v3" /></>,
    tickets: <><path d="M4 6h6l2 3h8v12H4zM7 3h13v3" /><path d="M8 13h8m-8 4h5" /></>,
    file: <><path d="M14 2H5v20h14V7zm0 0v5h5" /><rect x="8" y="13" width="8" height="6" rx="1" /><path d="M10 13v-2a2 2 0 0 1 4 0v2" /></>,
    history: <><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v6l4 2" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const roles = {
  client: { symbol: "C", label: "Client", heading: "Your tickets", description: "Follow your own and explicitly shared tickets in your company.", permissions: ["Open and follow a support request", "View permitted private attachments", "Review a proposed solution"], boundary: "Another company's tickets remain outside your access." },
  staff: { symbol: "S", label: "Staff", heading: "Your work queue", description: "Work in assigned companies on tickets you own or collaborate on.", permissions: ["Reply and update ticket progress", "Work with permitted ticket files", "Propose a solution to the client"], boundary: "Company assignment and ticket scope determine what staff can access." },
  admin: { symbol: "A", label: "Admin", heading: "Company administration", description: "Manage people and support access within your assigned company scope.", permissions: ["Review account and membership requests", "Manage company access", "Review project decisions and audit history"], boundary: "Organization Admin access stays scoped. SuperAdmin has a separate global role." },
};
type Role = keyof typeof roles;

export function SecureDeskLanding() {
  const [role, setRole] = useState<Role>("client");
  const photoRef = useRef<HTMLImageElement>(null), laptopRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null), connectionsRef = useRef<HTMLCanvasElement>(null);
  const selected = roles[role];
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    if (laptopRef.current && photoRef.current) cleanups.push(startLaptop(laptopRef.current, photoRef.current));
    if (connectionsRef.current && sectionRef.current) cleanups.push(startConnections(connectionsRef.current, sectionRef.current));
    return () => cleanups.forEach(cleanup => cleanup());
  }, []);

  return <div className="securedesk-landing">
    <a href="#landing-content" className="dv-skip">Skip to content</a>
    <header className="dv-nav dv-container">
      <Link href="/" className="dv-brand" aria-label="SecureDesk home"><span aria-hidden="true">SD</span>SecureDesk</Link>
      <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><Link href="/demo" prefetch={false}>Try demo</Link><Link href="/login" prefetch={false}>Sign in <span aria-hidden="true">↗</span></Link></nav>
    </header>
    <main id="landing-content">
      <section className="dv-hero" aria-labelledby="dv-title">
        <div className="dv-intro dv-container"><p className="dv-kicker">A clearer way to support your clients</p>
          <h1 id="dv-title">Less back and forth.<br /><span>A clearer way forward.</span></h1>
          <p className="dv-lead">Keep company tickets, project requests and private files together. Give clients and support teams a shared path from the first request to the final resolution.</p>
          <div className="dv-actions"><Link href="/demo" prefetch={false} className="dv-button">Try demo <span aria-hidden="true">→</span></Link><a href="#how-it-works" className="dv-text-link">See how it works <span aria-hidden="true">↓</span></a></div>
          <p className="dv-access-note"><Icon name="lock" />Explore with fictional data. No account needed.</p>
        </div>
        <div className="dv-laptop" role="img" aria-label="Photographic laptop with an automatically scrolling illustrative SecureDesk ticket list. The requests shown are fictional.">
          {/* This locally optimized 76 KB photo is also the canvas texture. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={photoRef} src="/securedesk/laptop.jpg" width="1448" height="1086" alt="A silver laptop on a dark blue studio surface" fetchPriority="high" />
          <canvas ref={laptopRef} width="1448" height="1086" aria-hidden="true" />
        </div>
      </section>
      <div className="dv-connected" ref={sectionRef}>
        <canvas className="dv-connections" ref={connectionsRef} aria-hidden="true" />
        <section id="how-it-works" className="dv-workflow dv-container" aria-labelledby="dv-workflow-title">
          <div className="dv-section-title"><p className="dv-eyebrow">The support workflow</p><h2 id="dv-workflow-title">One request.<br /><span>Connected from start to finish.</span></h2><p>People, context and the next step — together.</p></div>
          <div className="dv-steps">
            <article><span className="dv-step-icon"><Icon name="access" /></span><p className="dv-number">01 / ACCESS</p><h3>Join your company.</h3><p>Verify your email and request access. An administrator reviews your account and company membership.</p><div className="dv-step-footer">Reviewed access <span aria-hidden="true">↗</span></div></article>
            <article><span className="dv-step-icon"><Icon name="messages" /></span><p className="dv-number">02 / COLLABORATION</p><h3>Start a conversation.</h3><p>Open a ticket, explain the problem and attach relevant files. Follow replies and status updates in one place.</p><div className="dv-step-footer">One connected thread <span aria-hidden="true">↗</span></div></article>
            <article><span className="dv-step-icon"><Icon name="check" /></span><p className="dv-number">03 / RESOLUTION</p><h3>Review the solution.</h3><p>Confirm that the issue is solved, or request a continuation for the same problem within the review window.</p><div className="dv-step-footer">Client confirmation <span aria-hidden="true">↗</span></div></article>
          </div>
        </section>
        <section className="dv-roles dv-container" aria-labelledby="dv-roles-title">
          <div><p className="dv-eyebrow">The right people. The right context.</p><h2 id="dv-roles-title">Built for every<br /><span>side of support.</span></h2><p className="dv-role-copy">Everyone gets the context they need, with access defined by their role and company.</p>
            <div className="dv-role-picker" aria-label="Explore roles">{(Object.keys(roles) as Role[]).map(key => <button key={key} type="button" aria-pressed={key===role} aria-controls="dv-role-preview" onClick={() => setRole(key)}>{roles[key].label}</button>)}</div>
          </div>
          <div className="dv-role-preview" id="dv-role-preview" aria-live="polite" aria-atomic="true"><div className="dv-role-head"><span className="dv-role-symbol" aria-hidden="true">{selected.symbol}</span><div><p className="dv-number">Example view</p><h3>{selected.heading}</h3></div><Icon name="grid" /></div><p>{selected.description}</p><ul>{selected.permissions.map(permission => <li key={permission}><span aria-hidden="true">✓</span>{permission}</li>)}</ul><p className="dv-boundary"><Icon name="lock" />{selected.boundary}</p></div>
        </section>
        <section className="dv-capabilities dv-container" aria-labelledby="dv-capabilities-title"><div className="dv-section-title"><p className="dv-eyebrow">The workspace, connected</p><h2 id="dv-capabilities-title">A place for every request.<br /><span>A boundary for every role.</span></h2></div>
          <div className="dv-feature-grid">
            <article><div className="dv-feature-art" aria-hidden="true"><span className="dv-context-icon"><Icon name="building" /></span><span className="dv-context-line" /><span className="dv-context-icon dv-context-active"><Icon name="tickets" /></span></div><div className="dv-feature-copy"><p className="dv-number">01 / COMPANY CONTEXT</p><h3>Keep the right work together.</h3><p>Separate company spaces, project context and controlled ticket collaboration.</p></div></article>
            <article><div className="dv-feature-art" aria-hidden="true"><span className="dv-private-file"><Icon name="file" />Private attachment<span>✓</span></span></div><div className="dv-feature-copy"><p className="dv-number">02 / PRIVATE FILES</p><h3>Share files within boundaries.</h3><p>Attachment access is checked against the current user, role and company context.</p></div></article>
            <article><div className="dv-feature-art dv-history-art" aria-hidden="true"><span><Icon name="messages" />Comment</span><span><Icon name="check" />Resolution</span><span><Icon name="history" />History</span></div><div className="dv-feature-copy"><p className="dv-number">03 / TRACEABLE HISTORY</p><h3>Keep the story connected.</h3><p>Follow comments, status changes and administrative decisions in their context.</p></div></article>
          </div>
        </section>
        <section className="dv-final"><div className="dv-container"><div><p className="dv-eyebrow">Your next step</p><h2>Bring support<br /><span>into focus.</span></h2><p>Try the interactive walkthrough, or sign in to your approved company workspace.</p></div><Link href="/demo" prefetch={false} className="dv-button">Try demo <span aria-hidden="true">→</span></Link></div></section>
      </div>
    </main>
    <footer className="dv-footer dv-container"><span>SecureDesk · Company support, connected.</span><span>Interactive product demo</span></footer>
  </div>;
}
