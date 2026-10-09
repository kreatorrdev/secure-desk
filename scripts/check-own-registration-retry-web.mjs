import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync,writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createChunks, combineChunks } from '@supabase/ssr';

// Actual own-account native form/cookie test. Two fictional accounts and history are retained.
// No actual user's requests, roles, cookies or credentials are accessed or changed.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const site='http://127.0.0.1:3000',api='http://127.0.0.1:54321',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const q=value=>"'"+value.replaceAll("'","''")+"'";
let checks=0,stage='setup',key,reviewerId,originalAdmins;
const accounts=[];
function assert(condition,label){if(!condition)throw new CheckError(label);checks++;console.log('PASS: '+label);}
function command(exe,args){const r=spawnSync(exe,args,{cwd:root,env:process.env,encoding:'utf8',timeout:30000});if(r.error||r.status!==0)throw new CheckError('Local fixture check failed; private output withheld.');return r.stdout;}
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
}function extractForm(page,intent,id){
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
}async function confirm(account){
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
  const suffix=randomUUID().slice(0,8),email='securedesk-retry-web-'+label+'-'+suffix+'@securedesk.example.invalid';
  const password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const result=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Retry Web Account',phone:'+12025550600',company_name:'Fictional Web Company '+label+' '+suffix,message:'UI review fixture <script>alert("untrusted")</script>',app_role:'super_admin',account_status:'active'}}});
  assert(!result.error&&result.data.user?.id&&result.data.session===null,'Public signup creates a pending fictional account without privileges.');
  const account={id:result.data.user.id,email,password,browser:new Browser(),client};accounts.push(account);
  if(confirmed){await confirm(account);const response=await account.browser.post('/login',{email,password});assert(response.location==='/account','Native sign-in establishes a real browser cookie session.');}
  return account;
}
function profileRole(id,role,status='active'){
  const count=sql('with changed as (update public.profiles set app_role='+q(role)+',account_status='+q(status)+' where id='+q(id)+" and full_name='Fictional Retry Web Account' returning id) select count(*)::integer from changed");
  if(count!==1)throw new CheckError('Fixture profile change did not match exactly one new fictional account.');
}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const stateFor=id=>sql('select jsonb_build_object(\'status\',p.account_status,\'role\',p.app_role,\'members\',(select count(*) from public.organization_members m where m.user_id=p.id)) from public.profiles p where id='+q(id));
function retryForm(page){
  const match=[...page.html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].find(row=>row[0].includes('data-registration-retry="true"'));
  if(!match)throw new CheckError('Own retry form missing.');
  return{markup:match[0],path:page.path};
}
async function retryPost(browser,form,fields={},duplicates={},origin=site){
  const decode=value=>value.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  const data=new FormData();
  for(const tag of form.markup.matchAll(/<input\b[^>]*>/gi)){
    const attrs=Object.fromEntries([...tag[0].matchAll(/([\w$:-]+)="([^"]*)"/g)].map(row=>[row[1],decode(row[2])]));
    if(attrs.type==='hidden'&&attrs.name)data.set(attrs.name,attrs.value??'');
  }
  for(const [name,value] of Object.entries(fields))data.set(name,value);
  for(const [name,value] of Object.entries(duplicates))data.append(name,value);
  return browser.request(form.path,{method:'POST',headers:{origin},body:data});
}
async function savePreview(page,file){
  // Inert HTML/CSS of this fictional account only, for visual QA. No scripts/forms/session cookies.
  let html=page.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<form\b([^>]*)>/gi,'<div$1>').replace(/<\/form>/gi,'</div>');
  const styles=[];
  for(const link of html.matchAll(/<link\b[^>]*>/gi)){
    const attrs=Object.fromEntries([...link[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(row=>[row[1],row[2]]));
    if(attrs.rel==='stylesheet'&&attrs.href?.startsWith('/_next/static/'))styles.push(await(await fetch(new URL(attrs.href,site))).text());
  }
  html=html.replace(/<link\b[^>]*>/gi,'').replace('</head>','<style>'+styles.join('\n')+'</style></head>');
  html=html.replace(/<title>[^<]*<\/title>/,'<title>SecureDesk fictional account — static visual check</title>');
  writeFileSync(new URL('../.tools/verification/'+file,import.meta.url),html);
}
async function reject(browser,id,reason){const page=await requestPage(browser,id);const result=await postForm(browser,extractForm(page,'reject',id),{reason});assert(result.location==='/admin/requests?notice=rejected','Reviewer uses the native admin form to reject the fictional request.');}
async function run(){
  if(process.argv.slice(2).length!==1||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo to retain two new fictional accounts and their decision history.');
  const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
  if(env.NEXT_PUBLIC_SUPABASE_URL!==api||env.SITE_URL!==site||!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)throw new CheckError('Refusing a nonlocal application target.');
  key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(process.env.DOCKER_HOST)throw new CheckError('Refusing Docker host override.');
  const host=JSON.parse(command(docker,['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
  if(!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host)&&host!=='unix:///var/run/docker.sock')throw new CheckError('Expected local Docker context.');
  const labels=JSON.parse(command(docker,['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
  if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw new CheckError('Unexpected local database workspace.');
  originalAdmins=sql("select count(*)::integer from public.profiles where app_role='super_admin'");
  const anonymous=new Browser();assert((await anonymous.request('/account')).location==='/login','Anonymous account page still requires sign-in.');
  stage='fictional sign-ins';
  const reviewer=await fixture('reviewer');reviewerId=reviewer.id;
  const client=await fixture('applicant');
  const noRetry=await client.browser.request('/account');
  assert(!noRetry.html.includes('data-registration-retry="true"'),'Pending Client has status and no retry form.');
  profileRole(reviewer.id,'super_admin');
  const organization=sql("select to_json(id) from public.organizations where status='active' and name like 'Fictional%' order by created_at,id limit 1");
  if(!organization)throw new CheckError('Expected an existing fictional active company from prior local review tests.');
  const first=requestFor(client.id);
  const page=await requestPage(reviewer.browser,first.id);
  const route=await postForm(reviewer.browser,extractForm(page,'route',first.id),{organization_id:organization});assert(route.location==='/admin/requests?notice=routed','First request receives a trusted fixture company route.');
  await reject(reviewer.browser,first.id,'Please correct your fictional contact phone.');
  let own=await client.browser.request('/account');
  assert(own.html.includes('Submit a new access request')&&own.html.includes('Please correct your fictional contact phone.'),'Own rejected account displays reason and new request form.');
  assert(own.html.includes('name="company_name"')&&own.html.includes('value="'+first.company_name_text+'"')&&own.html.includes(first.message.replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')),'Form is prefilled from own immutable submitted snapshot.');
  assert(own.headers.get('cache-control')?.includes('no-store'),'Own retry fields and history disable shared caching.');
  assert(!own.html.includes(reviewer.email)&&!own.html.includes('type="password"'),'Retry page exposes own details and requests no password.');
  await savePreview(own,'own-retry-rejected-preview.html');
  stage='native validation and concurrent retry';
  const oldForm=retryForm(own),corrected={company_name:'Corrected Fictional Company',phone:'+12025550677',message:'Corrected details for the administrator.'};
  const foreignOrigin=await retryPost(client.browser,oldForm,corrected,{},'https://foreign.example.invalid');
  assert([403,500].includes(foreignOrigin.status)&&requestFor(client.id).id===first.id,'Foreign-Origin retry POST cannot change own request.');
  const anonPost=await retryPost(anonymous,oldForm,corrected);assert(anonPost.location==='/login','Copied retry form cannot submit without verified login.');
  const foreignUser=await retryPost(reviewer.browser,oldForm,corrected);assert(foreignUser.location==='/account?notice=retry-unavailable','Copied form cannot submit for another identity, including Super Admin.');
  const mismatch=await retryPost(client.browser,oldForm,{...corrected,expected_request_id:requestFor(reviewer.id).id});assert(mismatch.location==='/account?notice=retry-unavailable'&&requestFor(client.id).id===first.id,'Foreign expected request UUID cannot redirect retry to another user.');
  for(const [fields,label] of [[{...corrected,company_name:'  '},'Blank company'],[{...corrected,phone:'x'.repeat(41)},'Oversized phone'],[{...corrected,message:'x'.repeat(4001)},'Oversized message']]){
    const result=await retryPost(client.browser,oldForm,fields);assert(result.html.includes('Check the highlighted fields')&&requestFor(client.id).id===first.id,label+' fails server validation without new attempt.');
  }
  const fileValue=await retryPost(client.browser,oldForm,{...corrected,phone:new File(['fake'],'phone.txt')});assert(fileValue.html.includes('Contact phone is required')&&requestFor(client.id).id===first.id,'File payload cannot replace required text field.');
  const duplicate=await retryPost(client.browser,oldForm,corrected,{company_name:'Different second value'});assert(duplicate.html.includes('Company name is required')&&requestFor(client.id).id===first.id,'Duplicate text fields are rejected rather than ambiguously parsed.');
  const auditBefore=sql('select count(*)::integer from public.audit_logs where actor_user_id='+q(client.id)+" and event_type='registration.resubmitted'");
  const concurrent=await Promise.all([retryPost(client.browser,oldForm,corrected),retryPost(client.browser,oldForm,corrected)]);
  assert(concurrent.filter(result=>result.location==='/account?notice=resubmitted').length===1&&concurrent.filter(result=>result.location==='/account?notice=retry-unavailable').length===1,'Two simultaneous native form POSTs produce one success and one stale-form response.');
  const second=requestFor(client.id);
  assert(second.attempt_number===2&&second.id!==first.id&&second.status==='pending'&&second.target_organization_id===null&&second.reviewed_by===null,'Retry creates a new UUID/attempt, pending and unrouted.');
  assert(stateFor(client.id).role==='client'&&stateFor(client.id).status==='pending'&&stateFor(client.id).members===0,'Retry keeps Client role and grants no membership.');
  assert(sql('select count(*)::integer from public.audit_logs where actor_user_id='+q(client.id)+" and event_type='registration.resubmitted'")===auditBefore+1,'Concurrent retry creates exactly one audit with own actor.');
  own=await client.browser.request('/account?notice=resubmitted');
  assert(own.html.includes('Your new request has been submitted')&&own.html.replace(/<!--[\s\S]*?-->/g,'').includes('Request #2')&&!own.html.includes('data-registration-retry="true"'),'Success reload shows pending state and removes retry form.');
  assert(own.html.includes('Previous decisions')&&own.html.includes('Please correct your fictional contact phone.'),'Earlier rejection remains visible in own decision history.');
  await savePreview(own,'own-retry-pending-preview.html');
  const saved=sql('select to_jsonb(r) from public.registration_requests r where id='+q(first.id));
  assert(saved.company_name_text===first.company_name_text&&saved.phone===first.phone&&saved.message===first.message&&saved.status==='rejected'&&saved.target_organization_id===organization,'Previous content, rejection and original company route remain immutable.');
  const replay=await retryPost(client.browser,oldForm,corrected);assert(replay.location==='/account?notice=retry-unavailable'&&requestFor(client.id).attempt_number===2,'Replayed old form cannot add another pending attempt.');
  stage='later rejection and stale-form guard';
  await reject(reviewer.browser,second.id,'Please clarify the fictional company address.');
  own=await client.browser.request('/account');const latestForm=retryForm(own);
  assert(own.html.includes('value="Corrected Fictional Company"')&&own.html.includes('Please clarify the fictional company address.')&&own.html.includes('Please correct your fictional contact phone.'),'Later rejection displays latest draft plus the previous decision.');
  const oldAfterReview=await retryPost(client.browser,oldForm,corrected);assert(oldAfterReview.location==='/account?notice=retry-unavailable'&&requestFor(client.id).attempt_number===2,'First-attempt form stays invalid after a later rejected attempt.');
  const injected=await retryPost(client.browser,latestForm,{...corrected,company_name:'Final Fictional Company',user_id:reviewer.id,app_role:'super_admin',account_status:'active',target_organization_id:organization,next:'https://foreign.example.invalid'});
  assert(injected.location==='/account?notice=resubmitted','Latest rejected attempt accepts corrected own form with fixed local destination.');
  const third=requestFor(client.id);
  assert(third.attempt_number===3&&third.user_id===client.id&&third.target_organization_id===null&&stateFor(client.id).role==='client'&&stateFor(reviewer.id).role==='super_admin','Injected identity/role/route fields are ignored; only own new Client request changes.');
  const history=await client.browser.request('/account?history=1&user_id='+reviewer.id);
  assert(history.html.includes('Please correct your fictional contact phone.')&&history.html.includes('Please clarify the fictional company address.')&&!history.html.includes(reviewer.email),'Own history stays scoped even with a foreign user query parameter.');
  const emptyPage=await client.browser.request('/account?history=2');assert(emptyPage.html.includes('No earlier decisions on this page')&&emptyPage.html.includes('Newer decisions'),'Own decision-history paging has an empty page and return link.');
  stage='approved Client and Staff denials';
  const thirdPage=await requestPage(reviewer.browser,third.id);
  await postForm(reviewer.browser,extractForm(thirdPage,'route',third.id),{organization_id:organization});
  const existing=await requestPage(reviewer.browser,third.id);
  const approve=await postForm(reviewer.browser,extractForm(existing,'approve',third.id),{verified:'yes'});assert(approve.location==='/admin/requests?notice=approved','Reviewer approves the latest retried request through existing-company form.');
  const approved=await client.browser.request('/account');assert(stateFor(client.id).status==='active'&&stateFor(client.id).members===1&&!approved.html.includes('data-registration-retry="true"'),'Actually approved Client retains history but has no retry form.');
  const activeReplay=await retryPost(client.browser,latestForm,corrected);assert(activeReplay.location==='/account?notice=retry-unavailable'&&requestFor(client.id).attempt_number===3,'Approved Client cannot reuse a captured retry form as transfer or re-registration.');
  profileRole(reviewer.id,'staff');assert(!(await reviewer.browser.request('/account')).html.includes('data-registration-retry="true"'),'Staff account has no retry controls.');
  const staffPost=await retryPost(reviewer.browser,latestForm,corrected);assert(staffPost.location==='/account?notice=retry-unavailable','Staff cookie session cannot invoke copied Client retry form.');
  await restoreReviewer();assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===originalAdmins,'Original persistent Super Admin count restored.');
  console.log('Own retry web checks: '+checks+' passed. Two fictional accounts and three Client attempts retained.');
  console.log('Fictional reviewer restored to client/pending; sessions closed in finally; no credentials printed.');
}
async function restoreReviewer(){if(reviewerId)profileRole(reviewerId,'client','pending');}
try{await run();}catch(error){console.error('FAIL during '+stage+': '+(error instanceof CheckError?error.message:'Own retry check failed; private details withheld.'));process.exitCode=1;}
finally{
  try{await restoreReviewer();}catch{console.error('Fictional reviewer cleanup needs inspection.');process.exitCode=1;}
  for(const account of accounts){try{const session=await account.browser.session();if(session){await account.client.auth.setSession({access_token:session.data.access_token,refresh_token:session.data.refresh_token});const out=await account.client.auth.signOut({scope:'local'});if(out.error)process.exitCode=1;}}catch{console.error('Fictional session cleanup needs inspection.');process.exitCode=1;}}
}
