import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { deflateRawSync, deflateSync } from 'node:zlib';
import { crc32 } from '../lib/attachments/validation.ts';
import { createServerClient } from '@supabase/ssr';

// Private ticket uploads/downloads using real Auth, SSR cookies and current parent rights.
// All business decisions use authenticated RPCs. Owner writes only bootstrap/fixture revocation.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321',site='http://127.0.0.1:3000',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const tables=['organization_change_requests','organization_change_approvals','organization_access_codes','organization_code_submissions','profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs','project_proposals','attachments','tickets','ticket_collaborators','ticket_comments','ticket_comment_revisions','ticket_participant_requests','ticket_participants'];
const accounts=[],matrix=[],fileFixtures=[];let checks=0,stage='local guards',key,baseline,adminCount,orgA,orgB;
const q=value=>"'"+value.replaceAll("'","''")+"'";
function assert(condition,label){if(!condition)throw new CheckError(label);checks++;}
function command(args,input){const r=spawnSync(docker,args,{cwd:root,input,encoding:'utf8',timeout:30000});if(r.error||r.status)throw new CheckError('Local database verification failed; private details withheld.');return r.stdout.trim();}
function sql(query){const s=command(['exec','-i','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1'],query);return s?JSON.parse(s):null;}
function snapshot(previous){return tables.map(table=>sql('select jsonb_build_object(\'table\','+q(table)+',\'count\',count(*),\'hash\',md5(coalesce(string_agg(to_jsonb(t)::text,\'\' order by id),\'\')),\'ids\',coalesce(jsonb_agg(id order by id),\'[]\'::jsonb)) from public.'+table+' t'+(previous?(previous.find(x=>x.table===table).ids.length?' where id in ('+previous.find(x=>x.table===table).ids.map(q).join(',')+')':' where false'):'')));}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const revision=id=>String(sql('select access_revision from public.profiles where id='+q(id)));
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
async function register(label){
  const email='securedesk-ticket-files-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Ticket Attachment Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
  account.id=signup.data.user?.id;
  assert(!signup.error&&account.id&&signup.data.session===null,label+': signup requires confirmation.');
  const stored=sql('select jsonb_build_object(\'role\',app_role,\'state\',account_status) from public.profiles where id='+q(account.id));
  assert(stored.role==='client'&&stored.state==='pending',label+': forged signup metadata grants no privileges.');
  const early=await client.auth.signInWithPassword({email,password});assert(Boolean(early.error)&&!early.data.session,label+': unconfirmed password login denied.');
  let messageId;
  for(let n=0;n<20&&!messageId;n++){const listing=await(await fetch(inbox+'/api/v1/messages',{signal:AbortSignal.timeout(5000)})).json();messageId=(listing.messages??[]).find(m=>(m.To??[]).some(to=>to.Address===email))?.ID;if(!messageId)await new Promise(r=>setTimeout(r,250));}
  if(!messageId)throw new CheckError('Fictional local confirmation message missing.');
  const mail=await(await fetch(inbox+'/api/v1/message/'+encodeURIComponent(messageId),{signal:AbortSignal.timeout(5000)})).json();let hash;
  for(const m of [mail.HTML,mail.Text].filter(Boolean).join(' ').replaceAll('&amp;','&').matchAll(/https?:\/\/[^\s<>"']+/g)){const u=new URL(m[0]);if(u.origin===site&&u.pathname==='/auth/confirm'&&u.searchParams.get('type')==='email')hash=u.searchParams.get('token_hash');}
  if(!hash)throw new CheckError('Expected local confirmation link missing.');
  const confirmed=await client.auth.verifyOtp({token_hash:hash,type:'email'});assert(!confirmed.error&&confirmed.data.user?.id===account.id,label+': email verifies correct identity.');
  if((await client.auth.signOut({scope:'local'})).error)throw new CheckError('Confirmation session cleanup failed.');
  const login=await client.auth.signInWithPassword({email,password});assert(!login.error&&login.data.user?.id===account.id,label+': real login succeeds after confirmation.');
  // Bridge the same real session through the installed SSR cookie adapter, without another login.
  const ssr=createServerClient(api,key,{auth:{autoRefreshToken:false},cookies:{getAll:()=>[...account.cookies].map(([name,value])=>({name,value})),setAll:values=>{for(const {name,value}of values)if(value)account.cookies.set(name,value);else account.cookies.delete(name);}}});
  assert(!(await ssr.auth.setSession(login.data.session)).error,label+': verified session encodes through SSR cookies.');
  return account;
}

async function page(account,path,init={}) {
  const response=await fetch(site+path,{...init,headers:{...init.headers,...(account?{cookie:[...account.cookies].map(([k,v])=>k+'='+v).join('; ')}:{})},redirect:'manual',signal:AbortSignal.timeout(30000)});
  if(account)for(const set of response.headers.getSetCookie()){const pair=set.split(';')[0],at=pair.indexOf('='),name=pair.slice(0,at),value=pair.slice(at+1);if(!value||/max-age=0(?:;|$)/i.test(set))account.cookies.delete(name);else account.cookies.set(name,value);}
  return {path,status:response.status,html:await response.text(),location:response.headers.get('location'),headers:response.headers};
}
function form(web,marker) {
  const markup=[...web.html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].find(m=>m[0].slice(0,m[0].indexOf('>')+1).includes(marker))?.[0];
  if(!markup)throw new CheckError('Expected native form missing: '+marker);
  return {markup,path:web.path};
}
async function allowedRpc(client,name,args,label){const r=await client.rpc(name,args);assert(!r.error,label);return r.data;}
const utf8=s=>Buffer.from(s);
const chunk=(name,data)=>{const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(name,4);data.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,b.length-4)),b.length-4);return b;};
const ihdr=Buffer.from([0,0,0,1,0,0,0,1,8,2,0,0,0]);
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from([0,255,0,0]))),chunk('IEND',Buffer.alloc(0))]);
const jpeg=Buffer.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,218,0,8,1,1,0,0,63,0,0,255,217]);
const webp=Buffer.alloc(22);webp.write('RIFF');webp.writeUInt32LE(14,4);webp.write('WEBP',8);webp.write('VP8L',12);webp.writeUInt32LE(2,16);webp[20]=0x2f;
const pdf=utf8('%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n2 0 obj << /Type /Page >> endobj\nstartxref\n40\n%%EOF\n');
function zip(entries,mutate=()=>{}) {
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

async function run() {
 if(process.argv.length!==3||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo to retain eleven fictional attachment accounts and two companies.');
 const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
 if(env.NEXT_PUBLIC_SUPABASE_URL!==api||env.SITE_URL!==site||!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.DOCKER_HOST)throw new CheckError('Refusing nonlocal application/Docker target.');
 key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 const host=JSON.parse(command(['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
 if(!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host)&&host!=='unix:///var/run/docker.sock')throw new CheckError('Expected local Docker context.');
 const labels=JSON.parse(command(['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
 if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw new CheckError('Unexpected local project/workspace.');
 baseline=snapshot();adminCount=sql("select count(*)::integer from public.profiles where app_role='super_admin'");
 stage='real signup and session';
 for(const label of ['super-admin','admin-a','admin-b','owner','collaborator','org-reader','client-a','client-colleague','client-b','pending','unassigned-staff'])await register(label);
 const [sa,oa,oaB,owner,collab,reader,clientA,colleague,clientB,pending,unassigned]=accounts;
 const anonymous=createClient(api,key,options);
 stage='controlled fixture setup';
 mkdirSync(new URL('../.tools/verification/phase5-step2/',import.meta.url),{recursive:true});
 writeFileSync(new URL('../.tools/verification/phase5-step2/database-web-before.json',import.meta.url),JSON.stringify(baseline,null,2));
 assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Ticket Attachment Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed")===1,'Only new fixture receives temporary SA bootstrap.');
 for(const target of [oa,oaB,owner,collab,reader,unassigned])await allowedRpc(sa.client,'approve_privileged_registration',{p_request_id:requestFor(target.id).id,p_role:[oa,oaB].includes(target)?'admin':'staff',p_reason:'Fictional ticket fixture.'},'Approve fixture role.');
 const details=label=>({name:'Fictional Ticket Company '+label+' '+randomUUID().slice(0,8),address:'Fictional office',email:'tickets-'+label.toLowerCase()+'@securedesk.example.invalid',phone:'+12025550655',description:'Fictional ticket access test.'});
 orgA=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientA.id).id,p_details:details('A')},'Approve A');
 orgB=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientB.id).id,p_details:details('B')},'Approve B');
 await allowedRpc(sa.client,'route_registration_request',{p_request_id:requestFor(colleague.id).id,p_organization_id:orgA},'Route colleague to company');
 await allowedRpc(sa.client,'approve_registration_request',{p_request_id:requestFor(colleague.id).id,p_organization_id:orgA},'Approve colleague in same company');
 const oaArgs=(target,org,active)=>({p_organization_id:org,p_admin_user_id:target.id,p_expected_access_revision:revision(target.id),p_expected_assignment_revision:sql('select to_jsonb(revision::text) from public.organization_admin_assignments where organization_id='+q(org)+' and admin_user_id='+q(target.id)),p_active:active,p_reason:'Fictional ticket OA scope.'});
 for(const [target,org]of[[oa,orgA],[oaB,orgB]])await allowedRpc(sa.client,'set_organization_admin_assignment',oaArgs(target,org,true),'Assign OA');
 const staffArgs=(target,active,permission=false)=>({p_organization_id:orgA,p_staff_user_id:target.id,p_expected_access_revision:revision(target.id),p_expected_assignment_revision:sql('select to_jsonb(revision::text) from public.staff_organization_assignments where organization_id='+q(orgA)+' and staff_user_id='+q(target.id)),p_active:active,p_can_create_project:permission,p_reason:'Fictional ticket Staff scope.'});
 for(const target of [owner,collab,reader])await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(target,true,target===reader),'Assign Staff');
 const support=org=>sql('select to_jsonb(id) from public.projects where organization_id='+q(org)+' and is_general_support'),supportA=support(orgA),supportB=support(orgB);
 const context=async(actor,org=orgA)=>{const r=await actor.client.rpc('ticket_context',{p_organization_id:org});assert(!r.error,'Current ticket context');return r.data[0];};
 const common=async(actor,id,org=orgA)=>{const c=await context(actor,org);return {p_organization_id:org,p_ticket_id:id,p_expected_access_revision:c.access_revision,p_expected_scope:c.scope_revision};};
 const ticket=id=>sql('select to_jsonb(t) from public.tickets t where id='+q(id));
 const manage=async(actor,id,intent,value,v=ticket(id).revision)=>(actor.client.rpc('manage_ticket',{...await common(actor,id),p_expected_revision:String(v),p_intent:intent,p_value:value}));
 const create=async(actor,id,client=clientA,org=orgA,project=supportA,extra={})=>actor.client.rpc('create_ticket',{...await common(actor,id,org),p_project_id:project,p_client_user_id:client.id,p_details:{title:'Fictional ticket '+id.slice(0,8),description:'A fictional support problem.',...extra}});
 const path=(org,id)=>'/organizations/'+org+'/tickets/'+id;

 const idA=randomUUID(),idSame=randomUUID(),idB=randomUUID(),idOnBehalf=randomUUID();
 for(const [actor,id,client,org,project] of [[clientA,idA,clientA,orgA,supportA],[colleague,idSame,colleague,orgA,supportA],[clientB,idB,clientB,orgB,supportB],[reader,idOnBehalf,clientA,orgA,supportA]])assert(!(await create(actor,id,client,org,project)).error,'Fixture ticket creation');
 assert(!(await manage(oa,idA,'owner',owner.id)).error,'Assign owner before upload');
 assert(!(await manage(owner,idA,'add_collaborator',collab.id)).error,'Assign collaborator before upload');
 const uploadPath=path(orgA,idA),bucket='ticket-attachments',content=Buffer.from('Fictional private ticket evidence.\n');
 const privileged=createClient(api,env.SUPABASE_STORAGE_SECRET_KEY,options);
 const fileRows=()=>sql('select coalesce(jsonb_agg(to_jsonb(a) order by created_at,id),\'[]\'::jsonb) from public.attachments a where ticket_id='+q(idA));
 const objectCount=()=>sql('select count(*)::integer from storage.objects where bucket_id='+q(bucket)+' and name like '+q(orgA+'/'+idA+'/%'));
 const fieldsOf=web=>{
  form(web,'data-ticket-upload="true"');
  // React may stream form inputs in later placeholder fragments once the page grows.
  // All occurrences on this ticket page must agree; never fall back to empty/stale values.
  const tags=[...web.html.matchAll(/<input\b[^>]*>/gi)].map(match=>match[0]);
  return Object.fromEntries(['revision','access_revision','scope_revision'].map(name=>{
   const values=[...new Set(tags.filter(tag=>tag.includes('name="'+name+'"')).map(tag=>tag.match(/value="([^"]*)"/)?.[1]).filter(value=>value!==undefined))];
   if(values.length!==1)throw new CheckError('Native streamed field is missing or ambiguous: '+name);
   return [name,values[0]];
  }));
 };
 const fieldsFor=async actor=>fieldsOf(await page(actor,uploadPath));
 const send=async(actor,fields,file={name:'evidence.txt',mime:'text/plain',bytes:content},origin=site,mutate=()=>{})=>{
  const data=new FormData();for(const[name,value]of Object.entries(fields))data.append(name,value);
  if(file)data.append('file',new File([file.bytes],file.name,{type:file.mime}));mutate(data);
  return page(actor,uploadPath+'/attachments',{method:'POST',headers:origin===null?{}:{origin},body:data});
 };
 const upload=async(actor,file,extra={},origin=site)=>send(actor,{...await fieldsFor(actor),...extra},file,origin);
 const small={name:'evidence.txt',mime:'text/plain',bytes:content};
 const ownFields=await fieldsFor(clientA);
 console.log('Local synthetic Auth and ticket fixtures ready.');
 stage='hosting transfer boundaries';
 const transferTicket=randomUUID();
 assert(!(await create(clientA,transferTicket)).error,'Create dedicated transfer fixture');
 const transferPath=path(orgA,transferTicket),transferEndpoint=transferPath+'/attachments/transfer';
 const transferFields=()=>page(clientA,transferPath).then(fieldsOf);
 const transferCall=(actor,input,endpoint=transferEndpoint,origin=site)=>page(actor,endpoint,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(input)});
 const prepare=async(file,extra={})=>transferCall(clientA,{intent:'prepare',...await transferFields(),name:file.name,mime:file.mime,size:file.bytes.length,...extra});
 const complete=(id,actor=clientA,endpoint=transferEndpoint)=>transferCall(actor,{intent:'complete',id},endpoint);
 const transferRows=()=>sql('select coalesce(jsonb_agg(to_jsonb(a) order by created_at,id),\'[]\'::jsonb) from public.attachments a where ticket_id='+q(transferTicket));
 const baseInput={intent:'prepare',...await transferFields(),name:small.name,mime:small.mime,size:content.length};
 for(const actor of [null,pending,colleague,clientB,reader,oaB,unassigned,owner])
  assert([404,409].includes((await transferCall(actor,baseInput)).status)&&transferRows().length===0,'Transfer denies copied identity or inaccessible parent');
 assert((await transferCall(clientA,baseInput,transferEndpoint,'https://foreign.example.invalid')).status===403,'Transfer rejects foreign Origin');
 for(const extra of [{size:0},{size:10485761},{mime:'application/pdf'},{name:'../evidence.txt'},{uploaded_by_user_id:sa.id},{storage_path:'forged'}])
  assert((await transferCall(clientA,{...baseInput,...extra})).status===400&&transferRows().length===0,'Transfer rejects forged or invalid metadata');
 const missing=JSON.parse((await prepare(small)).html);
 assert(missing.token&&missing.bucket==='attachment-quarantine'&&missing.path===missing.id,'Capability is restricted to temporary Storage');
 assert((await complete(missing.id)).status===503&&transferRows().length===1,'Completion before bytes arrive is retryable');
 assert((await complete(missing.id,colleague)).status===404,'Another caller cannot finalize the reservation');
 assert((await complete(missing.id,clientA,path(orgB,transferTicket)+'/attachments/transfer')).status===404,'Transfer parent and organization are bound');
 assert(Boolean((await anonymous.storage.from(missing.bucket).uploadToSignedUrl(randomUUID(),missing.token,content,{contentType:'text/plain'})).error),'Upload token cannot choose another path');
 assert(!(await anonymous.storage.from(missing.bucket).uploadToSignedUrl(missing.path,missing.token,content,{contentType:'text/plain'})).error,'Scoped capability transfers bytes without app request body');
 for(const actor of [anonymous,clientA.client,sa.client]){
  assert(Boolean((await actor.storage.from(missing.bucket).download(missing.path)).error),'Quarantine is unreadable even to business administrators');
  assert(Boolean((await actor.storage.from(missing.bucket).createSignedUrl(missing.path,60)).error),'User cannot sign temporary download');
 }
 assert((await page(clientA,transferPath+'/attachments/'+missing.id)).status===404,'Unvalidated bytes are not downloadable');
 assert((await complete(missing.id)).status===200,'Server validates then publishes transferred content');
 const transferred=transferRows()[0];
 assert(transferred.state==='ready'&&transferred.sha256===createHash('sha256').update(content).digest('hex'),'Final content checksum is server generated');
 assert((await complete(missing.id)).status===200,'Lost-response completion is idempotent');
 assert(sql("select count(*)::integer from public.audit_logs where target_id="+q(missing.id)+" and event_type='ticket.attachment_uploaded'")===1,'Transfer completion emits one audit event');
 const privateDownload=await page(clientA,transferPath+'/attachments/'+missing.id);
 assert(privateDownload.status===200&&privateDownload.html===content.toString()&&privateDownload.headers.get('content-security-policy')==="sandbox; default-src 'none'",'Transferred file keeps guarded stream and sandbox');
 assert((await page(colleague,transferPath+'/attachments/'+missing.id)).status===404,'Copied private download denies peer Client');
 // The provider token lasts two hours. Reuse reaches only quarantine, never ready bytes.
 assert(!(await anonymous.storage.from(missing.bucket).uploadToSignedUrl(missing.path,missing.token,Buffer.from('Changed bytes'),{contentType:'text/plain'})).error,'Token replay is isolated to quarantine');
 assert(Boolean((await anonymous.storage.from(missing.bucket).uploadToSignedUrl(missing.path,missing.token,content,{contentType:'text/plain',upsert:true})).error),'Client cannot enable overwriting a signed path');
 assert((await complete(missing.id)).status===200&&(await page(clientA,transferPath+'/attachments/'+missing.id)).html===content.toString(),'Token replay cannot alter published file');
 await privileged.storage.from(missing.bucket).remove([missing.path]);
 const invalidFile={name:'fake.pdf',mime:'application/pdf',bytes:content};
 const invalid=JSON.parse((await prepare(invalidFile)).html);
 assert(!(await anonymous.storage.from(invalid.bucket).uploadToSignedUrl(invalid.path,invalid.token,content,{contentType:invalidFile.mime})).error,'Allowed declared MIME reaches private quarantine only');
 assert((await complete(invalid.id)).status===400&&!transferRows().some(a=>a.id===invalid.id),'Actual fake PDF is rejected before publication');
 assert(Boolean((await privileged.storage.from(invalid.bucket).download(invalid.path)).error),'Rejected temporary bytes are removed');
 const changed=JSON.parse((await prepare(small)).html);
 await anonymous.storage.from(changed.bucket).uploadToSignedUrl(changed.path,changed.token,content,{contentType:small.mime});
 assert(!(await manage(oa,transferTicket,'priority','High')).error,'Change parent after reservation');
 assert((await complete(changed.id)).status===409&&!transferRows().some(a=>a.id===changed.id),'Changed parent prevents publication and compensates');
 const limitBytes=Buffer.alloc(10485760,65),transferLimit=JSON.parse((await prepare({name:'transfer-transferLimit.txt',mime:'text/plain',bytes:limitBytes})).html);
 assert(!(await anonymous.storage.from(transferLimit.bucket).uploadToSignedUrl(transferLimit.path,transferLimit.token,limitBytes,{contentType:'text/plain'})).error,'Exact 10 MiB goes directly to temporary Storage');
 assert((await complete(transferLimit.id)).status===200,'Exact 10 MiB validates and publishes');
 const largeDownload=await page(clientA,transferPath+'/attachments/'+transferLimit.id);
 assert(largeDownload.status===200&&Buffer.byteLength(largeDownload.html)===10485760&&createHash('sha256').update(largeDownload.html).digest('hex')===createHash('sha256').update(limitBytes).digest('hex'),'Streamed 10 MiB download preserves full verified bytes');
 assert([401,503].includes((await page(null,'/api/maintenance/attachments')).status),'Unauthenticated maintenance never runs');
 stage='native multipart boundaries';
 for(const actor of [null,pending,colleague,clientB,reader,oaB,unassigned]){
  const denied=await send(actor,ownFields,small);
  assert(denied.status===404&&fileRows().length===0,'Copied upload without ticket rights denied');
 }
 for(const origin of ['https://foreign.example.invalid',null,'http://localhost:3000'])assert((await send(clientA,ownFields,small,origin)).status===403&&fileRows().length===0,'Exact configured Origin required');
 for(const file of [{name:'empty.txt',mime:'text/plain',bytes:Buffer.alloc(0)},{name:'oversize.txt',mime:'text/plain',bytes:Buffer.alloc(10*1024*1024+1,65)},{name:'spoof.pdf',mime:'application/pdf',bytes:Buffer.from('<script>fake()</script>')},{name:'spoof.png',mime:'image/png',bytes:content},{name:'mismatch.txt',mime:'application/pdf',bytes:content},{name:'unsupported.svg',mime:'image/svg+xml',bytes:content}]){
  assert((await send(clientA,ownFields,file)).location===uploadPath+'?upload_error=invalid'&&fileRows().length===0&&objectCount()===0,'Invalid content never reaches Storage');
 }
 for(const mutate of [data=>data.append('file',new File([content],'second.txt',{type:'text/plain'})),data=>data.append('revision',ownFields.revision),data=>data.set('revision','not-a-version'),data=>data.delete('access_revision'),data=>data.set('scope_revision','not-a-scope'),data=>data.append('uploaded_by_user_id',sa.id),data=>data.append('storage_path','../forged')]){
  assert((await send(clientA,ownFields,small,site,mutate)).location===uploadPath+'?upload_error=invalid'&&fileRows().length===0,'Duplicate, missing or forged multipart fields rejected');
 }
 assert((await send(clientA,ownFields,null)).location===uploadPath+'?upload_error=invalid','Missing file rejected');
 const oversized=await page(clientA,uploadPath+'/attachments',{method:'POST',headers:{origin:site,'content-type':'application/octet-stream'},body:Buffer.alloc(10*1024*1024+65537,65)});
 assert(oversized.location===uploadPath+'?upload_error=invalid'&&objectCount()===0,'Bounded total HTTP body rejects excessive multipart overhead');
 const malformed=await page(clientA,uploadPath+'/attachments',{method:'POST',headers:{origin:site,'content-type':'multipart/form-data; boundary=missing'},body:'not multipart'});
 assert(malformed.location===uploadPath+'?upload_error=invalid','Malformed multipart rejected');
 assert((await send(owner,ownFields,small)).location===uploadPath+'?upload_error=stale'&&fileRows().length===0,'Copied Client form is not an owner identity');
 assert((await upload(clientA,small,{revision:'1'})).location===uploadPath+'?upload_error=stale','Stale ticket version rejected');
 stage='real private upload and download role matrix';
 assert((await upload(clientA,small)).location===uploadPath+'?notice=upload','Native multipart TXT succeeds');
 const first=fileRows()[0];assert(first?.state==='ready'&&first.uploaded_by_user_id===clientA.id&&first.size_bytes===content.length&&first.sha256===createHash('sha256').update(content).digest('hex'),'Published metadata is server-derived and matches bytes');
 const fileUrl=uploadPath+'/attachments/'+first.id;
 assert(sql('select count(*)::integer from public.audit_logs where target_id='+q(first.id)+" and event_type='ticket.attachment_uploaded' and actor_user_id="+q(clientA.id))===1,'Actual uploader audit');
 for(const actor of [null,...accounts]){
  const before=checks,can=[sa,oa,owner,collab,clientA].includes(actor),web=await page(actor,fileUrl);
  assert(can?web.status===200&&web.html===content.toString():web.status===404,'Download exact role/ticket scope');
  assert(web.headers.get('cache-control')?.includes('no-store')&&web.headers.get('x-content-type-options')==='nosniff','Download and unavailable responses have private headers');
  if(can)assert(web.headers.get('content-type')==='application/octet-stream'&&web.headers.get('content-disposition')?.startsWith('attachment;')&&web.headers.get('content-security-policy')==="sandbox; default-src 'none'",'Download is a forced file with sandbox headers; observed CSP: '+web.headers.get('content-security-policy'));
  const apiClient=actor?.client??anonymous;
  assert((await apiClient.storage.from(bucket).download(first.storage_path)).error,'Direct Storage download denied');
  assert((await apiClient.storage.from(bucket).createSignedUrl(first.storage_path,60)).error,'Direct user signed URL denied');
  assert((await apiClient.storage.from(bucket).upload(orgA+'/'+idA+'/'+randomUUID(),content,{contentType:'text/plain'})).error,'Direct Storage upload denied');
  if(actor){assert((await actor.client.rpc('complete_ticket_attachment',{p_attachment_id:first.id,p_actor_id:actor.id,p_sha256:first.sha256})).error?.code==='42501','User cannot attest content');
   assert((await actor.client.rpc('abort_ticket_attachment',{p_attachment_id:first.id,p_actor_id:actor.id})).error?.code==='42501','User cannot claim cleanup');
   const listed=await actor.client.from('attachments').select('id,ticket_id').eq('id',first.id);
   assert(!listed.error&&listed.data.length===(can?1:0),'Independent metadata RLS');}
  matrix.push({role:actor?.label??'anonymous',checks:checks-before,result:'PASS'});
 }
 for(const wrong of [path(orgB,idA)+'/attachments/'+first.id,path(orgA,idSame)+'/attachments/'+first.id,uploadPath+'/attachments/'+randomUUID(),uploadPath+'/attachments/invalid-id'])assert((await page(clientA,wrong)).status===404,'Canonical tenant/ticket/attachment binding');
 for(const [actor,label]of[[sa,'superadmin'],[oa,'admin'],[owner,'owner'],[collab,'collaborator']])assert((await upload(actor,{name:label+'.txt',mime:'text/plain',bytes:content})).location===uploadPath+'?notice=upload','Authorized role sends its own form');
 for(const [name,mime,bytes] of [['evidence.csv','text/csv',utf8('name,status\nFictional,active\n')],['evidence.png','image/png',png],['evidence.jpg','image/jpeg',jpeg],['evidence.webp','image/webp',webp],['evidence.pdf','application/pdf',pdf],['evidence.docx',docxMime,zip(office)]]) {
  const uploaded=await upload(clientA,{name,mime,bytes});
  assert(uploaded.location===uploadPath+'?notice=upload','Supported format '+name+' returned '+String(uploaded.location?.split('?').pop()??uploaded.status));
  const row=fileRows().find(r=>r.original_name===name);
  const response=await fetch(site+uploadPath+'/attachments/'+row.id,{headers:{cookie:[...clientA.cookies].map(([k,v])=>k+'='+v).join('; ')},signal:AbortSignal.timeout(30000)});
  assert(response.status===200&&Buffer.from(await response.arrayBuffer()).equals(bytes),'Format bytes round trip intact: '+name);
 }
 const unicodeName='Dokaz č ć š đ ž.txt';assert((await upload(clientA,{name:unicodeName,mime:'text/plain',bytes:content})).location===uploadPath+'?notice=upload','Unicode filename succeeds');
 const unicode=fileRows().find(row=>row.original_name===unicodeName),unicodeResponse=await page(clientA,uploadPath+'/attachments/'+unicode.id);
 assert(unicodeResponse.headers.get('content-disposition')?.includes(encodeURIComponent(unicodeName)),'Download filename is safely encoded');
 const xssName='<script>probe()</script>.txt';assert((await upload(clientA,{name:xssName,mime:'text/plain',bytes:content})).location===uploadPath+'?upload_error=invalid','Path separator in filename rejected');
 const textName='<img onerror=probe()>.txt';assert((await upload(clientA,{name:textName,mime:'text/plain',bytes:content})).location===uploadPath+'?notice=upload','Literal filename may contain harmless markup text');
 const markupPage=await page(clientA,uploadPath);
 assert(!markupPage.html.includes(textName)&&markupPage.html.includes('&lt;img onerror=probe()&gt;.txt'),'Filename is escaped in HTML');
 assert(!markupPage.html.includes(env.SUPABASE_STORAGE_SECRET_KEY)&&!markupPage.html.includes(first.storage_path)&&!markupPage.html.includes(first.sha256),'Privileged key, Storage path and checksum are not in rendered HTML');
 stage='exact file limit and integrity';
 const limit=Buffer.alloc(10*1024*1024,65);
 assert((await upload(clientA,{name:'limit.txt',mime:'text/plain',bytes:limit})).location===uploadPath+'?notice=upload','Exact 10 MB survives proxy, parser, validator and Storage');
 const limitFile=fileRows().find(row=>row.original_name==='limit.txt'),limitResponse=await fetch(site+uploadPath+'/attachments/'+limitFile.id,{headers:{cookie:[...clientA.cookies].map(([k,v])=>k+'='+v).join('; ')},signal:AbortSignal.timeout(30000)});
 assert(limitResponse.status===200&&Buffer.from(await limitResponse.arrayBuffer()).equals(limit),'Exact 10 MB bytes return intact');
 assert(!(await privileged.storage.from(bucket).upload(first.storage_path,Buffer.alloc(content.length,66),{contentType:'text/plain',upsert:true})).error,'Scoped fixture byte tamper prepared');
 assert((await page(clientA,fileUrl)).status===404,'Checksum or length mismatch refuses bytes');
 assert(!(await privileged.storage.from(bucket).upload(first.storage_path,content,{contentType:'text/plain',upsert:true})).error,'Scoped fixture bytes restored');
 assert((await page(clientA,fileUrl)).html===content.toString(),'Restored fixture content matches published hash');
 stage='sharing and live revocation';
 const requestId=randomUUID();
 await allowedRpc(clientA.client,'request_ticket_participant',{...await common(clientA,idA),p_request_id:requestId,p_candidate_client_id:colleague.id},'Client requests peer sharing');
 assert((await page(colleague,fileUrl)).status===404,'Pending sharing does not grant file access');
 const req=sql('select to_jsonb(r) from public.ticket_participant_requests r where id='+q(requestId));
 await allowedRpc(owner.client,'review_ticket_participant',{...await common(owner,idA),p_request_id:requestId,p_expected_request_revision:String(req.revision),p_intent:'approve',p_reason:null},'Owner approves sharing');
 assert((await page(colleague,fileUrl)).html===content.toString(),'Approved peer reads existing file with same session');
 assert((await upload(colleague,{name:'peer.txt',mime:'text/plain',bytes:content})).location===uploadPath+'?notice=upload','Approved peer can add attachment');
 const peerFile=fileRows().find(row=>row.original_name==='peer.txt');
 await allowedRpc(owner.client,'revoke_ticket_participant',{...await common(owner,idA),p_client_user_id:colleague.id,p_expected_revision:String(ticket(idA).revision)},'Owner revokes peer');
 assert((await page(colleague,fileUrl)).status===404&&(await page(colleague,uploadPath+'/attachments/'+peerFile.id)).status===404,'Revoked peer loses all files including own upload');
 const collabOld=await fieldsFor(collab);
 assert(!(await manage(owner,idA,'remove_collaborator',collab.id)).error,'Remove collaborator');
 assert((await page(collab,fileUrl)).status===404&&(await send(collab,collabOld,small)).status===404,'Same cookie loses collaborator file access');
 assert(!(await manage(owner,idA,'add_collaborator',collab.id)).error,'Regrant collaborator');
 assert((await send(collab,collabOld,small)).location===uploadPath+'?upload_error=stale','Old form after collaborator regrant stays stale');
 const ownerOld=await fieldsFor(owner);
 assert(!(await manage(oa,idA,'owner',reader.id)).error,'Reassign owner');
 assert((await page(owner,fileUrl)).status===404&&(await send(owner,ownerOld,small)).status===404,'Old owner loses files and upload');
 assert(!(await manage(oa,idA,'owner',owner.id)).error,'Restore fixture owner');
 const adminOld=await fieldsFor(oa);
 await allowedRpc(sa.client,'set_organization_admin_assignment',oaArgs(oa,orgA,false),'Revoke org Admin');
 assert((await page(oa,fileUrl)).status===404&&(await send(oa,adminOld,small)).status===404,'Same Admin session loses scope');
 await allowedRpc(sa.client,'set_organization_admin_assignment',oaArgs(oa,orgA,true),'Regrant org Admin');
 assert((await send(oa,adminOld,small)).location===uploadPath+'?upload_error=stale','Regranted Admin cannot use old form');
 stage='concurrent publication and compensation';
 const reserve=async()=>{const c=await context(clientA);return (await allowedRpc(clientA.client,'reserve_ticket_attachment',{p_organization_id:orgA,p_ticket_id:idA,p_expected_revision:String(ticket(idA).revision),p_expected_access_revision:c.access_revision,p_expected_scope:c.scope_revision,p_name:'race.txt',p_mime:'text/plain',p_size:content.length},'Reserve concurrent test'))[0];};
 const seal=r=>privileged.rpc('complete_ticket_attachment',{p_attachment_id:r.id,p_actor_id:clientA.id,p_sha256:createHash('sha256').update(content).digest('hex')});
 const cancel=r=>privileged.rpc('abort_ticket_attachment',{p_attachment_id:r.id,p_actor_id:clientA.id});
 const twice=await reserve();assert(!(await privileged.storage.from(bucket).upload(twice.storage_path,content,{contentType:'text/plain'})).error,'Concurrent fixture bytes uploaded');
 const completed=await Promise.all([seal(twice),seal(twice)]);
 assert(completed.every(r=>!r.error&&r.data===twice.id),'Concurrent completions both refer to one ready attachment');
 assert(sql('select count(*)::integer from public.audit_logs where target_id='+q(twice.id)+" and event_type='ticket.attachment_uploaded'")===1,'Concurrent completion has one audit');
 assert(!(await cancel(twice)).data,'Lost-response abort cannot claim ready bytes');
 for(let n=0;n<3;n++){
  const r=await reserve();assert(!(await privileged.storage.from(bucket).upload(r.storage_path,content,{contentType:'text/plain'})).error,'Race fixture upload');
  const [finish,abort]=await Promise.all(n%2?[seal(r),cancel(r)]:[Promise.resolve().then(()=>seal(r)),cancel(r)]);
  const row=sql('select to_jsonb(a) from public.attachments a where id='+q(r.id));
  assert(!abort.error,'Race abort completes safely');
  if(abort.data){assert(abort.data===r.storage_path&&!row&&finish.error,'Aborted reservation cannot later publish');assert(!(await privileged.storage.from(bucket).remove([abort.data])).error,'Only claimed path is compensated');}
  else {assert(!finish.error&&row?.state==='ready','Completion wins without destructive compensation');assert((await page(clientA,uploadPath+'/attachments/'+r.id)).html===content.toString(),'Ready race bytes remain downloadable');}
 }
 stage='scoped late audit failure and cleanup';
 const faultId=randomUUID();assert(!(await create(clientA,faultId)).error,'Create isolated audit failure ticket');
 const faultPath=path(orgA,faultId),faultFields=fieldsOf(await page(clientA,faultPath));
 sql("create function securedesk_private.ticket_attachment_web_fault() returns trigger language plpgsql as $$ begin if new.event_type='ticket.attachment_uploaded' and new.metadata_redacted->>'ticket_id'="+q(faultId)+" then raise exception 'Fictional attachment audit failure'; end if;return new;end;$$;create trigger ticket_attachment_web_fault before insert on public.audit_logs for each row execute function securedesk_private.ticket_attachment_web_fault();select to_jsonb(true)");
 try{
  const data=new FormData();for(const[k,v]of Object.entries(faultFields))data.append(k,v);data.append('file',new File([content],'audit-fault.txt',{type:'text/plain'}));
  assert((await page(clientA,faultPath+'/attachments',{method:'POST',headers:{origin:site},body:data})).location===faultPath+'?upload_error=stale','Route reports safe failure when audit rolls back');
  assert(sql('select count(*)::integer from public.attachments where ticket_id='+q(faultId))===0,'No published or reserved row after failed completion');
  assert(sql('select count(*)::integer from storage.objects where bucket_id='+q(bucket)+' and name like '+q(orgA+'/'+faultId+'/%'))===0,'Compensation removes scoped failed bytes');
 }finally{sql('drop trigger ticket_attachment_web_fault on public.audit_logs;drop function securedesk_private.ticket_attachment_web_fault();select to_jsonb(true)');}
 stage='attachment pages, notices and unchanged ticket forms';
 const initialCount=fileRows().filter(r=>r.state==='ready').length;
 for(let n=initialCount;n<27;n++)assert((await upload(clientA,{name:'page-'+String(n).padStart(2,'0')+'.txt',mime:'text/plain',bytes:content})).location===uploadPath+'?notice=upload','Pagination fixture uploaded through real route');
 const firstPage=await page(clientA,uploadPath+'?comments=2&attachments=1'),secondPage=await page(clientA,uploadPath+'?comments=2&attachments=2');
 assert(firstPage.html.includes('More attachments')&&secondPage.html.includes('Previous attachments')&&secondPage.html.includes('comments=2'),'Attachment paging retains other section pages');
 assert((await clientA.client.rpc('ticket_attachments',{p_organization_id:orgA,p_ticket_id:idA,p_offset:25})).data.length===2,'Second attachment page contains remaining two records');
 for(const error of ['invalid','stale','unavailable'])assert((await page(clientA,uploadPath+'?upload_error='+error)).html.includes('role="alert"'),'Safe retryable upload error shown');
 assert((await page(clientA,uploadPath+'?notice=upload')).html.includes('Your private file was uploaded'),'Success notice shown');
 const remainingPage=await page(owner,uploadPath);assert(remainingPage.html.includes('data-ticket-form="priority"')&&remainingPage.html.includes('data-ticket-form="comment"'),'Existing management/comment forms remain present');
 fileFixtures.push({organization:orgA,ticket:idA,first_attachment:first.id,filename:first.original_name,download_path:fileUrl});
 const previewRequest=randomUUID();
 await allowedRpc(clientA.client,'request_ticket_participant',{...await common(clientA,idA),p_request_id:previewRequest,p_candidate_client_id:colleague.id},'Prepare synthetic browser peer');
 await allowedRpc(owner.client,'review_ticket_participant',{...await common(owner,idA),p_request_id:previewRequest,p_expected_request_revision:'1',p_intent:'approve'},'Approve synthetic browser peer');
 stage='Client transfer immediately revokes old file rights';
 const oldClientFields=await fieldsFor(clientA);
 const codeB=(await allowedRpc(oaB.client,'manage_organization_access_code',{p_organization_id:orgB,p_expected_code_id:null,p_intent:'issue'},'Issue fixture transfer code'))[0];
 assert((await clientA.client.rpc('submit_organization_transfer',{p_code:codeB.code})).data==='submitted','Client requests real transfer');
 const transfer=sql('select to_jsonb(r) from public.organization_change_requests r where user_id='+q(clientA.id)+" and status='pending'");
 assert((await sa.client.rpc('review_organization_transfer',{p_request_id:transfer.id,p_expected_revision:String(transfer.revision),p_intent:'approve',p_side:'super_admin'})).data==='approved','Real transfer is atomic');
 assert((await page(clientA,fileUrl)).status===404&&(await send(clientA,oldClientFields,small)).status===404,'Same Client cookie loses old company file and upload on transfer');
 assert((await clientA.client.rpc('ticket_attachment',{p_organization_id:orgA,p_ticket_id:idA,p_attachment_id:first.id})).error?.code==='42501','Same JWT loses old download metadata on transfer');
 // Colleague is still a harmless approved Client in A for the optional live browser check.
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
 const ids=accounts.map(a=>a.id).filter(Boolean);
 try{sql('drop trigger if exists ticket_attachment_web_fault on public.audit_logs;drop function if exists securedesk_private.ticket_attachment_web_fault();select to_jsonb(true)');}catch{failed=true;console.error('FAIL: Scoped audit fixture cleanup');}
 try{for(const org of [orgA,orgB].filter(Boolean))sql("with c as(update public.organization_access_codes set active=false,revoked_at=clock_timestamp() where organization_id="+q(org)+" and active returning id) select to_jsonb(true)");}catch{failed=true;console.error('FAIL: Fictional code cleanup');}
 try{if(ids.length){const values=ids.map(q).join(',');sql("with s as(update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ("+values+") and (active or can_create_project) returning id),a as(update public.organization_admin_assignments set active=false where admin_user_id in ("+values+") and active returning id),p as(update public.profiles set app_role='client' where id in ("+values+") and app_role<>'client' returning id) select to_jsonb(true)");if(accounts[0]?.id)sql("with p as(update public.profiles set account_status='pending' where id="+q(accounts[0].id)+" returning id) select to_jsonb(true)");}}catch{failed=true;console.error('FAIL: Fixture role cleanup');}
 for(const account of accounts)try{if((await account.client.auth.signOut({scope:'local'})).error)throw new CheckError('Signout failed');account.cookies.clear();}catch{failed=true;console.error('FAIL: Fixture signout');}
 try{if(adminCount!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Persistent Super Admin count unchanged');if(ids.length){const values=ids.map(q).join(',');assert(sql('select count(*)::integer from auth.sessions where user_id in ('+values+')')===0,'All new fixture sessions closed');assert(sql("select count(*)::integer from public.profiles where id in ("+values+") and app_role<>'client'")===0,'No privileged fixture roles remain');assert(sql('select count(*)::integer from public.staff_organization_assignments where staff_user_id in ('+values+') and (active or can_create_project)')===0,'No Staff fixture permissions remain');assert(sql('select count(*)::integer from public.organization_admin_assignments where admin_user_id in ('+values+') and active')===0,'No OA fixture assignments remain');}if(baseline)assert(JSON.stringify(snapshot(baseline))===JSON.stringify(baseline),'All earlier business rows unchanged');}catch(error){failed=true;console.error('FAIL: '+(error instanceof CheckError?error.message:'Final guard failed'));}
}
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/phase5-step2/attachments-web-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',stage,matrix,fileFixtures,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Ticket attachment Auth/API/Storage/HTTP matrix: '+checks+' checks / '+(failed?'FAIL':'PASS'));if(failed)process.exitCode=1;




