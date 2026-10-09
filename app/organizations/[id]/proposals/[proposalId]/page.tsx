import { PrivateAttachmentUpload } from '@/components/private-attachment-upload';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { OrganizationUnavailable } from '@/components/organization-state';
import { OrganizationProposalForm } from '@/components/organization-proposal-form';
import type { Proposal, ProposalContext } from '@/lib/organizations/proposals';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project proposal | SecureDesk' };
export default async function ProposalPage({ params, searchParams }: PageProps<'/organizations/[id]/proposals/[proposalId]'>) {
 const access = await organizationAccess();
 if (access.kind==='signed-out') redirect('/login'); if (access.kind==='forbidden') redirect('/account'); if (access.kind==='unavailable') return <OrganizationUnavailable />;
 const { id, proposalId } = await params;
 if (![id,proposalId].every(v=>organizationIdPattern.test(v))) notFound();
 const c = await access.supabase.rpc('organization_proposal_context',{p_organization_id:id});
 const r = await access.supabase.rpc('organization_proposal',{p_organization_id:id,p_proposal_id:proposalId});
 if (c.error?.code==='42501' || r.error?.code==='42501' || !r.error&&!r.data) notFound();
 if (c.error || r.error) return <OrganizationUnavailable />;
 const context=c.data[0] as ProposalContext, proposal=r.data as Proposal, query=await searchParams;
 const path='/organizations/'+id+'/proposals/'+proposalId;
 const files=await access.supabase.from('attachments').select('id,original_name,size_bytes').eq('organization_id',id).eq('project_proposal_id',proposalId).eq('state','ready').order('created_at');
 if(files.error) return <OrganizationUnavailable />;
 let reviewers: {user_id:string;full_name:string}[]=[];
 const search=typeof query.reviewer==='string'?query.reviewer.slice(0,100):'';
 if(context.can_administer&&proposal.status==='pending') {
  const staff=await access.supabase.rpc('proposal_reviewers',{p_organization_id:id,p_search:search});
  if(staff.error) return <OrganizationUnavailable />; reviewers=staff.data;
 }
 const notices: Record<string,string>={submit:'Proposal submitted. You can now add private attachments.',assign:'Reviewer updated.',recommend:'Recommendation saved.',approve:'Proposal approved and project created.',reject:'Proposal rejected.',upload:'Private attachment uploaded.'};
 const notice=typeof query.notice==='string'?notices[query.notice]:null;
 const uploadError=typeof query.upload_error==='string'?{invalid:'Choose a supported file up to 10 MB with matching type and content.',stale:'This proposal or your access changed. Reload before uploading again.',unavailable:'The file could not be stored. Try again later.'}[query.upload_error as 'invalid'|'stale'|'unavailable']:null;
 return <article data-proposal-detail={proposalId}><Link href={'/organizations/'+id+'/proposals'} prefetch={false} className="org-link text-sm">← Project proposals</Link>
 <p className="org-eyebrow mt-8">{proposal.status} proposal</p><h1 className="mt-2 break-words text-3xl font-semibold">{proposal.title}</h1><p className="mt-3 break-words text-[var(--org-muted)]">{context.organization_name}</p>
 {notice&&<p role="status" className="org-panel mt-5 text-sm">{notice}</p>}{uploadError&&<p role="alert" className="org-panel mt-5 text-sm">{uploadError}</p>}
 {context.organization_status!=='active'&&<p className="org-panel mt-5 text-sm">This company is inactive. Proposal history is read-only.</p>}
 <section className="org-panel mt-6"><h2 className="text-lg font-semibold">Proposal details</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2">{[['Author',proposal.author_name],['Estimated priority',proposal.proposed_priority],['Desired deadline',proposal.desired_deadline],['Staff reviewer',proposal.reviewer_name||'Not assigned']].map(([label,value])=><div key={label}><dt className="org-eyebrow">{label}</dt><dd className="mt-2 break-words text-sm">{value}</dd></div>)}</dl><h3 className="mt-6 font-semibold">Description</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{proposal.description}</p><h3 className="mt-6 font-semibold">Business reason</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{proposal.reason}</p></section>
 <section className="org-panel mt-6"><h2 className="text-lg font-semibold">Review and decision</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{proposal.recommendation||'No recommendation yet.'}</p>{proposal.decision_reason&&<p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7">Decision: {proposal.decision_reason}</p>}{proposal.project_id&&<Link href={'/organizations/'+id+'/projects/'+proposal.project_id} prefetch={false} className="org-link mt-5 inline-block text-sm">View approved project</Link>}</section>
 <section className="org-panel mt-6"><h2 className="text-lg font-semibold">Private attachments</h2><p className="mt-3 text-sm leading-6 text-[var(--org-muted)]">JPEG, PNG, WebP, PDF, UTF-8 TXT or CSV, and DOCX. Maximum 10 MB per file. Attachments are downloaded as files.</p>
 {files.data.length===0?<p className="mt-4 text-sm text-[var(--org-muted)]">No attachments yet.</p>:<ul className="mt-5 space-y-4">{files.data.map(f=><li key={f.id} className="break-words text-sm"><a href={path+'/attachments/'+f.id} className="org-link">{f.original_name}</a><span className="ml-3 text-[var(--org-muted)]">{f.size_bytes < 1024 ? f.size_bytes + " B" : f.size_bytes < 1048576 ? (f.size_bytes/1024).toFixed(1) + " KB" : (f.size_bytes/1048576).toFixed(1) + " MB"}</span></li>)}</ul>}
 {proposal.can_upload&&<PrivateAttachmentUpload path={path} kind="proposal" revision={proposal.revision} accessRevision={context.access_revision} scopeRevision={context.assignment_revision || ''}/>}</section>
 {context.can_administer&&proposal.status==='pending'&&<><form className="mt-7 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm">Find Staff reviewer by name or full ID<input name="reviewer" maxLength={100} defaultValue={search} className="mt-2 block w-full rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-3"/></label><button className="org-button">Find reviewers</button></form><p className="mt-3 text-sm text-[var(--org-muted)]">Showing up to 25 eligible Staff members. Search to narrow the choices.</p><OrganizationProposalForm key={'assign'+proposal.revision+search} organization={id} id={proposalId} context={context} proposal={proposal} intent="assign" reviewers={reviewers}/></>}
 {proposal.can_recommend&&<OrganizationProposalForm key={'recommend'+proposal.revision} organization={id} id={proposalId} context={context} proposal={proposal} intent="recommend"/>}
 {context.can_administer&&proposal.status==='pending'&&<div className="grid gap-5 md:grid-cols-2"><OrganizationProposalForm key={'approve'+proposal.revision} organization={id} id={proposalId} context={context} proposal={proposal} intent="approve"/><OrganizationProposalForm key={'reject'+proposal.revision} organization={id} id={proposalId} context={context} proposal={proposal} intent="reject"/></div>}</article>;
}
