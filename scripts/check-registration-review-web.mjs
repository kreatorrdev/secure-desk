import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createChunks, combineChunks } from '@supabase/ssr';

// Native Next.js form POSTs and cookie sessions. No actual user's credentials or requests.
// Explicit --create-demo retains four fictional accounts, two companies and decision history.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const site='http://127.0.0.1:3000',api='http://127.0.0.1:54321',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
let checks=0,stage='setup',key,adminCount,adminId,orgAdminId,fixtureOrgId;
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
function extractForm(page,intent,id){
  const html=page.html;
  const form=[...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].find(match=>match[0].includes('data-review="'+intent+'"')&&match[0].includes('data-request="'+id+'"'));
  if(!form)throw new CheckError('Expected '+intent+' review form is missing.');
  return { markup: form[0], path: page.path };
}
async function requestPage(browser,id){
  for(let n=1;n<=10001;n++){
    const page=await browser.request('/admin/requests?page='+n);
    if(page.html.includes('data-request-card="'+id+'"'))return page;
    if(!page.html.includes('Next page'))break;
  }
  throw new CheckError('Fictional request not present in accessible queue pages.');
}
async function postForm(browser,form,fields={},origin=site){
  const data=new FormData();
  const decode=value=>value.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  for(const tag of form.markup.matchAll(/<input\b[^>]*>/gi)){
    const attrs=Object.fromEntries([...tag[0].matchAll(/([\w$:-]+)="([^"]*)"/g)].map(entry=>[entry[1],decode(entry[2])]));
    if(attrs.type==='hidden'&&attrs.name)data.set(attrs.name,attrs.value??'');
  }
  if(![...data.keys()].some(name=>name.startsWith('$ACTION_')))throw new CheckError('Native review action reference missing.');
  for(const [name,value] of Object.entries(fields))data.set(name,value);
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
  const suffix=randomUUID().slice(0,8),email='securedesk-review-web-'+label+'-'+suffix+'@securedesk.example.invalid';
  const password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const result=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Web Review Account',phone:'+12025550600',company_name:'Fictional Web Company '+label+' '+suffix,message:'UI review fixture <script>alert("untrusted")</script>',app_role:'super_admin',account_status:'active'}}});
  assert(!result.error&&result.data.user?.id&&result.data.session===null,'Public signup creates a pending fictional account without privileges.');
  const account={id:result.data.user.id,email,password,browser:new Browser(),client};accounts.push(account);
  if(confirmed){await confirm(account);const response=await account.browser.post('/login',{email,password});assert(response.location==='/account','Native sign-in establishes a real browser cookie session.');}
  return account;
}
function profileRole(id,role,status='active'){
  const count=sql('with changed as (update public.profiles set app_role='+q(role)+',account_status='+q(status)+' where id='+q(id)+" and full_name='Fictional Web Review Account' returning id) select count(*)::integer from changed");
  if(count!==1)throw new CheckError('Fixture profile change did not match exactly one new fictional account.');
}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const stateFor=id=>sql('select jsonb_build_object(\'status\',p.account_status,\'role\',p.app_role,\'members\',(select count(*) from public.organization_members m where m.user_id=p.id)) from public.profiles p where id='+q(id));
function assignment(org,id,active){
  if(active){sql('with changed as (insert into public.organization_admin_assignments(organization_id,admin_user_id,assigned_by) values('+q(org)+','+q(id)+','+q(adminId)+') returning id) select count(*)::integer from changed');}
  else{sql('with changed as (update public.organization_admin_assignments set active=false where organization_id='+q(org)+' and admin_user_id='+q(id)+' returning id) select count(*)::integer from changed');}
}
async function run(){
  if(process.argv.slice(2).length!==1||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo to retain four fictional accounts and their review history.');
  const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
  if(env.NEXT_PUBLIC_SUPABASE_URL!==api||env.SITE_URL!==site||!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)throw new CheckError('Refusing a nonlocal application target.');
  key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(process.env.DOCKER_HOST)throw new CheckError('Refusing Docker host override.');
  const host=JSON.parse(command(docker,['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
  if(!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host)&&host!=='unix:///var/run/docker.sock')throw new CheckError('Expected local Docker context.');
  const labels=JSON.parse(command(docker,['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
  if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw new CheckError('Unexpected local database workspace.');
  adminCount=sql("select count(*)::integer from public.profiles where app_role='super_admin'");
  const anonymous=new Browser();
  const anon=await anonymous.request('/admin/requests');
  assert(anon.location==='/login'&&!anon.html.includes('data-request-card='),'Anonymous review GET redirects without request data.');
  assert(anon.headers.get('cache-control')?.includes('no-store'),'Administrative redirects disable shared caching.');
  assert((await anonymous.request('/dashboard')).location==='/login','Anonymous dashboard requires sign-in.');

  stage='fixture sign-ins';
  const reviewer=await fixture('reviewer');adminId=reviewer.id;
  const oa=await fixture('org-admin');orgAdminId=oa.id;
  const applicant=await fixture('applicant');
  const second=await fixture('second',false);
  const pendingPage=await applicant.browser.request('/admin/requests');
  assert(pendingPage.location==='/account'&&!pendingPage.html.includes('data-request-card='),'Pending Client cannot view admin requests.');
  assert(!(await applicant.browser.request('/account')).html.includes('Open Pending Requests'),'Pending account has no administrator navigation.');
  profileRole(reviewer.id,'super_admin');profileRole(oa.id,'admin');
  assert((await reviewer.browser.request('/account')).html.includes('Open Pending Requests'),'Existing cookie session receives navigation only after trusted role activation.');
  let page=await reviewer.browser.request('/admin/requests');
  assert(page.status===200&&page.html.includes('Super Admin')&&page.html.includes('data-review="approve-new"'),'Super Admin review screen renders bounded decision forms.');
  assert(page.headers.get('cache-control')?.includes('no-store')&&page.headers.get('referrer-policy')==='no-referrer','Review data is not cacheable and suppresses referrer disclosure.');
  assert(page.html.includes('&lt;script&gt;alert(')&&!page.html.includes('<script>alert("untrusted")</script>'),'Applicant text is escaped rather than executable markup.');
  const request=requestFor(applicant.id),request2=requestFor(second.id);
  page=await requestPage(reviewer.browser,request.id);
  const secondPage=await requestPage(reviewer.browser,request2.id);
  const rejectForm=extractForm(page,'reject',request.id);
  const secondReject=extractForm(secondPage,'reject',request2.id);
  const withoutConfirm=secondPage.html.match(new RegExp('<article[^>]*data-request-card="'+request2.id+'"[\\s\\S]*?<\\/article>'))?.[0];
  assert(withoutConfirm?.includes('Awaiting confirmation')&&!withoutConfirm.includes('data-review="approve-new"'),'Unconfirmed applicant has rejection/routing controls but no approval form.');
  const unsigned=await postForm(anonymous,rejectForm,{reason:'Forged anonymous decision'});
  assert(unsigned.location==='/login'||unsigned.html.includes('active administrator account'),'Copied form cannot authorize an anonymous POST.');
  const self=await postForm(applicant.browser,rejectForm,{reason:'Forged client decision',app_role:'super_admin',actor_user_id:reviewer.id});
  assert(self.location==='/account'||self.html.includes('active administrator account'),'Copied form plus forged role fields cannot authorize a Client.');
  assert(requestFor(applicant.id).status==='pending','Unauthorized POSTs leave request unchanged.');
  const foreign=await postForm(reviewer.browser,rejectForm,{reason:'Wrong origin'},'https://foreign.example.invalid');
  assert([403,500].includes(foreign.status)&&requestFor(applicant.id).status==='pending','Foreign-Origin action POST is rejected before changing data.');
  const invalid=await postForm(reviewer.browser,rejectForm,{request_id:'invalid',reason:'Bad ID'});
  assert(invalid.html.includes('review form is invalid')&&requestFor(applicant.id).status==='pending','Server validates request UUID independently of HTML.');
  const badReason=await postForm(reviewer.browser,rejectForm,{reason:'  '});
  assert(badReason.html.includes('Enter a reason of 1 to 2000 characters')&&requestFor(applicant.id).status==='pending','Native form POST cannot bypass mandatory rejection reason.');
  const longReason=await postForm(reviewer.browser,rejectForm,{reason:'x'.repeat(2001)});
  assert(longReason.html.includes('Enter a reason of 1 to 2000 characters')&&requestFor(applicant.id).status==='pending','Server rejects oversized rejection reason.');
  const rejected=await postForm(reviewer.browser,rejectForm,{reason:'Please verify the fictional company address.'});
  assert(rejected.location==='/admin/requests?notice=rejected','Successful rejection uses fixed redirect destination.');
  assert(stateFor(applicant.id).status==='rejected'&&requestFor(applicant.id).reviewed_by===reviewer.id,'Actual cookie identity records reviewer and rejected profile atomically.');
  assert((await applicant.browser.request('/account')).html.includes('Please verify the fictional company address.'),'Rejected applicant sees the saved reason in its own account.');
  const history=await reviewer.browser.request('/admin/requests?view=reviewed');
  assert(history.html.includes(applicant.email)&&history.html.includes('Please verify the fictional company address.'),'Decision history displays the reviewed request and reason.');
  assert(!(await reviewer.browser.request('/admin/requests')).html.includes(applicant.email),'Reviewed request leaves pending queue.');
  const repeatReject=await postForm(reviewer.browser,rejectForm,{reason:'Rewrite history'});
  assert(repeatReject.html.includes('request is unavailable')&&requestFor(applicant.id).rejection_reason==='Please verify the fictional company address.','Stale decision form cannot rewrite completed request.');

  stage='new-company approval';
  const session=await applicant.browser.session();
  await applicant.client.auth.setSession({access_token:session.data.access_token,refresh_token:session.data.refresh_token});
  const retry=await applicant.client.rpc('resubmit_registration',{p_company_name:'Fictional UI Approved Company '+applicant.id.slice(0,8),p_phone:'+12025550601',p_message:'Corrected fictional company details.'});
  assert(!retry.error&&requestFor(applicant.id).attempt_number===2,'Existing tested retry RPC supplies a new pending attempt on the same account.');
  const next=requestFor(applicant.id);page=await requestPage(reviewer.browser,next.id);
  const approveNew=extractForm(page,'approve-new',next.id);
  const company={name:'Fictional UI Approved Company '+applicant.id.slice(0,8),address:'101 Example Street, Fictional City',email:'fictional-company@securedesk.example.invalid',phone:'+12025550601',description:'Company created by the local web review demonstration.'};
  const badCompany=await postForm(reviewer.browser,approveNew,{...company,address:'',email:'invalid',verified:'yes'});
  assert(badCompany.html.includes('Enter a valid company email address')&&stateFor(applicant.id).status==='pending','Native form validates verified company fields before approval.');
  const noVerification=await postForm(reviewer.browser,approveNew,company);
  assert(noVerification.html.includes('Confirm that you checked')&&stateFor(applicant.id).status==='pending','Server requires explicit reviewed-details confirmation.');
  const approved=await postForm(reviewer.browser,approveNew,{...company,verified:'yes',app_role:'super_admin',account_status:'active',actor_user_id:second.id,next:'https://foreign.example.invalid'});
  assert(approved.location==='/admin/requests?notice=approved','Approval redirects only to the local review screen.');
  const completed=requestFor(applicant.id),home=completed.target_organization_id;
  assert(stateFor(applicant.id).status==='active'&&stateFor(applicant.id).role==='client'&&stateFor(applicant.id).members===1,'Form approval grants one membership and leaves applicant role Client.');
  assert(completed.reviewed_by===reviewer.id&&completed.status==='approved','Forged actor fields cannot change decision attribution.');
  assert(sql('select count(*)::integer from public.projects where organization_id='+q(home)+" and is_general_support and status='active'")===1,'Approval creates exactly one active General Support project.');
  const repeated=await postForm(reviewer.browser,approveNew,{...company,verified:'yes'});
  assert(repeated.html.includes('request is unavailable')&&stateFor(applicant.id).members===1,'Repeated native approval POST cannot create a duplicate membership.');
  assert(!(await applicant.browser.request('/account')).html.includes('Open Pending Requests')&&(await applicant.browser.request('/admin/requests')).location==='/account','Approved Client remains outside administrator navigation and route.');

  stage='organization-admin scope and stale permissions';
  fixtureOrgId=randomUUID();
  sql('with created as (insert into public.organizations(id,name,description,address,email,phone,status) values('+q(fixtureOrgId)+",'Fictional UI Pending Company','Pending company for assignment isolation','202 Example Street','pending-company@securedesk.example.invalid','+12025550602','pending') returning id) select count(*)::integer from created");
  page=await requestPage(reviewer.browser,request2.id);
  const route=extractForm(page,'route',request2.id);
  const routed=await postForm(reviewer.browser,route,{organization_id:fixtureOrgId});
  assert(routed.location==='/admin/requests?notice=routed'&&requestFor(second.id).target_organization_id===fixtureOrgId&&stateFor(second.id).members===0,'Routing changes review scope without approving membership.');
  const empty=await oa.browser.request('/admin/requests');
  assert(empty.html.includes('No pending requests in your scope')&&!empty.html.includes(second.email),'Unassigned Organization Admin sees neither foreign nor unrouted requests.');
  const foreignDecision=await postForm(oa.browser,secondReject,{reason:'Out of scope'});
  assert(foreignDecision.html.includes('request is unavailable')&&requestFor(second.id).status==='pending','Copied valid request UUID cannot bypass tenant scope on POST.');
  const fakeNew=await postForm(oa.browser,approveNew,{request_id:request2.id,...company,verified:'yes'});
  assert(fakeNew.html.includes('Only a Super Admin')&&requestFor(second.id).status==='pending','Organization Admin cannot invoke copied new-company action.');
  assignment(fixtureOrgId,oa.id,true);
  const pendingScope=await oa.browser.request('/admin/requests');
  assert(pendingScope.html.includes(second.email)&&pendingScope.html.includes('Stored company details')&&pendingScope.html.includes('202 Example Street'),'Explicit pending-company assignment allows scoped review and company verification.');
  assert(!pendingScope.html.includes('data-review="route"')&&!pendingScope.html.includes('data-review="approve-new"'),'Organization Admin UI contains no global routing or new-company controls.');
  const assignedReject=extractForm(pendingScope,'reject',request2.id);
  assignment(fixtureOrgId,oa.id,false);
  const revoked=await postForm(oa.browser,assignedReject,{reason:'Stale assignment'});
  assert(revoked.html.includes('request is unavailable')&&requestFor(second.id).status==='pending','Old rendered form loses authority immediately after assignment revocation.');
  assert(!(await oa.browser.request('/admin/requests')).html.includes(second.email),'Same cookie session loses queue visibility after assignment revocation.');
  // Confirm only now, proving the original unconfirmed request remains pending throughout.
  await confirm(second);const secondLogin=await second.browser.post('/login',{email:second.email,password:second.password});assert(secondLogin.location==='/account','Second applicant signs in after confirmation.');
  assignment(home,oa.id,true);
  const routeHome=await postForm(reviewer.browser,route,{organization_id:home});assert(routeHome.location==='/admin/requests?notice=routed','Super Admin routes confirmed applicant to an existing active company.');
  const own=await oa.browser.request('/admin/requests');
  const approveExisting=extractForm(own,'approve',request2.id);
  const wrongOrg=await postForm(oa.browser,approveExisting,{organization_id:fixtureOrgId,verified:'yes'});
  assert(wrongOrg.html.includes('request is unavailable')&&stateFor(second.id).members===0,'Tampered company UUID cannot replace the trusted request route.');
  const approvedExisting=await postForm(oa.browser,approveExisting,{verified:'yes'});
  assert(approvedExisting.location==='/admin/requests?notice=approved'&&stateFor(second.id).members===1&&requestFor(second.id).reviewed_by===oa.id,'Assigned Organization Admin approves existing-company Client through the native form.');
  assert(sql('select count(*)::integer from public.projects where organization_id='+q(home)+' and is_general_support')===1,'Existing-company approval reuses the unique General Support project.');
  const scopedHistory=await oa.browser.request('/admin/requests?view=reviewed');assert(scopedHistory.html.includes(second.email)&&!scopedHistory.html.includes('Please verify the fictional company address.'),'Scoped history includes tenant decisions and excludes prior unrouted rejection.');
  profileRole(reviewer.id,'client','pending');
  const demoted=await postForm(reviewer.browser,secondReject,{reason:'Stale admin role'});
  assert(demoted.location==='/account'||demoted.html.includes('active administrator account'),'Old administrator form fails after stored role revocation in the same session.');
  assert((await reviewer.browser.request('/admin/requests')).location==='/account','Demoted reviewer loses protected page immediately.');
  profileRole(oa.id,'staff');
  assert((await oa.browser.request('/admin/requests')).location==='/account','Active Staff cannot view administrator route with an existing cookie.');
  await restoreRoles();
  assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Original persistent Super Admin count restored.');
  console.log('Local review web checks: '+checks+' passed. Four fictional accounts and two companies retained.');
  console.log('Temporary reviewer/admin roles restored; fixture assignments inactive; no credentials printed.');
}

async function restoreRoles(){
  if(orgAdminId){sql('with changed as (update public.organization_admin_assignments set active=false where admin_user_id='+q(orgAdminId)+' returning id) select count(*)::integer from changed');profileRole(orgAdminId,'client','pending');}
  if(adminId)profileRole(adminId,'client','pending');
}
try{await run();}catch(error){console.error('FAIL during '+stage+': '+(error instanceof CheckError?error.message:'Local web verification failed; private details withheld.'));process.exitCode=1;}
finally{
  try{await restoreRoles();}catch{console.error('Fictional role cleanup needs inspection.');process.exitCode=1;}
  for(const account of accounts){
    try{
      const session=await account.browser.session();
      if(session){await account.client.auth.setSession({access_token:session.data.access_token,refresh_token:session.data.refresh_token});const out=await account.client.auth.signOut({scope:'local'});if(out.error)process.exitCode=1;}
    }catch{console.error('Fictional session cleanup needs inspection.');process.exitCode=1;}
  }
}
