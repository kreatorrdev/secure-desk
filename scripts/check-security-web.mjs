import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Local native security checks: headers, abuse limits, CSRF, XSS, IDOR and stale access.
// All ordinary business decisions use authenticated RPCs. Owner writes only new fixture bootstrap, cleanup; no prior business row is modified.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321',site='http://127.0.0.1:3000',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const tables=['organization_change_requests','organization_change_approvals','organization_access_codes','organization_code_submissions','profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs','project_proposals','attachments','tickets','ticket_collaborators','ticket_comments','ticket_comment_revisions','ticket_participant_requests','ticket_participants','ticket_reopen_requests'];
const accounts=[],matrix=[];let checks=0,stage='local guards',key,baseline,adminCount,orgA,orgB;
const q=value=>"'"+value.replaceAll("'","''")+"'";
function assert(condition,label){if(!condition)throw new CheckError(label);checks++;}
function command(args,input){const r=spawnSync(docker,args,{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:32*1024*1024,input});if(r.error||r.status)throw new CheckError('Local database verification failed; private details withheld.');return r.stdout.trim();}
function sql(query){const s=command(['exec','-i','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1'],query);return s?JSON.parse(s):null;}
function snapshot(previous){return tables.map(table=>sql('select jsonb_build_object(\'table\','+q(table)+',\'count\',count(*),\'hash\',md5(coalesce(string_agg(to_jsonb(t)::text,\'\' order by id),\'\')),\'ids\',coalesce(jsonb_agg(id order by id),\'[]\'::jsonb)) from public.'+table+' t'+(previous?(previous.find(x=>x.table===table).ids.length?' where id in ('+previous.find(x=>x.table===table).ids.map(q).join(',')+')':' where false'):'')));}
const requestFor=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
const revision=id=>String(sql('select access_revision from public.profiles where id='+q(id)));
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
async function register(label){
  const email='securedesk-security-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Security Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
  const html=await response.text();return {path,status:response.status,html,location:response.headers.get('location')??html.match(/<meta[^>]*http-equiv="refresh"[^>]*content="[^"]*url=([^"]*)"/i)?.[1]??null,headers:response.headers};
}
function form(web,marker) {
  const markup=[...web.html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].find(m=>m[0].slice(0,m[0].indexOf('>')+1).includes(marker))?.[0];
  if(!markup)throw new CheckError('Expected native form missing: '+marker);
  return {markup,path:web.path};
}
async function post(account,selected,fields={},origin=site,extraHeaders={}) {
  const data=new FormData(),decode=v=>v.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  for(const tag of selected.markup.matchAll(/<input\b[^>]*>/gi)){
    const attrs=Object.fromEntries([...tag[0].matchAll(/([\w$:-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
    if(attrs.type==='hidden'&&attrs.name)data.set(attrs.name,attrs.value??'');
  }
  assert([...data.keys()].some(k=>k.startsWith('$ACTION_')),'Real native action reference used.');
  for(const [k,v] of Object.entries(fields)){if(v===null)data.delete(k);else if(Array.isArray(v)){data.delete(k);for(const x of v)data.append(k,x);}else data.set(k,v);}
  return page(account,selected.path,{method:'POST',headers:{...extraHeaders,origin},body:data});
}
async function allowedRpc(client,name,args,label){const r=await client.rpc(name,args);assert(!r.error,label);return r.data;}
async function run() {
 if(process.argv.length!==3||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo for seven fictional local security accounts.');
 const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
 if(env.NEXT_PUBLIC_SUPABASE_URL!==api||env.SITE_URL!==site||!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.DOCKER_HOST)throw new CheckError('Refusing nonlocal application/Docker target.');
 key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 const host=JSON.parse(command(['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
if(!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host)&&host!=='unix:///var/run/docker.sock')throw new CheckError('Expected local Docker context.');
 const labels=JSON.parse(command(['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw new CheckError('Unexpected local project/workspace.');
 baseline=snapshot();adminCount=sql("select count(*)::integer from public.profiles where app_role='super_admin'");
 stage='actual production browser headers';
 let previousNonce;
 for(const path of ['/','/login','/register','/auth/check-email','/account','/dashboard','/admin/audit','/organizations','/missing-security-page']){
  const web=await page(null,path),h=web.headers,csp=h.get('content-security-policy')??'',nonce=csp.match(/'nonce-([^']+)'/)?.[1];
  assert(Boolean(nonce)&&nonce!==previousNonce,path+': fresh response nonce');previousNonce=nonce;
  for(const [name,value]of[['x-content-type-options','nosniff'],['x-frame-options','DENY'],['referrer-policy','no-referrer'],['cross-origin-opener-policy','same-origin'],['cross-origin-resource-policy','same-origin']])assert(h.get(name)===value,path+': '+name);
  assert(!h.has('x-powered-by')&&!h.has('strict-transport-security'),path+': localhost transport and framework disclosure');
  assert(csp.includes("'strict-dynamic'")&&!csp.includes("'unsafe-eval'")&&!csp.includes("'unsafe-inline'")&&csp.includes("script-src-attr 'none'")&&csp.includes("form-action 'self'")&&csp.includes("frame-ancestors 'none'"),path+': production CSP');
  assert(csp.includes(api)&&!csp.includes('https://evil.example'),path+': only configured API target');
  assert(h.get('cache-control')?.includes('no-store'),path+': no shared response cache');
  const scripts=[...web.html.matchAll(/<script\b[^>]*>/gi)];assert(scripts.every(tag=>tag[0].includes('nonce="'+nonce+'"')),path+': actual framework scripts carry response nonce');
 }
 const spoof=await page(null,'/login',{headers:{'x-nonce':'attacker','content-security-policy':"script-src 'unsafe-inline'"}});assert(!spoof.headers.get('content-security-policy').includes('attacker')&&!spoof.html.includes('nonce="attacker"'),'Client cannot choose server nonce');
 stage='native auth validation CSRF and rate limits';
 const login=form(await page(null,'/login'),''),email='security-rate-'+randomUUID()+'@securedesk.example.invalid',password='FictionalWrongPassword8!';
 const duplicate=await post(null,login,{email:[email,'victim@securedesk.example.invalid'],password});assert(duplicate.html.includes('Enter a valid email')&&!duplicate.html.includes(password),'Duplicate identity rejected without password echo');
 const crossEmail='csrf-'+randomUUID()+'@securedesk.example.invalid',registration=form(await page(null,'/register'),'');
 const csrf=await post(null,registration,{email:crossEmail,password,full_name:'Fictional CSRF',phone:'+12025550602',company_name:'Fictional security',message:'Fictional probe'},'https://evil.example');
 assert(csrf.status>=400,'Foreign-origin native action rejected');assert(sql('select count(*)::integer from auth.users where email='+q(crossEmail))===0,'CSRF creates no account');
 for(let n=0;n<10;n++){const r=await post(null,login,{email,password});assert(!r.location&&r.html.includes('Sign-in failed.'),'Native wrong password attempt '+(n+1)+' is generic');}
 const blocked=await post(null,login,{email:email.toUpperCase(),password},site,{'x-forwarded-for':'198.51.100.88','x-real-ip':'198.51.100.99'});assert(blocked.html.includes('Too many attempts.'),'Case and spoofed forwarding headers do not bypass account limit');
 const resend=form(await page(null,'/auth/confirm'),'');const resendEmail='resend-'+randomUUID()+'@securedesk.example.invalid';
 assert((await post(null,resend,{email:resendEmail})).html.includes('If this address needs confirmation'),'First resend gives generic result');assert((await post(null,resend,{email:resendEmail.toUpperCase()})).html.includes('Too many attempts.'),'Immediate repeated resend blocked');
 const token=randomBytes(32).toString('hex'),confirmation=form(await page(null,'/auth/confirm?type=email&token_hash='+token),'');
 for(let n=0;n<5;n++)assert((await post(null,confirmation)).html.includes('This confirmation link is invalid or expired.'),'Invalid confirmation attempt '+(n+1));
 assert((await post(null,confirmation)).html.includes('Too many attempts.'),'Repeated confirmation token blocked');
 stage='seven real Auth roles and scope';
 for(const label of['super-admin','admin-a','owner','client-a','client-peer','client-b','pending'])await register(label);
 const [sa,oa,owner,clientA,peer,clientB,pending]=accounts;
 assert(sql("with c as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Security Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from c")===1,'Only new security fixture bootstrapped');
 for(const target of[oa,owner])await allowedRpc(sa.client,'approve_privileged_registration',{p_request_id:requestFor(target.id).id,p_role:target===oa?'admin':'staff',p_reason:'Fictional security roles.'},'Approve fictional role');
 const details=label=>({name:'Fictional Security Company '+label+' '+randomUUID().slice(0,8),address:'Fictional office',email:'security-'+label.toLowerCase()+'@securedesk.example.invalid',phone:'+12025550655',description:'Fictional security scope.'});
 orgA=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientA.id).id,p_details:details('A')},'Approve security A');orgB=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientB.id).id,p_details:details('B')},'Approve security B');
 await allowedRpc(sa.client,'route_registration_request',{p_request_id:requestFor(peer.id).id,p_organization_id:orgA},'Route peer');await allowedRpc(sa.client,'approve_registration_request',{p_request_id:requestFor(peer.id).id,p_organization_id:orgA},'Approve peer');
 await allowedRpc(sa.client,'set_organization_admin_assignment',{p_organization_id:orgA,p_admin_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_expected_assignment_revision:null,p_active:true,p_reason:'Fictional security scope'},'Assign OA');
 const staffArgs=active=>({p_organization_id:orgA,p_staff_user_id:owner.id,p_expected_access_revision:revision(owner.id),p_expected_assignment_revision:sql('select to_jsonb(revision::text) from public.staff_organization_assignments where organization_id='+q(orgA)+' and staff_user_id='+q(owner.id)),p_active:active,p_can_create_project:false,p_reason:'Fictional security scope'});
 await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(true),'Assign Staff organization');
 const id=randomUUID(),path='/organizations/'+orgA+'/tickets/'+id;
 const common=async(actor)=>{const r=await actor.client.rpc('ticket_context',{p_organization_id:orgA});assert(!r.error,'Actual current actor context');return {p_organization_id:orgA,p_ticket_id:id,p_expected_access_revision:r.data[0].access_revision,p_expected_scope:r.data[0].scope_revision};};
 const payload='<img src=x onerror="document.documentElement.dataset.xss=1">',description='<script>document.documentElement.dataset.xss=1</script> Fictional security text';
 const create=form(await page(clientA,'/organizations/'+orgA+'/tickets/new'),'data-ticket-form="create"');
 const created=await post(clientA,create,{ticket_id:id,title:payload,description,project_id:sql('select to_jsonb(id) from public.projects where organization_id='+q(orgA)+' and is_general_support'),client_user_id:clientA.id,app_role:'super_admin',account_status:'active',owner_staff_user_id:owner.id});
 assert(created.location===path+'?notice=created','Native creation accepts only permitted business fields');
 const row=()=>sql('select to_jsonb(t) from public.tickets t where id='+q(id));assert(row().title===payload&&row().description===description&&row().owner_staff_user_id===null,'Mass assignment cannot choose owner or privilege');
 const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
 const textPage=await page(clientA,path);assert(textPage.html.includes(escape(payload))&&textPage.html.includes(escape(description))&&!textPage.html.includes(payload)&&!textPage.html.includes(description),'Stored HTML is rendered as text');
 const native=form(textPage,'data-ticket-form="comment"');
 for(const actor of[null,sa,oa,owner,clientA,peer,clientB,pending]){const web=await page(actor,path),canRead=[sa,oa,clientA].includes(actor);assert(canRead?web.html.includes('data-ticket-form='):!web.html.includes(escape(payload)),(actor?.label??'anonymous')+': correct ticket detail scope');matrix.push({actor:actor?.label??'anonymous',read:canRead?'allow':'deny'});}
 for(const actor of[owner,peer,clientB,pending]){const r=await post(actor,native,{body:'Fictional unauthorized comment'});assert((['/account','/login'].includes(r.location)||(!r.location&&(r.html.includes('Your ticket access is unavailable.')||r.html.includes('This record or your permissions changed.'))))&&sql('select count(*)::integer from public.ticket_comments where ticket_id='+q(id))===0,actor.label+': copied action cannot write');}
 assert(!(await oa.client.rpc('manage_ticket',{...await common(oa),p_expected_revision:String(row().revision),p_intent:'owner',p_value:owner.id})).error,'OA assigns real owner');
 const ownerPage=await page(owner,path);assert(ownerPage.html.includes('data-ticket-form="comment"'),'Assigned owner gains native comment form');
 const ownerForm=form(ownerPage,'data-ticket-form="comment"');
 assert((await post(owner,ownerForm,{body:payload})).location===path+'?notice=saved','Owner native comment succeeds');assert((await page(owner,path)).html.includes(escape(payload))&&sql('select count(*)::integer from public.ticket_comments where ticket_id='+q(id)+' and body='+q(payload))===1,'Comment HTML remains literal stored text');
 await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(false),'Revoke already logged-in owner');
 assert(!(await page(owner,path)).html.includes(escape(payload)),'Existing owner cookie loses ticket immediately');
 const revoked=await post(owner,ownerForm,{body:'Fictional stale owner comment'});assert(!revoked.location&&sql('select count(*)::integer from public.ticket_comments where ticket_id='+q(id))===1,'Old native action cannot write after revocation');
 assert(!(await page({cookies:new Map([['sb-127-auth-token','forged']])},'/account')).html.includes('Fictional Security Screen Account'),'Forged cookie gives no identity');
 assert((await page(pending,'/dashboard')).location==='/account','Confirmed pending account has no business dashboard');
 for(const actor of[owner,clientA,peer,clientB,pending])assert(!(await page(actor,'/admin/access')).html.includes('data-access-target='),actor.label+': no administrative account details');
 const session=await clientA.client.auth.getSession();assert(Boolean(session.data.session),'Real current JWT for documented logout limit');assert(!(await clientA.client.auth.signOut({scope:'local'})).error,'Client signs out its provider session');
 const jwtReplay=createClient(api,key,{...options,global:{headers:{Authorization:'Bearer '+session.data.session.access_token}}});const rawReplay=await jwtReplay.rpc('current_account_role');assert(!rawReplay.error&&rawReplay.data==='client','Direct issued JWT retains provider lifetime after logout: documented limitation');assert((await page(clientA,'/account')).location==='/login','Application getUser rejects the revoked session cookie');
 mkdirSync(new URL('../.tools/verification/phase6/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/phase6/practice.json',import.meta.url),JSON.stringify({organization:orgA,ticket:id,path,payload:'Fictional stored HTML probe; browser must render plain text'},null,2));
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
 const ids=accounts.map(a=>a.id).filter(Boolean);
 try{for(const org of[orgA,orgB].filter(Boolean))sql("with c as(update public.organization_access_codes set active=false,revoked_at=clock_timestamp() where organization_id="+q(org)+" and active returning id) select to_jsonb(true)");
 if(ids.length){const values=ids.map(q).join(',');sql("with s as(update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ("+values+") and (active or can_create_project) returning id),a as(update public.organization_admin_assignments set active=false where admin_user_id in ("+values+") and active returning id),p as(update public.profiles set app_role='client' where id in ("+values+") and app_role<>'client' returning id) select to_jsonb(true)");sql("with p as(update public.profiles set account_status='pending' where id="+q(ids[0])+" returning id) select to_jsonb(true)");}
 }catch{failed=true;console.error('FAIL: Fictional privilege cleanup');}
 for(const account of accounts)try{if((await account.client.auth.signOut({scope:'local'})).error)throw new CheckError('Signout failed');account.cookies.clear();}catch{failed=true;console.error('FAIL: Fixture signout');}
 try{if(adminCount!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===adminCount,'Persistent SA count unchanged');if(ids.length){const values=ids.map(q).join(',');assert(sql('select count(*)::integer from auth.sessions where user_id in ('+values+')')===0,'All new sessions closed');assert(sql("select count(*)::integer from public.profiles where id in ("+values+") and app_role<>'client'")===0,'No privileged fixture roles');assert(sql('select count(*)::integer from public.staff_organization_assignments where staff_user_id in ('+values+') and (active or can_create_project)')===0,'No Staff fixture privilege');assert(sql('select count(*)::integer from public.organization_admin_assignments where admin_user_id in ('+values+') and active')===0,'No OA fixture privilege');}if(baseline)assert(JSON.stringify(snapshot(baseline))===JSON.stringify(baseline),'All earlier business rows unchanged');}catch(error){failed=true;console.error('FAIL: '+(error instanceof CheckError?error.message:'Final guard failed'));}
}
mkdirSync(new URL('../.tools/verification/phase6/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/phase6/security-web-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',stage,matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Native security checks: '+checks+' / '+(failed?'FAIL':'PASS'));if(failed)process.exitCode=1;
