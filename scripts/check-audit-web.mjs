import { randomBytes, randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Local audit scopes, parent activity, native retention forms and real maintenance concurrency.
// All ordinary business decisions use authenticated RPCs. Owner writes only new fixture bootstrap, historical deadline fixtures, scoped audit failure and cleanup.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321',site='http://127.0.0.1:3000',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const tables=['organization_change_requests','organization_change_approvals','organization_access_codes','organization_code_submissions','profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs','project_proposals','attachments','tickets','ticket_collaborators','ticket_comments','ticket_comment_revisions','ticket_participant_requests','ticket_participants','ticket_reopen_requests'];
const accounts=[],matrix=[];let checks=0,stage='local guards',key,baseline,adminCount,orgA,orgB,retentionScheduleChanged=false;
const q=value=>"'"+value.replaceAll("'","''")+"'";
function assert(condition,label){if(!condition)throw new CheckError(label);checks++;}
function command(args,input){const r=spawnSync(docker,args,{cwd:root,encoding:'utf8',timeout:30000,input});if(r.error||r.status)throw new CheckError('Local database verification failed; private details withheld.');return r.stdout.trim();}
function sql(query){const s=command(['exec','-i','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1'],query);return s?JSON.parse(s):null;}
function snapshot(previous){return tables.map(table=>sql('select jsonb_build_object(\'table\','+q(table)+',\'count\',count(*),\'hash\',md5(coalesce(string_agg(to_jsonb(t)::text,\'\' order by id),\'\')),\'ids\',coalesce(jsonb_agg(id order by id),\'[]\'::jsonb)) from public.'+table+' t'+(previous?(previous.find(x=>x.table===table).ids.length?' where id in ('+previous.find(x=>x.table===table).ids.map(q).join(',')+')':' where false'):'')));}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const revision=id=>String(sql('select access_revision from public.profiles where id='+q(id)));
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
async function register(label){
  const email='securedesk-audit-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Audit Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
 assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Audit Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed")===1,'Only new fixture receives temporary SA bootstrap.');
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

 const settings=()=>sql("select to_jsonb(s) from public.platform_settings s where key='audit_retention_days'");
 const policyArgs=days=>({p_days:days,p_expected_revision:String(settings().revision),p_expected_access_revision:revision(sa.id)});
 assert(settings().value===365,'Local baseline policy is 365 days');assert(sql("select count(*)::integer from public.audit_logs where created_at<clock_timestamp()-interval '8760 hours'")===0,'No prior rows eligible for purge');
 const id=randomUUID(),commonClient=await common(clientA,id);
 assert(!(await clientA.client.rpc('create_ticket',{...commonClient,p_project_id:supportA,p_client_user_id:clientA.id,p_details:{title:'Fictional audit activity practice',description:'Fictional audit and parent access proof'}})).error,'Actual Client opens activity ticket');
 const fresh=async(actor)=>({...await common(actor,id),p_expected_revision:String(ticket(id).revision)});
 assert(!(await oa.client.rpc('manage_ticket',{...await fresh(oa),p_intent:'owner',p_value:owner.id})).error,'Actual Admin assigns owner');
 assert(!(await owner.client.rpc('manage_ticket',{...await fresh(owner),p_intent:'add_collaborator',p_value:collab.id})).error,'Actual owner adds collaborator');
 const auditA=randomUUID(),auditB=randomUUID(),auditGlobal=randomUUID();
 sql('insert into public.audit_logs(id,organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted) values('+[auditA,orgA,owner.id,'ticket.comment_added','ticket',id,'success',JSON.stringify({token:'Fictional private metadata sentinel',reason:'Private fictional detail'})].map(q).join(',')+'),('+[auditB,orgB,oaB.id,'security.audit_fixture','ticket',id,'failure','{}'].map(q).join(',')+'),('+q(auditGlobal)+',null,'+[sa.id,'security.audit_fixture','platform_setting',settings().id,'failure','{}'].map(q).join(',')+');select to_jsonb(true)');
 const activityArgs={p_organization_id:orgA,p_ticket_id:id},fixtureAuditIds=[auditA,auditB,auditGlobal],native=form(await page(sa,'/admin/audit'),'data-audit-retention');
 stage='real Auth audit and business activity scopes';
 for(const actor of [null,...accounts]){
  const client=actor?.client??anonymous,label=actor?.label??'anonymous',admin=[sa,oa,oaB].includes(actor),canRead=[sa,oa,owner,collab,clientA].includes(actor);
  const global=await client.rpc('audit_list'),detail=await client.rpc('ticket_activity',activityArgs),policy=await client.rpc('audit_retention_settings');
  assert(admin?!global.error:Boolean(global.error),label+': administrator audit gate');
  assert(canRead?!detail.error:Boolean(detail.error),label+': parent-bound business activity');
  assert(actor===sa?!policy.error:Boolean(policy.error),label+': global retention restricted');
  if(canRead)assert(!JSON.stringify(detail.data).includes('Fictional private metadata sentinel')&&!JSON.stringify(detail.data).includes('Private fictional detail')&&!JSON.stringify(detail.data).includes('security.'),label+': activity DTO excludes security and arbitrary metadata');
  const raw=await client.from('audit_logs').select('id,organization_id').in('id',fixtureAuditIds);
  assert(!actor?Boolean(raw.error):!raw.error&&raw.data.length===(actor===sa?3:actor===oa||actor===oaB?1:0),label+': direct RLS audit scope');
  const direct=await client.from('platform_settings').update({value:1}).eq('key','audit_retention_days');assert(Boolean(direct.error)&&settings().value===365,label+': direct setting writes denied');
  const copied=await post(actor,native,{days:'365',verified:'yes'});assert(actor===sa?Boolean(copied.location):!copied.location,label+': copied native form respects current role');assert(settings().value===365,label+': no privilege through hidden values');
  const businessPage=await page(actor,path(orgA,id));assert(canRead?businessPage.html.includes('id="ticket-activity"')&&businessPage.html.includes(auditA):!businessPage.html.includes('id="ticket-activity"')&&!businessPage.html.includes(auditA),label+': native ticket activity follows parent access');
  const web=await page(actor,'/admin/audit');if(admin)assert(web.headers.get('cache-control')?.includes('private')&&web.headers.get('cache-control')?.includes('no-store'),label+': audit response remains private');assert(admin?web.status===200&&!web.location:(Boolean(web.location)||/NEXT_REDIRECT;replace;\/(login|account);/.test(web.html))&&!web.html.includes('id="audit-events"'),label+': audit page gate');
  if(actor && actor!==sa){const denial=await client.rpc('set_audit_retention',{p_days:1,p_expected_revision:'1',p_expected_access_revision:'1'});assert(!denial.error&&denial.data?.code==='forbidden'&&settings().value===365,label+': verified unauthorized RPC logged and denied');}
 }
 assert((await oa.client.rpc('audit_list',{p_organization_id:orgB})).error?.code==='42501','OA copied company B audit denied');
 const scoped=await page(oa,'/admin/audit?company='+orgB);assert(scoped.html.includes('This view is unavailable')&&!scoped.html.includes(auditB),'Native copied company produces no audit leak');
 const failures=await sa.client.rpc('audit_list',{p_event_type:'security.audit_retention_denied',p_outcome:'failure'});const deniedIds=sql("select coalesce(jsonb_agg(id),'[]'::jsonb) from public.audit_logs where event_type='security.audit_retention_denied' and actor_user_id in ("+accounts.slice(1).map(a=>q(a.id)).join(',')+")");assert(!failures.error&&deniedIds.length===10&&failures.data.filter(e=>deniedIds.includes(e.id)).length===10,'SA sees all ten new actor-derived denied attempts');
 assert((await oa.client.rpc('audit_list',{p_event_type:'security.audit_retention_denied'})).data.length===0,'Global denial never visible to OA');
 const noWorker=await sa.client.rpc('purge_expired_audit',{p_batch:1});assert(noWorker.error?.code==='PGRST202','Business SA cannot call maintenance');
 stage='native malformed stale origin and concurrent retention';
 for(const extra of [{days:['365','1']},{actor_user_id:sa.id},{value:'1'},{days:'0'},{days:'3651'},{verified:null},{setting_revision:null}]){const r=await post(sa,native,{days:'366',verified:'yes',...extra});assert(!r.location&&settings().value===365,'Malformed native retention denied');}
 const foreign=await post(sa,native,{days:'366',verified:'yes'},'https://outside.example.invalid');assert(!foreign.location&&settings().value===365,'Foreign Origin cannot change retention');
 const args=policyArgs(366),concurrent=await Promise.all([sa.client.rpc('set_audit_retention',args),sa.client.rpc('set_audit_retention',{...args,p_days:367})]);assert(concurrent.filter(x=>x.data?.saved===true).length===1&&concurrent.filter(x=>x.error?.code==='40001').length===1,'Concurrent policy changes keep one winner');
 assert(!(await sa.client.rpc('set_audit_retention',policyArgs(365))).error,'Restore 365 through actual SA');
 const stale=await post(sa,native,{days:'366',verified:'yes'});assert(!stale.location&&settings().value===365,'Old native policy form rejected');
 const freshNative=form(await page(sa,'/admin/audit'),'data-audit-retention');assert((await post(sa,freshNative,{days:'366',verified:'yes'})).location?.startsWith('/admin/audit?notice=saved'),'Real native retention change succeeds');assert(settings().value===366,'Native form changes database');assert(!(await sa.client.rpc('set_audit_retention',policyArgs(365))).error,'Default restored with its own audit');
 stage='keyset and same-session revocation';
 sql("insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,created_at) select "+q(orgA)+','+q(owner.id)+",'ticket.comment_added','ticket',"+q(id)+",'success',clock_timestamp() from generate_series(1,28);select to_jsonb(true)");
 const first=await oa.client.rpc('audit_list',{p_organization_id:orgA,p_event_type:'ticket.comment_added'});assert(!first.error&&first.data.length===26,'Real audit page bounded');const anchor=first.data[24],second=await oa.client.rpc('audit_list',{p_organization_id:orgA,p_event_type:'ticket.comment_added',p_before_at:anchor.created_at,p_before_id:anchor.id});assert(!second.error&&second.data.length===4&&!second.data.some(x=>first.data.slice(0,25).some(y=>y.id===x.id)),'Second keyset page has remaining events once');
 const listing=await page(oa,'/admin/audit?company='+orgA+'&event=ticket.comment_added');assert(listing.html.includes('Older events')&&listing.html.includes(auditA)===false,'Native first page bounds old fixture event');
 sql('update public.organization_admin_assignments set active=false where organization_id='+q(orgA)+' and admin_user_id='+q(oa.id)+';select to_jsonb(true)');assert((await oa.client.rpc('audit_list')).data.length===0,'Already logged-in OA loses raw audit immediately');assert((await page(oa,'/admin/audit?company='+orgA)).html.includes('This view is unavailable'),'Same cookie loses native company audit');sql('update public.organization_admin_assignments set active=true where organization_id='+q(orgA)+' and admin_user_id='+q(oa.id)+';select to_jsonb(true)');
 const sharing=randomUUID();assert(!(await clientA.client.rpc('request_ticket_participant',{...await common(clientA,id),p_request_id:sharing,p_candidate_client_id:colleague.id})).error,'Source Client proposes sharing');assert((await colleague.client.rpc('ticket_activity',activityArgs)).error?.code==='42501','Pending sharing no activity access');assert(!(await owner.client.rpc('review_ticket_participant',{...await common(owner,id),p_request_id:sharing,p_expected_request_revision:'1',p_intent:'approve'})).error,'Owner approves activity access');assert(!(await colleague.client.rpc('ticket_activity',activityArgs)).error,'Approved shared Client can read business activity');assert((await page(colleague,path(orgA,id))).html.includes('id="ticket-activity"'),'Approved Client cookie can render activity');
 assert(!(await owner.client.rpc('revoke_ticket_participant',{...await fresh(owner),p_client_user_id:colleague.id})).error,'Owner revokes shared access');assert((await colleague.client.rpc('ticket_activity',activityArgs)).error?.code==='42501','Same shared Client session loses activity');assert(!(await page(colleague,path(orgA,id))).html.includes('id="ticket-activity"'),'Same Client cookie loses rendered activity immediately');
 stage='real maintenance audit rollback concurrency and policy serialization';
 const ownerCall=async(query)=>{const child=spawn(docker,['exec','-i','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1'],{cwd:root,stdio:['pipe','pipe','pipe']});let output='',error='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>error+=x);const done=new Promise(resolve=>child.on('close',code=>resolve({code,output,error})));child.stdin.end(query);return done;};
 const purge=()=>ownerCall('select securedesk_private.purge_expired_audit(10000);'),count=r=>{assert(r.code===0,'Maintenance session succeeds');return Number(r.output.trim());},aged=days=>{const n=randomUUID();sql("insert into public.audit_logs(id,event_type,target_type,target_id,outcome,created_at) values("+q(n)+",'audit.fictional_expired','platform_setting',"+q(settings().id)+",'success',clock_timestamp()-make_interval(secs=>"+days*86400+"));select to_jsonb(true)");return n;},exists=n=>sql('select count(*)::integer from public.audit_logs where id='+q(n))===1;
 const oldA=aged(400),oldB=aged(401);sql("create function securedesk_private.audit_runtime_fault() returns trigger language plpgsql as $$begin if new.event_type='audit.retention_purged' then raise exception 'Fictional retention audit failure';end if;return new;end;$$;create trigger audit_runtime_fault before insert on public.audit_logs for each row execute function securedesk_private.audit_runtime_fault();select to_jsonb(true)");
 try{const fail=await purge();assert(fail.code!==0&&fail.error.includes('Fictional retention audit failure')&&exists(oldA)&&exists(oldB),'Late purge audit failure restores all rows');}finally{sql('drop trigger audit_runtime_fault on public.audit_logs;drop function securedesk_private.audit_runtime_fault();select to_jsonb(true)');}
 const both=await Promise.all([purge(),purge()]);assert(both.map(count).reduce((a,b)=>a+b,0)===2&&!exists(oldA)&&!exists(oldB),'Two maintenance workers remove each expired row once');assert(count(await purge())===0,'Repeated maintenance creates nothing');
 const middle=aged(365.5);sql("create function securedesk_private.audit_runtime_delay() returns trigger language plpgsql as $$begin if new.event_type='audit.retention_changed' then perform pg_sleep(0.7);end if;return new;end;$$;create trigger audit_runtime_delay before insert on public.audit_logs for each row execute function securedesk_private.audit_runtime_delay();select to_jsonb(true)");
 try{const saving=sa.client.rpc('set_audit_retention',policyArgs(366)).then(r=>r);for(let n=0;n<100;n++){if(sql("select count(*)::integer from pg_stat_activity where wait_event='PgSleep' and query like '%set_audit_retention%'")>0)break;await new Promise(r=>setTimeout(r,20));if(n===99)throw new CheckError('Policy race lock not reached');}const job=purge();assert(!(await saving).error&&count(await job)===0&&exists(middle),'Worker waits for current policy and preserves 365.5-day row under 366');}finally{sql('drop trigger audit_runtime_delay on public.audit_logs;drop function securedesk_private.audit_runtime_delay();select to_jsonb(true)');}
 assert(!(await sa.client.rpc('set_audit_retention',policyArgs(365))).error&&count(await purge())===1&&!exists(middle),'Restored policy removes only now-expired new fixture');
 stage='actual accelerated daily scheduler';const scheduled=aged(400),start=sql('select to_jsonb(clock_timestamp())');
 assert(sql("select cron.alter_job(jobid,schedule:='* * * * *') from cron.job where jobname='securedesk-audit-retention' and username='postgres';select count(*)::integer from cron.job where jobname='securedesk-audit-retention' and schedule='* * * * *';")===1,'Temporarily accelerate only the new daily job');retentionScheduleChanged=true;
 console.log('Audit scopes and races passed; waiting for an actual retention cron tick.');const until=Date.now()+75000;while(Date.now()<until&&exists(scheduled))await new Promise(r=>setTimeout(r,1000));assert(!exists(scheduled),'Real scheduled maintenance removes only fictional expired row');assert(sql("select count(*)::integer from cron.job_run_details d join cron.job j on j.jobid=d.jobid where j.jobname='securedesk-audit-retention' and d.start_time>="+q(start)+"::timestamptz and d.status='succeeded'")>=1,'Actual cron run history proves success');
 assert(sql("select cron.alter_job(jobid,schedule:='15 3 * * *') from cron.job where jobname='securedesk-audit-retention' and username='postgres';select count(*)::integer from cron.job where jobname='securedesk-audit-retention' and active and schedule='15 3 * * *';")===1,'Restore daily schedule');retentionScheduleChanged=false;
 writeFileSync(new URL('../.tools/verification/phase5-audit/practice.json',import.meta.url),JSON.stringify({organization:orgA,ticket:id,path:path(orgA,id),audit_path:'/admin/audit?company='+orgA},null,2));
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
 const ids=accounts.map(a=>a.id).filter(Boolean);
 try{if(retentionScheduleChanged){sql("select cron.alter_job(jobid,schedule:='15 3 * * *') from cron.job where jobname='securedesk-audit-retention' and username='postgres';select to_jsonb(true)");retentionScheduleChanged=false;}}catch{failed=true;console.error('FAIL: Restore local cron schedule');}
 try{if(accounts[0]?.id && sql("select count(*)::integer from public.platform_settings where key='audit_retention_days' and value<>365 and updated_by="+q(accounts[0].id))===1){const s=sql("select to_jsonb(s) from public.platform_settings s where key='audit_retention_days'");const r=await accounts[0].client.rpc('set_audit_retention',{p_days:365,p_expected_revision:String(s.revision),p_expected_access_revision:revision(accounts[0].id)});if(r.error)throw new CheckError('Policy restoration failed');}}catch{failed=true;console.error('FAIL: Fixture policy restoration');}
 try{for(const org of [orgA,orgB].filter(Boolean))sql("with c as(update public.organization_access_codes set active=false,revoked_at=clock_timestamp() where organization_id="+q(org)+" and active returning id) select to_jsonb(true)");}catch{failed=true;console.error('FAIL: Fictional code cleanup');}
 try{sql("drop trigger if exists audit_runtime_fault on public.audit_logs;drop function if exists securedesk_private.audit_runtime_fault();drop trigger if exists audit_runtime_delay on public.audit_logs;drop function if exists securedesk_private.audit_runtime_delay();select to_jsonb(true)");}catch{failed=true;console.error('FAIL: Audit fixture cleanup');}
 try{if(ids.length){const values=ids.map(q).join(',');sql("with s as(update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ("+values+") and (active or can_create_project) returning id),a as(update public.organization_admin_assignments set active=false where admin_user_id in ("+values+") and active returning id),p as(update public.profiles set app_role='client' where id in ("+values+") and app_role<>'client' returning id) select to_jsonb(true)");if(accounts[0]?.id)sql("with p as(update public.profiles set account_status='pending' where id="+q(accounts[0].id)+" returning id) select to_jsonb(true)");}}catch{failed=true;console.error('FAIL: Fixture role cleanup');}
 for(const account of accounts)try{if((await account.client.auth.signOut({scope:'local'})).error)throw new CheckError('Signout failed');account.cookies.clear();}catch{failed=true;console.error('FAIL: Fixture signout');}
 try{if(adminCount!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Persistent Super Admin count unchanged');if(ids.length){const values=ids.map(q).join(',');assert(sql('select count(*)::integer from auth.sessions where user_id in ('+values+')')===0,'All new fixture sessions closed');assert(sql("select count(*)::integer from public.profiles where id in ("+values+") and app_role<>'client'")===0,'No privileged fixture roles remain');assert(sql('select count(*)::integer from public.staff_organization_assignments where staff_user_id in ('+values+') and (active or can_create_project)')===0,'No Staff fixture permissions remain');assert(sql('select count(*)::integer from public.organization_admin_assignments where admin_user_id in ('+values+') and active')===0,'No OA fixture assignments remain');}if(baseline)assert(JSON.stringify(snapshot(baseline))===JSON.stringify(baseline),'All earlier business rows unchanged');}catch(error){failed=true;console.error('FAIL: '+(error instanceof CheckError?error.message:'Final guard failed'));}
}
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/phase5-audit/runtime-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',stage,matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Audit real Auth/concurrency/retention checks: '+checks+' checks / '+(failed?'FAIL':'PASS'));if(failed)process.exitCode=1;




