import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync, deflateSync } from 'node:zlib';
import { MAX_ATTACHMENT_BYTES, InvalidAttachment, validateAttachment, crc32 } from '../lib/attachments/validation.ts';
const utf8=s=>Buffer.from(s);
const chunk=(name,data)=>{const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(name,4);data.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,b.length-4)),b.length-4);return b;};
const ihdr=Buffer.from([0,0,0,1,0,0,0,1,8,2,0,0,0]);
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from([0,255,0,0]))),chunk('IEND',Buffer.alloc(0))]);
const jpeg=Buffer.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,218,0,8,1,1,0,0,63,0,0,255,217]);
const webp=Buffer.alloc(22);webp.write('RIFF');webp.writeUInt32LE(14,4);webp.write('WEBP',8);webp.write('VP8L',12);webp.writeUInt32LE(2,16);webp[20]=0x2f;
const pdf=utf8('%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n2 0 obj << /Type /Page >> endobj\nstartxref\n40\n%%EOF\n');
export function zip(entries,mutate=()=>{}) {
 const locals=[],central=[];let offset=0;
 for(const [name,raw] of Object.entries(entries)){
  const content=utf8(raw),data=deflateRawSync(content),filename=utf8(name),local=Buffer.alloc(30+filename.length);
  local.writeUInt32LE(0x04034b50);local.writeUInt16LE(8,8);local.writeUInt32LE(crc32(content),14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(content.length,22);local.writeUInt16LE(filename.length,26);filename.copy(local,30);
  const cd=Buffer.alloc(46+filename.length);cd.writeUInt32LE(0x02014b50);cd.writeUInt16LE(8,10);cd.writeUInt32LE(crc32(content),16);cd.writeUInt32LE(data.length,20);cd.writeUInt32LE(content.length,24);cd.writeUInt16LE(filename.length,28);cd.writeUInt32LE(offset,42);filename.copy(cd,46);mutate(cd);
  locals.push(local,data);central.push(cd);offset+=local.length+data.length;
 }
 const directory=Buffer.concat(central),eocd=Buffer.alloc(22);eocd.writeUInt32LE(0x06054b50);eocd.writeUInt16LE(central.length,8);eocd.writeUInt16LE(central.length,10);eocd.writeUInt32LE(directory.length,12);eocd.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,directory,eocd]);
}
const office={'[Content_Types].xml':'<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>','_rels/.rels':'<Relationships/>','word/document.xml':'<w:document xmlns:w="urn:office"><w:body><w:p>Fictional proposal.</w:p></w:body></w:document>'};
const docxMime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const invalid=(name,mime,bytes)=>assert.throws(()=>validateAttachment(name,mime,bytes),InvalidAttachment);
test('CRC reference vector',()=>assert.equal(crc32(utf8('123456789')),0xcbf43926));
for(const [name,mime,bytes] of [['evidence.txt','text/plain',utf8('UTF-8: č ć š đ ž\n')],['evidence.csv','text/csv',utf8('name,status\nFictional,pending\n')],['evidence.png','image/png',png],['evidence.jpg','image/jpeg',jpeg],['evidence.webp','image/webp',webp],['evidence.pdf','application/pdf',pdf],['evidence.docx',docxMime,zip(office)]])test('Allowed '+name,()=>assert.equal(validateAttachment(name,mime,bytes),mime));
for(const [name,mime,bytes] of [
 ['empty.txt','text/plain',Buffer.alloc(0)],['large.txt','text/plain',Buffer.alloc(MAX_ATTACHMENT_BYTES+1,65)],
 ['../private.txt','text/plain',utf8('text')],['evil\n.txt','text/plain',utf8('text')],['x'.repeat(201)+'.txt','text/plain',utf8('text')],
 ['evil.svg','image/svg+xml',utf8('<svg/>')],['evil.html','text/html',utf8('<script>alert(1)</script>')],
 ['double.pdf.exe','application/pdf',pdf],['spoof.pdf','application/pdf',utf8('<script>alert(1)</script>')],['spoof.png','image/png',utf8('fake')],
 ['mismatch.txt','application/pdf',utf8('text')],['binary.txt','text/plain',Buffer.from([0xff,0xfe])],['null.txt','text/plain',Buffer.from([65,0,66])],
 ['truncated.png','image/png',png.subarray(0,png.length-5)],['bad-crc.png','image/png',Buffer.from(png).fill(0,29,33)],
 ['extra.png','image/png',Buffer.concat([png,utf8('HTML')])],['truncated.jpg','image/jpeg',jpeg.subarray(0,8)],
 ['truncated.webp','image/webp',webp.subarray(0,20)],['script.pdf','application/pdf',utf8(pdf.toString().replace('/Type /Catalog','/Type /Catalog /JavaScript'))],
 ['zip.docx',docxMime,zip({'word/document.xml':'<w:document/>'})],['macro.docx',docxMime,zip({...office,'word/vbaProject.bin':'fake'})],
 ['external.docx',docxMime,zip({...office,'word/_rels/document.xml.rels':'<Relationship TargetMode="External"/>'})],
 ['dtd.docx',docxMime,zip({...office,'word/document.xml':'<!DOCTYPE x [<!ENTITY bomb "x">]><w:document/>'})],
 ['traversal.docx',docxMime,zip({...office,'../escape.txt':'fake'})],
 ['encrypted.docx',docxMime,zip(office,cd=>cd.writeUInt16LE(1,8))],
 ['bomb.docx',docxMime,zip(office,cd=>cd.writeUInt32LE(40*1024*1024,24))],
 ['crc.docx',docxMime,zip(office,cd=>cd.writeUInt32LE(0,16))]
])test('Reject '+name,()=>invalid(name,mime,bytes));
test('Exact 10 MB text limit',()=>assert.equal(validateAttachment('limit.txt','text/plain',Buffer.alloc(MAX_ATTACHMENT_BYTES,65)),'text/plain'));
