import {test}from'node:test';import assert from'node:assert/strict';
import{validateAttachmentMetadata,MAX_ATTACHMENT_BYTES}from'../lib/attachments/validation.ts';
import{attachmentStream}from'../lib/attachments/stream.ts';
test('Upload metadata accepts exact 10 MiB, but never substitutes for content validation',()=>{
 assert.equal(validateAttachmentMetadata('evidence.txt','text/plain',MAX_ATTACHMENT_BYTES),'text/plain');
 for(const[name,mime,size]of[['fake.png','text/plain',3],['bad.svg','image/svg+xml',3],['../proof.txt','text/plain',3],['proof.txt','text/plain',0],['proof.txt','text/plain',MAX_ATTACHMENT_BYTES+1],['proof.txt','text/plain',1.5]])assert.throws(()=>validateAttachmentMetadata(name,mime,size));
});
test('10 MiB stream preserves every byte across bounded chunks',async()=>{
 const bytes=new Uint8Array(MAX_ATTACHMENT_BYTES);for(let i=0;i<bytes.length;i++)bytes[i]=i%251;
 const reader=attachmentStream(bytes).getReader();let offset=0,chunks=0;
 for(;;){const item=await reader.read();if(item.done)break;assert.ok(item.value.length<=65536);assert.deepEqual(item.value,bytes.subarray(offset,offset+item.value.length));offset+=item.value.length;chunks++;}
 assert.equal(offset,MAX_ATTACHMENT_BYTES);assert.equal(chunks,160);
});
