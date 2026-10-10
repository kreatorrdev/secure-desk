import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Organization-code lifecycle, real native forms and scoped registration decisions.
// All business decisions use authenticated RPCs. Owner writes only bootstrap/fixture revocation.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321',site='http://127.0.0.1:3000',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const tables=['organization_access_codes','organization_code_submissions','profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs'];
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
  const email='securedesk-codes-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Code Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
async function reviewForm(account,id,intent) {
  for(let n=1;n<=30;n++){
    const web=await page(account,'/admin/requests?page='+n);
    const markup=[...web.html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].find(m=>m[0].includes('data-review="'+intent+'"')&&m[0].includes('data-request="'+id+'"'))?.[0];
    if(markup)return {path:web.path,markup};
    if(!web.html.includes('Next page'))break;
  }
  throw new CheckError('Expected scoped review form missing.');
}

async function run() {
  if (process.argv.slice(2).length !== 1 || process.argv[2] !== '--create-demo') throw new CheckError('Use --create-demo to retain eight fictional accounts and two companies.');
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
  for (const label of ['super-admin','org-admin','staff','client-a','client-b','pending','second','rate-limit']) await register(label);
  const [sa,oa,staff,clientA,clientB,pending,second,limited] = accounts;
  const anonymous = createClient(api,key,options);
  stage = 'controlled fixture setup';
  assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Code Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed") === 1, 'Only new fixture receives temporary SA bootstrap.');
  for (const [target,role] of [[oa,'admin'],[staff,'staff']]) await allowedRpc(sa.client,'approve_privileged_registration',{p_request_id:requestFor(target.id).id,p_role:role,p_reason:'Fictional code screen approval.'},'Approve fixture '+role);
  const details = label => ({name:'Fictional Code Company '+label+' '+randomUUID().slice(0,8),address:'Fictional office',email:'people-'+label.toLowerCase()+'@securedesk.example.invalid',phone:'+12025550655',description:'Fictional code-screen access test.'});
  const a=details('A'),b=details('B');
  orgA=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientA.id).id,p_details:a},'Approve Client A and company.');
  orgB=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientB.id).id,p_details:b},'Approve Client B and company.');
  await allowedRpc(sa.client,'set_organization_admin_assignment',{p_organization_id:orgA,p_admin_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_expected_assignment_revision:null,p_active:true,p_reason:'Fictional code-screen OA assignment.'},'Assign OA only to A.');
  await allowedRpc(oa.client,'set_staff_organization_assignment',{p_organization_id:orgA,p_staff_user_id:staff.id,p_expected_access_revision:revision(staff.id),p_expected_assignment_revision:null,p_active:true,p_can_create_project:true,p_reason:'Fictional code-screen Staff assignment.'},'Assign Staff A with project permission.');

  const path=id=>'/organizations/'+id+'/codes';
  const call=(account,org)=> (account?.client??anonymous).rpc('organization_access_code_state',{p_organization_id:org});
  stage='role/scope and private-state matrix';
  for(const account of [null,...accounts]){
    const before=checks,label=account?.label??'anonymous';
    for(const org of [orgA,orgB]){
      const allowed=account===sa||(account===oa&&org===orgA);
      const r=await call(account,org);
      assert(allowed?!r.error&&r.data.length===0:r.error?.code==='42501',label+': code metadata scope.');
      const web=await page(account,path(org));
      assert(web.headers.get('cache-control')?.includes('no-store'),label+': code page private/no-store.');
      assert(allowed?web.html.includes('name="expected_code_id"'):!web.html.includes('name="expected_code_id"'),label+': only scoped admins receive management form.');
      if(account){
        assert((await account.client.from('organization_access_codes').select('*')).error?.code==='42501',label+': code hashes inaccessible.');
        assert((await account.client.from('organization_code_submissions').select('*')).error?.code==='42501',label+': private receipts inaccessible.');
      }
    }
    matrix.push({role:label,checks:checks-before,result:'PASS'});
  }
  const entry=form(await page(pending,'/account'),'name="organization_code"');
  let manager=form(await page(oa,path(orgA)),'name="expected_code_id"');
  const issue={intent:'issue',confirmed:'yes'};
  stage='native code lifecycle and forged actions';
  const anon=await post(null,manager,issue);
  assert(!anon.html.includes('data-issued-code'), 'Copied code form cannot authorize anonymous caller.');
  for(const actor of [staff,clientA,pending]){
    const result=await post(actor,manager,{...issue,app_role:'super_admin'});
    assert(!result.html.includes('data-issued-code'),'Copied management form and forged role cannot issue code.');
  }
  const cross=await post(oa,manager,{...issue,organization_id:orgB});
  assert(!cross.html.includes('data-issued-code') && (await call(sa,orgB)).data.length===0,'Foreign organization hidden field cannot widen OA scope.');
  const unconfirmed=await post(oa,manager,{intent:'issue'});
  assert(unconfirmed.html.includes('Confirm that you understand'),'Change requires explicit confirmation in native form.');
  const csrf=await post(oa,manager,issue,'https://foreign.example.invalid');
  assert([403,500].includes(csrf.status)&&(await call(oa,orgA)).data.length===0,'Foreign-Origin action rejected without mutation.');
  const generated=await post(oa,manager,issue);
  const code=generated.html.match(/<code\b[^>]*data-issued-code[^>]*>([a-f0-9]{64})<\/code>/)?.[1];
  assert(Boolean(code),'Native issuance displays the newly generated code once.');
  const meta=(await call(oa,orgA)).data[0];
  assert(meta?.is_usable && JSON.stringify(Object.keys(meta).sort())===JSON.stringify(['id','created_at','expires_at','is_usable'].sort()),'Metadata response exposes exactly four nonsensitive fields.');
  const refreshed=await page(oa,path(orgA));
  assert(!refreshed.html.includes(code)&&!refreshed.html.includes('data-issued-code'),'Reload does not retrieve raw code.');
  assert(sql('select to_jsonb(code_hash) from public.organization_access_codes where id='+q(meta.id))!==code,'Stored value differs from issued code.');
  const stale=await post(oa,manager,issue);
  assert(stale.html.includes('code has changed')&&(await call(oa,orgA)).data[0].id===meta.id,'Stale issuance cannot rotate code silently.');
  const malformed=await post(pending,entry,{organization_code:'not-a-code'});
  assert(malformed.html.includes('This code cannot be used')&&!malformed.html.includes(a.name),'Invalid code gives no company detail.');
  const requestId=requestFor(pending.id).id;
  const submitted=await post(pending,entry,{organization_code:code,organization_id:orgB,user_id:clientA.id,status:'approved'});
  assert(submitted.location==='/account?notice=code-submitted','Native code submission uses fixed nonsecret redirect.');
  const routed=requestFor(pending.id);
  assert(routed.id===requestId&&routed.status==='pending'&&routed.target_organization_id===orgA,'Code routes own existing request without trusting forged identifiers.');
  const status=await page(pending,'/account');
  assert(status.html.includes('Your organization code has been submitted')&&!status.html.includes('name="organization_code"')&&!status.html.includes(code)&&!status.html.includes(a.name),'Reload shows only own submission status, without code or company details.');
  assert((await pending.client.from('organizations').select('id')).data.length===0,'Submitted applicant still has no company access.');
  assert(sql('select count(*)::integer from public.organization_members where user_id='+q(pending.id))===0,'Submission does not create membership.');
  const duplicate=await pending.client.rpc('submit_organization_access_code',{p_code:code});
  assert(duplicate.data==='submitted'&&!duplicate.error,'Duplicate valid submission is idempotent.');
  assert(sql('select count(*)::integer from public.organization_code_submissions where user_id='+q(pending.id))===1,'Duplicate leaves one submission receipt.');
  assert((await clientA.client.rpc('submit_organization_access_code',{p_code:code})).error?.code==='42501','Existing approved Client cannot transfer through code.');
  assert((await sa.client.rpc('submit_organization_access_code',{p_code:code})).error?.code==='42501','Code cannot convert administrator role to membership.');
  const approval=await reviewForm(oa,requestId,'approve');
  manager=form(await page(oa,path(orgA)),'name="expected_code_id"');
  const revoke=await post(oa,manager,{intent:'revoke',confirmed:'yes'});
  assert(revoke.html.includes('Code revoked')&&(await call(oa,orgA)).data.length===0,'Native revoke removes active code.');
  const secondEntry=form(await page(second,'/account'),'name="organization_code"');
  const revoked=await post(second,secondEntry,{organization_code:code});
  assert(revoked.html.includes('This code cannot be used')&&requestFor(second.id).target_organization_id===null,'Revoked code cannot route a new request.');
  const approveResult=await post(oa,approval,{verified:'yes'});
  assert(approveResult.location==='/admin/requests?notice=approved','Existing native review approves a code-submitted request.');
  assert(requestFor(pending.id).status==='approved'&&(await pending.client.from('organizations').select('id')).data.some(o=>o.id===orgA),'Same applicant session gets access only after independent approval.');
  const staleApprove=await post(oa,approval,{verified:'yes'});
  assert(staleApprove.html.includes('request is unavailable'),'Stale approval cannot duplicate membership.');
  assert(sql('select count(*)::integer from public.organization_members where user_id='+q(pending.id)+' and status=\'active\'')===1,'Approved applicant has exactly one membership.');

  stage='concurrent rotation, rejection and rate limiting';
  const first=(await allowedRpc(oa.client,'manage_organization_access_code',{p_organization_id:orgA,p_expected_code_id:null,p_intent:'issue'},'Create code for race.'))[0];
  const racing=await Promise.all([1,2].map(()=>oa.client.rpc('manage_organization_access_code',{p_organization_id:orgA,p_expected_code_id:first.id,p_intent:'issue'})));
  assert(racing.filter(r=>!r.error).length===1&&racing.filter(r=>r.error?.code==='PT409').length===1,'Concurrent replacements have one winner and one stale rejection.');
  const fresh=racing.find(r=>!r.error).data[0];
  assert((await second.client.rpc('submit_organization_access_code',{p_code:first.code})).data==='unavailable','Losing old code cannot route request.');
  assert((await post(second,secondEntry,{organization_code:fresh.code})).location==='/account?notice=code-submitted','New code routes second applicant.');
  const rejected=await post(oa,await reviewForm(oa,requestFor(second.id).id,'reject'),{reason:'Please verify your fictional company details.'});
  assert(rejected.location==='/admin/requests?notice=rejected'&&requestFor(second.id).status==='rejected','Existing native rejection handles code-submitted request.');
  assert((await page(second,'/account')).html.includes('Please verify your fictional company details.'),'Applicant sees own rejection reason.');
  const limitedForm=form(await page(limited,'/account'),'name="organization_code"');
  for(let n=0;n<5;n++){
    const denied=await post(limited,limitedForm,{organization_code:n===0?'<script>codeProbe()</script>':'invalid-'+n});
    assert(denied.html.includes('This code cannot be used')&&!denied.html.includes('<script>codeProbe()</script>'),'Invalid attempt returns generic escaped response.');
  }
  const blocked=await post(limited,limitedForm,{organization_code:fresh.code});
  assert(blocked.html.includes('Too many attempts')&&requestFor(limited.id).target_organization_id===null,'Native sixth attempt cannot bypass durable limit.');
  assert((await limited.client.rpc('submit_organization_access_code',{p_code:fresh.code})).data==='rate_limited','Direct RPC shares the same attempt limit.');
  assert(sql('select attempts from securedesk_private.organization_code_attempts where user_id='+q(limited.id))===5,'Counter survives failed native submissions.');
  const audit=sql('select coalesce(jsonb_agg(metadata_redacted),\'[]\'::jsonb) from public.audit_logs where organization_id='+q(orgA));
  assert(!JSON.stringify(audit).includes(code)&&!JSON.stringify(audit).includes(fresh.code),'Audit records omit raw codes.');
  await allowedRpc(sa.client,'set_organization_admin_assignment',{p_organization_id:orgA,p_admin_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_expected_assignment_revision:String(sql('select revision from public.organization_admin_assignments where organization_id='+q(orgA)+' and admin_user_id='+q(oa.id))),p_active:false,p_reason:'Fictional code scope revocation.'},'Revoke fixture OA.');
  const afterRevoke=await post(oa,manager,{intent:'issue',confirmed:'yes',expected_code_id:fresh.id});
  assert(!afterRevoke.html.includes('data-issued-code')&&(await call(oa,orgA)).error?.code==='42501','Old form and same cookie cannot bypass revoked OA assignment.');
  assert((await call(sa,orgA)).data[0].id===fresh.id,'Revoked OA leaves current code unchanged.');
  await allowedRpc(sa.client,'manage_organization_access_code',{p_organization_id:orgA,p_expected_code_id:fresh.id,p_intent:'revoke'},'Revoke final fictional code.');
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
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/organization-codes-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Organization code API/native-form matrix: '+checks+' checks / '+(failed?'FAILED.':'PASS.'));if(failed)process.exitCode=1;

