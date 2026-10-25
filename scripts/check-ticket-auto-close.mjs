import { randomBytes, randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Local auto-close authorization, concurrent sessions, audit rollback and the actual periodic job.
// All ordinary business decisions use authenticated RPCs. Owner writes only new fixture bootstrap, historical deadline fixtures, scoped audit failure and cleanup.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321',site='http://127.0.0.1:3000',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const tables=['organization_change_requests','organization_change_approvals','organization_access_codes','organization_code_submissions','profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs','project_proposals','attachments','tickets','ticket_collaborators','ticket_comments','ticket_comment_revisions','ticket_participant_requests','ticket_participants','ticket_reopen_requests'];
const accounts=[],matrix=[];let checks=0,stage='local guards',key,baseline,adminCount,orgA,orgB,schedulerPaused=false;
const q=value=>"'"+value.replaceAll("'","''")+"'";
function assert(condition,label){if(!condition)throw new CheckError(label);checks++;}
function command(args,input){const r=spawnSync(docker,args,{cwd:root,encoding:'utf8',timeout:30000,input});if(r.error||r.status)throw new CheckError('Local database verification failed; private details withheld.');return r.stdout.trim();}
function sql(query){const s=command(['exec','-i','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1'],query);return s?JSON.parse(s):null;}
function snapshot(previous){return tables.map(table=>sql('select jsonb_build_object(\'table\','+q(table)+',\'count\',count(*),\'hash\',md5(coalesce(string_agg(to_jsonb(t)::text,\'\' order by id),\'\')),\'ids\',coalesce(jsonb_agg(id order by id),\'[]\'::jsonb)) from public.'+table+' t'+(previous?(previous.find(x=>x.table===table).ids.length?' where id in ('+previous.find(x=>x.table===table).ids.map(q).join(',')+')':' where false'):'')));}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const revision=id=>String(sql('select access_revision from public.profiles where id='+q(id)));
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
async function register(label){
  const email='securedesk-autoclose-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional AutoClose Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
 const [sa,oa,oaB,owner,collab,reader,clientA,colleague,clientB,,unassigned]=accounts;
 const anonymous=createClient(api,key,options);
 stage='controlled fixture setup';
 assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional AutoClose Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed")===1,'Only new fixture receives temporary SA bootstrap.');
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
 const path=(org,id)=>'/organizations/'+org+'/tickets/'+id;
 const jobName='securedesk-ticket-auto-close';
 assert(sql("select count(*)::integer from cron.job where jobname="+q(jobName)+" and username='postgres' and active")===1,'One active local owner schedule');
 assert(sql("select cron.alter_job(jobid,active:=false) from cron.job where jobname="+q(jobName)+" and username='postgres';select count(*)::integer from cron.job where jobname="+q(jobName)+" and username='postgres' and not active;")===1,'Pause only new job for controlled races');schedulerPaused=true;
 const fixtureIds=[];
 const historical=(label,pending=false,seconds=-86400)=>{
  const id=randomUUID();fixtureIds.push(id);
  sql('insert into public.tickets(id,organization_id,project_id,client_user_id,created_by_user_id,owner_staff_user_id,title,description,status,resolved_at,created_at) values('+[id,orgA,supportA,clientA.id,clientA.id,owner.id,'Fictional auto-close '+label,'Fictional scheduled-job verification','Resolved'].map(q).join(',')+",clock_timestamp()-interval '168 hours'+make_interval(secs=>"+seconds+"),clock_timestamp()-interval '10 days');select to_jsonb(true)");
  if(pending)sql('insert into public.ticket_reopen_requests(organization_id,ticket_id,requested_by_user_id,requester_membership_id,resolved_at,ticket_revision,reason,created_at) select organization_id,id,client_user_id,(select id from public.organization_members where user_id=client_user_id and status=\'active\'),resolved_at,revision,\'Fictional timely continuation\',resolved_at+interval \'1 hour\' from public.tickets where id='+q(id)+';select to_jsonb(true)');
  return id;
 };
 const fresh=async(actor,id)=>({...await common(actor,id),p_expected_revision:String(ticket(id).revision)});
 const requestArgs=async(id)=>({...await fresh(clientA,id),p_request_id:randomUUID(),p_reason:'Fictional timely continuation from a real Client session'});
 const latest=id=>sql('select to_jsonb(r) from public.ticket_reopen_requests r where ticket_id='+q(id)+' order by created_at desc,id desc limit 1');
 const reviewArgs=async(actor,id,intent)=>({...await fresh(actor,id),p_request_id:latest(id).id,p_expected_request_revision:String(latest(id).revision),p_intent:intent,p_reason:intent==='reject'?'Fictional late rejection':null,p_owner_staff_user_id:null});
 const auditCount=(id,event='ticket.auto_closed')=>sql('select count(*)::integer from public.audit_logs where target_id='+q(id)+' and event_type='+q(event));
 const ownerCall=async(query)=>{
  const child=spawn(docker,['exec','-i','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1'],{cwd:root,stdio:['pipe','pipe','pipe']});let output='',error='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>error+=x);
  const done=new Promise(resolve=>child.on('close',code=>resolve({code,output,error})));child.stdin.end(query);return done;
 };
 const worker=()=>ownerCall('select securedesk_private.auto_close_resolved_tickets(100);');
 const closed=r=>{assert(r.code===0,'Owner worker finishes successfully');return Number(r.output.trim());};
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const waitSleep=async(name,queryPart)=>{for(let n=0;n<100;n++){if(sql('select count(*)::integer from pg_stat_activity where wait_event=\'PgSleep\' and '+(name?'application_name='+q(name):'query like '+q('%'+queryPart+'%')))>0)return;await sleep(20);}throw new CheckError('Concurrent test did not reach expected lock point');};
 stage='real API and native scheduler denial';
 const denyId=historical('protected scheduler',false,3600);
 const adminForm=form(await page(oa,path(orgA,denyId)),'data-ticket-form="admin_close"');
 for(const actor of [null,...accounts]){
  const client=actor?.client??anonymous;
  assert((await client.rpc('auto_close_resolved_tickets',{p_batch:100})).error?.code==='PGRST202',(actor?.label??'anonymous')+': no public scheduler RPC');
  assert((await client.schema('securedesk_private').rpc('auto_close_resolved_tickets',{p_batch:100})).error?.code==='PGRST106',(actor?.label??'anonymous')+': private scheduler schema is not exposed');
  const r=await post(actor,adminForm,{intent:'auto_close',reason:'Forged scheduler'});assert(!r.location&&ticket(denyId).status==='Resolved',(actor?.label??'anonymous')+': native form cannot invoke scheduler');
 }
 assert((await owner.client.rpc('manage_ticket',{...await fresh(owner,denyId),p_intent:'status',p_value:'Closed'})).error?.code==='22023','Owner Staff cannot bypass auto-close through status RPC');
 stage='locked ticket and company skip';
 for(const kind of ['ticket','company']){
  const id=historical('locked '+kind),name='sd-autoclose-'+randomUUID().slice(0,8),hold=ownerCall('begin;set application_name='+q(name)+';select id from public.'+(kind==='ticket'?'tickets':'organizations')+' where id='+q(kind==='ticket'?id:orgA)+' for update;select pg_sleep(0.7);commit;');
  await waitSleep(name);assert(closed(await worker())===0,'Busy '+kind+' skipped without waiting');await hold;
  assert(ticket(id).status==='Resolved','Locked '+kind+' fixture unchanged');assert(closed(await worker())===1&&ticket(id).status==='Closed','Next tick closes unlocked '+kind+' fixture');
 }
 stage='two simultaneous owner workers';
 const sameId=historical('overlapping workers'),both=await Promise.all([worker(),worker()]);assert(both.map(closed).reduce((a,b)=>a+b,0)===1,'Overlapping workers close one ticket once');assert(auditCount(sameId)===1&&closed(await worker())===0,'One audit and safe replay');
 stage='worker wins against native acceptance';
 const jobWins=historical('worker wins'),oldAccept=form(await page(clientA,path(orgA,jobWins)),'data-ticket-form="accept_solution"'),name='sd-autoclose-'+randomUUID().slice(0,8);
 const first=ownerCall('begin;set application_name='+q(name)+';select securedesk_private.auto_close_resolved_tickets();select pg_sleep(0.7);commit;');await waitSleep(name);
 const acceptance=post(clientA,oldAccept);await first;const stale=await acceptance;
 assert(!stale.location&&stale.html.includes('permissions changed'),'Old native acceptance rejected after worker commit');assert(ticket(jobWins).status==='Closed'&&auditCount(jobWins)===1&&auditCount(jobWins,'ticket.solution_accepted')===0,'Worker winner creates only system close');
 stage='real Client acceptance wins against worker';
 const clientWins=historical('Client wins'),acceptArgs={...await fresh(clientA,clientWins),p_intent:'accept',p_reason:null};
 sql("create function securedesk_private.auto_close_runtime_delay() returns trigger language plpgsql as $$begin if new.event_type='ticket.solution_accepted' and new.target_id="+q(clientWins)+"::uuid then perform pg_sleep(0.7);end if;return new;end;$$;create trigger auto_close_runtime_delay before insert on public.audit_logs for each row execute function securedesk_private.auto_close_runtime_delay();select to_jsonb(true)");
 try{const accept=clientA.client.rpc('close_resolved_ticket',acceptArgs).then(x=>x);await waitSleep(null,'close_resolved_ticket');assert(closed(await worker())===0,'Job skips real Client transaction');assert(!(await accept).error,'Real Client acceptance commits');}finally{sql('drop trigger auto_close_runtime_delay on public.audit_logs;drop function securedesk_private.auto_close_runtime_delay();select to_jsonb(true)');}
 assert(ticket(clientWins).status==='Closed'&&auditCount(clientWins,'ticket.solution_accepted')===1&&auditCount(clientWins)===0,'Client winner gets only actual-user audit');
 stage='Pending approval and rejection versus worker';
 const pendingApprove=historical('Pending approval',true),approvalArgs=await reviewArgs(owner,pendingApprove,'approve');
 const [jobApproval,approved]=await Promise.all([worker(),owner.client.rpc('review_ticket_reopen',approvalArgs)]);
 assert(closed(jobApproval)===0&&!approved.error&&ticket(pendingApprove).status==='Assigned','Timely Pending approval wins; job does not close');
 const pendingReject=historical('Pending late rejection',true),rejectArgs=await reviewArgs(oa,pendingReject,'reject');
 const [jobRejection,rejected]=await Promise.all([worker(),oa.client.rpc('review_ticket_reopen',rejectArgs)]);
 assert(closed(jobRejection)===0&&!rejected.error&&ticket(pendingReject).status==='Closed','Late Pending rejection closes with human decision only');assert(auditCount(pendingReject)===0&&auditCount(pendingReject,'ticket.reopen_reject')===1,'Job creates no duplicate rejection audit');
 stage='timely real request protects ticket across deadline';
 const requestFirst=historical('timely request',false,3),request=await requestArgs(requestFirst);
 assert(!(await clientA.client.rpc('request_ticket_reopen',request)).error,'Real Client request accepted before deadline');await sleep(3300);
 assert(closed(await worker())===0&&ticket(requestFirst).status==='Resolved'&&latest(requestFirst).status==='pending','After deadline job preserves timely Pending');
 assert(sql('select to_jsonb(created_at<resolved_at+interval \'168 hours\') from public.ticket_reopen_requests where ticket_id='+q(requestFirst))===true,'Request time is inside server window');
 stage='batch audit rollback';
 const faultA=historical('batch first'),faultB=historical('batch failing');
 sql("create function securedesk_private.auto_close_runtime_fault() returns trigger language plpgsql as $$begin if new.event_type='ticket.auto_closed' and new.target_id="+q(faultB)+"::uuid then raise exception 'Fictional auto-close audit failure';end if;return new;end;$$;create trigger auto_close_runtime_fault before insert on public.audit_logs for each row execute function securedesk_private.auto_close_runtime_fault();select to_jsonb(true)");
 try{const r=await worker();assert(r.code!==0&&r.error.includes('Fictional auto-close audit failure'),'Expected late audit failure is reached');assert(ticket(faultA).status==='Resolved'&&ticket(faultB).status==='Resolved'&&auditCount(faultA)===0&&auditCount(faultB)===0,'Whole failed batch has no ticket or audit change');}finally{sql('drop trigger auto_close_runtime_fault on public.audit_logs;drop function securedesk_private.auto_close_runtime_fault();select to_jsonb(true)');}
 assert(closed(await worker())===2,'Retried batch closes exactly two');
 stage='actual periodic scheduler';
 // Drain the denial fixture if it has elapsed; it is also new, fictional data.
 if(ticket(denyId).status==='Resolved'){
  const remaining=sql('select extract(epoch from resolved_at+interval \'168 hours\'-clock_timestamp()) from public.tickets where id='+q(denyId));
  if(remaining>0)assert(!(await oa.client.rpc('close_resolved_ticket',{...await fresh(oa,denyId),p_intent:'admin_close',p_reason:'Fictional scheduler-denial verification completed'})).error,'Finish new denial fixture');
  else closed(await worker());
 }
 const periodic=historical('scheduled practice',false,3),pendingDemo=historical('scheduled Pending protection',true),start=sql('select to_jsonb(clock_timestamp())');
 writeFileSync(new URL('../.tools/verification/phase5-autoclose/practice.json',import.meta.url),JSON.stringify({organization:orgA,ticket:periodic,path:path(orgA,periodic),pending_ticket:pendingDemo,pending_path:path(orgA,pendingDemo)},null,2));
 assert(sql("select cron.alter_job(jobid,active:=true) from cron.job where jobname="+q(jobName)+" and username='postgres';select count(*)::integer from cron.job where jobname="+q(jobName)+" and username='postgres' and active;")===1,'Restore active one-minute schedule');schedulerPaused=false;
 console.log('Race checks passed; waiting for the actual scheduled run on a new fictional ticket.');
 const until=Date.now()+75000;let closedByCron=false;
 while(Date.now()<until){if(ticket(periodic).status==='Closed'){closedByCron=true;break;}await sleep(1000);}
 assert(closedByCron&&auditCount(periodic)===1,'Actual cron tick closes eligible fictional ticket');
 assert(ticket(pendingDemo).status==='Resolved'&&latest(pendingDemo).status==='pending','Actual cron tick skips expired Pending fixture');
 assert(sql('select count(*)::integer from cron.job_run_details d join cron.job j on j.jobid=d.jobid where j.jobname='+q(jobName)+" and d.start_time>="+q(start)+"::timestamptz and d.status='succeeded'")>=1,'Cron run history confirms real success');
 assert(closed(await worker())===0&&auditCount(periodic)===1,'Owner replay after scheduled run adds nothing');
 const web=await page(clientA,path(orgA,periodic));assert(web.html.includes('This ticket is Closed')&&web.html.includes('Automatically closed after the seven-day response window')&&!web.html.includes('data-ticket-form="accept_solution"')&&!web.html.includes('data-ticket-form="request_reopen"'),'Actual Client page shows system closure and terminal controls');
 writeFileSync(new URL('../.tools/verification/phase5-autoclose/fixtures.json',import.meta.url),JSON.stringify(fixtureIds,null,2));
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
 const ids=accounts.map(a=>a.id).filter(Boolean);
 try{if(schedulerPaused){sql("select cron.alter_job(jobid,active:=true) from cron.job where jobname='securedesk-ticket-auto-close' and username='postgres';select to_jsonb(true)");schedulerPaused=false;}}catch{failed=true;console.error('FAIL: Restore local cron schedule');}
 try{for(const org of [orgA,orgB].filter(Boolean))sql("with c as(update public.organization_access_codes set active=false,revoked_at=clock_timestamp() where organization_id="+q(org)+" and active returning id) select to_jsonb(true)");}catch{failed=true;console.error('FAIL: Fictional code cleanup');}
 try{sql("drop trigger if exists auto_close_runtime_fault on public.audit_logs;drop function if exists securedesk_private.auto_close_runtime_fault();drop trigger if exists auto_close_runtime_delay on public.audit_logs;drop function if exists securedesk_private.auto_close_runtime_delay();select to_jsonb(true)");}catch{failed=true;console.error('FAIL: Audit fixture cleanup');}
 try{if(ids.length){const values=ids.map(q).join(',');sql("with s as(update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ("+values+") and (active or can_create_project) returning id),a as(update public.organization_admin_assignments set active=false where admin_user_id in ("+values+") and active returning id),p as(update public.profiles set app_role='client' where id in ("+values+") and app_role<>'client' returning id) select to_jsonb(true)");if(accounts[0]?.id)sql("with p as(update public.profiles set account_status='pending' where id="+q(accounts[0].id)+" returning id) select to_jsonb(true)");}}catch{failed=true;console.error('FAIL: Fixture role cleanup');}
 for(const account of accounts)try{if((await account.client.auth.signOut({scope:'local'})).error)throw new CheckError('Signout failed');account.cookies.clear();}catch{failed=true;console.error('FAIL: Fixture signout');}
 try{if(adminCount!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Persistent Super Admin count unchanged');if(ids.length){const values=ids.map(q).join(',');assert(sql('select count(*)::integer from auth.sessions where user_id in ('+values+')')===0,'All new fixture sessions closed');assert(sql("select count(*)::integer from public.profiles where id in ("+values+") and app_role<>'client'")===0,'No privileged fixture roles remain');assert(sql('select count(*)::integer from public.staff_organization_assignments where staff_user_id in ('+values+') and (active or can_create_project)')===0,'No Staff fixture permissions remain');assert(sql('select count(*)::integer from public.organization_admin_assignments where admin_user_id in ('+values+') and active')===0,'No OA fixture assignments remain');}if(baseline)assert(JSON.stringify(snapshot(baseline))===JSON.stringify(baseline),'All earlier business rows unchanged');}catch(error){failed=true;console.error('FAIL: '+(error instanceof CheckError?error.message:'Final guard failed'));}
}
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/phase5-autoclose/runtime-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',stage,matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Auto-close real Auth/concurrency/scheduler matrix: '+checks+' checks / '+(failed?'FAIL':'PASS'));if(failed)process.exitCode=1;




