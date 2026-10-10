import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Scoped projects, explicit Staff permission, General Support and native forms.
// All business decisions use authenticated RPCs. Owner writes only bootstrap/fixture revocation.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321',site='http://127.0.0.1:3000',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const tables=['project_proposals','attachments','organization_change_requests','organization_change_approvals','organization_access_codes','organization_code_submissions','profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs'];
const accounts=[],matrix=[];let checks=0,stage='local guards',key,baseline,adminCount,orgA,orgB;
const q=value=>"'"+value.replaceAll("'","''")+"'";
function assert(condition,label){if(!condition)throw new CheckError(label);checks++;}
function command(args){const r=spawnSync(docker,args,{cwd:root,encoding:'utf8',timeout:30000});if(r.error||r.status)throw new CheckError('Local database verification failed; private details withheld.');return r.stdout.trim();}
function sql(query){const s=command(['exec','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1','-c',query]);return s?JSON.parse(s):null;}
function snapshot(previous){return tables.map(table=>sql('select jsonb_build_object(\'table\','+q(table)+',\'count\',count(*),\'hash\',md5(coalesce(string_agg(to_jsonb(t)::text,\'\' order by id),\'\')),\'ids\',coalesce(jsonb_agg(id order by id),\'[]\'::jsonb)) from public.'+table+' t'+(previous?(previous.find(x=>x.table===table).ids.length?' where id in ('+previous.find(x=>x.table===table).ids.map(q).join(',')+')':' where false'):'')));}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const revision=id=>String(sql('select access_revision from public.profiles where id='+q(id)));
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
async function register(label){
  const email='securedesk-proposals-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Proposal Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
  const markup=[...web.html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].find(m=>m[0].includes(marker))?.[0];
  if(!markup)throw new CheckError('Expected native form missing: '+marker);
  return {markup,path:web.path};
}
async function post(account,selected,fields={},origin=site) {
  const data=new FormData(),decode=v=>v.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  for(const tag of selected.markup.matchAll(/<input\b[^>]*>/gi)){
    const attrs=Object.fromEntries([...tag[0].matchAll(/([\w$:-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
    if(attrs.type==='hidden'&&attrs.name)data.set(attrs.name,attrs.value??'');
  }
  assert([...data.keys()].some(k=>k.startsWith('$ACTION_')),'Real native action reference used.');
  for(const [k,v] of Object.entries(fields))data.set(k,v);
  return page(account,selected.path,{method:'POST',headers:{origin},body:data});
}
async function allowedRpc(client,name,args,label){const r=await client.rpc(name,args);assert(!r.error,label);return r.data;}

async function run() {
 if(process.argv.slice(2).length!==1||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo to retain fictional proposal fixtures.');
 const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
 if(env.NEXT_PUBLIC_SUPABASE_URL!==api||env.SITE_URL!==site||!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||!env.SUPABASE_STORAGE_SECRET_KEY||process.env.DOCKER_HOST)throw new CheckError('Refusing nonlocal/unconfigured test target.');
 key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 const host=JSON.parse(command(['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
 if(!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host)&&host!=='unix:///var/run/docker.sock')throw new CheckError('Expected local Docker context.');
 const labels=JSON.parse(command(['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
 if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw new CheckError('Unexpected local project/workspace.');
 baseline=snapshot();adminCount=sql("select count(*)::integer from public.profiles where app_role='super_admin'");
 stage='confirmed Auth sessions';
 for(const label of ['super-admin','admin-a','admin-b','reviewer','other-staff','client-a','client-b','pending','client-peer'])await register(label);
 const [sa,oa,oaB,reviewer,other,clientA,clientB,pending,peer]=accounts,anonymous=createClient(api,key,options);
 stage='controlled proposal fixture setup';
 assert(sql("with c as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Proposal Screen Account' and app_role='client' and account_status='pending' returning id)select count(*)::integer from c")===1,'Only new fixture SA bootstrap.');
 for(const target of [oa,oaB,reviewer,other])await allowedRpc(sa.client,'approve_privileged_registration',{p_request_id:requestFor(target.id).id,p_role:[oa,oaB].includes(target)?'admin':'staff',p_reason:'Fictional proposal fixture.'},'Approve fixture role.');
 const company=label=>({name:'Fictional Proposal Company '+label+' '+randomUUID().slice(0,8),description:'Fictional private proposal workflow.',address:'Fictional office',email:'proposals-'+label.toLowerCase()+'@securedesk.example.invalid',phone:'+12025550666'});
 orgA=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientA.id).id,p_details:company('A')},'Approve company A.');
 orgB=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientB.id).id,p_details:company('B')},'Approve company B.');
 await allowedRpc(sa.client,'route_registration_request',{p_request_id:requestFor(peer.id).id,p_organization_id:orgA},'Route peer to A.');
 await allowedRpc(sa.client,'approve_registration_request',{p_request_id:requestFor(peer.id).id,p_organization_id:orgA},'Approve peer membership.');
 const oaArgs=(actor,org,active)=>({p_organization_id:org,p_admin_user_id:actor.id,p_expected_access_revision:revision(actor.id),p_expected_assignment_revision:sql('select to_jsonb(revision::text) from public.organization_admin_assignments where organization_id='+q(org)+' and admin_user_id='+q(actor.id)),p_active:active,p_reason:'Fictional proposal OA scope.'});
 for(const [actor,org] of [[oa,orgA],[oaB,orgB]])await allowedRpc(sa.client,'set_organization_admin_assignment',oaArgs(actor,org,true),'Assign fixture OA.');
 const staffArgs=(actor,active)=>({p_organization_id:orgA,p_staff_user_id:actor.id,p_expected_access_revision:revision(actor.id),p_expected_assignment_revision:sql('select to_jsonb(revision::text) from public.staff_organization_assignments where organization_id='+q(orgA)+' and staff_user_id='+q(actor.id)),p_active:active,p_can_create_project:actor===other&&active,p_reason:'Fictional reviewer scope.'});
 for(const actor of [reviewer,other])await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(actor,true),'Assign fixture Staff.');
 const path=org=>'/organizations/'+org+'/proposals';
 const field=(selected,name)=>[...selected.markup.matchAll(/<input\b[^>]*>/gi)].find(m=>m[0].includes('name="'+name+'"'))?.[0].match(/value="([^"]*)"/)?.[1]??'';
 const row=id=>sql('select to_jsonb(p) from public.project_proposals p where id='+q(id));
 const details={title:'Fictional network renewal <script>proposalProbe()</script>',description:'Upgrade the fictional company network.',reason:'Fictional capacity planning.',desired_deadline:'2026-12-20',proposed_priority:'High'};
 const context=(actor,org)=>actor.client.rpc('organization_proposal_context',{p_organization_id:org});
 const draft=form(await page(clientA,path(orgA)),'data-proposal-form="submit"'),id=field(draft,'proposal_id'),detail=path(orgA)+'/'+id;
 for(const actor of [null,pending,reviewer,other,oaB,clientB])assert(!(await post(actor,draft,details)).location&&row(id)===null,'Copied Client submit form cannot bypass scope/role.');
 assert((await post(clientA,draft,{...details,title:' '})).html.includes('Enter the title'),'Native submit validates required fields.');
 assert((await post(clientA,draft,details,'https://foreign.example.invalid')).status===500&&row(id)===null,'Foreign-Origin native submission denied.');
 assert((await post(clientA,draft,{...details,status:'approved',proposed_by_user_id:sa.id,project_id:randomUUID()})).location===detail+'?notice=submit','Native Client submits proposal.');
 assert(row(id).status==='pending'&&row(id).proposed_by_user_id===clientA.id&&!row(id).project_id,'Forged fields cannot activate proposal or rewrite author.');
 assert((await post(clientA,draft,details)).location===detail+'?notice=submit','Identical native submission is idempotent.');
 assert(sql('select count(*)::integer from public.audit_logs where target_id='+q(id)+" and event_type='proposal.submitted'")===1,'One submission audit.');
 const escaped=await page(clientA,detail);assert(!escaped.html.includes('<script>proposalProbe()</script>')&&escaped.html.includes('&lt;script&gt;proposalProbe()&lt;/script&gt;'),'Proposal fields are escaped.');
 assert(!escaped.html.includes(env.SUPABASE_STORAGE_SECRET_KEY),'Server-only storage key not serialized.');
 stage='proposal role/tenant/privacy matrix';
 for(const actor of [null,...accounts]){
  const before=checks,readable=[sa,oa,clientA].includes(actor),web=await page(actor,detail),rpc=await(actor?.client??anonymous).rpc('organization_proposal',{p_organization_id:orgA,p_proposal_id:id});
  assert(readable?!rpc.error:rpc.error?.code==='42501','Proposal DTO author/admin-only before reviewer assignment.');
  assert(readable?web.html.includes('data-proposal-detail='):!web.html.includes('data-proposal-detail='),'Native proposal detail privacy.');
  assert(web.headers.get('cache-control')?.includes('no-store'),'Native detail private/no-store.');
  if(actor){
   for(const table of ['project_proposals','attachments'])for(const method of ['update','delete']){
    const r=method==='update'?actor.client.from(table).update({organization_id:orgB}).eq('organization_id',orgA):actor.client.from(table).delete().eq('organization_id',orgA);
    const outcome=await r;assert(outcome.error?.code==='42501','Direct '+table+' '+method+' denied ('+(outcome.error?.code??outcome.status)+').');
   }
   const visible=await actor.client.from('project_proposals').select('id').eq('id',id);
   assert(!visible.error&&visible.data.length===(readable?1:0),'RLS proposal visibility.');
  }
  matrix.push({role:actor?.label??'anonymous',checks:checks-before,result:'PASS'});
 }
 for(const pair of [[orgB,id],[orgA,randomUUID()],[orgA,'invalid']]){
  const r=await page(clientA,path(pair[0])+'/'+pair[1]);assert(!r.html.includes('data-proposal-detail='),'Wrong tenant/missing/malformed proposal unavailable.');
 }
 stage='native reviewer recommendation and final decision';
 const assignment=form(await page(oa,detail),'data-proposal-form="assign"');
 assert((await post(oa,assignment,{reviewer_id:clientA.id})).html.includes('details cannot be saved'),'Client cannot be selected as Staff reviewer.');
 assert((await post(oa,assignment,{reviewer_id:reviewer.id})).location===detail+'?notice=assign','OA selects assigned Staff reviewer.');
 const reviewerPage=await page(reviewer,detail);assert(reviewerPage.html.includes('data-proposal-form="recommend"')&&!reviewerPage.html.includes('data-proposal-form="approve"'),'Reviewer can recommend with no project creation permission.');
 assert(!(await page(other,detail)).html.includes('data-proposal-detail='),'Project creation permission does not grant unassigned review.');
 const recommendation=form(reviewerPage,'data-proposal-form="recommend"');
 assert((await post(reviewer,recommendation,{text:'Recommend approval for fictional network capacity.'})).location===detail+'?notice=recommend','Native Staff recommendation saved.');
 assert(row(id).status==='pending'&&row(id).recommended_by_user_id===reviewer.id,'Recommendation does not activate project and records actual actor.');
 const decision=form(await page(oa,detail),'data-proposal-form="approve"');
 for(const actor of [clientA,peer,reviewer,other,oaB])assert(!(await post(actor,decision,{text:'Forged approval'})).location&&row(id).status==='pending','Copied Admin decision cannot widen permission.');
 const concurrentArgs=async(actor,intent)=>{const c=(await context(actor,orgA)).data[0];return{p_organization_id:orgA,p_proposal_id:id,p_expected_revision:String(row(id).revision),p_expected_access_revision:c.access_revision,p_expected_assignment_revision:c.assignment_revision,p_intent:intent,p_text:'Concurrent fixture decision.'};};
 const args=await concurrentArgs(oa,'approve');
 const racing=await Promise.all([oa.client.rpc('review_project_proposal',args),oa.client.rpc('review_project_proposal',{...args,p_intent:'reject'})]);
 assert(racing.filter(r=>!r.error).length===1&&racing.filter(r=>r.error?.code==='PT409').length===1,'Concurrent approve/reject accepts exactly one final decision.');
 const first=row(id);assert(['approved','rejected'].includes(first.status),'Concurrent decision is final.');
 assert(sql('select count(*)::integer from public.audit_logs where target_id='+q(id)+" and event_type in ('proposal.approve','proposal.reject')")===1,'Concurrent final decision has one audit.');
 assert(!(await post(oa,decision,{text:'Duplicate click'})).location,'Old native decision cannot run twice.');
 assert(sql('select count(*)::integer from public.projects where id='+q(first.project_id??randomUUID()))===(first.status==='approved'?1:0),'Final outcome creates at most one project.');

 // Separate native approved and rejected proposals provide deterministic browser evidence.
 const make=async(actor,org,title)=>{const f=form(await page(actor,path(org)),'data-proposal-form="submit"'),uid=field(f,'proposal_id');assert((await post(actor,f,{...details,title})).location===path(org)+'/'+uid+'?notice=submit','Native scoped proposal creation.');return uid;};
 const approved=await make(clientA,orgA,'Fictional office connectivity project');
 const approvedPath=path(orgA)+'/'+approved;
 const assignApproved=form(await page(oa,approvedPath),'data-proposal-form="assign"');
 await post(oa,assignApproved,{reviewer_id:reviewer.id});
 assert((await post(reviewer,form(await page(reviewer,approvedPath),'data-proposal-form="recommend"'),{text:'The fictional proposal is ready for review.'})).location===approvedPath+'?notice=recommend','Recommend deterministic proposal.');
 assert((await post(oa,form(await page(oa,approvedPath),'data-proposal-form="approve"'),{text:'Approved fictional business need.'})).location===approvedPath+'?notice=approve','Native approve creates active project.');
 const result=row(approved);assert(result.project_id&&result.status==='approved'&&result.decided_by_admin_user_id===oa.id,'Native decision actor and project stored.');
 const created=sql('select to_jsonb(p) from public.projects p where id='+q(result.project_id));
 assert(created.organization_id===orgA&&created.created_by_user_id===oa.id&&created.name===result.title&&created.status==='active'&&!created.is_general_support,'Created project derives tenant/content and actual Admin identity.');
 const rejected=await make(peer,orgA,'Fictional proposal declined');
 const rejectedPath=path(orgA)+'/'+rejected,rejectForm=form(await page(oa,rejectedPath),'data-proposal-form="reject"');
 assert((await post(oa,rejectForm,{text:''})).html.includes('Enter a recommendation or rejection reason'),'Native reject requires reason.');
 assert((await post(oa,rejectForm,{text:'Fictional duplicate request.'})).location===rejectedPath+'?notice=reject'&&row(rejected).project_id===null,'Native rejection creates no project.');
 const uploadProposal=await make(clientA,orgA,'Fictional proposal with private evidence'),uploadPath=path(orgA)+'/'+uploadProposal;
 const content=Buffer.from('Fictional private proposal evidence.\n');
 stage='hosting proposal transfer boundaries';
 const transferProposal=await make(clientA,orgA,'Fictional proposal transfer hosting check');
 const transferPath=path(orgA)+'/'+transferProposal,transferEndpoint=transferPath+'/attachments/transfer';
 const transferFields=async actor=>{
  const selected=form(await page(actor,transferPath),'data-proposal-upload="true"');
  return Object.fromEntries(['revision','access_revision','assignment_revision'].map(name=>[name,field(selected,name)]));
 };
 const transferCall=(actor,input,endpoint=transferEndpoint,origin=site)=>page(actor,endpoint,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(input)});
 const prepare=async(actor,name='transferred.txt',bytes=content,mime='text/plain')=>transferCall(actor,{intent:'prepare',...await transferFields(actor),name,mime,size:bytes.length});
 const complete=(id,actor=clientA,endpoint=transferEndpoint)=>transferCall(actor,{intent:'complete',id},endpoint);
 const transferRows=()=>sql("select coalesce(jsonb_agg(to_jsonb(a) order by created_at,id),'[]'::jsonb) from public.attachments a where project_proposal_id="+q(transferProposal));
 const preparedInput={intent:'prepare',...await transferFields(clientA),name:'transferred.txt',mime:'text/plain',size:content.length};
 for(const actor of [null,pending,peer,clientB,reviewer,other,oaB])
  assert([404,409].includes((await transferCall(actor,preparedInput)).status)&&transferRows().length===0,'Proposal transfer denies copied identity or inaccessible parent.');
 assert((await transferCall(clientA,preparedInput,transferEndpoint,'https://foreign.example.invalid')).status===403,'Proposal transfer rejects foreign Origin.');
 assert((await transferCall(clientA,{...preparedInput,storage_path:'forged'})).status===400&&transferRows().length===0,'Proposal transfer rejects forged metadata.');
 const prepared=JSON.parse((await prepare(clientA)).html);
 assert(prepared.token&&prepared.bucket==='attachment-quarantine'&&prepared.path===prepared.id,'Proposal token is limited to quarantine.');
 assert((await complete(prepared.id)).status===503,'Proposal completion without bytes is retryable.');
 assert((await complete(prepared.id,peer)).status===404,'Peer cannot finalize another author upload.');
 assert((await complete(prepared.id,clientA,path(orgB)+'/'+transferProposal+'/attachments/transfer')).status===404,'Proposal transfer binds organization and parent.');
 assert(!(await anonymous.storage.from(prepared.bucket).uploadToSignedUrl(prepared.path,prepared.token,content,{contentType:'text/plain'})).error,'Proposal bytes transfer directly to private quarantine.');
 assert((await complete(prepared.id)).status===200&&(await complete(prepared.id)).status===200,'Proposal publication succeeds and retry is idempotent.');
 const transferred=transferRows().find(a=>a.id===prepared.id),transferUrl=transferPath+'/attachments/'+prepared.id;
 assert(transferred.state==='ready'&&transferred.sha256===createHash('sha256').update(content).digest('hex'),'Proposal checksum is trusted and immutable.');
 assert(sql("select count(*)::integer from public.audit_logs where target_id="+q(prepared.id)+" and event_type='proposal.attachment_uploaded'")===1,'Proposal publication audits only once.');
 for(const actor of [null,...accounts]){
  const allowed=[clientA,oa,sa].includes(actor),download=await page(actor,transferUrl);
  assert(allowed?download.status===200&&download.html===content.toString():download.status===404,'Transferred proposal download follows current parent scope.');
 }
 const bad=JSON.parse((await prepare(clientA,'fake.pdf',content,'application/pdf')).html);
 await anonymous.storage.from(bad.bucket).uploadToSignedUrl(bad.path,bad.token,content,{contentType:'application/pdf'});
 assert((await complete(bad.id)).status===400&&!transferRows().some(a=>a.id===bad.id),'Transferred fake PDF is not published.');
 const administrator=JSON.parse((await prepare(oa,'admin-transferred.txt')).html);
 assert(administrator.token,'Admin obtains a capability using own access revision.');
 await anonymous.storage.from(administrator.bucket).uploadToSignedUrl(administrator.path,administrator.token,content,{contentType:'text/plain'});
 assert((await complete(administrator.id,oa)).status===200,'Scoped Admin publishes transferred evidence.');
 const transferredLimitBytes=Buffer.alloc(10485760,65);
 const transferredLimit=JSON.parse((await prepare(clientA,'transfer-limit.txt',transferredLimitBytes)).html);
 assert(!(await anonymous.storage.from(transferredLimit.bucket).uploadToSignedUrl(transferredLimit.path,transferredLimit.token,transferredLimitBytes,{contentType:'text/plain'})).error,'Exact 10 MiB proposal transfer avoids app request payload.');
 assert((await complete(transferredLimit.id)).status===200,'Exact 10 MiB proposal publishes.');
 const transferredLarge=await page(clientA,transferPath+'/attachments/'+transferredLimit.id);
 assert(transferredLarge.status===200&&Buffer.byteLength(transferredLarge.html)===10485760&&createHash('sha256').update(transferredLarge.html).digest('hex')===createHash('sha256').update(transferredLimitBytes).digest('hex'),'Large proposal stream preserves every verified byte.');
 await post(oa,form(await page(oa,transferPath),'data-proposal-form="assign"'),{reviewer_id:reviewer.id});
 assert((await page(reviewer,transferUrl)).status===200,'Assigned reviewer reads transferred proposal evidence.');
 const reviewerInput={intent:'prepare',...await transferFields(clientA),name:'reviewer.txt',mime:'text/plain',size:content.length};
 assert((await transferCall(reviewer,reviewerInput)).status===409,'Reading reviewer cannot publish attachments.');
 const changed=JSON.parse((await prepare(clientA)).html);
 await anonymous.storage.from(changed.bucket).uploadToSignedUrl(changed.path,changed.token,content,{contentType:'text/plain'});
 assert(!(await post(oa,form(await page(oa,transferPath),'data-proposal-form="reject"'),{text:'Fictional decision while upload was in flight.'})).location&&row(transferProposal).status==='pending','In-flight upload blocks a final proposal decision.');
 assert((await post(oa,form(await page(oa,transferPath),'data-proposal-form="recommend"'),{text:'Fictional changed recommendation.'})).location===transferPath+'?notice=recommend','Change proposal revision after reservation.');
 assert((await complete(changed.id)).status===409&&!transferRows().some(a=>a.id===changed.id),'Changed proposal revision prevents publication and compensates.');
 stage='private attachment HTTP validation';
 const uploadFields=async()=>{const web=await page(clientA,uploadPath),f=form(web,'data-proposal-upload="true"');return Object.fromEntries(['revision','access_revision','assignment_revision'].map(n=>[n,field(f,n)]));};
 const upload=async(actor,name,mime,bytes,origin=site,extra={})=>{
  const fields=await uploadFields(),data=new FormData();for(const[k,v]of Object.entries({...fields,...extra}))data.set(k,v);
  data.set('file',new File([bytes],name,{type:mime}));return page(actor,uploadPath+'/attachments',{method:'POST',headers:{origin},body:data});
 };
 const countFiles=()=>sql('select count(*)::integer from public.attachments where project_proposal_id='+q(uploadProposal));
 for(const actor of [null,pending,peer,clientB,reviewer,other,oaB])assert((await upload(actor,'evidence.txt','text/plain',content)).status===404&&countFiles()===0,'Upload author/admin scope enforced.');
 assert((await upload(clientA,'evidence.txt','text/plain',content,'https://foreign.example.invalid')).status===403&&countFiles()===0,'Multipart upload explicitly rejects foreign Origin.');
 for(const [name,mime,bytes]of [['spoof.pdf','application/pdf',content],['unsafe.svg','image/svg+xml',Buffer.from('<svg/>')],['binary.txt','text/plain',Buffer.from([0,255])],['mismatch.txt','application/pdf',content],['large.txt','text/plain',Buffer.alloc(10*1024*1024+1,65)]]){
  const r=await upload(clientA,name,mime,bytes);assert(r.location===uploadPath+'?upload_error=invalid'&&countFiles()===0,'HTTP rejects invalid attachment '+name+' without publishing.');
 }
 assert((await upload(clientA,'evidence.txt','text/plain',content)).location===uploadPath+'?notice=upload','Native multipart TXT upload succeeds.');
 const attachment=sql("select to_jsonb(a) from public.attachments a where project_proposal_id="+q(uploadProposal)+" and state='ready'");
 assert(attachment.uploaded_by_user_id===clientA.id&&attachment.size_bytes===content.length&&attachment.mime_type==='text/plain','Server validates immutable attachment metadata.');
 const url=uploadPath+'/attachments/'+attachment.id;
 for(const actor of [null,...accounts]){
  const can=[sa,oa,clientA].includes(actor),r=await page(actor,url);
  assert(can?r.status===200&&r.html===content.toString():r.status===404,'Attachment download inherits exact parent permission.');
  assert(r.headers.get('cache-control')?.includes('no-store'),'Download and unavailable response are no-store.');
  if(can)assert(r.headers.get('content-type')==='application/octet-stream'&&r.headers.get('content-disposition')?.startsWith('attachment;')&&r.headers.get('x-content-type-options')==='nosniff','Download is a forced file without inline execution.');
  if(can)assert(r.headers.get('content-security-policy')==="sandbox; default-src 'none'",'Proposal file preserves its strict sandbox through Proxy.');
  const direct=await(actor?.client??anonymous).storage.from('proposal-attachments').download(attachment.storage_path);
  assert(Boolean(direct.error),'Direct authenticated/anonymous Storage read denied.');
  const signed=await(actor?.client??anonymous).storage.from('proposal-attachments').createSignedUrl(attachment.storage_path,60);
  assert(Boolean(signed.error),'Direct user signed URLs denied.');
 }
 for(const actor of [clientA,oa,sa]){
  const write=await actor.client.storage.from('proposal-attachments').upload(orgA+'/'+uploadProposal+'/'+randomUUID(),content,{contentType:'text/plain'});
  assert(Boolean(write.error),'Direct upload cannot bypass server format checks.');
  assert((await actor.client.rpc('complete_proposal_attachment',{p_attachment_id:attachment.id,p_actor_id:actor.id,p_sha256:'a'.repeat(64)})).error?.code==='42501','User cannot forge trusted completion.');
 }
 for(const wrong of [path(orgB)+'/'+uploadProposal+'/attachments/'+attachment.id,path(orgA)+'/'+approved+'/attachments/'+attachment.id,uploadPath+'/attachments/'+randomUUID()])assert((await page(clientA,wrong)).status===404,'Attachment URL tenant/parent/ID binding.');

 assert((await upload(clientA,'limit.txt','text/plain',Buffer.alloc(10*1024*1024,65))).location===uploadPath+'?notice=upload','Exact 10 MB file survives proxy, multipart, validator and private Storage.');
 const limitFile=sql("select to_jsonb(a) from public.attachments a where project_proposal_id="+q(uploadProposal)+" and original_name='limit.txt' and state='ready'");
 assert(limitFile.size_bytes===10*1024*1024,'Exact limit attachment records 10485760 bytes.');
 const limitDownload=await page(clientA,uploadPath+'/attachments/'+limitFile.id);
 assert(limitDownload.status===200&&Buffer.byteLength(limitDownload.html)===10*1024*1024,'Exact limit private file downloads in full.');

 const staleFields=await uploadFields();
 assert((await upload(clientA,'second.csv','text/csv',Buffer.from('name,status\nFictional,pending\n'))).location===uploadPath+'?notice=upload','CSV multipart upload succeeds.');
 assert((await upload(clientA,'stale.txt','text/plain',content,site,staleFields)).location===uploadPath+'?upload_error=stale','Old upload form cannot append to changed proposal.');
 assert((await upload(oa,'administrator-note.txt','text/plain',content)).location===uploadPath+'?upload_error=stale','Copied author access revision is not trusted for an administrator.');
 // Administrator uses their own current native form versions.
 const oaUpload=form(await page(oa,uploadPath),'data-proposal-upload="true"'),oaData=new FormData();
 for(const n of ['revision','access_revision','assignment_revision'])oaData.set(n,field(oaUpload,n));
 oaData.set('file',new File([content],'administrator-note.txt',{type:'text/plain'}));
 assert((await page(oa,uploadPath+'/attachments',{method:'POST',headers:{origin:site},body:oaData})).location===uploadPath+'?notice=upload','Scoped Admin uploads using own current form.');
 const uploadAssign=form(await page(oa,uploadPath),'data-proposal-form="assign"');
 await post(oa,uploadAssign,{reviewer_id:reviewer.id});
 assert((await page(reviewer,url)).status===200,'Assigned reviewer downloads proposal evidence.');
 assert((await page(other,url)).status===404,'Unassigned Staff cannot download despite project create permission.');
 stage='reviewer revocation and regrant';
 const savedReview=form(await page(reviewer,uploadPath),'data-proposal-form="recommend"');
 await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(reviewer,false),'Revoke reviewer company.');
 assert(!(await page(reviewer,uploadPath)).html.includes('data-proposal-detail=')&&(await page(reviewer,url)).status===404,'Same cookie immediately loses proposal and attachment.');
 await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(reviewer,true),'Regrant Staff company at new revision.');
 assert((await page(reviewer,url)).status===404,'Regrant does not revive historical reviewer.');
 assert((await page(reviewer,transferUrl)).status===404,'Regrant does not revive transferred evidence scope.');
 assert(!(await post(reviewer,savedReview,{text:'Old reviewer form.'})).location,'Old review form remains invalid.');
 await post(oa,form(await page(oa,uploadPath),'data-proposal-form="assign"'),{reviewer_id:reviewer.id});
 assert((await page(reviewer,url)).status===200,'Admin explicitly refreshes reviewer scope.');
 stage='same-session Client transfer';
 const cookies=[...clientA.cookies],code=(await allowedRpc(oaB.client,'manage_organization_access_code',{p_organization_id:orgB,p_expected_code_id:null,p_intent:'issue'},'Issue local transfer code.'))[0];
 assert((await clientA.client.rpc('submit_organization_transfer',{p_code:code.code})).data==='submitted','Author requests transfer.');
 const transfer=sql("select to_jsonb(t) from public.organization_change_requests t where user_id="+q(clientA.id)+" and status='pending'");
 assert((await sa.client.rpc('review_organization_transfer',{p_request_id:transfer.id,p_expected_revision:String(transfer.revision),p_intent:'approve',p_side:'super_admin'})).data==='approved','Transfer completes atomically.');
 assert((await page(clientA,url)).status===404&&!(await page(clientA,uploadPath)).html.includes('data-proposal-detail='),'Same transferred author cookie loses old proposal and file.');
 assert((await clientA.client.rpc('proposal_attachment',{p_organization_id:orgA,p_proposal_id:uploadProposal,p_attachment_id:attachment.id})).error?.code==='42501','Same transferred JWT loses old attachment DTO.');
 assert((await page(clientA,transferUrl)).status===404&&(await complete(prepared.id)).status===404,'Transferred author loses new transfer download and completion retry.');
 assert(JSON.stringify([...clientA.cookies])===JSON.stringify(cookies),'Access revocation does not depend on replacing login cookie.');
 assert((await page(oa,url)).status===200&&(await page(reviewer,url)).status===200,'Scoped Admin/reviewer keep authorized source proposal history.');
 const destination=await make(clientA,orgB,'Fictional transferred Client proposal');
 assert(row(destination).organization_id===orgB,'Transferred Client can submit in destination only.');
 stage='OA revocation, filters, inactive company';
 const oaOld=form(await page(oa,uploadPath),'data-proposal-form="approve"');
 await allowedRpc(sa.client,'set_organization_admin_assignment',oaArgs(oa,orgA,false),'Revoke OA scope.');
 assert((await page(oa,url)).status===404&&!(await post(oa,oaOld,{text:'Revoked OA.'})).location,'Same OA cookie loses attachment and old decision.');
 await allowedRpc(sa.client,'set_organization_admin_assignment',oaArgs(oa,orgA,true),'Regrant OA scope at new revision.');
 assert((await post(oa,oaOld,{text:'Old OA form.'})).html.includes('proposal or your permissions have changed'),'OA regrant does not restore stale decision form.');
 for(const bad of [{p_status:'bad'},{p_offset:-1}])assert((await sa.client.rpc('organization_proposals',{p_organization_id:orgA,...bad})).error?.code==='22023','Proposal RPC validates filters.');
 assert((await page(peer,path(orgA)+'?status=rejected')).html.includes(rejected),'Author sees own rejected filter.');
 assert(!(await page(peer,path(orgA)+'?status=rejected')).html.includes(approved),'Peer cannot enumerate other author proposals.');
 // Bounded list with lookahead is checked using new fixture-only proposals.
 for(let n=0;n<26;n++){
  const c=(await context(peer,orgA)).data[0];
  await allowedRpc(peer.client,'submit_project_proposal',{p_organization_id:orgA,p_proposal_id:randomUUID(),p_expected_access_revision:c.access_revision,p_expected_assignment_revision:null,p_details:{...details,title:'Fictional page proposal '+String(n).padStart(2,'0')}},'Pagination proposal.');
 }
 const firstPage=await page(peer,path(orgA)),secondPage=await page(peer,path(orgA)+'?page=2');
 assert((firstPage.html.match(/data-proposal-record=/g)??[]).length===25&&firstPage.html.includes('Next page'),'Proposal first page bounded to 25.');
 assert((secondPage.html.match(/data-proposal-record=/g)??[]).length===2&&secondPage.html.includes('Previous page'),'Proposal second page has remaining own records.');
 sql("with c as(update public.organizations set status='inactive' where id="+q(orgB)+" returning id)select count(*)::integer from c");
 assert(!(await page(clientA,path(orgB))).html.includes('data-proposal-record='),'Inactive company revokes Client proposal list.');
 assert((await page(sa,path(orgB))).html.includes('read-only')&&!(await page(sa,path(orgB))).html.includes('data-proposal-form="submit"'),'SA inactive proposal history is read-only.');
 // Expose only nonsensitive fixture IDs for later browser verification.
 matrix.push({role:'browser fixtures',approved,rejected,pending:uploadProposal,attachment:attachment.id,result:'PASS'});
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
  const ids=accounts.map(a=>a.id).filter(Boolean);
  try { for (const org of [orgA,orgB].filter(Boolean)) sql("with c as(update public.organization_access_codes set active=false,revoked_at=clock_timestamp() where organization_id="+q(org)+" and active returning id) select to_jsonb(true)"); }
  catch { failed=true; console.error('FAIL: New fictional code cleanup needs attention.'); }
  try{if(ids.length){const list=ids.map(q).join(',');sql('with s as(update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ('+list+') and (active or can_create_project) returning id),a as(update public.organization_admin_assignments set active=false where admin_user_id in ('+list+') and active returning id),p as(update public.profiles set app_role=\'client\' where id in ('+list+') and app_role<>\'client\' returning id),u as(update auth.users set banned_until=null where id in ('+list+') and banned_until is not null returning id) select to_jsonb(true)');if(accounts[0]?.id)sql('with p as(update public.profiles set account_status=\'pending\' where id='+q(accounts[0].id)+' returning id) select to_jsonb(true)');}}
  catch{failed=true;console.error('FAIL: Fixture role cleanup needs attention.');}
  for(const account of accounts)try{if((await account.client.auth.signOut({scope:'local'})).error)throw new CheckError('Fixture signout failed.');account.cookies.clear();}catch{failed=true;console.error('FAIL: Fixture session cleanup needs attention.');}
  try{if(adminCount!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Persistent Super Admin count unchanged.');if(ids.length){const list=ids.map(q).join(',');assert(sql('select count(*)::integer from auth.sessions where user_id in ('+list+')')===0,'All new fixture Auth sessions closed.');assert(sql("select count(*)::integer from public.profiles where id in ("+list+") and app_role<>'client'")===0,'All new privileged fixture roles removed.');assert(sql('select count(*)::integer from public.staff_organization_assignments where staff_user_id in ('+list+') and (active or can_create_project)')===0,'All new Staff assignment permissions removed.');assert(sql('select count(*)::integer from public.organization_admin_assignments where admin_user_id in ('+list+') and active')===0,'All new Admin assignments removed.');}if(baseline)assert(JSON.stringify(snapshot(baseline))===JSON.stringify(baseline),'Every existing business row unchanged.');}
  catch(error){failed=true;console.error('FAIL: '+(error instanceof CheckError?error.message:'Final fixture guard failed.'));}
}
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/organization-proposals-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Organization proposal API/native-form/attachment matrix: '+checks+' checks / '+(failed?'FAILED.':'PASS.'));if(failed)process.exitCode=1;

