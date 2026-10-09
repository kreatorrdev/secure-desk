import { inflateRawSync } from 'node:zlib';
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const types: Record<string,string> = { jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf',txt:'text/plain',csv:'text/csv',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
export class InvalidAttachment extends Error { constructor() { super('Unsupported or invalid attachment.'); } }
const fail = (): never => { throw new InvalidAttachment(); };
export function crc32(data: Uint8Array): number {
 let crc=0xffffffff;
 for(const byte of data){crc^=byte; for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function png(bytes: Buffer) {
 if(bytes.length<57 || !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) fail();
 let offset=8,header=false,data=false,end=false;
 while(offset+12<=bytes.length) {
  const length=bytes.readUInt32BE(offset), type=bytes.toString('ascii',offset+4,offset+8);
  if(length>bytes.length-offset-12 || !/^[A-Za-z]{4}$/.test(type)) fail();
  if(crc32(bytes.subarray(offset+4,offset+8+length))!==bytes.readUInt32BE(offset+8+length)) fail();
  if(!header){if(type!=='IHDR'||length!==13||bytes.readUInt32BE(offset+8)===0||bytes.readUInt32BE(offset+12)===0)fail();header=true;}
  else if(type==='IHDR')fail();
  if(type==='IDAT')data=true;
  if(type==='IEND'){if(length!==0||!data)fail();end=true;offset+=12;break;}
  offset+=length+12;
 }
 if(!end||offset!==bytes.length)fail();
}
function jpeg(bytes: Buffer) {
 if(bytes.length<12 || bytes[0]!==255 || bytes[1]!==216 || bytes[bytes.length-2]!==255 || bytes[bytes.length-1]!==217)fail();
 let offset=2,frame=false,scan=false;
 while(offset<bytes.length-2){
  if(bytes[offset++]!==255)fail();
  while(bytes[offset]===255)offset++;
  const marker=bytes[offset++];if(marker===0||marker===216||marker===217)fail();
  if(marker>=0xd0&&marker<=0xd7)continue;
  if(offset+2>bytes.length)fail();const length=bytes.readUInt16BE(offset);
  if(length<2||offset+length>bytes.length-2)fail();
  if([0xc0,0xc1,0xc2].includes(marker)){if(length<8||bytes.readUInt16BE(offset+3)===0||bytes.readUInt16BE(offset+5)===0)fail();frame=true;}
  if(marker===0xda){if(!frame||length<6)fail();scan=true;break;}
  offset+=length;
 }
 if(!frame||!scan)fail();
}
function webp(bytes: Buffer) {
 if(bytes.length<20||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP'||bytes.readUInt32LE(4)+8!==bytes.length)fail();
 let offset=12,data=false;
 while(offset+8<=bytes.length){const type=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4);if(length>bytes.length-offset-8)fail();if(['VP8 ','VP8L','VP8X'].includes(type)&&length>0)data=true;offset+=8+length+(length%2);}
 if(offset!==bytes.length||!data)fail();
}
function docx(bytes: Buffer) {
 // Bound archive size, entry count and decompression. No executable or external relationship parts.
 let eocd=-1;
 for(let n=bytes.length-22;n>=Math.max(0,bytes.length-65557);n--)if(bytes.readUInt32LE(n)===0x06054b50){eocd=n;break;}
 if(eocd<0||bytes.readUInt16LE(eocd+4)!==0||bytes.readUInt16LE(eocd+6)!==0||eocd+22+bytes.readUInt16LE(eocd+20)!==bytes.length)fail();
 const count=bytes.readUInt16LE(eocd+10),size=bytes.readUInt32LE(eocd+12),start=bytes.readUInt32LE(eocd+16);
 if(count<3||count>1000||bytes.readUInt16LE(eocd+8)!==count||start+size!==eocd)fail();
 const entries=new Map<string,Buffer>();let offset=start,total=0;
 for(let n=0;n<count;n++){
  if(offset+46>eocd||bytes.readUInt32LE(offset)!==0x02014b50)fail();
  const flags=bytes.readUInt16LE(offset+8),method=bytes.readUInt16LE(offset+10),crc=bytes.readUInt32LE(offset+16),compressed=bytes.readUInt32LE(offset+20),expanded=bytes.readUInt32LE(offset+24),nameLength=bytes.readUInt16LE(offset+28),extra=bytes.readUInt16LE(offset+30),comment=bytes.readUInt16LE(offset+32),local=bytes.readUInt32LE(offset+42);
  if(flags&1||![0,8].includes(method)||offset+46+nameLength+extra+comment>eocd||expanded>20*1024*1024||(total+=expanded)>40*1024*1024||local+30>start||bytes.readUInt32LE(local)!==0x04034b50)fail();
  const name=bytes.toString('utf8',offset+46,offset+46+nameLength);
  if(!name||name.includes('\\')||name.startsWith('/')||name.split('/').includes('..')||entries.has(name)||/vba|activex|embeddings|\.exe$|\.js$|\.html?$/i.test(name))fail();
  if(bytes.readUInt16LE(local+6)!==flags||bytes.readUInt16LE(local+8)!==method)fail();
  const localNameLength=bytes.readUInt16LE(local+26),localExtra=bytes.readUInt16LE(local+28),begin=local+30+localNameLength+localExtra;
  if(bytes.toString('utf8',local+30,local+30+localNameLength)!==name||begin+compressed>start)fail();
  let content: Buffer;
  try { content=method===0?bytes.subarray(begin,begin+compressed):inflateRawSync(bytes.subarray(begin,begin+compressed),{maxOutputLength:Math.max(1,expanded)}); } catch { return fail(); }
  if(content.length!==expanded||crc32(content)!==crc)fail();
  if(/\.(xml|rels)$/i.test(name)){
   let xml:string;try{xml=new TextDecoder('utf-8',{fatal:true}).decode(content);}catch{return fail();}
   if(/<!DOCTYPE|<!ENTITY|macroEnabled|TargetMode\s*=\s*["']External["']/i.test(xml))fail();
  }
  entries.set(name,content);offset+=46+nameLength+extra+comment;
 }
 if(offset!==eocd||!entries.has('[Content_Types].xml')||!entries.has('_rels/.rels')||!entries.has('word/document.xml'))fail();
 if(!entries.get('[Content_Types].xml')!.toString().includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml')
 ||!/<(?:\w+:)?document\b/.test(entries.get('word/document.xml')!.toString()))fail();
}
export function validateAttachmentMetadata(name: string, suppliedType: string, size: number): string {
 if(!name||[...name].length>200||/[/\\\u0000-\u001f\u007f]/.test(name)||!Number.isInteger(size)||size<1||size>MAX_ATTACHMENT_BYTES)fail();
 const ext=name.split('.').pop()?.toLowerCase()||'',mime=types[ext];
 if(!mime||suppliedType!==mime)fail();
 return mime;
}
export function validateAttachment(name: string, suppliedType: string, bytes: Buffer): string {
 const mime=validateAttachmentMetadata(name,suppliedType,bytes.length);
 const ext=name.split('.').pop()?.toLowerCase()||'';
 if(ext==='png')png(bytes);
 else if(ext==='jpg'||ext==='jpeg')jpeg(bytes);
 else if(ext==='webp')webp(bytes);
 else if(ext==='pdf'){
  const text=bytes.toString('latin1');
  if(!/^%PDF-(1\.[0-7]|2\.0)[\r\n]/.test(text)||!/(?:\r|\n)%%EOF[\r\n\t ]*$/.test(text)||!/\/Type\s*\/Catalog\b/.test(text)||!/\/Type\s*\/Page\b/.test(text)||!/startxref\s+\d+/.test(text)||/\/(?:JavaScript|JS|Launch|EmbeddedFile|RichMedia|OpenAction)\b/i.test(text))fail();
 } else if(ext==='docx')docx(bytes);
 else {
  let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return fail();}
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))fail();
 }
 return mime;
}
