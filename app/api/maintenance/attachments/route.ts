import { createHash, timingSafeEqual } from 'node:crypto';
import { createStorageClient } from '@/lib/supabase/storage-server';
import { privateHeaders } from '@/lib/attachments/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request) {
 const secret=process.env.CRON_SECRET;
 if(!secret||secret.length<32)return new Response('Maintenance unavailable.',{status:503,headers:privateHeaders});
 const digest=(value:string)=>createHash('sha256').update(value).digest();
 if(!timingSafeEqual(digest(request.headers.get('authorization')??''),digest('Bearer '+secret)))
  return new Response('Maintenance unavailable.',{status:401,headers:privateHeaders});
 try {
  const storage=createStorageClient(),batch=await storage.rpc('attachment_cleanup_batch',{p_limit:100});
  if(batch.error||!Array.isArray(batch.data))throw Error();
  let removed=0;
  for(const bucket of ['attachment-quarantine','ticket-attachments','proposal-attachments']){
   const paths=batch.data.filter((item:{bucket:string;path:string})=>item.bucket===bucket).map((item:{path:string})=>item.path);
   if(paths.length){const result=await storage.storage.from(bucket).remove(paths);if(result.error)throw Error();removed+=paths.length;}
  }
  return Response.json({removed},{headers:privateHeaders});
 }catch{return new Response('Maintenance unavailable.',{status:503,headers:privateHeaders});}
}
