import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// People screen Auth/Data API/SSR checks; six new fictional accounts and two retained companies.
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
  const email='securedesk-people-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional People Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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


async function run() {
  if (process.argv.slice(2).length !== 1 || process.argv[2] !== '--create-demo') throw new CheckError('Use --create-demo to retain six fictional accounts and two companies.');
  const env = parseEnv(readFileSync(new URL('../.env.local', import.meta.url), 'utf8'));
  if (env.NEXT_PUBLIC_SUPABASE_URL !== api || env.SITE_URL !== site || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.DOCKER_HOST) throw new CheckError('Refusing nonlocal application/Docker target.');
  key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const host = JSON.parse(command(['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
  if (!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host) && host !== 'unix:///var/run/docker.sock') throw new CheckError('Expected local Docker context.');
  const labels = JSON.parse(command(['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
  if (labels['com.supabase.cli.project'] !== 'secure-desk' || labels['com.supabase.cli.workdir'] !== root.replace(/[\\/]$/, '')) throw new CheckError('Unexpected local project/workspace.');
  baseline = snapshot();
  adminCount = sql("select count(*)::integer from public.profiles where app_role='super_admin'");
  stage = 'signup/email/session';
  for (const label of ['super-admin','org-admin','staff','client-a','client-b','pending']) await register(label);
  const [sa,oa,staff,clientA,clientB,pending] = accounts;
  const anonymous = createClient(api,key,options);
  stage = 'controlled fixture setup';
  assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional People Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed") === 1, 'Only new fixture receives temporary SA bootstrap.');
  for (const [target,role] of [[oa,'admin'],[staff,'staff']]) await allowedRpc(sa.client,'approve_privileged_registration',{p_request_id:requestFor(target.id).id,p_role:role,p_reason:'Fictional people screen approval.'},'Approve fixture '+role);
  const details = label => ({name:'Fictional People Company '+label+' '+randomUUID().slice(0,8),address:'Fictional office',email:'people-'+label.toLowerCase()+'@securedesk.example.invalid',phone:'+12025550655',description:'Fictional people-screen access test.'});
  const a=details('A'),b=details('B');
  orgA=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientA.id).id,p_details:a},'Approve Client A and company.');
  orgB=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientB.id).id,p_details:b},'Approve Client B and company.');
  await allowedRpc(sa.client,'set_organization_admin_assignment',{p_organization_id:orgA,p_admin_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_expected_assignment_revision:null,p_active:true,p_reason:'Fictional people-screen OA assignment.'},'Assign OA only to A.');
  await allowedRpc(oa.client,'set_staff_organization_assignment',{p_organization_id:orgA,p_staff_user_id:staff.id,p_expected_access_revision:revision(staff.id),p_expected_assignment_revision:null,p_active:true,p_can_create_project:true,p_reason:'Fictional people-screen Staff assignment.'},'Assign Staff A with project permission.');
  const marker='<script>peopleProbe()</script>';
  assert(sql('with changed as(update public.profiles set full_name='+q('Fictional Client A '+marker)+' where id='+q(clientA.id)+' returning id) select count(*)::integer from changed')===1,'Only new Client A fixture gets untrusted display text.');
  const rpc=(account,org,kind='client',status='active',offset=0)=>(account?.client??anonymous).rpc('admin_organization_people',{p_organization_id:org,p_kind:kind,p_status:status,p_offset:offset});
  const path=(org,kind='client',status='active',page=1)=>'/organizations/'+org+'/people?'+new URLSearchParams({kind,status,page:String(page)});
  const expectedA={
    client:sql('select coalesce(jsonb_agg(id order by id),\'[]\'::jsonb) from public.organization_members where organization_id='+q(orgA)),
    staff:sql('select coalesce(jsonb_agg(id order by id),\'[]\'::jsonb) from public.staff_organization_assignments where organization_id='+q(orgA)),
    admin:sql('select coalesce(jsonb_agg(id order by id),\'[]\'::jsonb) from public.organization_admin_assignments where organization_id='+q(orgA)),
  };
  const expectedB={client:sql('select coalesce(jsonb_agg(id order by id),\'[]\'::jsonb) from public.organization_members where organization_id='+q(orgB)),staff:[],admin:[]};
  const fields=['id','full_name','email','link_status','since','ended_at','updated_at','can_create_project','has_current_access'].sort();

  stage='role/tenant API and HTTP matrix';
  for (const account of [null,...accounts]) {
    const label=account?.label??'anonymous',before=checks;
    for (const org of [orgA,orgB]) for (const kind of ['client','staff','admin']) {
      const allowed=account===sa || (account===oa && org===orgA);
      const rows=await rpc(account,org,kind);
      assert(allowed ? !rows.error && JSON.stringify(rows.data.map(row=>row.id).sort())===JSON.stringify((org===orgA?expectedA:expectedB)[kind]) : rows.error?.code==='42501',label+': '+kind+' exact scoped RPC result.');
      if (allowed) for (const person of rows.data) assert(JSON.stringify(Object.keys(person).sort())===JSON.stringify(fields),label+': minimal roster fields only.');
      const web=await page(account,path(org,kind));
      assert(web.headers.get('cache-control')?.includes('no-store'),label+': roster response is private/no-store.');
      if (allowed) {
        const ids=[...web.html.matchAll(/data-person-record="([^"]+)"/g)].map(m=>m[1]).sort();
        assert(web.status===200 && !web.location && JSON.stringify(ids)===JSON.stringify(rows.data.map(row=>row.id).sort()),label+': rendered roster matches RPC.');
        assert(!web.html.includes(org===orgA?clientB.email:clientA.email),label+': foreign Client identity is absent.');
        if (rows.data.length===0) assert(web.html.replace(/<!--.*?-->/g,'').includes('No matching assignments'),label+': empty category has readable message.');
      } else {
        assert(!web.html.includes('data-person-record=') && !web.html.includes(clientA.email) && !web.html.includes(clientB.email) && !web.html.includes(staff.email),label+': denied roster leaks no identities.');
        if (!account || account===pending) assert(web.location===(account?'/account':'/login'),label+': pending/signed-out route returns to allowed page.');
        else assert(web.html.includes('Organization not available'),label+': other roles and foreign OA see unavailable view.');
      }
    }
    if (account) {
      const profile=await page(account,'/organizations/'+orgA);
      assert(profile.html.includes('href="/organizations/'+orgA+'/people"')===(account===sa||account===oa),label+': profile navigation is administrator-only.');
      assert((await account.client.from('profiles').select('full_name,phone')).error?.code==='42501',label+': direct profile grant remains restricted.');
    }
    matrix.push({role:label,checks:checks-before,result:'PASS'});
    console.log('PASS: '+label+' / '+(checks-before)+' people-screen checks.');
  }

  stage='filters, escaping and navigation';
  const ownPage=await page(oa,path(orgA));
  assert(ownPage.html.includes('&lt;script&gt;peopleProbe()&lt;/script&gt;') && !ownPage.html.includes(marker),'Untrusted person name is escaped.');
  assert(ownPage.html.includes('/admin/access?company='+orgA) && ownPage.html.includes('Manage Staff access'),'OA action opens existing company-scoped Staff management.');
  assert((await page(sa,path(orgA))).html.includes('Manage Access'),'SA receives existing access-management entry point.');
  for (const query of ['?kind=unknown&status=other&page=-1','?kind=client&kind=staff&status=active&status=all','?page=1%20or%201=1']) {
    const web=await page(oa,'/organizations/'+orgA+'/people'+query);
    assert(web.html.includes('data-person-record="'+expectedA.client[0]+'"') && !web.html.includes(staff.email),'Malformed filters fall back to a scoped Client page.');
  }
  const empty=await page(oa,path(orgA,'client','active',2));
  assert(empty.html.replace(/<!--.*?-->/g,'').includes('No matching memberships') && empty.html.includes('Go to first page'),'Empty later page has a recovery link.');
  for (const args of [{p_kind:'wrong'},{p_status:'wrong'},{p_offset:-1},{p_offset:250000}]) assert((await oa.client.rpc('admin_organization_people',{p_organization_id:orgA,...args})).error?.code==='22023','RPC independently validates filters.');
  for (const id of [orgB,randomUUID(),'invalid-id']) {
    const web=await page(oa,path(id));
    assert(web.html.includes('Organization not available') && !web.html.includes(clientB.email),'Foreign, missing and invalid company IDs have the same unavailable view.');
  }
  assert(!(await oa.client.auth.updateUser({data:{app_role:'super_admin',organization_id:orgB}})).error,'Fixture may change metadata without granting authority.');
  assert((await rpc(oa,orgB)).error?.code==='42501','Forged OA metadata cannot widen roster scope.');
  const forged=await page(oa,path(orgB)+'&role=super_admin&organization_id='+orgA);
  assert(!forged.html.includes(clientB.email) && forged.html.includes('Organization not available'),'Query identifiers and role cannot widen scope.');
  const rsc=await fetch(site+path(orgB)+'&_rsc',{headers:{RSC:'1',cookie:[...oa.cookies].map(([k,v])=>k+'='+v).join('; ')},redirect:'manual',signal:AbortSignal.timeout(30000)});
  const rscText=await rsc.text();
  assert(rsc.headers.get('content-type')?.includes('text/x-component') && !rscText.includes(clientB.email) && !rscText.includes('data-person-record'), 'RSC navigation cannot reveal foreign people.');
  assert(rsc.headers.get('cache-control')?.includes('no-store'),'RSC roster response is private/no-store.');

  stage='history and current access';
  const previewDir=new URL('../.tools/verification/people-preview/',import.meta.url);
  mkdirSync(previewDir,{recursive:true});
  for(const kind of ['client','staff','admin']) writeFileSync(new URL(kind+'.html',previewDir),(await page(oa,path(orgA,kind))).html);
  assert((await rpc(oa,orgA,'staff')).data[0].can_create_project===true,'Current eligible Staff has effective project permission.');
  sql('with changed as(update auth.users set banned_until=now()+interval \'1 hour\' where id='+q(staff.id)+' returning id) select count(*)::integer from changed');
  const blockedStaff=(await rpc(oa,orgA,'staff')).data[0];
  assert(blockedStaff.link_status==='active' && !blockedStaff.has_current_access && !blockedStaff.can_create_project,'Active assignment does not imply access for a banned target.');
  sql('with changed as(update auth.users set banned_until=null where id='+q(staff.id)+' returning id) select count(*)::integer from changed');
  await allowedRpc(oa.client,'set_staff_organization_assignment',{p_organization_id:orgA,p_staff_user_id:staff.id,p_expected_access_revision:revision(staff.id),p_expected_assignment_revision:String(sql('select revision from public.staff_organization_assignments where id='+q(expectedA.staff[0]))),p_active:false,p_can_create_project:false,p_reason:'Fictional roster revocation.'},'OA revokes Staff through existing controlled RPC.');
  assert((await rpc(oa,orgA,'staff')).data.length===0,'Revoked Staff leaves the current filter.');
  const history=(await rpc(oa,orgA,'staff','inactive')).data[0];
  assert(history.id===expectedA.staff[0] && history.link_status==='revoked' && !history.has_current_access && !history.can_create_project,'Revoked Staff history remains scoped and powerless.');
  const staffHistory=await page(oa,path(orgA,'staff','inactive'));
  assert(staffHistory.html.includes(staff.email) && staffHistory.html.includes('Revoked') && staffHistory.html.includes('Not available'),'HTTP history reflects the revocation.');
  writeFileSync(new URL('history.html',previewDir),staffHistory.html);
  assert(sql("with changed as(update public.organization_members set status='ended',ended_at=greatest(now(),joined_at) where id="+q(expectedA.client[0])+" and status='active' returning id) select count(*)::integer from changed")===1,'Owner ends only the newly-created Client fixture episode.');
  assert((await rpc(oa,orgA)).data.length===0,'Ended membership leaves the current Client filter.');
  const ended=(await rpc(oa,orgA,'client','inactive')).data[0];
  assert(ended.link_status==='ended' && ended.ended_at && !ended.has_current_access && ended.can_create_project===null,'Ended episode has a date and grants no access.');
  writeFileSync(new URL('empty.html',previewDir),(await page(oa,path(orgA))).html);
  assert((await page(oa,path(orgA,'client','all'))).html.includes('Membership ended'),'All-records view includes membership history.');

  stage='caller revocation and inactive company';
  sql('with changed as(update public.organizations set status=\'inactive\' where id='+q(orgA)+' returning id) select count(*)::integer from changed');
  assert((await rpc(oa,orgA,'admin')).error?.code==='42501','Inactive company closes OA roster without widening T-01.');
  const saInactive=(await rpc(sa,orgA,'admin')).data[0];
  assert(saInactive && !saInactive.has_current_access,'SA reads inactive assignment history with no access through that record.');
  sql('with changed as(update public.organizations set status=\'active\' where id='+q(orgA)+' returning id) select count(*)::integer from changed');
  sql('with changed as(update auth.users set banned_until=now()+interval \'1 hour\' where id='+q(oa.id)+' returning id) select count(*)::integer from changed');
  assert((await rpc(oa,orgA)).error?.code==='42501','Banned OA loses roster using the same JWT.');
  assert(!(await page(oa,path(orgA))).html.includes('data-person-record='),'Banned OA cookies cannot retrieve identities.');
  sql('with changed as(update auth.users set banned_until=null where id='+q(oa.id)+' returning id) select count(*)::integer from changed');
  await allowedRpc(sa.client,'set_organization_admin_assignment',{p_organization_id:orgA,p_admin_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_expected_assignment_revision:String(sql('select revision from public.organization_admin_assignments where id='+q(expectedA.admin[0]))),p_active:false,p_reason:'Fictional roster OA revocation.'},'SA revokes OA assignment through controlled RPC.');
  assert((await rpc(oa,orgA)).error?.code==='42501','Revoked OA JWT immediately loses people RPC.');
  const revokedPage=await page(oa,path(orgA));
  assert(revokedPage.html.includes('Organization not available') && !revokedPage.html.includes(clientA.email),'Existing OA cookie immediately loses the page.');
  writeFileSync(new URL('unavailable.html',previewDir),revokedPage.html);
  await allowedRpc(sa.client,'change_account_role',{p_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_new_role:'client',p_reason:'Fictional roster role cleanup.'},'SA demotes fixture OA.');
  assert((await rpc(oa,orgA)).error?.code==='42501','Demoted role cannot read a roster.');
  await allowedRpc(sa.client,'reject_registration_request',{p_request_id:requestFor(pending.id).id,p_reason:'Fictional roster rejection.'},'Reject fixture Pending account.');
  assert((await rpc(pending,orgA)).error?.code==='42501' && (await page(pending,path(orgA))).location==='/account','Rejected account has no roster access.');
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
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/organization-people-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Organization people API/cookie matrix: '+checks+' checks / '+(failed?'FAILED.':'PASS.'));if(failed)process.exitCode=1;
