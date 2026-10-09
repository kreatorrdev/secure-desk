import 'server-only';
export const privateHeaders = { 'Cache-Control':'private, no-store, max-age=0', 'X-Content-Type-Options':'nosniff' };
export function attachmentUnavailable() { return new Response('Attachment not available.',{status:404,headers:privateHeaders}); }
export async function boundedBody(request: Request, max: number): Promise<Buffer> {
 const length=request.headers.get('content-length');
 if(request.headers.get('content-encoding') || length && (!/^\d+$/.test(length)||Number(length)>max)) throw new Error('Invalid body');
 if(!request.body)throw new Error('Missing body');
 const reader=request.body.getReader();const chunks:Uint8Array[]=[];let total=0;
 try {
  for(;;){const part=await reader.read();if(part.done)break;total+=part.value.byteLength;if(total>max){await reader.cancel();throw new Error('Body too large');}chunks.push(part.value);}
 }finally{reader.releaseLock();}
 return Buffer.concat(chunks);
}
