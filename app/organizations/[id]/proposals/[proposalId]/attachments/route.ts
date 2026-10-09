import { createHash } from 'node:crypto';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { proposalField as field, proposalVersion as version } from '@/lib/organizations/proposals';
import { createStorageClient } from '@/lib/supabase/storage-server';
import { MAX_ATTACHMENT_BYTES, validateAttachment } from '@/lib/attachments/validation';
import { attachmentUnavailable, boundedBody, privateHeaders } from '@/lib/attachments/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request: Request, ctx: RouteContext<'/organizations/[id]/proposals/[proposalId]/attachments'>) {
 const {id,proposalId}=await ctx.params;
 if(![id,proposalId].every(v=>organizationIdPattern.test(v)))return attachmentUnavailable();
 // Route Handlers need an explicit CSRF boundary, including unauthenticated requests.
 const site=process.env.SITE_URL;
 if(!site||request.headers.get('origin')!==new URL(site).origin)return new Response('Request origin is unavailable.',{status:403,headers:privateHeaders});
 const access=await organizationAccess();if(access.kind!=='allowed')return attachmentUnavailable();
 const user=await access.supabase.auth.getUser();if(!user.data.user)return attachmentUnavailable();
 const proposal=await access.supabase.rpc('organization_proposal',{p_organization_id:id,p_proposal_id:proposalId});
 if(proposal.error||!proposal.data?.can_upload)return attachmentUnavailable();
 const redirect=(error:string)=>new Response(null,{status:303,headers:{...privateHeaders,Location:'/organizations/'+id+'/proposals/'+proposalId+'?'+(error?'upload_error='+error:'notice=upload')}});
 let form: FormData, bytes: Buffer, file: File, mime: string;
 try{
  const body=await boundedBody(request,MAX_ATTACHMENT_BYTES+65536);
  const parsed=new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')||''},body:new Uint8Array(body)});
  form=await parsed.formData();
  const uploaded=form.getAll('file');if(uploaded.length!==1||!(uploaded[0] instanceof File))throw new Error('Invalid file');
  file=uploaded[0];bytes=Buffer.from(await file.arrayBuffer());mime=validateAttachment(file.name,file.type,bytes);
  if(!version(field(form,'revision'))||!version(field(form,'access_revision'))||(field(form,'assignment_revision')!==''&&!version(field(form,'assignment_revision'))))throw new Error('Invalid form');
 }catch{return redirect('invalid');}
 let storage: ReturnType<typeof createStorageClient>;
 try{storage=createStorageClient();}catch{return redirect('unavailable');}
 const reservation=await access.supabase.rpc('reserve_proposal_attachment',{p_organization_id:id,p_proposal_id:proposalId,p_expected_revision:field(form,'revision'),p_expected_access_revision:field(form,'access_revision'),p_expected_assignment_revision:field(form,'assignment_revision')||null,p_name:file.name,p_mime:mime,p_size:bytes.length});
 if(reservation.error||!reservation.data?.[0])return redirect('stale');
 const reserved=reservation.data[0] as {id:string;storage_path:string};
 let complete=false;
 try {
  const uploaded=await storage.storage.from('proposal-attachments').upload(reserved.storage_path,bytes,{contentType:mime,upsert:false});
  if(uploaded.error)return redirect('unavailable');
  const finalized=await storage.rpc('complete_proposal_attachment',{p_attachment_id:reserved.id,p_actor_id:user.data.user.id,p_sha256:createHash('sha256').update(bytes).digest('hex')});
  if(finalized.error)return redirect('stale');
  complete=true;return redirect('');
 }catch{return redirect('unavailable');}
 finally{
  if(!complete){
   // Claim compensation in the DB first. A committed completion returns no cleanup path.
   const aborted=await Promise.resolve(storage.rpc('abort_proposal_attachment',{p_attachment_id:reserved.id,p_actor_id:user.data.user.id})).catch(()=>null);
   if(aborted && !aborted.error && aborted.data===reserved.storage_path)await storage.storage.from('proposal-attachments').remove([reserved.storage_path]).catch(()=>undefined);
  }
 }
}
