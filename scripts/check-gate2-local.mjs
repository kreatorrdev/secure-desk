import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Gate 2 real Auth/Data API matrix; six new fictional accounts and two retained companies.
// All business decisions use authenticated RPCs. Owner writes only bootstrap/fixture revocation.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321',site='http://127.0.0.1:3000',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const tables=['profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs'];
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
  const email='securedesk-gate2-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Gate 2 Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
async function page(account,path){
  const response=await fetch(site+path,{headers:account?{cookie:[...account.cookies].map(([k,v])=>k+'='+v).join('; ')}:{},redirect:'manual',signal:AbortSignal.timeout(30000)});
  if(account)for(const set of response.headers.getSetCookie()){const pair=set.split(';')[0],at=pair.indexOf('='),name=pair.slice(0,at),value=pair.slice(at+1);if(!value||/max-age=0(?:;|$)/i.test(set))account.cookies.delete(name);else account.cookies.set(name,value);}
  const html=await response.text();return{status:response.status,html,location:response.headers.get('location')??html.match(/<meta[^>]*http-equiv="refresh"[^>]*content="[^"]*url=([^"]*)"/i)?.[1]??null,headers:response.headers};
}
async function allowedRpc(client,name,args,label){const r=await client.rpc(name,args);assert(!r.error,label);return r.data;}
async function deniedRpc(client,name,args,label){assert((await client.rpc(name,args)).error?.code==='42501',label);}
async function run(){
  if(process.argv.slice(2).length!==1||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo to retain six fictional accounts and two companies.');
  const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
  if(env.NEXT_PUBLIC_SUPABASE_URL!==api||env.SITE_URL!==site||!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.DOCKER_HOST)throw new CheckError('Refusing nonlocal application/Docker target.');key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const host=JSON.parse(command(['context','inspect','--format','{{json .Endpoints.docker.Host}}']));if(!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host)&&host!=='unix:///var/run/docker.sock')throw new CheckError('Expected local Docker context.');
  const labels=JSON.parse(command(['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw new CheckError('Unexpected local project/workspace.');
  baseline=snapshot();adminCount=sql("select count(*)::integer from public.profiles where app_role='super_admin'");
  assert(sql("select count(*)::integer from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ("+tables.map(q).join(',')+") and c.relrowsecurity")===8,'All eight private tables have RLS.');
  assert(sql("select count(*)::integer from supabase_migrations.schema_migrations where version in ('20261005183025','20261005191316','20261005193034','20261005202205','20261006120000','20261006143000','20261006170000','20261006200000','20261006201000','20261006210000')")===10,'Ten Gate 2 baseline migrations remain applied.');
  stage='signup/email/session';for(const label of ['super-admin','org-admin','staff','client-a','client-b','pending'])await register(label);
  const[sa,oa,staff,clientA,clientB,pending]=accounts,ids=accounts.map(a=>a.id),anonymous=createClient(api,key,options);
  stage='controlled approval and assignment';
  assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Gate 2 Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed")===1,'Owner bootstrap affects exactly one new fixture Super Admin.');
  for(const[target,role]of [[staff,'staff'],[oa,'admin']])await allowedRpc(sa.client,'approve_privileged_registration',{p_request_id:requestFor(target.id).id,p_role:role,p_reason:'Fictional Gate 2 approval.'},'SA approves '+role+' through real RPC.');
  const details=label=>({name:'Fictional Gate 2 '+label+' '+randomUUID().slice(0,8),address:'Fictional address',email:'gate2-company@securedesk.example.invalid',phone:'+12025550622',description:'Final local role matrix.'});
  orgA=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientA.id).id,p_details:details('A')},'SA atomically approves Client A/company/General Support.');
  orgB=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientB.id).id,p_details:details('B')},'SA atomically approves Client B/company/General Support.');
  await allowedRpc(sa.client,'set_organization_admin_assignment',{p_organization_id:orgA,p_admin_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_expected_assignment_revision:null,p_active:true,p_reason:'Gate 2 Admin scope A.'},'SA grants Admin only company A.');
  await allowedRpc(oa.client,'set_staff_organization_assignment',{p_organization_id:orgA,p_staff_user_id:staff.id,p_expected_access_revision:revision(staff.id),p_expected_assignment_revision:null,p_active:true,p_can_create_project:false,p_reason:'Gate 2 Staff scope A.'},'OA grants Staff A without project creation privilege.');
  await allowedRpc(sa.client,'route_registration_request',{p_request_id:requestFor(pending.id).id,p_organization_id:orgA},'SA routes Pending review to A without granting company access.');
  assert(sql('select count(*)::integer from public.projects where organization_id in ('+q(orgA)+','+q(orgB)+") and is_general_support and status='active'")===2,'Exactly one General Support per approved fixture company.');
  const data={};for(const table of tables)data[table]=sql('select coalesce(jsonb_agg(jsonb_build_object(\'id\',id'+(table==='profiles'?'':table==='organizations'?'':table==='registration_requests'?',\'user_id\',user_id,\'organization_id\',target_organization_id':table==='audit_logs'?',\'organization_id\',organization_id':',\'organization_id\',organization_id')+') order by id),\'[]\'::jsonb) from public.'+table+' where '+(table==='profiles'?'id':table==='registration_requests'?'user_id':table==='audit_logs'?'actor_user_id':table==='organization_members'?'user_id':table==='staff_organization_assignments'?'staff_user_id':table==='organization_admin_assignments'?'admin_user_id':table==='organizations'?'id':'organization_id')+' in ('+(table==='projects'||table==='organizations'?[orgA,orgB]:ids).map(q).join(',')+')');
  const roleByLabel={'super-admin':'super_admin','org-admin':'admin',staff:'staff','client-a':'client','client-b':'client',pending:null};
  stage='seven identity access matrix';
  for(const account of [null,...accounts]){
    const label=account?.label??'anonymous',client=account?.client??anonymous,saRole=label==='super-admin',oaRole=label==='org-admin';
    const scope=saRole?[orgA,orgB]:['org-admin','staff','client-a'].includes(label)?[orgA]:label==='client-b'?[orgB]:[];
    const beforeChecks=checks;
    const role=await client.rpc('current_account_role');assert(account?!role.error&&role.data===roleByLabel[label]:role.error?.code==='42501',label+': actual current role.');
    for(const table of tables){
      let expected=[];
      if(account){if(table==='profiles')expected=data[table].filter(r=>r.id===account.id);else if(table==='registration_requests')expected=data[table].filter(r=>saRole||r.user_id===account.id||(oaRole&&r.organization_id===orgA));else if(table==='organizations')expected=data[table].filter(r=>scope.includes(r.id));else if(table==='projects')expected=data[table].filter(r=>scope.includes(r.organization_id));else if(saRole)expected=data[table];else if(oaRole)expected=data[table].filter(r=>r.organization_id===orgA);else if(table==='organization_members'&&label.startsWith('client-'))expected=data[table].filter(r=>r.organization_id===scope[0]);else if(table==='staff_organization_assignments'&&label==='staff')expected=data[table].filter(r=>r.organization_id===orgA);}
      const columns=table==='profiles'?'id,account_status':table==='registration_requests'?'id,user_id,status':'id';
      const result=await client.from(table).select(columns).in('id',data[table].map(r=>r.id));
      assert(account?!result.error&&JSON.stringify(result.data.map(r=>r.id).sort())===JSON.stringify(expected.map(r=>r.id).sort()):result.error?.code==='42501',label+': '+table+' exact row scope.');
      const id=data[table][0].id;
      for(const[op,query]of [['INSERT',()=>client.from(table).insert({id:randomUUID()})],['UPDATE',()=>client.from(table).update({id}).eq('id',id)],['DELETE',()=>client.from(table).delete().eq('id',id)]])assert((await query()).error?.code==='42501',label+': direct '+op+' '+table+' is closed.');
    }
    if(account){for(const[table,column]of [['profiles','app_role'],['registration_requests','message']])assert((await client.from(table).select(column).eq('id',data[table][0].id)).error?.code==='42501',label+': private columns remain closed.');}
    const accountPage=await page(account,'/account?user_id='+clientB.id);
    assert(account?accountPage.status===200&&!accountPage.location&&accountPage.html.includes(account.email):accountPage.location==='/login',label+': verified account identity ignores query user_id.');
    assert(accountPage.headers.get('cache-control')?.includes('no-store'),label+': account response is private/no-store.');
    for(const path of ['/admin/requests','/admin/access']){const r=await page(account,path);assert(saRole||oaRole?r.status===200&&!r.location&&r.html.includes('<h1'):r.location===(account?'/account':'/login'),label+': '+path+' page authorization.');}
    if(account)assert(accountPage.html.includes('Manage Access')===(saRole||oaRole),label+': administrative navigation matches current role.');
    matrix.push({role:label,checks:checks-beforeChecks,result:'PASS'});console.log('PASS: '+label+' / '+(checks-beforeChecks)+' matrix checks.');
  }
  stage='escalation and tenant manipulation';
  assert(!(await staff.client.auth.updateUser({data:{app_role:'super_admin',account_status:'active',organization_id:orgB}})).error,'Staff may edit metadata without granting privileges.');
  assert((await staff.client.rpc('current_account_role')).data==='staff','Forged metadata leaves current role Staff.');
  assert((await staff.client.from('projects').select('id').eq('organization_id',orgB)).data?.length===0,'Staff metadata org B cannot widen project scope.');
  await deniedRpc(clientA.client,'approve_privileged_registration',{p_request_id:requestFor(pending.id).id,p_role:'super_admin',p_reason:'Forged self elevation.'},'Client cannot approve privileges.');
  await deniedRpc(staff.client,'change_account_role',{p_user_id:clientA.id,p_expected_access_revision:revision(clientA.id),p_new_role:'admin',p_reason:'Forged change.'},'Staff cannot change global roles.');
  await deniedRpc(oa.client,'admin_access_target',{p_email:clientB.email,p_organization_id:orgB},'OA exact lookup cannot access foreign company.');
  await deniedRpc(oa.client,'reject_registration_request',{p_request_id:requestFor(clientB.id).id,p_reason:'Cross-org decision.'},'OA cannot review foreign request UUID.');
  await deniedRpc(sa.client,'change_account_role',{p_user_id:sa.id,p_expected_access_revision:revision(sa.id),p_new_role:'client',p_reason:'Self role change.'},'SA cannot change own global role.');
  const memberRoleChange=await sa.client.rpc('change_account_role',{p_user_id:clientA.id,p_expected_access_revision:revision(clientA.id),p_new_role:'staff',p_reason:'Active Client membership conflict.'});
  assert(memberRoleChange.error?.code==='22023'&&(await clientA.client.rpc('current_account_role')).data==='client'&&sql('select count(*)::integer from public.organization_members where user_id='+q(clientA.id)+" and status='active'")===1,'Active Client membership cannot be bypassed by role change.');
  stage='same-session revocations';
  assert(sql("with changed as(update public.organization_members set status='ended',ended_at=greatest(now(),joined_at) where user_id="+q(clientA.id)+' and organization_id='+q(orgA)+" and status='active' returning id) select count(*)::integer from changed")===1,'Owner ends only the new Client A fixture membership.');
  for(const table of ['organizations','projects'])assert((await clientA.client.from(table).select('id').in(table==='organizations'?'id':'organization_id',[orgA,orgB])).data?.length===0,'Unchanged Client A token loses '+table+' scope immediately.');
  const staffVersion=String(sql('select revision from public.staff_organization_assignments where staff_user_id='+q(staff.id)+' and organization_id='+q(orgA)));
  await allowedRpc(oa.client,'set_staff_organization_assignment',{p_organization_id:orgA,p_staff_user_id:staff.id,p_expected_access_revision:revision(staff.id),p_expected_assignment_revision:staffVersion,p_active:false,p_can_create_project:false,p_reason:'Gate 2 Staff revocation.'},'OA revokes Staff A through authenticated RPC.');
  assert((await staff.client.from('projects').select('id').in('organization_id',[orgA,orgB])).data?.length===0,'Unchanged Staff token loses project scope.');
  assert((await staff.client.rpc('current_account_role')).data==='staff','Revocation leaves global Staff role intact.');
  assert(sql('with changed as(update auth.users set banned_until=now()+interval \'1 hour\' where id='+q(oa.id)+' returning id) select count(*)::integer from changed')===1,'Owner temporarily bans only the new OA fixture.');
  assert((await oa.client.rpc('current_account_role')).data===null,'Banned OA current role is unavailable despite existing JWT.');
  assert((await oa.client.from('organizations').select('id').in('id',[orgA,orgB])).data?.length===0,'Banned OA loses organization read scope.');
  await deniedRpc(oa.client,'admin_access_organizations',{},'Banned OA cannot call administrative read RPC.');
  sql('with changed as(update auth.users set banned_until=null where id='+q(oa.id)+' returning id) select count(*)::integer from changed');
  const adminVersion=String(sql('select revision from public.organization_admin_assignments where admin_user_id='+q(oa.id)+' and organization_id='+q(orgA)));
  await allowedRpc(sa.client,'set_organization_admin_assignment',{p_organization_id:orgA,p_admin_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_expected_assignment_revision:adminVersion,p_active:false,p_reason:'Gate 2 Admin scope revocation.'},'SA revokes OA A through authenticated RPC.');
  assert((await oa.client.from('organizations').select('id').in('id',[orgA,orgB])).data?.length===0,'Unchanged OA token loses company scope.');
  assert(!(await page(oa,'/admin/access?company='+orgA+'&email='+encodeURIComponent(staff.email))).html.includes('data-access-target='),'Existing OA cookie cannot load revoked company target.');
  await allowedRpc(sa.client,'change_account_role',{p_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_new_role:'client',p_reason:'Gate 2 Admin global revocation.'},'SA demotes OA through authenticated RPC.');
  assert((await page(oa,'/admin/access')).location==='/account','Existing OA cookie loses administrative page after demotion.');
  stage='rejected retry history';
  const oldRequest=requestFor(pending.id);await allowedRpc(sa.client,'reject_registration_request',{p_request_id:oldRequest.id,p_reason:'Clarify fictional Gate 2 company.'},'SA rejects the new Pending fixture with a reason.');
  const own=await pending.client.from('registration_requests').select('id,status,rejection_reason').eq('id',oldRequest.id).single();assert(!own.error&&own.data.status==='rejected'&&own.data.rejection_reason==='Clarify fictional Gate 2 company.','Same Pending session reads own rejection reason.');
  assert((await pending.client.from('projects').select('id').in('organization_id',[orgA,orgB])).data?.length===0,'Rejected Client has no company projects.');
  assert((await page(pending,'/account')).html.includes('Submit a new access request'),'Existing rejected cookie receives its own retry form.');
  await allowedRpc(pending.client,'resubmit_registration_form',{p_expected_request_id:oldRequest.id,p_company_name:'Fictional corrected Gate 2 company',p_phone:'+12025550603',p_message:'Clarified fictional request.'},'Rejected Client submits a new expected-attempt request.');
  assert(requestFor(pending.id).attempt_number===2&&requestFor(pending.id).status==='pending','Retry creates attempt 2/Pending without approval.');
  assert(sql('select count(*)::integer from public.registration_requests where id='+q(oldRequest.id)+" and status='rejected' and rejection_reason='Clarify fictional Gate 2 company.'")===1,'Prior rejection remains immutable in history.');
  assert((await page(null,'/dashboard')).location==='/login','Anonymous dashboard requires login.');
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
  const ids=accounts.map(a=>a.id).filter(Boolean);
  try{if(ids.length){const list=ids.map(q).join(',');sql('with s as(update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ('+list+') and (active or can_create_project) returning id),a as(update public.organization_admin_assignments set active=false where admin_user_id in ('+list+') and active returning id),p as(update public.profiles set app_role=\'client\' where id in ('+list+') and app_role<>\'client\' returning id),u as(update auth.users set banned_until=null where id in ('+list+') and banned_until is not null returning id) select to_jsonb(true)');if(accounts[0]?.id)sql('with p as(update public.profiles set account_status=\'pending\' where id='+q(accounts[0].id)+' returning id) select to_jsonb(true)');}}
  catch{failed=true;console.error('FAIL: Fixture role cleanup needs attention.');}
  for(const account of accounts)try{if((await account.client.auth.signOut({scope:'local'})).error)throw new CheckError('Fixture signout failed.');account.cookies.clear();}catch{failed=true;console.error('FAIL: Fixture session cleanup needs attention.');}
  try{if(adminCount!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Persistent Super Admin count unchanged.');if(ids.length){const list=ids.map(q).join(',');assert(sql('select count(*)::integer from auth.sessions where user_id in ('+list+')')===0,'All new fixture Auth sessions closed.');assert(sql("select count(*)::integer from public.profiles where id in ("+list+") and app_role<>'client'")===0,'All new privileged fixture roles removed.');assert(sql('select count(*)::integer from public.staff_organization_assignments where staff_user_id in ('+list+') and (active or can_create_project)')===0,'All new Staff assignment permissions removed.');assert(sql('select count(*)::integer from public.organization_admin_assignments where admin_user_id in ('+list+') and active')===0,'All new Admin assignments removed.');}if(baseline)assert(JSON.stringify(snapshot(baseline))===JSON.stringify(baseline),'Every existing business row unchanged.');}
  catch(error){failed=true;console.error('FAIL: '+(error instanceof CheckError?error.message:'Final fixture guard failed.'));}
}
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/gate2-api-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Gate 2 real API/cookie matrix: '+checks+' checks / '+(failed?'FAILED.':'PASS.'));if(failed)process.exitCode=1;
