import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import ts from 'typescript';

const compile=path=>ts.transpileModule(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const route=compile('app/api/maintenance/attachments/route.ts'),http=compile('lib/attachments/http.ts');
const fixtureSecret='synthetic-test-only-'.repeat(3),privateMessage='private-backend-request-and-key-must-never-be-logged';
function handler(client,secret=fixtureSecret){
 const logs=[],headersModule={exports:{}};
 vm.runInNewContext(http,{exports:headersModule.exports,require:name=>{assert.equal(name,'server-only');return {};},Response,Buffer});
 const routeModule={exports:{}};
 vm.runInNewContext(route,{exports:routeModule.exports,process:{env:{CRON_SECRET:secret}},Response,
  console:{warn:(...args)=>logs.push(args)},
  require:name=>{if(name==='node:crypto')return crypto;if(name==='@/lib/attachments/http')return headersModule.exports;
   if(name==='@/lib/supabase/storage-server')return {createStorageClient:()=>typeof client==='function'?client():client};throw Error('Unexpected import');}});
 return {GET:routeModule.exports.GET,logs};
}
const request=(authorized=true)=>new Request('https://securedesk.example.invalid/api/maintenance/attachments',{headers:authorized?{authorization:'Bearer '+fixtureSecret}:{}});
const logText=h=>JSON.stringify(h.logs);
async function unavailable(h,stage,code){
 const r=await h.GET(request());assert.equal(r.status,503);assert.equal(await r.text(),'Maintenance unavailable.');
 assert.equal(r.headers.get('cache-control'),'private, no-store, max-age=0');
 assert.equal(h.logs.length,1);assert.equal(h.logs[0][1].stage,stage);if(code)assert.equal(h.logs[0][1].code,code);
 assert(!logText(h).includes(fixtureSecret));assert(!logText(h).includes(privateMessage));return r;
}
test('invalid cron configuration fails closed without leaking its value',async()=>{for(const secret of [undefined,'too-short'])await unavailable(handler(null,secret===undefined?'':secret),'cron-configuration');});
test('wrong authorization returns 401 without touching Storage or logging credentials',async()=>{let used=false;const h=handler(()=>{used=true;throw Error();});const r=await h.GET(request(false));assert.equal(r.status,401);assert.equal(used,false);assert.equal(h.logs.length,0);});
test('Storage client failure logs only the stage',async()=>{await unavailable(handler(()=>{throw Error(privateMessage);}), 'storage-client','unclassified');});
test('known RPC denial logs only an allowlisted code',async()=>{await unavailable(handler({rpc:async()=>({data:null,error:{code:'42501',message:privateMessage}})}),'batch-selection','42501');});
test('unknown or malicious provider code and message are redacted',async()=>{await unavailable(handler({rpc:async()=>({data:null,error:{code:privateMessage,message:fixtureSecret}})}),'batch-selection','unclassified');});
test('unexpected batch shape fails closed',async()=>{await unavailable(handler({rpc:async()=>({data:{path:privateMessage},error:null})}),'batch-selection','unclassified');});
test('Storage deletion failure does not log paths or backend messages',async()=>{await unavailable(handler({rpc:async()=>({data:[{bucket:'attachment-quarantine',path:privateMessage}],error:null}),storage:{from:()=>({remove:async()=>({error:{message:fixtureSecret}})})}}),'storage-delete','unclassified');});
test('empty successful maintenance returns zero without warning',async()=>{const h=handler({rpc:async()=>({data:[],error:null})});const r=await h.GET(request());assert.equal(r.status,200);assert.deepEqual(await r.json(),{removed:0});assert.equal(h.logs.length,0);});
test('only the three allowed buckets are considered on success',async()=>{const removed=[];const h=handler({rpc:async()=>({data:[{bucket:'ticket-attachments',path:'test/a'},{bucket:'proposal-attachments',path:'test/b'},{bucket:'foreign-bucket',path:'test/c'}],error:null}),storage:{from:bucket=>({remove:async paths=>{removed.push({bucket,paths:Array.from(paths)});return {error:null};}})}});const r=await h.GET(request());assert.equal(r.status,200);assert.deepEqual(await r.json(),{removed:2});assert.deepEqual(removed,[{bucket:'ticket-attachments',paths:['test/a']},{bucket:'proposal-attachments',paths:['test/b']}]);assert.equal(h.logs.length,0);});
