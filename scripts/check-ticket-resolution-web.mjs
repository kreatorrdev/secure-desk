import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Scoped projects, explicit Staff permission, General Support and native forms.
// All ordinary business decisions use authenticated RPCs. Owner writes only new fixture bootstrap, historical deadline fixtures, scoped audit failure and cleanup.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321',site='http://127.0.0.1:3000',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const tables=['organization_change_requests','organization_change_approvals','organization_access_codes','organization_code_submissions','profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs','project_proposals','attachments','tickets','ticket_collaborators','ticket_comments','ticket_comment_revisions','ticket_participant_requests','ticket_participants','ticket_reopen_requests'];
const accounts=[],matrix=[];let checks=0,stage='local guards',key,baseline,adminCount,orgA,orgB;
const q=value=>"'"+value.replaceAll("'","''")+"'";
function assert(condition,label){if(!condition)throw new CheckError(label);checks++;}
function command(args,input){const r=spawnSync(docker,args,{cwd:root,encoding:'utf8',timeout:30000,input});if(r.error||r.status)throw new CheckError('Local database verification failed; private details withheld.');return r.stdout.trim();}
function sql(query){const s=command(['exec','-i','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1'],query);return s?JSON.parse(s):null;}
function snapshot(previous){return tables.map(table=>sql('select jsonb_build_object(\'table\','+q(table)+',\'count\',count(*),\'hash\',md5(coalesce(string_agg(to_jsonb(t)::text,\'\' order by id),\'\')),\'ids\',coalesce(jsonb_agg(id order by id),\'[]\'::jsonb)) from public.'+table+' t'+(previous?(previous.find(x=>x.table===table).ids.length?' where id in ('+previous.find(x=>x.table===table).ids.map(q).join(',')+')':' where false'):'')));}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const revision=id=>String(sql('select access_revision from public.profiles where id='+q(id)));
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
async function register(label){
  const email='securedesk-resolution-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Resolution Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
async function post(account,selected,fields={},origin=site) {
  const data=new FormData(),decode=v=>v.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  for(const tag of selected.markup.matchAll(/<input\b[^>]*>/gi)){
    const attrs=Object.fromEntries([...tag[0].matchAll(/([\w$:-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
    if(attrs.type==='hidden'&&attrs.name)data.set(attrs.name,attrs.value??'');
  }
  assert([...data.keys()].some(k=>k.startsWith('$ACTION_')),'Real native action reference used.');
  for(const [k,v] of Object.entries(fields)){if(v===null)data.delete(k);else if(Array.isArray(v)){data.delete(k);for(const x of v)data.append(k,x);}else data.set(k,v);}
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
 assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Resolution Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed")===1,'Only new fixture receives temporary SA bootstrap.');
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
 const support=org=>sql('select to_jsonb(id) from public.projects where organization_id='+q(org)+' and is_general_support'),supportA=support(orgA);
 const context=async(actor,org=orgA)=>{const r=await actor.client.rpc('ticket_context',{p_organization_id:org});assert(!r.error,'Current ticket context');return r.data[0];};
 const common=async(actor,id,org=orgA)=>{const c=await context(actor,org);return {p_organization_id:org,p_ticket_id:id,p_expected_access_revision:c.access_revision,p_expected_scope:c.scope_revision};};
 const ticket=id=>sql('select to_jsonb(t) from public.tickets t where id='+q(id));
 const manage=async(actor,id,intent,value,v=ticket(id).revision)=>(actor.client.rpc('manage_ticket',{...await common(actor,id),p_expected_revision:String(v),p_intent:intent,p_value:value}));
 const create=async(actor,id,client=clientA,org=orgA,project=supportA,extra={})=>actor.client.rpc('create_ticket',{...await common(actor,id,org),p_project_id:project,p_client_user_id:client.id,p_details:{title:'Fictional ticket '+id.slice(0,8),description:'A fictional support problem.',...extra}});
 const path=(org,id)=>'/organizations/'+org+'/tickets/'+id;
 const hidden=(selected,name)=>[...selected.markup.matchAll(/<input\b[^>]*>/gi)].find(m=>m[0].includes('name="'+name+'"'))?.[0].match(/value="([^"]*)"/)?.[1];
 const resolution=(actor,id,org=orgA,offset=0)=>(actor?.client??anonymous).rpc('ticket_resolution',{p_organization_id:org,p_ticket_id:id,p_offset:offset});
 const resolved=async(label)=>{const id=randomUUID();assert(!(await create(clientA,id,clientA,orgA,supportA,{title:'Fictional resolution '+label})).error,'Create '+label);for(const [actor,intent,value]of[[oa,'owner',owner.id],[owner,'status','In Progress'],[owner,'status','Resolved']])assert(!(await manage(actor,id,intent,value)).error,'Resolve '+label+' '+value);return id;};
 const fresh=async(actor,id)=>({...await common(actor,id),p_expected_revision:String(ticket(id).revision)});
 const requestArgs=async(id)=>({...await fresh(clientA,id),p_request_id:randomUUID(),p_reason:'Fictional continuing problem'});
 const latest=id=>sql('select to_jsonb(r) from public.ticket_reopen_requests r where ticket_id='+q(id)+' order by created_at desc,id desc limit 1');
 const reviewArgs=async(actor,id,intent,reason=null,person=null)=>({...await fresh(actor,id),p_request_id:latest(id).id,p_expected_request_revision:String(latest(id).revision),p_intent:intent,p_reason:reason,p_owner_staff_user_id:person});
 const selected=async(actor,id,intent)=>form(await page(actor,path(orgA,id)),'data-ticket-form="'+intent+'"');
 const idA=await resolved('review'),acceptId=await resolved('acceptance'),adminId=await resolved('administration');
 assert(!(await manage(owner,idA,'add_collaborator',collab.id)).error,'Collaborator added for privacy probe');
 const peerRequest=randomUUID();assert(!(await clientA.client.rpc('request_ticket_participant',{...await common(clientA,idA),p_request_id:peerRequest,p_candidate_client_id:colleague.id})).error,'Request peer sharing');
 const peerRow=sql('select to_jsonb(r) from public.ticket_participant_requests r where id='+q(peerRequest));assert(!(await owner.client.rpc('review_ticket_participant',{...await common(owner,idA),p_request_id:peerRequest,p_expected_request_revision:String(peerRow.revision),p_intent:'approve',p_reason:null})).error,'Approve peer sharing');
 stage='resolution form input and identity guards';
 const initialRequest=await selected(clientA,idA,'request_reopen'),initialAccept=await selected(clientA,idA,'accept_solution');
 for(const actor of [null,sa,oa,oaB,owner,collab,reader,colleague,clientB,pending,unassigned]){const r=await post(actor,initialRequest,{reason:'Copied request'});assert(!r.location?.includes('continuation_requested')&&!latest(idA),(actor?.label??'anon')+': copied original Client form denied');}
 for(const fields of [{reason:' '},{reason:'x'.repeat(2001)},{reason:'Valid but forged',app_role:'super_admin'},{reason:'Valid but forged',status:'Assigned'},{reason:'Duplicate revision',revision:['1','1']},{reason:'Missing scope',scope_revision:null}])assert(!(await post(clientA,initialRequest,fields)).location&&!latest(idA),'Malformed resolution form writes nothing');
 const csrf=await post(clientA,initialRequest,{reason:'Fictional cross-origin'},'https://foreign.example.invalid');assert([403,500].includes(csrf.status)&&!latest(idA),'Foreign Origin rejects continuation action');
 const faultId=hidden(initialRequest,'request_id'),faultTicket=ticket(idA),faultAudit=sql('select count(*)::integer from public.audit_logs where target_id in ('+q(idA)+','+q(faultId)+')');
 sql("create function securedesk_private.resolution_web_fault() returns trigger language plpgsql as $$ begin if new.target_id="+q(idA)+"::uuid then raise exception 'Fictional resolution audit fault'; end if; return new; end; $$; create trigger resolution_web_fault before insert on public.audit_logs for each row execute function securedesk_private.resolution_web_fault(); select to_jsonb(true)");
 try{assert(!(await post(clientA,initialRequest,{reason:'Fictional audit rollback'})).location&&!latest(idA),'Late native audit fault rolls back request');assert(JSON.stringify(ticket(idA))===JSON.stringify(faultTicket)&&sql('select count(*)::integer from public.audit_logs where target_id in ('+q(idA)+','+q(faultId)+')')===faultAudit,'Audit fault preserves ticket and event count');}finally{sql('drop trigger resolution_web_fault on public.audit_logs;drop function securedesk_private.resolution_web_fault();select to_jsonb(true)');}
 const marker='<script>resolutionProbe()</script>',reason='Fictional: printer still fails '+marker;
 assert((await post(clientA,initialRequest,{reason})).location===path(orgA,idA)+'?notice=continuation_requested','Original Client sends native request');
 assert(ticket(idA).status==='Resolved'&&latest(idA).status==='pending'&&latest(idA).requested_by_user_id===clientA.id,'Pending request keeps Resolved and actual requester');
 const auditAfter=sql('select count(*)::integer from public.audit_logs where target_id in ('+q(idA)+','+q(faultId)+')');assert((await post(clientA,initialRequest,{reason})).location?.includes('continuation_requested'),'Identical native request replay succeeds');assert(sql('select count(*)::integer from public.audit_logs where target_id in ('+q(idA)+','+q(faultId)+')')===auditAfter,'Identical replay creates no extra audit');
 assert(!(await post(clientA,initialRequest,{reason:'Different payload'})).location,'Changed replay rejected');
 assert(!(await post(clientA,initialAccept)).location&&ticket(idA).status==='Resolved','Old acceptance cannot close pending request');
 stage='real Auth table/RPC/cookie HTTP resolution matrix';
 for(const actor of [null,...accounts]){
  const before=checks,label=actor?.label??'anonymous',canRead=[sa,oa,owner,collab,clientA,colleague].includes(actor),canHistory=[sa,oa,owner,clientA].includes(actor),canReview=[sa,oa,owner].includes(actor);
  const r=await resolution(actor,idA),web=await page(actor,path(orgA,idA));
  assert(canRead?!r.error:r.error?.code==='42501',label+': parent scope on resolution');
  assert(canRead?web.html.includes('data-ticket-detail='):!web.html.includes('data-ticket-detail='),label+': parent scope on native page');
  if(canRead){assert(r.data.requests.length===(canHistory?1:0),label+': private reason history');assert(r.data.can_review_reopen===canReview&&!r.data.can_accept&&!r.data.can_request_reopen&&!r.data.can_admin_close,label+': live decision flags');assert(web.html.includes('data-ticket-form="approve_reopen"')===canReview,label+': scoped decision forms');assert(!JSON.stringify(r.data).includes('requester_membership_id')&&!JSON.stringify(r.data).includes('ticket_revision'),label+': internal snapshots hidden');assert(web.html.includes('Fictional: printer still fails')===canHistory,label+': rendered private reason scope');}
  assert(!web.html.includes(marker),label+': reason cannot execute script');
  if(actor){const rows=await actor.client.from('ticket_reopen_requests').select('id,reason,status').eq('ticket_id',idA);assert(!rows.error&&rows.data.length===(canHistory?1:0),label+': independent table RLS');for(const op of ['insert','update','delete']){const query=op==='insert'?actor.client.from('ticket_reopen_requests').insert({id:randomUUID()}):op==='update'?actor.client.from('ticket_reopen_requests').update({reason:'Forged'}).eq('ticket_id',idA):actor.client.from('ticket_reopen_requests').delete().eq('ticket_id',idA);assert((await query).error?.code==='42501',label+': direct '+op+' denied');}}
  const queue=await(actor?.client??anonymous).rpc('ticket_list',{p_organization_id:null,p_queue:'reopen'}),decisionRole=[sa,oa,oaB,owner,collab,reader,unassigned].includes(actor);
  assert(decisionRole?!queue.error:queue.error?.code==='42501',label+': continuation queue role');
  if(decisionRole){assert(queue.data.some(t=>t.id===idA)===canReview,label+': continuation queue exact object');const d=await actor.client.rpc('workspace_dashboard');assert(!d.error&&(canReview?d.data.queues.reopen>=1:d.data.queues.reopen===0),label+': continuation dashboard scope');}
  matrix.push({role:label,checks:checks-before,result:'PASS'});
 }
 const approve=await selected(owner,idA,'approve_reopen'),reject=await selected(owner,idA,'reject_reopen');
 for(const actor of [clientA,colleague,collab,reader,oaB,pending])assert(!(await post(actor,approve,{owner_staff_user_id:''})).location&&latest(idA).status==='pending','Copied owner decision denied for '+actor.label);
 assert(!(await post(owner,reject,{reason:' '})).location&&latest(idA).status==='pending','Blank decision reason denied');
 const originalResolved=ticket(idA).resolved_at;
 assert((await post(owner,reject,{reason:'Fictional: please provide more detail'})).location===path(orgA,idA)+'?notice=continuation_rejected','Owner native early rejection');
 assert(ticket(idA).status==='Resolved'&&ticket(idA).resolved_at===originalResolved&&latest(idA).status==='rejected','Early rejection preserves resolution and window');
 assert(!(await post(owner,approve,{owner_staff_user_id:''})).location&&latest(idA).status==='rejected','Stale opposite decision cannot overwrite');
 const nextRequest=await selected(clientA,idA,'request_reopen');assert((await post(clientA,nextRequest,{reason:'Fictional: printer error code 42 remains'})).location?.includes('continuation_requested'),'Client native new attempt after rejection');
 assert(sql('select count(*)::integer from public.ticket_reopen_requests where ticket_id='+q(idA))===2,'New attempt retains prior rejected record');
 assert((await post(owner,await selected(owner,idA,'approve_reopen'),{owner_staff_user_id:''})).location===path(orgA,idA)+'?notice=continuation_approved','Owner native approval');
 assert(ticket(idA).status==='Assigned'&&ticket(idA).resolved_at===null&&latest(idA).status==='approved','Approval atomically returns Assigned');
 for(const status of ['In Progress','Resolved'])assert(!(await manage(owner,idA,'status',status)).error,'New work cycle '+status);
 assert(ticket(idA).resolved_at!==originalResolved,'New resolution cycle gets server timestamp');
 assert(!(await post(clientA,nextRequest,{reason:'Fictional: printer error code 42 remains'})).location,'Old request ID cannot replay across resolution cycles');
 stage='native acceptance and exceptional administrative closure';
 const accept=await selected(clientA,acceptId,'accept_solution');
 for(const actor of [oa,owner,colleague,clientB])assert(!(await post(actor,accept)).location&&ticket(acceptId).status==='Resolved','Only original Client may accept: '+actor.label);
 assert((await post(clientA,accept)).location===path(orgA,acceptId)+'?notice=accepted'&&ticket(acceptId).status==='Closed','Native acceptance closes permanently');
 assert(!(await post(clientA,accept)).location&&ticket(acceptId).status==='Closed','Acceptance old form cannot reopen terminal Closed');
 const close=await selected(oa,adminId,'admin_close');
 for(const actor of [owner,collab,clientA,oaB])assert(!(await post(actor,close,{reason:'Forged close'})).location&&ticket(adminId).status==='Resolved','Copied Admin closure denied for '+actor.label);
 assert(!(await post(oa,close,{reason:' '})).location,'Administrative reason required');
 assert((await post(oa,close,{reason:'Fictional exceptional administrative decision'})).location===path(orgA,adminId)+'?notice=admin_closed'&&ticket(adminId).status==='Closed','Scoped Admin native exceptional closure');
 assert(!(await post(oa,close,{reason:'Repeat'})).location,'Closed administrative old form denied');
 stage='simultaneous real session requests';
 const raceRequest=await resolved('concurrent requests'),args=await requestArgs(raceRequest),requestRace=await Promise.all([clientA.client.rpc('request_ticket_reopen',args),clientA.client.rpc('request_ticket_reopen',{...args,p_request_id:randomUUID()})]);
 assert(requestRace.filter(x=>!x.error).length===1&&requestRace.filter(x=>x.error).length===1,'Two real concurrent requests have one winner');assert(sql("select count(*)::integer from public.ticket_reopen_requests where status='pending' and ticket_id="+q(raceRequest))===1,'Concurrent requests leave exactly one Pending');
 const a=await reviewArgs(owner,raceRequest,'approve'),b=await reviewArgs(oa,raceRequest,'reject','Fictional concurrent rejection'),decisions=await Promise.all([owner.client.rpc('review_ticket_reopen',a),oa.client.rpc('review_ticket_reopen',b)]);
 assert(decisions.filter(x=>!x.error).length===1&&decisions.filter(x=>x.error).length===1,'Separate owner/Admin sessions decide only once');assert(latest(raceRequest).status!=='pending','Concurrent decision leaves final request');
 const raceClose=await resolved('accept versus request'),ra=await requestArgs(raceClose),ca={...await fresh(clientA,raceClose),p_intent:'accept',p_reason:null},closeRace=await Promise.all([clientA.client.rpc('request_ticket_reopen',ra),clientA.client.rpc('close_resolved_ticket',ca)]);
 assert(closeRace.filter(x=>!x.error).length===1&&closeRace.filter(x=>x.error).length===1,'Simultaneous request/accept has one winner');assert(!(ticket(raceClose).status==='Closed'&&latest(raceClose)?.status==='pending'),'No Closed ticket with Pending request');
 stage='historical deadline fixtures and real decisions';
 const lateFixture=()=>{const id=randomUUID(),rid=randomUUID();sql('insert into public.tickets(id,organization_id,project_id,client_user_id,created_by_user_id,owner_staff_user_id,title,description,status,resolved_at,created_at) values('+[id,orgA,supportA,clientA.id,clientA.id,owner.id,'Fictional expired resolution','Fictional historical deadline test','Resolved'].map(q).join(',')+",clock_timestamp()-interval '8 days',clock_timestamp()-interval '10 days');insert into public.ticket_reopen_requests(id,organization_id,ticket_id,requested_by_user_id,requester_membership_id,resolved_at,ticket_revision,reason,created_at) select "+q(rid)+",organization_id,id,client_user_id,(select id from public.organization_members where user_id=client_user_id and status='active'),resolved_at,revision,'Fictional timely pending request',resolved_at+interval '1 hour' from public.tickets where id="+q(id)+';select to_jsonb(true)');return id;};
 const lateReject=lateFixture(),lateApprove=lateFixture();
 assert(!(await resolution(clientA,lateReject)).data.can_request_reopen,'Server deadline disables new continuation');
 assert((await post(owner,await selected(owner,lateReject,'reject_reopen'),{reason:'Fictional late decision'})).location?.includes('continuation_rejected')&&ticket(lateReject).status==='Closed','Native late rejection closes ticket');
 assert((await post(owner,await selected(owner,lateApprove,'approve_reopen'),{owner_staff_user_id:''})).location?.includes('continuation_approved')&&ticket(lateApprove).status==='Assigned','Timely request can be approved after deadline');
 stage='old owner form revoked and Admin replacement';
 const fallback=await resolved('owner replacement');assert(!(await manage(owner,fallback,'add_collaborator',collab.id)).error,'Fallback collaborator available');assert(!(await clientA.client.rpc('request_ticket_reopen',await requestArgs(fallback))).error,'Fallback Pending request');
 const oldOwner=await selected(owner,fallback,'approve_reopen');
 await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(owner,false),'Revoke fixture owner scope');
 assert(!(await post(owner,oldOwner,{owner_staff_user_id:''})).location&&latest(fallback).status==='pending','Same owner cookie old form loses decision immediately');
 const adminReplacement=await selected(oa,fallback,'approve_reopen');assert(!(await post(oa,adminReplacement,{owner_staff_user_id:''})).location&&latest(fallback).status==='pending','Approval refuses unavailable owner');
 assert((await post(oa,adminReplacement,{owner_staff_user_id:collab.id})).location?.includes('continuation_approved')&&ticket(fallback).owner_staff_user_id===collab.id&&ticket(fallback).status==='Assigned','Admin replaces unavailable owner atomically');
 assert(sql('select to_jsonb(active) from public.ticket_collaborators where ticket_id='+q(fallback)+' and staff_user_id='+q(collab.id))===false,'Replacement removes redundant collaborator role');
 await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(owner,true),'Restore fixture owner scope');
 stage='bounded history and native rendering';
 const historyId=await resolved('paged history');
 for(let n=0;n<27;n++){assert(!(await clientA.client.rpc('request_ticket_reopen',await requestArgs(historyId))).error,'History request '+n);assert(!(await owner.client.rpc('review_ticket_reopen',await reviewArgs(owner,historyId,'reject','Fictional attempt '+n))).error,'History rejection '+n);}
 const first=await resolution(clientA,historyId),second=await resolution(clientA,historyId,orgA,25);assert(first.data.requests.length===26&&second.data.requests.length===2,'History is 25 plus lookahead');
 const historyPage=await page(clientA,path(orgA,historyId)),secondPage=await page(clientA,path(orgA,historyId)+'?reopen=2');assert((historyPage.html.match(/data-reopen-request=/g)??[]).length===25&&historyPage.html.includes('reopen=2'),'History first native page bounded');assert((secondPage.html.match(/data-reopen-request=/g)??[]).length===2&&secondPage.html.includes('reopen=1'),'History second native page navigable');
 stage='practical fictional ticket';
 const demo=await resolved('Practice: continuation decision');assert(!(await clientA.client.rpc('request_ticket_reopen',{...await requestArgs(demo),p_reason:'Fictional practice: the printer still shows error 42 after the suggested fix.'})).error,'Prepare fictional Pending practice');
 const browserDemo=await resolved('Browser: continuation review');assert(!(await clientA.client.rpc('request_ticket_reopen',{...await requestArgs(browserDemo),p_reason:'Fictional browser check: the printer still needs attention.'})).error,'Prepare separate fictional browser review');
 writeFileSync(new URL('../.tools/verification/phase5-resolution-ui/practice.json',import.meta.url),JSON.stringify({organization:orgA,ticket:demo,path:path(orgA,demo),browser_ticket:browserDemo,browser_path:path(orgA,browserDemo)},null,2));
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
 const ids=accounts.map(a=>a.id).filter(Boolean);
 try{for(const org of [orgA,orgB].filter(Boolean))sql("with c as(update public.organization_access_codes set active=false,revoked_at=clock_timestamp() where organization_id="+q(org)+" and active returning id) select to_jsonb(true)");}catch{failed=true;console.error('FAIL: Fictional code cleanup');}
 try{sql('drop trigger if exists resolution_web_fault on public.audit_logs;drop function if exists securedesk_private.resolution_web_fault();select to_jsonb(true)');}catch{failed=true;console.error('FAIL: Audit fixture cleanup');}
 try{if(ids.length){const values=ids.map(q).join(',');sql("with s as(update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ("+values+") and (active or can_create_project) returning id),a as(update public.organization_admin_assignments set active=false where admin_user_id in ("+values+") and active returning id),p as(update public.profiles set app_role='client' where id in ("+values+") and app_role<>'client' returning id) select to_jsonb(true)");if(accounts[0]?.id)sql("with p as(update public.profiles set account_status='pending' where id="+q(accounts[0].id)+" returning id) select to_jsonb(true)");}}catch{failed=true;console.error('FAIL: Fixture role cleanup');}
 for(const account of accounts)try{if((await account.client.auth.signOut({scope:'local'})).error)throw new CheckError('Signout failed');account.cookies.clear();}catch{failed=true;console.error('FAIL: Fixture signout');}
 try{if(adminCount!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Persistent Super Admin count unchanged');if(ids.length){const values=ids.map(q).join(',');assert(sql('select count(*)::integer from auth.sessions where user_id in ('+values+')')===0,'All new fixture sessions closed');assert(sql("select count(*)::integer from public.profiles where id in ("+values+") and app_role<>'client'")===0,'No privileged fixture roles remain');assert(sql('select count(*)::integer from public.staff_organization_assignments where staff_user_id in ('+values+') and (active or can_create_project)')===0,'No Staff fixture permissions remain');assert(sql('select count(*)::integer from public.organization_admin_assignments where admin_user_id in ('+values+') and active')===0,'No OA fixture assignments remain');}if(baseline)assert(JSON.stringify(snapshot(baseline))===JSON.stringify(baseline),'All earlier business rows unchanged');}catch(error){failed=true;console.error('FAIL: '+(error instanceof CheckError?error.message:'Final guard failed'));}
}
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/phase5-resolution-ui/web-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',stage,matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Resolution Auth/API/native matrix: '+checks+' checks / '+(failed?'FAIL':'PASS'));if(failed)process.exitCode=1;




