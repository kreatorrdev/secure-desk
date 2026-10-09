import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createChunks, combineChunks } from '@supabase/ssr';

// Native Next.js form POSTs and cookie sessions. No actual user's credentials or requests.
// Explicit --create-demo retains five fictional accounts, two companies and audited history.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const site='http://127.0.0.1:3000',api='http://127.0.0.1:54321',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
let checks=0,stage='setup',key,adminCount,adminId;
const accounts=[];
const q=value=>"'"+value.replaceAll("'","''")+"'";
function assert(condition,label){if(!condition)throw new CheckError(label);checks++;console.log('PASS: '+label);}
function command(exe,args){const r=spawnSync(exe,args,{cwd:root,env:process.env,encoding:'utf8',timeout:30000});if(r.error||r.status!==0)throw new CheckError('Local fixture verification failed; private output withheld.');return r.stdout;}
function sql(query){return JSON.parse(command(docker,['exec','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1','-c',query]));}
class Browser {
  cookies = new Map();
  async request(path, options = {}) {
    const headers = new Headers(options.headers);
    if (this.cookies.size) headers.set('cookie', [...this.cookies].map(([k,v]) => k + '=' + v).join('; '));
    const response = await fetch(new URL(path, site), { ...options, headers, redirect: 'manual', signal: AbortSignal.timeout(30000) });
    for (const set of response.headers.getSetCookie()) {
      const pair = set.split(';')[0], at = pair.indexOf('='), name = pair.slice(0, at), value = pair.slice(at + 1);
      if (!value || /max-age=0(?:;|$)/i.test(set)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    const html = await response.text();
    const location = response.headers.get('location') ?? html.match(/<meta[^>]*http-equiv="refresh"[^>]*content="[^"]*url=([^"]*)"/i)?.[1] ?? null;
    return { status: response.status, location, headers: response.headers, html, path: new URL(path, site).pathname + new URL(path, site).search };
  }
  async post(path, fields, origin = site) {
    const page = await this.request(path);
    const match = page.html.match(/<form\b[^>]*>([\s\S]*?)<\/form>/i);
    if (!match) throw new CheckError('Expected rendered form is missing.');
    const data = new FormData();
    const unescape = value => value.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
    for (const tag of match[1].matchAll(/<input\b[^>]*>/gi)) {
      const attrs = Object.fromEntries([...tag[0].matchAll(/([\w$:-]+)="([^"]*)"/g)].map(entry => [entry[1], unescape(entry[2])]));
      if (attrs.type === 'hidden' && attrs.name) data.set(attrs.name, attrs.value ?? '');
    }
    if (![...data.keys()].some(key => key.startsWith('$ACTION_'))) throw new CheckError('Native action reference is missing.');
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return this.request(path, { method: 'POST', headers: { origin }, body: data });
  }
  async session() {
    const name = [...this.cookies.keys()].find(key => /^sb-.*-auth-token(?:\.\d+)?$/.test(key))?.replace(/\.\d+$/, '');
    if (!name) return null;
    const raw = await combineChunks(name, part => this.cookies.get(part));
    if (!raw?.startsWith('base64-')) throw new CheckError('Unexpected session encoding.');
    return { name, data: JSON.parse(Buffer.from(raw.slice(7), 'base64url').toString('utf8')) };
  }
  replaceSession(name, data) {
    for (const key of this.cookies.keys()) if (key === name || key.startsWith(name + '.')) this.cookies.delete(key);
    for (const chunk of createChunks(name, 'base64-' + Buffer.from(JSON.stringify(data)).toString('base64url'))) this.cookies.set(chunk.name, chunk.value);
  }
}
async function postForm(browser,form,fields={},origin=site){
  const data=new FormData();
  const decode=value=>value.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  for(const tag of form.markup.matchAll(/<input\b[^>]*>/gi)){
    const attrs=Object.fromEntries([...tag[0].matchAll(/([\w$:-]+)="([^"]*)"/g)].map(entry=>[entry[1],decode(entry[2])]));
    if(attrs.type==='hidden'&&attrs.name)data.set(attrs.name,attrs.value??'');
  }
  if(![...data.keys()].some(name=>name.startsWith('$ACTION_')))throw new CheckError('Native review action reference missing.');
  for(const [name,value] of Object.entries(fields)){data.delete(name);for(const part of Array.isArray(value)?value:[value])data.append(name,part);}
  return browser.request(form.path,{method:'POST',headers:{origin},body:data});
}
async function confirm(account){
  let id;
  for(let n=0;n<20&&!id;n++){
    const listing=await(await fetch(inbox+'/api/v1/messages',{signal:AbortSignal.timeout(5000)})).json();
    id=(listing.messages??[]).find(item=>(item.To??[]).some(to=>to.Address===account.email))?.ID;
    if(!id)await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!id)throw new CheckError('Local confirmation message missing.');
  const mail=await(await fetch(inbox+'/api/v1/message/'+encodeURIComponent(id))).json();
  let hash;
  for(const match of [mail.HTML,mail.Text].filter(Boolean).join(' ').replaceAll('&amp;','&').matchAll(/https?:\/\/[^\s<>"']+/g)){
    const url=new URL(match[0]);if(url.origin===site&&url.pathname==='/auth/confirm'&&url.searchParams.get('type')==='email')hash=url.searchParams.get('token_hash');
  }
  if(!hash)throw new CheckError('Expected application confirmation link missing.');
  const client=createClient(api,key,{auth:{persistSession:false,autoRefreshToken:false}});
  try{const result=await client.auth.verifyOtp({token_hash:hash,type:'email'});assert(!result.error&&result.data.user?.id===account.id,'Fictional account confirms its own email.');}
  finally{await client.auth.signOut({scope:'local'});}
}
async function fixture(label,confirmed=true){
  const suffix=randomUUID().slice(0,8),email='securedesk-access-web-'+label+'-'+suffix+'@securedesk.example.invalid';
  const password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const result=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Access Web Account',phone:'+12025550600',company_name:'Fictional Web Company '+label+' '+suffix,message:'UI review fixture <script>alert("untrusted")</script>',app_role:'super_admin',account_status:'active'}}});
  assert(!result.error&&result.data.user?.id&&result.data.session===null,'Public signup creates a pending fictional account without privileges.');
  const account={id:result.data.user.id,email,password,browser:new Browser(),client};accounts.push(account);
  if(confirmed){await confirm(account);const response=await account.browser.post('/login',{email,password});assert(response.location==='/account','Native sign-in establishes a real browser cookie session.');}
  return account;
}
function profileRole(id,role,status='active'){
  const count=sql('with changed as (update public.profiles set app_role='+q(role)+',account_status='+q(status)+' where id='+q(id)+" and full_name='Fictional Access Web Account' returning id) select count(*)::integer from changed");
  if(count!==1)throw new CheckError('Fixture profile change did not match exactly one new fictional account.');
}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const stateFor=id=>sql('select jsonb_build_object(\'status\',p.account_status,\'role\',p.app_role,\'members\',(select count(*) from public.organization_members m where m.user_id=p.id)) from public.profiles p where id='+q(id));

function extractForm(page,intent,id){
  const match=[...page.html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].find(form=>form[0].includes('data-access="'+intent+'"')&&form[0].includes('data-user="'+id+'"'));
  if(!match)throw new CheckError('Expected '+intent+' access form is missing.');return{markup:match[0],path:page.path};
}
const saved=response=>response.location&&new URL(response.location,site).pathname==='/admin/access'&&new URL(response.location,site).searchParams.get('notice')==='saved';
const accessPage=(browser,account,org=null,extra={})=>browser.request('/admin/access?'+new URLSearchParams({email:account.email,...(org?{company:org}:{}),...extra}));
const fixtureAssignment=(org,id,staff=true)=>sql('select coalesce((select to_jsonb(a) from public.'+(staff?'staff_organization_assignments':'organization_admin_assignments')+' a where a.organization_id='+q(org)+' and '+(staff?'staff_user_id':'admin_user_id')+'='+q(id)+'),\'null\'::jsonb)');
const decision={reason:'Verified fictional account and access decision.',verified:'yes'};
async function run(){
  if(process.argv.slice(2).length!==1||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo to retain five fictional accounts and two companies.');
  const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
  if(env.NEXT_PUBLIC_SUPABASE_URL!==api||env.SITE_URL!==site||!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.DOCKER_HOST)throw new CheckError('Refusing nonlocal application/Docker target.');
  key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const host=JSON.parse(command(docker,['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
  if(!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host)&&host!=='unix:///var/run/docker.sock')throw new CheckError('Expected local Docker context.');
  const labels=JSON.parse(command(docker,['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
  if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw new CheckError('Unexpected local database workspace.');
  adminCount=sql("select count(*)::integer from public.profiles where app_role='super_admin'");
  const anonymous=new Browser();const anon=await anonymous.request('/admin/access');
  assert(anon.location==='/login'&&!anon.html.includes('data-access-target='),'Anonymous access page redirects without account details.');
  assert(anon.headers.get('cache-control')?.includes('no-store'),'Administrative redirect disables shared caching.');
  assert((await anonymous.request('/dashboard')).location==='/login','Anonymous dashboard requires sign-in.');
  stage='fictional cookie sign-ins';
  const reviewer=await fixture('reviewer');adminId=reviewer.id;
  const oa=await fixture('org-admin'),staff=await fixture('staff'),client=await fixture('client'),unconfirmed=await fixture('unconfirmed',false);
  assert((await client.browser.request('/admin/access')).location==='/account','Pending Client cannot view access management.');
  assert(!(await client.browser.request('/account')).html.includes('Manage Access'),'Pending account has no access-management navigation.');
  profileRole(reviewer.id,'super_admin');
  assert((await reviewer.browser.request('/account')).html.includes('Manage Access'),'Trusted Super Admin activation exposes Manage Access navigation.');
  const orgA=randomUUID(),orgB=randomUUID();
  for(const[org,label]of [[orgA,'A'],[orgB,'B']]){
    sql('with inserted as(insert into public.organizations(id,name,description,address,email,phone,status) values('+q(org)+','+q('Fictional Access UI '+label+' '+randomUUID().slice(0,8))+",'Fixture company.','Fixture address','access-ui@securedesk.example.invalid','+12025550703','active') returning id),projects as(insert into public.projects(organization_id,name,description,is_general_support,created_by_user_id) select id,'General Support','Fixture support.',true,"+q(reviewer.id)+' from inserted returning id) select count(*)::integer from projects');
  }
  stage='privileged registration forms';
  let page=await accessPage(reviewer.browser,staff);
  assert(page.status===200&&page.html.includes('Approve Staff or Admin access'),'SA sees privileged approval form for eligible Pending account.');
  assert(page.headers.get('cache-control')?.includes('no-store')&&page.headers.get('referrer-policy')==='no-referrer','Private access page has no-store and no-referrer protection.');
  assert(page.html.includes('&lt;script&gt;alert(')&&!page.html.includes('<script>alert("untrusted")</script>'),'Submitted applicant message is escaped.');
  const approveStaff=extractForm(page,'approve-role',staff.id);
  assert(!(await accessPage(reviewer.browser,unconfirmed)).html.includes('data-access="approve-role"'),'Unconfirmed account has no privileged approval form.');
  const empty=await reviewer.browser.request('/admin/access?email=unknown%40securedesk.example.invalid');
  assert(empty.html.includes('No available account matches')&&!empty.html.includes('data-access-target='),'Unknown email has a useful empty state without other account details.');
  assert(!(await reviewer.browser.request('/admin/access?email=securedesk-access')).html.includes('data-access-target='),'Partial email cannot expose a directory.');
  const forged=await postForm(reviewer.browser,approveStaff,{...decision,new_role:'super_admin'});
  assert(forged.html.includes('Choose an available role.')&&stateFor(staff.id).role==='client','Forged Super Admin role is rejected server-side.');
  const missing=await postForm(reviewer.browser,approveStaff,{reason:decision.reason,new_role:'staff'});
  assert(missing.html.includes('Confirm that you checked')&&stateFor(staff.id).status==='pending','Verification checkbox is enforced by server.');
  const duplicate=await postForm(reviewer.browser,approveStaff,{...decision,new_role:'staff',reason:['one','two']});
  assert(duplicate.html.includes('Enter a business reason')&&stateFor(staff.id).status==='pending','Duplicate reason fields are rejected.');
  const file=await postForm(reviewer.browser,approveStaff,{...decision,new_role:'staff',reason:new Blob(['File cannot be a reason.'])});
  assert(file.html.includes('Enter a business reason')&&stateFor(staff.id).status==='pending','File payload cannot become an audit reason.');
  const long=await postForm(reviewer.browser,approveStaff,{...decision,new_role:'staff',reason:'x'.repeat(2001)});
  assert(long.html.includes('Enter a business reason')&&stateFor(staff.id).status==='pending','Oversized reason is rejected.');
  const copied=await postForm(client.browser,approveStaff,{...decision,new_role:'staff'});
  assert(copied.html.includes('administrator access has changed')&&stateFor(staff.id).status==='pending','Pending Client cannot use copied administrator form.');
  const csrf=await postForm(reviewer.browser,approveStaff,{...decision,new_role:'staff'},'https://foreign.example.invalid');
  assert(csrf.status>=400&&stateFor(staff.id).status==='pending','Cross-origin native form POST is rejected.');
  const approvals=await Promise.all([1,2].map(()=>postForm(reviewer.browser,approveStaff,{...decision,new_role:'staff',actor_id:client.id,account_status:'rejected',next:'https://foreign.example.invalid'})));
  assert(approvals.filter(saved).length===1&&approvals.filter(response=>response.html.includes('access has changed')).length===1,'Two native approval POSTs produce one success and one stale rejection.');
  assert(stateFor(staff.id).role==='staff'&&stateFor(staff.id).status==='active'&&stateFor(staff.id).members===0,'Native privileged approval grants Staff without Client membership.');
  assert(sql("select count(*)::integer from public.audit_logs where target_id="+q(requestFor(staff.id).id)+" and event_type='registration.privileged_approved'")===1,'Concurrent native approval creates one audit event.');
  assert(approvals.find(saved).location.startsWith('/admin/access?'),'Saved decision redirects only to fixed local access page.');
  assert((await staff.browser.request('/admin/access')).location==='/account','Staff cannot enter administrative access page.');
  page=await accessPage(reviewer.browser,oa);assert(saved(await postForm(reviewer.browser,extractForm(page,'approve-role',oa.id),{...decision,new_role:'admin'})),'SA approves Admin through native form.');
  const noScope=await accessPage(oa.browser,staff);
  assert(noScope.html.includes('Choose one of your assigned companies')&&!noScope.html.includes('data-access-target='),'OA must choose an assigned company before lookup.');
  page=await accessPage(reviewer.browser,oa,orgA);const adminGrant=extractForm(page,'admin-grant',oa.id);
  assert(saved(await postForm(reviewer.browser,adminGrant,decision)),'SA gives Admin company scope through native form.');
  assert(!(await accessPage(oa.browser,staff,orgB)).html.includes('data-access-target='),'OA cannot read target or options for company B.');
  assert(!(await accessPage(oa.browser,client,orgA)).html.includes('data-access-target='),'OA assignment lookup does not expose Pending Client.');
  assert(!(await accessPage(oa.browser,staff,orgA)).html.includes('data-access="role"')&&!(await accessPage(oa.browser,staff,orgA)).html.includes('data-access="admin-grant"'),'OA sees no global role/Admin assignment forms.');
  assert((await postForm(oa.browser,adminGrant,decision)).html.includes('Only a Super Admin'),'OA cannot post a copied Admin grant form.');
  stage='Staff assignments and permissions';
  page=await accessPage(oa.browser,staff,orgA);const firstGrant=extractForm(page,'staff-grant',staff.id);
  const badContext=await postForm(oa.browser,firstGrant,{...decision,can_create_project:'no',organization_id:orgB});
  assert(badContext.html.includes('access has changed')&&fixtureAssignment(orgB,staff.id)===null,'Tampered cross-company hidden UUID is rejected.');
  const foreignId=await postForm(oa.browser,firstGrant,{...decision,can_create_project:'no',user_id:client.id});
  assert(foreignId.html.includes('access has changed'),'Hidden target UUID must match current exact-email lookup.');
  assert(saved(await postForm(oa.browser,firstGrant,{...decision,can_create_project:'no',app_role:'super_admin',assigned_by:client.id})),'OA assigns existing Staff through native form.');
  assert(fixtureAssignment(orgA,staff.id).active&&!fixtureAssignment(orgA,staff.id).can_create_project,'Staff assignment defaults to no project creation permission.');
  page=await accessPage(reviewer.browser,staff,orgB);
  assert(saved(await postForm(reviewer.browser,extractForm(page,'staff-grant',staff.id),{...decision,can_create_project:'no'})),'SA assigns same Staff to company B.');
  page=await accessPage(oa.browser,staff,orgA);assert(!page.html.includes(orgB),'OA target page omits other-company assignment UUID.');
  const permission=extractForm(page,'staff-grant',staff.id);
  const invalidPermission=await postForm(oa.browser,permission,{...decision,can_create_project:['yes','no']});
  assert(invalidPermission.html.includes('Choose whether this Staff account')&&!fixtureAssignment(orgA,staff.id).can_create_project,'Duplicate project permission fields are rejected.');
  assert(saved(await postForm(oa.browser,permission,{...decision,can_create_project:'yes'})),'OA grants explicit project creation permission.');
  assert(fixtureAssignment(orgA,staff.id).can_create_project,'Project permission is stored only in company A assignment.');
  assert((await postForm(oa.browser,permission,{...decision,can_create_project:'no'})).html.includes('access has changed'),'Old permission form cannot overwrite newer decision.');
  page=await accessPage(oa.browser,staff,orgA);const revokeStaff=extractForm(page,'staff-revoke',staff.id);
  assert(saved(await postForm(oa.browser,revokeStaff,{...decision,can_create_project:'yes',active:'true'})),'Native Staff revoke ignores forged active/project permission parameters.');
  assert(!fixtureAssignment(orgA,staff.id).active&&!fixtureAssignment(orgA,staff.id).can_create_project&&fixtureAssignment(orgB,staff.id).active,'Staff revoke clears A permission and preserves B assignment.');
  assert((await postForm(oa.browser,firstGrant,{...decision,can_create_project:'yes'})).html.includes('access has changed'),'Pre-assignment form cannot recreate access after revocation.');
  page=await accessPage(oa.browser,staff,orgA);
  assert(saved(await postForm(oa.browser,extractForm(page,'staff-grant',staff.id),{...decision,can_create_project:'no'})),'Fresh explicit form can regrant Staff access.');
  const copiedStaff=extractForm(await accessPage(oa.browser,staff,orgA),'staff-grant',staff.id);
  assert((await postForm(staff.browser,copiedStaff,{...decision,can_create_project:'yes'})).html.includes('administrator access has changed'),'Staff cannot post copied assignment form.');
  stage='OA scope revocation';
  page=await accessPage(reviewer.browser,oa,orgA);
  assert(saved(await postForm(reviewer.browser,extractForm(page,'admin-revoke',oa.id),decision)),'SA revokes OA company scope through native form.');
  assert(!(await accessPage(oa.browser,staff,orgA)).html.includes('data-access-target='),'Existing OA cookie session loses company target immediately.');
  assert((await postForm(oa.browser,copiedStaff,{...decision,can_create_project:'yes'})).html.includes('access has changed'),'Revoked OA cannot submit earlier valid Staff form.');
  page=await accessPage(reviewer.browser,oa,orgA);
  assert(saved(await postForm(reviewer.browser,extractForm(page,'admin-grant',oa.id),decision)),'SA can regrant OA with current assignment revision.');
  stage='global role transitions';
  page=await accessPage(reviewer.browser,staff,orgA);const oldRole=extractForm(page,'role',staff.id),oldStaff=extractForm(page,'staff-grant',staff.id);
  assert(saved(await postForm(reviewer.browser,oldRole,{...decision,new_role:'admin'})),'SA changes Staff to Admin through native form.');
  assert(!fixtureAssignment(orgA,staff.id).active&&!fixtureAssignment(orgB,staff.id).active,'Native role change revokes all old Staff company assignments.');
  page=await accessPage(reviewer.browser,staff);
  assert(saved(await postForm(reviewer.browser,extractForm(page,'role',staff.id),{...decision,new_role:'staff'})),'SA restores Staff role without restoring assignments.');
  assert((await postForm(reviewer.browser,oldRole,{...decision,new_role:'admin'})).html.includes('access has changed'),'Old global role form stays invalid after Staff/Admin/Staff cycle.');
  assert((await postForm(reviewer.browser,oldStaff,{...decision,can_create_project:'yes'})).html.includes('access has changed'),'Old Staff form stays invalid after global role cycle.');
  for(const account of [staff,oa]){page=await accessPage(reviewer.browser,account);assert(saved(await postForm(reviewer.browser,extractForm(page,'role',account.id),{...decision,new_role:'client'})),'SA demotes fictional privileged account through native form.');}
  assert((await oa.browser.request('/admin/access')).location==='/account','Demoted Admin cookie session loses administrative page access.');
  assert(!(await oa.browser.request('/account')).html.includes('Manage Access'),'Demoted Admin loses administrative navigation.');
  assert(!(await accessPage(reviewer.browser,reviewer)).html.includes('data-access="role"'),'Super Admin cannot change their own role in UI.');
  assert((await accessPage(reviewer.browser,client,orgA,{company:'invalid'})).html.includes('selected company is unavailable'),'Invalid company selection has a clear recovery state.');
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
  try{
    if(accounts.length){const ids=accounts.map(account=>q(account.id)).join(',');sql('with s as(update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ('+ids+') and (active or can_create_project) returning id),a as(update public.organization_admin_assignments set active=false where admin_user_id in ('+ids+') and active returning id),p as(update public.profiles set app_role=\'client\' where id in ('+ids+') returning id) select jsonb_build_object(\'profiles\',(select count(*) from p))');if(adminId)profileRole(adminId,'client','pending');}
  }catch{failed=true;console.error('FAIL: Fixture role cleanup needs attention.');}
  for(const account of accounts){try{const session=await account.browser.session();if(session){const client=createClient(api,key,{auth:{persistSession:false,autoRefreshToken:false}});const restored=await client.auth.setSession(session.data);if(restored.error)throw new CheckError('Fixture session restore failed.');if((await client.auth.signOut({scope:'local'})).error)throw new CheckError('Fixture signout failed.');}account.browser.cookies.clear();}catch{failed=true;console.error('FAIL: Fixture session cleanup needs attention.');}}
  try{if(adminCount!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Persistent Super Admin count is unchanged after fixture cleanup.');if(accounts.length)assert(sql('select count(*)::integer from auth.sessions where user_id in ('+accounts.map(account=>q(account.id)).join(',')+')')===0,'All new browser/confirmation fixture sessions are closed.');}catch{failed=true;console.error('FAIL: Final fixture guard failed.');}
}
console.log('Access management web: '+checks+' checks'+(failed?' / FAILED.':' / PASS.'));if(failed)process.exitCode=1;
