import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { OrganizationUnavailable } from '@/components/organization-state';
import { OrganizationProposalForm } from '@/components/organization-proposal-form';
import type { ProposalContext, ProposalSummary } from '@/lib/organizations/proposals';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project proposals | SecureDesk' };
export default async function ProposalsPage({ params, searchParams }: PageProps<'/organizations/[id]/proposals'>) {
 const access = await organizationAccess();
 if (access.kind === 'signed-out') redirect('/login');
 if (access.kind === 'forbidden') redirect('/account');
 if (access.kind === 'unavailable') return <OrganizationUnavailable />;
 const { id } = await params;
 if (!organizationIdPattern.test(id)) notFound();
 const c = await access.supabase.rpc('organization_proposal_context', { p_organization_id: id });
 if (c.error?.code === '42501' || !c.error && !c.data?.length) notFound();
 if (c.error) return <OrganizationUnavailable />;
 const context = c.data[0] as ProposalContext, query = await searchParams;
 const status = typeof query.status === 'string' && ['all','pending','approved','rejected'].includes(query.status) ? query.status : 'all';
 const page = typeof query.page === 'string' && /^[1-9][0-9]{0,3}$/.test(query.page) ? Number(query.page) : 1;
 const r = await access.supabase.rpc('organization_proposals', { p_organization_id: id, p_status: status, p_offset: (page-1)*25 });
 if (r.error?.code === '42501') notFound(); if (r.error) return <OrganizationUnavailable />;
 const rows = r.data as ProposalSummary[], path = '/organizations/' + id + '/proposals', href = (n: number) => path + '?' + new URLSearchParams({ status, page: String(n) });
 return <article><Link href={'/organizations/' + id + '/projects'} prefetch={false} className="org-link text-sm">← Projects</Link>
 <p className="org-eyebrow mt-8">Project review</p><h1 className="mt-2 text-3xl font-semibold">Project proposals</h1><p className="mt-3 break-words text-[var(--org-muted)]">{context.organization_name}</p>
 <p className="mt-4 text-sm leading-7 text-[var(--org-muted)]">Authors see their own proposals. Staff see proposals assigned to them for review. Company administrators make the final decision.</p>
 {context.organization_status !== 'active' && <p role="status" className="org-panel mt-5 text-sm">This company is inactive. Proposal history is read-only.</p>}
 <form className="mt-6 flex flex-wrap items-end gap-3"><label className="text-sm">Status<select name="status" defaultValue={status} className="mt-2 block rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-3">{['all','pending','approved','rejected'].map(s => <option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select></label><button className="org-button">Apply filter</button></form>
 <section aria-label="Visible proposals" className="mt-6 grid gap-5 md:grid-cols-2">{rows.slice(0,25).map(p => <article key={p.id} data-proposal-record={p.id} className="org-panel"><p className="org-eyebrow">{p.status}</p><h2 className="mt-3 break-words text-lg font-semibold"><Link href={path+'/'+p.id} prefetch={false} className="org-link">{p.title}</Link></h2><p className="mt-4 text-sm text-[var(--org-muted)]">{p.proposed_priority} priority · Desired deadline {p.desired_deadline}</p><Link href={path+'/'+p.id} prefetch={false} className="org-link mt-5 inline-block text-sm">View proposal</Link></article>)}
 {rows.length===0 && <div className="org-panel md:col-span-2"><h2 className="text-lg font-semibold">No matching proposals</h2><p className="mt-3 text-sm text-[var(--org-muted)]">No proposals are available to you on this page and status.</p>{page>1 && <Link href={href(1)} prefetch={false} className="org-link mt-4 inline-block">Go to first page</Link>}</div>}</section>
 <nav aria-label="Proposal pages" className="mt-6 flex justify-between text-sm"><span>{page>1 && <Link href={href(page-1)} prefetch={false} className="org-link">Previous page</Link>}</span><span>Page {page}</span><span>{rows.length>25 && page<9999 && <Link href={href(page+1)} prefetch={false} className="org-link">Next page</Link>}</span></nav>
 {context.can_submit && <OrganizationProposalForm organization={id} id={randomUUID()} context={context} />}</article>;
}
