import { attachmentStream } from '@/lib/attachments/stream';
import { createHash } from 'node:crypto';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { createStorageClient } from '@/lib/supabase/storage-server';
import { attachmentUnavailable, privateHeaders } from '@/lib/attachments/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request: Request, ctx: RouteContext<'/organizations/[id]/proposals/[proposalId]/attachments/[attachmentId]'>) {
 const {id,proposalId,attachmentId}=await ctx.params;
 if(![id,proposalId,attachmentId].every(v=>organizationIdPattern.test(v)))return attachmentUnavailable();
 const access=await organizationAccess();if(access.kind!=='allowed')return attachmentUnavailable();
 const args={p_organization_id:id,p_proposal_id:proposalId,p_attachment_id:attachmentId};
 const metadata=await access.supabase.rpc('proposal_attachment',args);if(metadata.error||!metadata.data)return attachmentUnavailable();
 const file=metadata.data as {storage_path:string;original_name:string;mime_type:string;size_bytes:number;sha256:string};
 try {
  const storage=createStorageClient(),download=await storage.storage.from('proposal-attachments').download(file.storage_path);
  if(download.error||!download.data)return attachmentUnavailable();
  const bytes=Buffer.from(await download.data.arrayBuffer());
  if(bytes.length!==file.size_bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)return attachmentUnavailable();
  // Re-check live parent authorization after fetching file bytes; no reusable signed URL is issued.
  const current=await access.supabase.rpc('proposal_attachment',args);if(current.error||!current.data)return attachmentUnavailable();
  const encoded=encodeURIComponent(file.original_name).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
  return new Response(attachmentStream(new Uint8Array(bytes)),{headers:{...privateHeaders,'Content-Type':'application/octet-stream','Content-Length':String(bytes.length),'Content-Disposition':"attachment; filename=\"attachment\"; filename*=UTF-8''"+encoded,'Content-Security-Policy':"sandbox; default-src 'none'",'Referrer-Policy':'no-referrer'}});
 }catch{return attachmentUnavailable();}
}
