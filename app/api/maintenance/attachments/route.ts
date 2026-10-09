import { createHash, timingSafeEqual } from 'node:crypto';
import { createStorageClient } from '@/lib/supabase/storage-server';
import { privateHeaders } from '@/lib/attachments/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request) {
 const secret=process.env.CRON_SECRET;
 if(!secret||secret.length<32){
  console.warn('SecureDesk attachment maintenance unavailable.',{stage:'cron-configuration'});
  return new Response('Maintenance unavailable.',{status:503,headers:privateHeaders});
 }
 const digest=(value:string)=>createHash('sha256').update(value).digest();
 if(!timingSafeEqual(digest(request.headers.get('authorization')??''),digest('Bearer '+secret)))
  return new Response('Maintenance unavailable.',{status:401,headers:privateHeaders});
 let stage='storage-client',code='unclassified';
 // Provider messages can contain request details. Log only a stage and allowlisted code.
 const safeCode=(value:unknown)=>typeof value==='string'&&['42501','PGRST202','PGRST301','PGRST302','23514','22P02','XX000'].includes(value)?value:'unclassified';
 try {
  const storage=createStorageClient();stage='batch-selection';
  const batch=await storage.rpc('attachment_cleanup_batch',{p_limit:100});
  if(batch.error||!Array.isArray(batch.data)){code=safeCode(batch.error?.code);throw Error();}
  let removed=0;
  for(const bucket of ['attachment-quarantine','ticket-attachments','proposal-attachments']){
   const paths=batch.data.filter((item:{bucket:string;path:string})=>item.bucket===bucket).map((item:{path:string})=>item.path);
   if(paths.length){stage='storage-delete';const result=await storage.storage.from(bucket).remove(paths);if(result.error)throw Error();removed+=paths.length;}
  }
  return Response.json({removed},{headers:privateHeaders});
 }catch{
  console.warn('SecureDesk attachment maintenance unavailable.',{stage,code});
  return new Response('Maintenance unavailable.',{status:503,headers:privateHeaders});
 }
}
