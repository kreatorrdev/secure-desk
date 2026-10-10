import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
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
const tables=['organization_change_requests','organization_change_approvals','organization_access_codes','organization_code_submissions','profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs','project_proposals','attachments','tickets','ticket_collaborators','ticket_comments','ticket_comment_revisions','ticket_participant_requests','ticket_participants'];
const accounts=[],matrix=[];let checks=0,stage='local guards',key,baseline,adminCount,orgA,orgB;
const q=value=>"'"+value.replaceAll("'","''")+"'";
function assert(condition,label){if(!condition)throw new CheckError(label);checks++;}
function command(args,input){const r=spawnSync(docker,args,{cwd:root,input,encoding:'utf8',timeout:30000});if(r.error||r.status)throw new CheckError('Local database verification failed; private details withheld.');return r.stdout.trim();}
function sql(query){const s=command(['exec','-i','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1'],query);return s?JSON.parse(s):null;}
function snapshot(previous){return tables.map(table=>sql('select jsonb_build_object(\'table\','+q(table)+',\'count\',count(*),\'hash\',md5(coalesce(string_agg(to_jsonb(t)::text,\'\' order by id),\'\')),\'ids\',coalesce(jsonb_agg(id order by id),\'[]\'::jsonb)) from public.'+table+' t'+(previous?(previous.find(x=>x.table===table).ids.length?' where id in ('+previous.find(x=>x.table===table).ids.map(q).join(',')+')':' where false'):'')));}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const revision=id=>String(sql('select access_revision from public.profiles where id='+q(id)));
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
async function register(label){
  const email='securedesk-tickets-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Ticket Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
 if(process.argv.length!==3||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo to retain eleven fictional accounts and two companies.');
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
 assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Ticket Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed")===1,'Only new fixture receives temporary SA bootstrap.');
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
 const detail=(actor,id,org=orgA)=>(actor?.client??anonymous).rpc('ticket_detail',{p_organization_id:org,p_ticket_id:id});
 const list=(actor,org=null,args={})=>(actor?.client??anonymous).rpc('ticket_list',{p_organization_id:org,...args});
 const manage=async(actor,id,intent,value,v=ticket(id).revision)=>(actor.client.rpc('manage_ticket',{...await common(actor,id),p_expected_revision:String(v),p_intent:intent,p_value:value}));
 const create=async(actor,id,client=clientA,org=orgA,project=supportA,extra={})=>actor.client.rpc('create_ticket',{...await common(actor,id,org),p_project_id:project,p_client_user_id:client.id,p_details:{title:'Fictional ticket '+id.slice(0,8),description:'A fictional support problem.',...extra}});
 const path=(org,id)=>'/organizations/'+org+'/tickets/'+id;
 const hidden=(selected,name)=>[...selected.markup.matchAll(/<input\b[^>]*>/gi)].find(m=>m[0].includes('name="'+name+'"'))?.[0].match(/value="([^"]*)"/)?.[1];
 const idA=randomUUID(),idSame=randomUUID(),idB=randomUUID(),idOnBehalf=randomUUID();
 stage='RPC defaults and on-behalf actor';
 assert(!(await create(clientA,idA)).error,'Client creates own ticket');assert(!(await create(colleague,idSame,colleague)).error,'Same-company colleague creates independent ticket');assert(!(await create(clientB,idB,clientB,orgB,supportB)).error,'B creates B ticket');assert(!(await create(reader,idOnBehalf)).error,'Staff opens on behalf');
 assert(ticket(idOnBehalf).created_by_user_id===reader.id&&ticket(idOnBehalf).client_user_id===clientA.id&&ticket(idOnBehalf).status==='Open'&&ticket(idOnBehalf).priority==='Medium','Actual Staff actor and Client identity plus defaults');
 assert(sql("select to_jsonb(actor_user_id="+q(reader.id)+" and metadata_redacted->>'on_behalf'='true') from public.audit_logs where event_type='ticket.created' and target_id="+q(idOnBehalf))===true,'Audit on-behalf actor is actual Staff');
 assert((await detail(reader,idOnBehalf)).error?.code==='42501','Creator and project permission give no ticket read');
 stage='real Auth RLS/DTO/HTTP matrix';
 const allIds=[idA,idSame,idB,idOnBehalf];
 for(const actor of [null,...accounts]){
  const before=checks,label=actor?.label??'anonymous';
  const visible=actor===sa?allIds:actor===oa?[idA,idSame,idOnBehalf]:actor===oaB?[idB]:actor===clientA?[idA,idOnBehalf]:actor===colleague?[idSame]:actor===clientB?[idB]:[];
  for(const id of allIds){const org=id===idB?orgB:orgA,r=await detail(actor,id,org),web=await page(actor,path(org,id));assert(visible.includes(id)?!r.error:r.error?.code==='42501',label+': DTO object scope');assert(visible.includes(id)?web.html.includes('data-ticket-detail='):!web.html.includes('data-ticket-detail='),label+': HTTP object scope');assert(web.headers.get('cache-control')?.includes('no-store'),label+': private HTTP caching');}
  const rows=await list(actor);assert(actor===null||actor===pending?rows.error?.code==='42501':!rows.error&&JSON.stringify(rows.data.filter(x=>allIds.includes(x.id)).map(x=>x.id).sort())===JSON.stringify([...visible].sort()),label+': list exact scope');
  const dashboard=await page(actor,'/dashboard');assert(actor===null||actor===pending?!dashboard.html.includes('data-dashboard='):dashboard.html.includes('data-dashboard="'+actor.label.replace('super-admin','super_admin').replace(/admin-[ab]/,'admin').replace(/owner|collaborator|org-reader|unassigned-staff/,'staff').replace(/client-.+/,'client')+'"'),label+': dashboard role');
  if(actor){const dbRows=await actor.client.from('tickets').select('id').in('id',allIds);assert(!dbRows.error&&JSON.stringify(dbRows.data.map(x=>x.id).sort())===JSON.stringify([...visible].sort()),label+': independent table RLS');
   for(const table of ['tickets','ticket_collaborators','ticket_comments','ticket_comment_revisions','ticket_participant_requests','ticket_participants'])for(const op of ['insert','update','delete']){const query=op==='insert'?actor.client.from(table).insert({id:randomUUID()}):op==='update'?actor.client.from(table).update({id:randomUUID()}).eq('id',randomUUID()):actor.client.from(table).delete().eq('id',randomUUID());assert((await query).error?.code==='42501',label+': direct '+op+' '+table+' denied');}}
  matrix.push({role:label,checks:checks-before,result:'PASS'});
 }
 stage='native creation, forged fields, CSRF and idempotence';
 const newForm=form(await page(clientA,'/organizations/'+orgA+'/tickets/new'),'data-ticket-form="create"'),nativeId=hidden(newForm,'ticket_id');
 assert(Boolean(nativeId),'Native creation uses submission ID');
 const marker='<script>ticketProbe()</script>',fields={title:'Fictional native support '+marker,description:'Fictional form problem.',project_id:supportA};
 for(const actor of [null,pending,colleague,oaB,unassigned]){const r=await post(actor,newForm,{...fields,app_role:'super_admin'});assert(!r.location?.includes('/tickets/'+nativeId)&&ticket(nativeId)===null,'Copied Client form cannot impersonate original Client');}
 assert((await post(clientA,newForm,{...fields,client_user_id:colleague.id})).html.includes('Your ticket access is unavailable')&&ticket(nativeId)===null,'Same-company forged Client denied');
 assert((await post(clientA,newForm,{...fields,project_id:supportB})).html.includes('Your ticket access is unavailable')&&ticket(nativeId)===null,'Forged cross-tenant project denied');
 assert((await post(clientA,newForm,{...fields,title:' '})).html.includes('Enter a title')&&ticket(nativeId)===null,'Native validation precedes write');
 const csrf=await post(clientA,newForm,fields,'https://foreign.example.invalid');assert([403,500].includes(csrf.status)&&ticket(nativeId)===null,'Foreign-origin action rejected');
 const created=await post(clientA,newForm,{...fields,status:'Closed',priority:'Critical',created_by_user_id:sa.id,owner_staff_user_id:owner.id});assert(created.location===path(orgA,nativeId)+'?notice=created','Native Client creation succeeds');assert(ticket(nativeId).priority==='Medium'&&ticket(nativeId).status==='Open'&&ticket(nativeId).created_by_user_id===clientA.id&&!ticket(nativeId).owner_staff_user_id,'Forged system fields ignored');assert((await post(clientA,newForm,fields)).location===created.location,'Native identical creation idempotent');assert(sql("select count(*)::integer from public.audit_logs where event_type='ticket.created' and target_id="+q(nativeId))===1,'One audit event for replay');
 const nativePage=await page(clientA,path(orgA,nativeId));assert(!nativePage.html.includes(marker)&&nativePage.html.includes('&lt;script&gt;ticketProbe()&lt;/script&gt;'),'Rendered ticket text escaped');
 const staffNew=form(await page(reader,'/organizations/'+orgA+'/tickets/new'),'data-ticket-form="create"'),staffId=hidden(staffNew,'ticket_id');assert((await post(reader,staffNew,{title:'Fictional Staff native ticket',description:'Created on behalf.',project_id:supportA,client_user_id:clientA.id})).location==='/tickets?notice=created','Staff creation redirects to accessible list');assert(ticket(staffId).created_by_user_id===reader.id&&(await detail(reader,staffId)).error?.code==='42501','Staff native actor exact with no implicit read');
 for(const [org,id] of [[orgB,idA],[orgA,idB],[orgA,randomUUID()],[orgA,'invalid-id']])assert((await page(clientA,path(org,id))).html.includes('Ticket not available'),'Foreign/missing/invalid IDs use same response');
 stage='owner, collaborator, status and priority native work';
 const adminPage=await page(oa,path(orgA,idA)),assign=form(adminPage,'data-ticket-form="owner"');
 for(const actor of [clientA,collab,reader,oaB])assert(!(await post(actor,assign,{value:owner.id})).location&&ticket(idA).status==='Open','Copied assignment denied');
 assert((await post(oa,assign,{value:owner.id})).location===path(orgA,idA)+'?notice=saved','Admin assigns owner');assert(ticket(idA).status==='Assigned','Owner assignment advances Open to Assigned');
 const ownerPage=await page(owner,path(orgA,idA)),add=form(ownerPage,'data-ticket-form="add_collaborator"');assert((await post(owner,add,{value:collab.id})).location===path(orgA,idA)+'?notice=saved','Owner adds Staff collaborator');assert(!(await detail(collab,idA)).error,'Collaborator current read');
 const stalePriority=form(ownerPage,'data-ticket-form="priority"');assert((await post(owner,stalePriority,{value:'High'})).html.includes('permissions changed'),'Stale ticket form rejected');
 const priority=form(await page(owner,path(orgA,idA)),'data-ticket-form="priority"');assert((await post(collab,priority,{value:'Critical'})).html.includes('Your ticket access is unavailable'),'Collaborator cannot set priority');assert((await post(owner,priority,{value:'High'})).location===path(orgA,idA)+'?notice=saved','Owner changes priority');
 let v=ticket(idA).revision;const race=await Promise.all([manage(owner,idA,'priority','Critical',v),manage(oa,idA,'priority','Low',v)]);assert(race.filter(r=>!r.error).length===1&&race.filter(r=>r.error?.code==='PT409').length===1,'Concurrent updates have one winner');
 for(const next of ['In Progress','Waiting for Client','In Progress']){const selected=form(await page(owner,path(orgA,idA)),'data-ticket-form="status"');assert((await post(owner,selected,{value:next})).location===path(orgA,idA)+'?notice=saved','Allowed native status '+next);}
 assert((await manage(owner,idA,'status','Closed')).error?.code==='22023','Manual owner close denied');assert((await manage(owner,idA,'status','Open')).error?.code==='22023','Invalid backward transition denied');
 stage='native comments and revisions';
 const commentForm=form(await page(collab,path(orgA,idA)),'data-ticket-form="comment"'),commentId=hidden(commentForm,'comment_id');
 assert(!(await post(colleague,commentForm,{body:'Unauthorized'})).location&&sql('select count(*)::integer from public.ticket_comments where id='+q(commentId))===0,'Other same-company Client cannot comment');
 assert((await post(collab,commentForm,{body:'Fictional comment '+marker,author_user_id:sa.id})).location===path(orgA,idA)+'?notice=saved','Collaborator comments');
 const commentRecord=()=>sql('select to_jsonb(c) from public.ticket_comments c where id='+q(commentId));assert(commentRecord().author_user_id===collab.id,'Comment actor comes from session');
 assert((await post(collab,commentForm,{body:'Fictional comment '+marker})).location===path(orgA,idA)+'?notice=saved','Comment replay idempotent');
 const edit=form(await page(collab,path(orgA,idA)),'data-ticket-form="edit_comment"');assert((await post(oa,edit,{body:'Admin overwrite'})).html.includes('Your ticket access is unavailable'),'Admin cannot overwrite another author');assert((await post(collab,edit,{body:'Edited fictional comment'})).location===path(orgA,idA)+'?notice=saved','Author edits in window');assert((await post(collab,edit,{body:'Stale overwrite'})).html.includes('permissions changed'),'Stale comment rejected');assert(sql('select count(*)::integer from public.ticket_comment_revisions where comment_id='+q(commentId))===1,'Exact one revision');
 assert((await detail(clientA,idA)).data.comments[0].revisions.some(r=>r.previous_body==='Fictional comment '+marker),'Authorized Client sees retained public-to-ticket revision');assert((await colleague.client.from('ticket_comment_revisions').select('id').eq('comment_id',commentId)).data.length===0,'Other Client cannot read revisions');
 const commentRace=await Promise.all(['Concurrent A','Concurrent B'].map(async body=>collab.client.rpc('write_ticket_comment',{...await common(collab,idA),p_comment_id:commentId,p_expected_comment_revision:'2',p_body:body}))); assert(commentRace.filter(r=>!r.error).length===1&&commentRace.filter(r=>r.error?.code==='PT409').length===1,'Concurrent comment edits retain one winner and revision');
 const lateId=randomUUID();sql('with c as(insert into public.ticket_comments(id,organization_id,ticket_id,author_user_id,body,created_at) values('+[lateId,orgA,idA,collab.id,'Fictional expired comment'].map(q).join(',')+",clock_timestamp()-interval '15 minutes') returning id) select to_jsonb(true)");
 assert((await collab.client.rpc('write_ticket_comment',{...await common(collab,idA),p_comment_id:lateId,p_expected_comment_revision:'1',p_body:'Late'})).error?.code==='22023','Server clock enforces expired edit boundary');
 stage='native sharing request approval and revocation';
 const share=form(await page(clientA,path(orgA,idA)),'data-ticket-form="request_sharing"'),requestId=hidden(share,'request_id');
 assert((await post(clientA,share,{candidate_id:clientB.id})).html.includes('Your ticket access is unavailable'),'Cross-company share denied');assert((await post(clientA,share,{candidate_id:colleague.id})).location===path(orgA,idA)+'?notice=saved','Original Client requests sharing');assert((await detail(colleague,idA)).error?.code==='42501','Pending grants no access');
 assert((await list(owner,null,{p_queue:'sharing'})).data.some(t=>t.id===idA),'Owner pending queue includes request');assert(!(await list(collab,null,{p_queue:'sharing'})).data.some(t=>t.id===idA),'Collaborator gets no owner decisions');
 const approve=form(await page(owner,path(orgA,idA)),'data-ticket-form="approve_sharing"');for(const actor of [clientA,colleague,collab,oaB])assert(!(await post(actor,approve,{})).location&&sql('select to_jsonb(status) from public.ticket_participant_requests where id='+q(requestId))==='pending','Copied sharing decision denied');assert((await post(owner,approve,{})).location===path(orgA,idA)+'?notice=saved','Owner approves native share');assert(!(await detail(colleague,idA)).error&&(await detail(colleague,idA)).data.comments.length===2,'Approved Client sees parent and comments');
 const participantPage=await page(colleague,path(orgA,idA));assert(!participantPage.html.includes('data-ticket-form="request_sharing"')&&!participantPage.html.includes('data-ticket-form="priority"')&&!participantPage.html.includes('data-ticket-form="approve_sharing"'),'Participant has read/comment but no owner or onward share');
 assert((await post(colleague,form(participantPage,'data-ticket-form="comment"'),{body:'Fictional participant comment'})).location===path(orgA,idA)+'?notice=saved','Participant comments');
 const revoke=form(await page(owner,path(orgA,idA)),'data-ticket-form="revoke_sharing"');assert((await post(owner,revoke,{})).location===path(orgA,idA)+'?notice=saved','Owner revokes sharing');assert((await detail(colleague,idA)).error?.code==='42501'&&!(await page(colleague,path(orgA,idA))).html.includes('data-ticket-detail='),'Same JWT/cookie immediately loses revoked shared access');
 const request2=await post(clientA,form(await page(clientA,path(orgA,idA)),'data-ticket-form="request_sharing"'),{candidate_id:colleague.id});assert(Boolean(request2.location),'New sharing request after revoke');
 const reject=form(await page(oa,path(orgA,idA)),'data-ticket-form="reject_sharing"');assert((await post(oa,reject,{reason:' '})).html.includes('Enter a rejection reason'),'Reject validation');assert((await post(oa,reject,{reason:'Fictional rejection reason.'})).location===path(orgA,idA)+'?notice=saved','Scoped Admin rejects');assert((await detail(colleague,idA)).error?.code==='42501','Rejection grants no access');
 const racingShare=form(await page(clientA,path(orgA,idA)),'data-ticket-form="request_sharing"'),racingRequest=hidden(racingShare,'request_id'); assert(Boolean((await post(clientA,racingShare,{candidate_id:colleague.id})).location),'Prepare concurrent sharing request'); const decisions=await Promise.all([owner,oa].map(async(actor,n)=>actor.client.rpc('review_ticket_participant',{...await common(actor,idA),p_request_id:racingRequest,p_expected_request_revision:'1',p_intent:n?'reject':'approve',p_reason:n?'Fictional concurrent decision.':null}))); assert(decisions.filter(r=>!r.error).length===1&&decisions.filter(r=>r.error?.code==='PT409').length===1,'Concurrent approve/reject has one winner'); if(decisions[0].error===null)assert(!(await owner.client.rpc('revoke_ticket_participant',{...await common(owner,idA),p_client_user_id:colleague.id,p_expected_revision:String(ticket(idA).revision)})).error,'Revoke race-approved participant');
 stage='pagination and scoped dashboard aggregates';
 for(let n=0;n<26;n++)assert(!(await create(clientA,randomUUID())).error,'Create bounded pagination fixture');
 const first=await list(clientA,orgA),second=await list(clientA,orgA,{p_offset:25});assert(first.data.length===26&&second.data.length>0&&second.data.length<26,'Ticket pagination bounded with lookahead');assert((await page(clientA,'/organizations/'+orgA+'/tickets')).html.includes('Next page'),'Native ticket pagination link');
 const dash=(await clientA.client.rpc('workspace_dashboard')).data;assert(!('registrations' in dash.queues)&&Object.values(dash.ticket_counts).reduce((a,b)=>a+b,0)===sql('select count(*)::integer from public.tickets where client_user_id='+q(clientA.id)),'Client aggregates contain no same-org peer tickets');
 assert((await list(clientA,null,{p_queue:'unassigned'})).error?.code==='42501','Client cannot request admin queue');
 stage='permissions, transfer and same-session revocation';
 const oldCollabComment=form(await page(collab,path(orgA,idA)),'data-ticket-form="comment"');await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(collab,false),'Revoke Staff scope');assert((await detail(collab,idA)).error?.code==='42501'&&(await post(collab,oldCollabComment,{body:'Revoked'})).html.includes('Your ticket access is unavailable'),'Staff org revoke immediate on same JWT/cookie and old form');
 await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(collab,true),'Regrant Staff scope');assert((await post(collab,oldCollabComment,{body:'Old regranted form'})).html.includes('permissions changed'),'Regrant does not revive old form');
 const fresh=await page(clientA,path(orgA,idA));mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/ticket-client-preview.html',import.meta.url),fresh.html);writeFileSync(new URL('../.tools/verification/ticket-owner-preview.html',import.meta.url),(await page(owner,path(orgA,idA))).html);
 writeFileSync(new URL('../.tools/verification/ticket-browser-target.json',import.meta.url),JSON.stringify({organization:orgA,ticket:idA,client:clientA.id,owner:owner.id,collaborator:collab.id}));
 const pendingBeforeTransfer=form(fresh,'data-ticket-form="request_sharing"'),transferShare=hidden(pendingBeforeTransfer,'request_id'); assert(Boolean((await post(clientA,pendingBeforeTransfer,{candidate_id:colleague.id})).location),'Prepare pending share before transfer');
 writeFileSync(new URL('../.tools/verification/ticket-dashboard-client.html',import.meta.url),(await page(clientA,'/dashboard')).html); writeFileSync(new URL('../.tools/verification/ticket-dashboard-admin.html',import.meta.url),(await page(oa,'/dashboard')).html);
 const oldClientForm=form(fresh,'data-ticket-form="comment"'),codeB=(await allowedRpc(oaB.client,'manage_organization_access_code',{p_organization_id:orgB,p_expected_code_id:null,p_intent:'issue'},'Issue transfer code'))[0];
 assert((await clientA.client.rpc('submit_organization_transfer',{p_code:codeB.code})).data==='submitted','Request real transfer');
 const transfer=sql('select to_jsonb(r) from public.organization_change_requests r where user_id='+q(clientA.id)+" and status='pending'");assert((await sa.client.rpc('review_organization_transfer',{p_request_id:transfer.id,p_expected_revision:String(transfer.revision),p_intent:'approve',p_side:'super_admin'})).data==='approved','Real atomic transfer');
 assert((await detail(clientA,idA)).error?.code==='42501'&&(await post(clientA,oldClientForm,{body:'Transferred'})).html.includes('Your ticket access is unavailable'),'Transfer removes historical parent/comments and old form');assert(!(await page(clientA,path(orgA,idA))).html.includes('data-ticket-detail='),'Same Client cookie loses old ticket URL');
 assert(ticket(idA).client_user_id===clientA.id&&ticket(idA).organization_id===orgA,'Transfer preserves ticket identity/history'); assert((await owner.client.rpc('review_ticket_participant',{...await common(owner,idA),p_request_id:transferShare,p_expected_request_revision:'1',p_intent:'approve'})).error?.code==='42501','Pending share cannot be approved after original Client transfers');
 const oldOwnerForm=form(await page(owner,path(orgA,idA)),'data-ticket-form="priority"');assert(!(await manage(oa,idA,'owner',collab.id)).error,'Admin reassigns owner');assert((await detail(owner,idA)).error?.code==='42501'&&(await post(owner,oldOwnerForm,{value:'Critical'})).html.includes('Your ticket access is unavailable'),'Former owner loses access immediately');assert(!(await detail(collab,idA)).error,'New owner has access');
 const oldOA=form(await page(oa,path(orgA,idSame)),'data-ticket-form="owner"');await allowedRpc(sa.client,'set_organization_admin_assignment',oaArgs(oa,orgA,false),'Revoke OA scope');assert((await detail(oa,idSame)).error?.code==='42501'&&(await post(oa,oldOA,{value:owner.id})).html.includes('Your ticket access is unavailable'),'Revoked OA loses ticket access');
 stage='audit rollback';
 // Failure injected only for one new fixture ticket, inside the test transaction and removed immediately.
 const rollbackId=randomUUID();sql("create function securedesk_private.ticket_test_audit_failure() returns trigger language plpgsql as $$ begin if new.target_id="+q(rollbackId)+"::uuid then raise exception 'Fictional audit failure'; end if; return new; end; $$; create trigger ticket_test_audit_failure before insert on public.audit_logs for each row execute function securedesk_private.ticket_test_audit_failure(); select to_jsonb(true)");
 try{assert((await create(colleague,rollbackId,colleague)).error&&ticket(rollbackId)===null,'Late audit failure rolls back ticket');}finally{sql('drop trigger ticket_test_audit_failure on public.audit_logs; drop function securedesk_private.ticket_test_audit_failure(); select to_jsonb(true)');}
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
 const ids=accounts.map(a=>a.id).filter(Boolean);
 try{for(const org of [orgA,orgB].filter(Boolean))sql("with c as(update public.organization_access_codes set active=false,revoked_at=clock_timestamp() where organization_id="+q(org)+" and active returning id) select to_jsonb(true)");}catch{failed=true;console.error('FAIL: Fictional code cleanup');}
 try{if(ids.length){const values=ids.map(q).join(',');sql("with s as(update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ("+values+") and (active or can_create_project) returning id),a as(update public.organization_admin_assignments set active=false where admin_user_id in ("+values+") and active returning id),p as(update public.profiles set app_role='client' where id in ("+values+") and app_role<>'client' returning id) select to_jsonb(true)");if(accounts[0]?.id)sql("with p as(update public.profiles set account_status='pending' where id="+q(accounts[0].id)+" returning id) select to_jsonb(true)");}}catch{failed=true;console.error('FAIL: Fixture role cleanup');}
 for(const account of accounts)try{if((await account.client.auth.signOut({scope:'local'})).error)throw new CheckError('Signout failed');account.cookies.clear();}catch{failed=true;console.error('FAIL: Fixture signout');}
 try{if(adminCount!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Persistent Super Admin count unchanged');if(ids.length){const values=ids.map(q).join(',');assert(sql('select count(*)::integer from auth.sessions where user_id in ('+values+')')===0,'All new fixture sessions closed');assert(sql("select count(*)::integer from public.profiles where id in ("+values+") and app_role<>'client'")===0,'No privileged fixture roles remain');assert(sql('select count(*)::integer from public.staff_organization_assignments where staff_user_id in ('+values+') and (active or can_create_project)')===0,'No Staff fixture permissions remain');assert(sql('select count(*)::integer from public.organization_admin_assignments where admin_user_id in ('+values+') and active')===0,'No OA fixture assignments remain');}if(baseline)assert(JSON.stringify(snapshot(baseline))===JSON.stringify(baseline),'All earlier business rows unchanged');}catch(error){failed=true;console.error('FAIL: '+(error instanceof CheckError?error.message:'Final guard failed'));}
}
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/tickets-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',stage,matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Ticket Auth/API/native matrix: '+checks+' checks / '+(failed?'FAIL':'PASS'));if(failed)process.exitCode=1;




