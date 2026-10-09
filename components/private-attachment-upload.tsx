'use client';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

const messages:Record<string,string>={
 invalid:'Choose one supported file up to 10 MB with matching format and content.',
 stale:'The item or your access changed. Reload this page and try again.',
 unavailable:'File storage is temporarily unavailable. Choose the file again and retry.',
};
type Prepared={id:string;bucket:string;path:string;token:string;mime:string};
export function PrivateAttachmentUpload({path,kind,revision,accessRevision,scopeRevision,helpId}:{
 path:string;kind:'ticket'|'proposal';revision:string;accessRevision:string;scopeRevision:string;helpId?:string;
}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();if(busy)return;
  const form=event.currentTarget,file=new FormData(form).get('file');
  if(!(file instanceof File)||file.size<1||file.size>10*1024*1024){setMessage(messages.invalid);setError(true);return;}
  setBusy(true);setError(false);setMessage('Preparing your private upload…');
  try {
   const call=async(input:Record<string,unknown>)=>{
    const result=await fetch(path+'/attachments/transfer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    const data=await result.json();if(!result.ok)throw new Error(typeof data.error==='string'?data.error:'unavailable');return data;
   };
   const prepared=await call({intent:'prepare',name:file.name,mime:file.type,size:file.size,revision,access_revision:accessRevision,
    [kind==='ticket'?'scope_revision':'assignment_revision']:scopeRevision}) as Prepared;
   setMessage('Uploading your private file…');
   const uploaded=await createClient().storage.from(prepared.bucket).uploadToSignedUrl(prepared.path,prepared.token,file,{contentType:prepared.mime});
   if(uploaded.error)throw new Error('unavailable');
   setMessage('Checking your file…');
   await call({intent:'complete',id:prepared.id});
   window.location.assign(path+'?notice=upload');
  }catch(error){setError(true);setMessage(messages[error instanceof Error?error.message:'']??messages.unavailable);setBusy(false);}
 }
 const scopeName=kind==='ticket'?'scope_revision':'assignment_revision';
 return <form action={path+'/attachments'} method="post" encType="multipart/form-data" onSubmit={submit}
  data-ticket-upload={kind==='ticket'?'true':undefined} data-proposal-upload={kind==='proposal'?'true':undefined}
  aria-busy={busy} className="mt-6 space-y-4">
  <input type="hidden" name="revision" value={revision}/>
  <input type="hidden" name="access_revision" value={accessRevision}/>
  <input type="hidden" name={scopeName} value={scopeRevision}/>
  <noscript><p className="org-notice text-sm">Enable JavaScript to upload files up to 10 MB.</p></noscript>
  <label className="org-field">Choose attachment
   <input type="file" name="file" required disabled={busy} accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.csv,.docx"
    aria-describedby={helpId} className="mt-2 block w-full min-w-0 rounded-lg border border-[var(--org-border)] bg-[var(--org-surface)] p-3 text-sm"/>
  </label>
  <button type="submit" disabled={busy} className="org-button">{busy?'Uploading…':'Upload private file'}</button>
  {message&&<p role={error?'alert':'status'} className="org-notice text-sm">{message}</p>}
 </form>;
}
