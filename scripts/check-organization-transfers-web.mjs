import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Organization transfers, live consents, real native forms and same-session access.
// All business decisions use authenticated RPCs. Owner writes only bootstrap/fixture revocation.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321',site='http://127.0.0.1:3000',inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
const tables=['organization_change_requests','organization_change_approvals','organization_access_codes','organization_code_submissions','profiles','organizations','organization_members','staff_organization_assignments','organization_admin_assignments','registration_requests','projects','audit_logs'];
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
  const email='securedesk-transfer-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Transfer Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
async function run() {
  if (process.argv.slice(2).length !== 1 || process.argv[2] !== '--create-demo') throw new CheckError('Use --create-demo to retain eleven fictional accounts and two companies.');
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
  for (const label of ['super-admin','source-admin','destination-admin','unassigned-admin','staff','client-a','client-b','second','rejected','rate-limit','pending']) await register(label);
  const [sa,oaA,oaB,foreign,staff,clientA,clientB,second,rejected,limited,pending]=accounts;
  const anonymous=createClient(api,key,options);
  stage='controlled fixture setup';
  assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Transfer Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed")===1,'Only new fixture receives temporary SA bootstrap.');
  for(const target of [oaA,oaB,foreign,staff]) await allowedRpc(sa.client,'approve_privileged_registration',{p_request_id:requestFor(target.id).id,p_role:target===staff?'staff':'admin',p_reason:'Fictional transfer review fixture.'},'Approve fixture role.');
  const details=label=>({name:'Fictional Transfer Company '+label+' '+randomUUID().slice(0,8),address:'Fictional office',email:'transfer-'+label.toLowerCase()+'@securedesk.example.invalid',phone:'+12025550655',description:'Fictional transfer-screen access test.'});
  const a=details('A'),b=details('B');
  orgA=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientA.id).id,p_details:a},'Approve Client A and company.');
  orgB=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientB.id).id,p_details:b},'Approve Client B and company.');
  for(const target of [second,rejected,limited]) await allowedRpc(sa.client,'route_registration_request',{p_request_id:requestFor(target.id).id,p_organization_id:orgA},'Route fictional registration to A.');
  for(const target of [second,rejected,limited]) await allowedRpc(sa.client,'approve_registration_request',{p_request_id:requestFor(target.id).id,p_organization_id:orgA},'Approve another fictional Client in A.');
  const assignmentArgs=(target,org,active)=>({p_organization_id:org,p_admin_user_id:target.id,p_expected_access_revision:revision(target.id),p_expected_assignment_revision:(()=>{const r=sql('select to_jsonb(revision::text) from public.organization_admin_assignments where organization_id='+q(org)+' and admin_user_id='+q(target.id));return r??null;})(),p_active:active,p_reason:'Fictional transfer scope change.'});
  for(const [target,org] of [[oaA,orgA],[oaB,orgB]]) await allowedRpc(sa.client,'set_organization_admin_assignment',assignmentArgs(target,org,true),'Assign OA to one company only.');
  await allowedRpc(oaA.client,'set_staff_organization_assignment',{p_organization_id:orgA,p_staff_user_id:staff.id,p_expected_access_revision:revision(staff.id),p_expected_assignment_revision:null,p_active:true,p_can_create_project:true,p_reason:'Fictional transfer Staff assignment.'},'Assign Staff A.');
  const issueB=(await allowedRpc(oaB.client,'manage_organization_access_code',{p_organization_id:orgB,p_expected_code_id:null,p_intent:'issue'},'Issue destination invitation.'))[0];
  const issueA=(await allowedRpc(oaA.client,'manage_organization_access_code',{p_organization_id:orgA,p_expected_code_id:null,p_intent:'issue'},'Issue source invitation.'))[0];
  const ownPath='/organizations/transfer',reviewPath='/organizations/transfers';
  const requestOf=actor=>sql('select to_jsonb(r) from public.organization_change_requests r where user_id='+q(actor.id)+' order by created_at desc limit 1');
  const membership=actor=>sql('select coalesce(jsonb_agg(to_jsonb(m) order by joined_at),\'[]\'::jsonb) from public.organization_members m where user_id='+q(actor.id));
  const requestList=(actor,status='all',offset=0)=>(actor?.client??anonymous).rpc('organization_transfer_requests',{p_status:status,p_offset:offset});
  const reviewArgs=(request,side)=>({p_request_id:request.id,p_expected_revision:String(request.revision),p_intent:'approve',p_side:side,p_reason:null});
  const consentForm=async(actor,id,side)=>form(await page(actor,reviewPath), 'data-transfer-review="'+side+'" data-transfer-id="'+id+'"');
  stage='role/scope and private-table matrix';
  for(const actor of [null,...accounts]){
    const before=checks,label=actor?.label??'anonymous';
    const canOwn=[clientA,clientB,second,rejected,limited].includes(actor),canReview=[sa,oaA,oaB,foreign].includes(actor);
    for(const [path,marker,allowed] of [[ownPath,'data-transfer-entry',canOwn],[reviewPath,'<h1 class=\"mt-2 text-3xl font-semibold\">Review organization transfers</h1>',canReview]]){
      const web=await page(actor,path);
      assert(web.headers.get('cache-control')?.includes('no-store'),label+': private page has no-store.');
      assert(allowed?web.status===200&&web.html.includes(marker):!web.html.includes(marker),label+': role receives only its transfer screen.');
    }
    const list=await requestList(actor);
    assert((canOwn||canReview)?!list.error&&(actor===sa?list.data.every(r=>!accounts.some(a=>a.email===r.email)):list.data.length===0):list.error?.code==='42501',label+': scoped empty requests RPC.');
    const context=await(actor?.client??anonymous).rpc('own_organization_transfer_context');
    assert(canOwn?!context.error&&context.data.length===1:context.error?.code==='42501',label+': own context requires active Client.');
    if(actor)for(const table of ['organization_change_requests','organization_change_approvals']){
      assert((await actor.client.from(table).select('*')).error?.code==='42501',label+': direct history select denied.');
      assert((await actor.client.from(table).insert({id:randomUUID()})).error?.code==='42501',label+': direct history insert denied.');
      assert((await actor.client.from(table).update({id:randomUUID()}).eq('id',randomUUID())).error?.code==='42501',label+': direct history update denied.');
      assert((await actor.client.from(table).delete().eq('id',randomUUID())).error?.code==='42501',label+': direct history delete denied.');
    }
    matrix.push({role:label,checks:checks-before,result:'PASS'});
  }
  for(const actor of [null,sa,oaA,oaB,foreign,staff,pending]){
    const r=await(actor?.client??anonymous).rpc('submit_organization_transfer',{p_code:issueB.code});
    assert(r.error?.code==='42501','Nonactive-Client cannot initiate transfer.');
  }
  for(const args of [{p_status:'invalid'},{p_offset:-1},{p_offset:250000}]) assert((await oaA.client.rpc('organization_transfer_requests',args)).error?.code==='22023','RPC independently validates filters.');
  assert((await page(oaA,reviewPath+'?view=forged&page=-1')).html.replace(/<!--.*?-->/g,'').includes('Page 1'),'Malformed web filters fall back to first pending page.');

  stage='native request and preserved pending access';
  const clientCookie=[...clientA.cookies],clientToken=(await clientA.client.auth.getSession()).data.session.access_token;
  const entry=form(await page(clientA,ownPath),'data-transfer-entry');
  const sameOrg=await post(clientA,entry,{organization_code:issueA.code});
  assert(sameOrg.html.includes('This code cannot be used')&&requestOf(clientA)===null,'Same-company code does not create transfer.');
  const marker='<script>transferProbe()</script>';
  const sent=await post(clientA,entry,{organization_code:issueB.code,reason:'Fictional transfer '+marker,user_id:clientB.id,from_organization_id:orgB,to_organization_id:orgA,status:'approved',app_role:'super_admin'});
  assert(sent.location===ownPath+'?notice=submitted','Real native request submits.');
  const original=requestOf(clientA);
  assert(original.user_id===clientA.id&&original.from_organization_id===orgA&&original.to_organization_id===orgB&&original.status==='pending','Arbitrary submitted identity/scope/status fields are ignored.');
  assert(membership(clientA).filter(m=>m.status==='active').every(m=>m.organization_id===orgA),'Request preserves old membership.');
  const clientView=await page(clientA,ownPath),own=(await requestList(clientA)).data[0];
  assert(!clientView.html.includes('data-transfer-entry')&&clientView.html.includes('pending transfer'),'Only one pending request can be submitted.');
  assert(!clientView.html.includes(b.name)&&!clientView.html.includes(orgB)&&!clientView.html.includes(issueB.code),'Pending Client page reveals no destination company or code.');
  assert(!clientView.html.includes(marker)&&clientView.html.includes('&lt;script&gt;transferProbe()&lt;/script&gt;'),'Untrusted reason renders as text.');
  assert(own.destination_name===null&&own.source_name===a.name&&own.full_name===null&&own.email===null,'Own DTO returns only currently readable company details.');
  assert((await requestList(clientB)).data.length===0,'Another Client sees none of the request.');
  for(const actor of [oaA,oaB]){
    const list=await requestList(actor),r=list.data[0];
    assert(r.id===original.id&&r.source_name===a.name&&r.destination_name===b.name&&r.email===clientA.email,'Scoped admin sees bounded transfer review details.');
    assert(actor===oaA?r.can_approve_source&&!r.can_approve_destination:r.can_approve_destination&&!r.can_approve_source,'OA form capabilities cover only its company.');
  }
  assert((await requestList(foreign)).data.length===0,'Unassigned OA sees no transfer or requester.');
  const sourceForm=await consentForm(oaA,original.id,'source'),destOld=await consentForm(oaB,original.id,'destination');
  stage='copied actions, scope forgery and CSRF';
  for(const actor of [null,clientA,clientB,staff,pending,foreign]){
    const r=await post(actor,sourceForm,{verified:'yes',app_role:'super_admin'});
    assert(r.location!==reviewPath+'?notice=approved'&&sql('select count(*)::integer from public.organization_change_approvals where request_id='+q(original.id))===0,'Copied review action cannot grant approval.');
  }
  for(const fields of [{side:'destination',verified:'yes'},{side:'super_admin',verified:'yes'},{request_id:randomUUID(),verified:'yes'},{}]){
    const r=await post(oaA,sourceForm,fields);
    assert(!r.location&&requestOf(clientA).revision===original.revision,'Forged side, missing request or absent confirmation cannot mutate.');
  }
  const csrf=await post(oaA,sourceForm,{verified:'yes'},'https://foreign.example.invalid');
  assert([403,500].includes(csrf.status)&&requestOf(clientA).revision===original.revision,'Foreign-Origin native action rejected before mutation.');
  for(const actor of [clientA,staff,pending,foreign]){
    assert((await actor.client.rpc('review_organization_transfer',reviewArgs(original,'source'))).error?.code==='42501','Direct forged review also denied.');
  }
  const consent=await post(oaA,sourceForm,{verified:'yes'});
  assert(consent.location===reviewPath+'?notice=consent','First real OA approval waits for other company.');
  assert(requestOf(clientA).status==='pending'&&membership(clientA).filter(m=>m.status==='active')[0].organization_id===orgA,'First consent leaves old access active.');
  assert((await clientA.client.from('organizations').select('id').eq('id',orgA)).data.length===1&&(await clientA.client.from('projects').select('id').eq('organization_id',orgB)).data.length===0,'Pending same JWT reads A and no B projects.');
  const stale=await post(oaB,destOld,{verified:'yes'});
  assert(stale.html.includes('This transfer has changed')&&requestOf(clientA).status==='pending','Old destination form cannot overwrite a newer consent.');
  const completed=await post(oaB,await consentForm(oaB,original.id,'destination'),{verified:'yes'});
  assert(completed.location===reviewPath+'?notice=approved','Second real OA approval completes transfer.');
  const episodes=membership(clientA),ended=episodes.find(m=>m.organization_id===orgA),active=episodes.find(m=>m.organization_id===orgB);
  assert(episodes.length===2&&ended.status==='ended'&&active.status==='active'&&ended.ended_at===active.joined_at&&active.approved_at===active.joined_at,'One atomic switch retains the exact old episode and timestamp.');
  assert((await clientA.client.auth.getSession()).data.session.access_token===clientToken,'Membership changes need no new JWT.');
  assert(JSON.stringify([...clientA.cookies])===JSON.stringify(clientCookie),'Membership changes need no replacement browser session.');
  assert((await clientA.client.from('organizations').select('id').eq('id',orgA)).data.length===0&&(await clientA.client.from('projects').select('id').eq('organization_id',orgA)).data.length===0,'Same JWT immediately loses old company and projects.');
  assert((await clientA.client.from('organizations').select('id').eq('id',orgB)).data.length===1&&(await clientA.client.from('projects').select('id').eq('organization_id',orgB)).data.length===1,'Same JWT immediately gains new company and General Support.');
  assert((await page(clientA,'/organizations/'+orgA)).html.includes('Organization not available')&&(await page(clientA,'/organizations/'+orgB)).html.includes(b.name),'Same browser cookie immediately changes profile access.');
  const completedOwn=(await requestList(clientA)).data[0];
  assert(completedOwn.source_name===null&&completedOwn.destination_name===b.name,'Historical own request no longer discloses unreadable old company.');
  assert((await post(oaB,destOld,{verified:'yes'})).html.includes('This transfer has changed')&&membership(clientA).length===2,'Replayed completed form cannot create duplicate membership.');
  stage='SA decision and rejection';
  const secondEntry=form(await page(second,ownPath),'data-transfer-entry');
  assert((await post(second,secondEntry,{organization_code:issueB.code})).location===ownPath+'?notice=submitted','Second Client requests transfer.');
  const secondReq=requestOf(second);
  const saDone=await post(sa,await consentForm(sa,secondReq.id,'super_admin'),{verified:'yes'});
  assert(saDone.location===reviewPath+'?notice=approved'&&requestOf(second).status==='approved','SA can complete through real form without two OA approvals.');
  assert(sql('select count(*)::integer from public.organization_change_approvals where request_id='+q(secondReq.id))===0,'SA completion invents no company consent history.');
  const rejectedEntry=form(await page(rejected,ownPath),'data-transfer-entry');
  assert((await post(rejected,rejectedEntry,{organization_code:issueB.code})).location===ownPath+'?notice=submitted','Third Client requests transfer.');
  const rejectedReq=requestOf(rejected),rejectForm=await consentForm(oaB,rejectedReq.id,'reject');
  assert((await post(oaB,rejectForm,{reason:' '})).html.includes('Enter a rejection reason'),'Rejection requires a reason.');
  assert((await post(oaB,rejectForm,{reason:'Please verify the fictional transfer.'})).location===reviewPath+'?notice=rejected','Either scoped company can reject with reason.');
  assert(requestOf(rejected).status==='rejected'&&membership(rejected).length===1&&membership(rejected)[0].organization_id===orgA,'Rejection does not alter membership.');
  assert((await page(rejected,ownPath)).html.includes('Please verify the fictional transfer.'),'Requester sees own rejection reason and may retry.');
  stage='concurrent reviews and live consent revocation';
  const raceEntry=form(await page(rejected,ownPath),'data-transfer-entry');
  assert((await post(rejected,raceEntry,{organization_code:issueB.code})).location===ownPath+'?notice=submitted','Rejected Client may submit a new attempt.');
  const raceReq=requestOf(rejected);
  const race=await Promise.all([[oaA,'source'],[oaB,'destination']].map(([actor,side])=>actor.client.rpc('review_organization_transfer',reviewArgs(raceReq,side))));
  assert(race.filter(r=>r.data==='awaiting_other_company').length===1&&race.filter(r=>r.error?.code==='PT409').length===1,'Concurrent first consents have one accepted revision and one stale response.');
  assert(requestOf(rejected).status==='pending'&&membership(rejected).length===1,'Concurrent stale review leaves one old active membership.');
  const sourceWon=race[0].data==='awaiting_other_company',winningActor=sourceWon?oaA:oaB,winningOrg=sourceWon?orgA:orgB,otherActor=sourceWon?oaB:oaA,otherSide=sourceWon?'destination':'source';
  const savedWinnerForm=await consentForm(winningActor,raceReq.id,sourceWon?'source':'destination');
  await allowedRpc(sa.client,'set_organization_admin_assignment',assignmentArgs(winningActor,winningOrg,false),'Revoke recorded consent actor assignment.');
  const afterRevoked=await post(winningActor,savedWinnerForm,{verified:'yes'});
  assert(!afterRevoked.location&&(await requestList(winningActor)).data.length===0,'Same cookie and saved action lose scope on OA revocation.');
  const otherConsent=await otherActor.client.rpc('review_organization_transfer',reviewArgs(requestOf(rejected),otherSide));
  assert(otherConsent.data==='awaiting_other_company'&&requestOf(rejected).status==='pending','Revoked prior consent cannot finish transfer.');
  await allowedRpc(sa.client,'set_organization_admin_assignment',assignmentArgs(winningActor,winningOrg,true),'Regrant fixture OA assignment at new revision.');
  const refreshed=(await requestList(sa)).data.find(r=>r.id===raceReq.id);
  assert(sourceWon?!refreshed.source_approved:!refreshed.destination_approved,'Regrant does not resurrect revoked consent.');
  const fresh=await winningActor.client.rpc('review_organization_transfer',reviewArgs(requestOf(rejected),sourceWon?'source':'destination'));
  assert(fresh.data==='approved'&&membership(rejected).filter(m=>m.status==='active').length===1,'Fresh approval completes with exactly one active membership.');
  stage='durable quota, privacy and final views';
  const limitedEntry=form(await page(limited,ownPath),'data-transfer-entry');
  for(let n=0;n<5;n++){
    const r=await post(limited,limitedEntry,{organization_code:n===0?marker:'invalid-'+n});
    assert(r.html.includes('This code cannot be used')&&!r.html.includes(marker),'Invalid code gives generic response and is not echoed.');
  }
  assert((await post(limited,limitedEntry,{organization_code:issueB.code})).html.includes('Too many code attempts')&&requestOf(limited)===null,'Sixth valid code is blocked by persistent quota.');
  assert((await limited.client.rpc('submit_organization_transfer',{p_code:issueB.code})).data==='rate_limited','Direct RPC and native form share durable quota.');
  const pendingCopy=await post(pending,entry,{organization_code:issueB.code});
  assert(!pendingCopy.location&&requestOf(pending)===null,'Copied request form cannot turn Pending account into transfer.');
  const all=await requestList(sa),reviewed=await requestList(sa,'reviewed'),pendingList=await requestList(sa,'pending');
  const fixtureOnly=list=>list.data.filter(r=>accounts.some(a=>a.email===r.email));
  assert(fixtureOnly(all).length===4&&fixtureOnly(reviewed).length===4&&fixtureOnly(pendingList).length===0,'Review filters return consistent completed/rejected history.');
  assert((await page(oaA,reviewPath)).html.includes('No matching transfers'),'Pending review has readable empty state.');
  const history=await page(sa,reviewPath+'?view=reviewed');
  assert(history.html.includes(clientA.email)&&history.html.includes(rejected.email)&&!history.html.includes('data-transfer-review'),'Reviewed history has no decision forms.');
  assert(!JSON.stringify(all.data).includes(issueA.code)&&!JSON.stringify(all.data).includes(issueB.code)&&!JSON.stringify(all.data).includes('assignment_id'),'Bounded DTO never exposes invitation or consent assignment fields.');
  const audit=sql('select coalesce(jsonb_agg(metadata_redacted),\'[]\'::jsonb) from public.audit_logs where organization_id in ('+q(orgA)+','+q(orgB)+')');
  assert(!JSON.stringify(audit).includes(issueA.code)&&!JSON.stringify(audit).includes(issueB.code),'Audit metadata contains no invitation code.');
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
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/organization-transfers-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Organization transfer API/native-form matrix: '+checks+' checks / '+(failed?'FAILED.':'PASS.'));if(failed)process.exitCode=1;

