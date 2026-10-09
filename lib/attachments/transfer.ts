import 'server-only';
import { createHash } from 'node:crypto';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { createStorageClient } from '@/lib/supabase/storage-server';
import { validateAttachment, validateAttachmentMetadata } from './validation';
import { boundedBody, privateHeaders } from './http';

type Kind='ticket'|'proposal';
type Metadata={id:string;storage_path:string;original_name:string;mime_type:string;size_bytes:number;state:string;sha256:string|null;expires_at:string};
const quarantine='attachment-quarantine';
const revision=/^[1-9][0-9]{0,17}$/;
const response=(status:number,error:string)=>Response.json({error},{status,headers:privateHeaders});
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

export async function attachmentTransfer(request:Request,kind:Kind,organization:string,parent:string) {
 if(![organization,parent].every(v=>organizationIdPattern.test(v)))return response(404,'unavailable');
 const site=process.env.SITE_URL;
 if(!site||request.headers.get('origin')!==new URL(site).origin)return response(403,'unavailable');
 const access=await organizationAccess();if(access.kind!=='allowed')return response(404,'unavailable');
 const user=await access.supabase.auth.getUser();if(!user.data.user)return response(404,'unavailable');
 const actor=user.data.user.id;
 let input:Record<string,unknown>;
 try {
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw Error();
  input=JSON.parse((await boundedBody(request,4096)).toString('utf8'));
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error();
 } catch {return response(400,'invalid');}
 let storage:ReturnType<typeof createStorageClient>;
 try{storage=createStorageClient();}catch{return response(503,'unavailable');}
 const bucket=kind==='ticket'?'ticket-attachments':'proposal-attachments';
 const args=(id:string)=>({p_organization_id:organization,p_parent_id:parent,p_parent_kind:kind,p_attachment_id:id,p_actor_id:actor});
 const metadata=async(id:string)=>{
  const result=await storage.rpc('attachment_transfer_metadata',args(id));
  if(result.error)throw Error('Transfer metadata unavailable');
  return result.data as Metadata|null;
 };
 const compensate=async(file:Metadata)=>{
  const result=await storage.rpc('abort_'+kind+'_attachment',{p_attachment_id:file.id,p_actor_id:actor});
  // Ready rows survive a lost completion response. A deleted reservation cannot
  // be completed later, so a late orphaned copy can be removed safely.
  if(!result.error&&(result.data===file.storage_path||await metadata(file.id)===null))
   await storage.storage.from(bucket).remove([file.storage_path]);
 };
 try {
  if(input.intent==='prepare') {
   const scope=kind==='ticket'?'scope_revision':'assignment_revision';
   const allowed=new Set(['intent','name','mime','size','revision','access_revision',scope]);
   if(Object.keys(input).some(k=>!allowed.has(k))||typeof input.name!=='string'||typeof input.mime!=='string'||typeof input.size!=='number'
    ||typeof input.revision!=='string'||!revision.test(input.revision)||typeof input.access_revision!=='string'||!revision.test(input.access_revision)
    ||typeof input[scope]!=='string'||(input[scope]!==''&&!revision.test(input[scope] as string)&&!(kind==='ticket'&&organizationIdPattern.test(input[scope] as string))))return response(400,'invalid');
   let mime:string;try{mime=validateAttachmentMetadata(input.name,input.mime,input.size);}catch{return response(400,'invalid');}
   const reservation=await access.supabase.rpc('reserve_'+kind+'_attachment',{
    p_organization_id:organization,[kind==='ticket'?'p_ticket_id':'p_proposal_id']:parent,
    p_expected_revision:input.revision,p_expected_access_revision:input.access_revision,
    [kind==='ticket'?'p_expected_scope':'p_expected_assignment_revision']:input[scope]||null,
    p_name:input.name,p_mime:mime,p_size:input.size,
   });
   if(reservation.error||!reservation.data?.[0])return response(409,'stale');
   const reserved=reservation.data[0] as {id:string;storage_path:string};
   // A bearer capability writes quarantine only; it cannot read or replace a permanent file.
   const signed=await storage.storage.from(quarantine).createSignedUploadUrl(reserved.id,{upsert:false});
   if(signed.error||!signed.data){await storage.rpc('abort_'+kind+'_attachment',{p_attachment_id:reserved.id,p_actor_id:actor});return response(503,'unavailable');}
   return Response.json({id:reserved.id,bucket:quarantine,path:signed.data.path,token:signed.data.token,mime},{headers:privateHeaders});
  }
  if(input.intent!=='complete'||Object.keys(input).some(k=>!['intent','id'].includes(k))||typeof input.id!=='string'||!organizationIdPattern.test(input.id))return response(400,'invalid');
  const file=await metadata(input.id);if(!file)return response(404,'unavailable');
  const readable=()=>access.supabase.rpc(kind+'_attachment',{
   p_organization_id:organization,[kind==='ticket'?'p_ticket_id':'p_proposal_id']:parent,p_attachment_id:file.id,
  });
  if(file.state==='ready'){
   const current=await readable();return current.error||!current.data?response(404,'unavailable'):Response.json({id:file.id},{headers:privateHeaders});
  }
  if(file.state!=='uploading'||Date.parse(file.expires_at)<=Date.now()){await compensate(file);return response(409,'stale');}
  if(kind==='ticket'){
   const [row,context]=await Promise.all([
    access.supabase.from('tickets').select('id').eq('organization_id',organization).eq('id',parent).maybeSingle(),
    access.supabase.rpc('ticket_context',{p_organization_id:organization}),
   ]);
   if(row.error||!row.data||context.error||context.data?.[0]?.organization_status!=='active')return response(404,'unavailable');
  }else{
   const row=await access.supabase.rpc('organization_proposal',{p_organization_id:organization,p_proposal_id:parent});
   if(row.error||!row.data?.can_upload)return response(404,'unavailable');
  }
  const pending=await storage.storage.from(quarantine).download(file.id);
  // Delayed upload completion is retryable; missing bytes do not cancel the reservation.
  if(pending.error||!pending.data)return response(503,'unavailable');
  const bytes=Buffer.from(await pending.data.arrayBuffer());
  try {
   if(bytes.length!==file.size_bytes||validateAttachment(file.original_name,file.mime_type,bytes)!==file.mime_type)throw Error();
  }catch{await compensate(file);await storage.storage.from(quarantine).remove([file.id]);return response(400,'invalid');}
  const sha=hash(bytes);let complete=false;
  try {
   const copied=await storage.storage.from(bucket).upload(file.storage_path,bytes,{contentType:file.mime_type,upsert:false});
   if(copied.error){
    const existing=await storage.storage.from(bucket).download(file.storage_path);
    if(existing.error||!existing.data||existing.data.size!==bytes.length||hash(Buffer.from(await existing.data.arrayBuffer()))!==sha)return response(503,'unavailable');
   }
   const finalized=await storage.rpc('complete_'+kind+'_attachment',{p_attachment_id:file.id,p_actor_id:actor,p_sha256:sha});
   if(finalized.error)return response(409,'stale');
   complete=true;return Response.json({id:file.id},{headers:privateHeaders});
  }finally {
   if(!complete)await compensate(file);
   await storage.storage.from(quarantine).remove([file.id]);
  }
 }catch{return response(503,'unavailable');}
}
