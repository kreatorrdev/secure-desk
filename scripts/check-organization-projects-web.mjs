import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Scoped projects, explicit Staff permission, General Support and native forms.
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
  const email='securedesk-projects-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Project Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
  if (process.argv.slice(2).length !== 1 || process.argv[2] !== '--create-demo') throw new CheckError('Use --create-demo to retain nine fictional accounts and two companies.');
  const env = parseEnv(readFileSync(new URL('../.env.local', import.meta.url), 'utf8'));
  if (env.NEXT_PUBLIC_SUPABASE_URL !== api || env.SITE_URL !== site || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.DOCKER_HOST) throw new CheckError('Refusing nonlocal application/Docker target.');
  key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const host = JSON.parse(command(['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
  if (!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host) && host !== 'unix:///var/run/docker.sock') throw new CheckError('Expected local Docker context.');
  const labels = JSON.parse(command(['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
  if (labels['com.supabase.cli.project'] !== 'secure-desk' || labels['com.supabase.cli.workdir'] !== root.replace(/[\\/]$/, '')) throw new CheckError('Unexpected local project/workspace.');
  baseline = snapshot();
  adminCount = sql("select count(*)::integer from public.profiles where app_role='super_admin'");

  stage='signup/email/session';
  for(const label of ['super-admin','admin-a','admin-b','staff-writer','staff-reader','client-a','client-b','pending','unassigned-staff']) await register(label);
  const [sa,oa,oaB,writer,reader,clientA,clientB,pending,unassigned]=accounts;
  const anonymous=createClient(api,key,options);
  stage='controlled fixture setup';
  assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id="+q(sa.id)+" and full_name='Fictional Project Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed")===1,'Only new fixture receives temporary SA bootstrap.');
  for(const target of [oa,oaB,writer,reader,unassigned]) await allowedRpc(sa.client,'approve_privileged_registration',{p_request_id:requestFor(target.id).id,p_role:[oa,oaB].includes(target)?'admin':'staff',p_reason:'Fictional project screen fixture.'},'Approve fixture role.');
  const details=label=>({name:'Fictional Project Company '+label+' '+randomUUID().slice(0,8),address:'Fictional office',email:'projects-'+label.toLowerCase()+'@securedesk.example.invalid',phone:'+12025550655',description:'Fictional project-screen access test.'});
  const a=details('A'),b=details('B');
  orgA=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientA.id).id,p_details:a},'Approve Client A and company.');
  orgB=await allowedRpc(sa.client,'approve_registration_new_organization',{p_request_id:requestFor(clientB.id).id,p_details:b},'Approve Client B and company.');
  const oaArgs=(target,org,active)=>({p_organization_id:org,p_admin_user_id:target.id,p_expected_access_revision:revision(target.id),p_expected_assignment_revision:sql('select to_jsonb(revision::text) from public.organization_admin_assignments where organization_id='+q(org)+' and admin_user_id='+q(target.id)),p_active:active,p_reason:'Fictional project OA scope.'});
  for(const [target,org] of [[oa,orgA],[oaB,orgB]]) await allowedRpc(sa.client,'set_organization_admin_assignment',oaArgs(target,org,true),'Assign scoped OA.');
  const staffArgs=(target,active,permission)=>({p_organization_id:orgA,p_staff_user_id:target.id,p_expected_access_revision:revision(target.id),p_expected_assignment_revision:sql('select to_jsonb(revision::text) from public.staff_organization_assignments where organization_id='+q(orgA)+' and staff_user_id='+q(target.id)),p_active:active,p_can_create_project:permission,p_reason:'Fictional project Staff permission.'});
  for(const target of [writer,reader]) await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(target,true,target===writer),'Assign Staff with separate permission.');
  const path=org=>'/organizations/'+org+'/projects',context=(actor,org)=>(actor?.client??anonymous).rpc('organization_project_context',{p_organization_id:org});
  const list=(actor,org,status='active',offset=0)=>(actor?.client??anonymous).rpc('organization_projects',{p_organization_id:org,p_status:status,p_offset:offset});
  const gs=org=>sql('select to_jsonb(id) from public.projects where organization_id='+q(org)+' and is_general_support');
  const supportA=gs(orgA),supportB=gs(orgB);
  const project=id=>sql('select to_jsonb(p) from public.projects p where id='+q(id));
  const formField=(selected,name)=>{const tag=[...selected.markup.matchAll(/<input\b[^>]*>/gi)].find(m=>m[0].includes('name="'+name+'"'))?.[0];return tag?.match(/value="([^"]*)"/)?.[1]??'';};
  const newArgs=async(actor,org,id,details)=>{const c=(await context(actor,org)).data[0];return {p_organization_id:org,p_project_id:id,p_expected_access_revision:c.access_revision,p_expected_assignment_revision:c.assignment_revision,p_details:details};};
  stage='role/scope/General Support matrix';
  for(const actor of [null,...accounts]){
    const before=checks,label=actor?.label??'anonymous';
    for(const org of [orgA,orgB]){
      const allowed=actor===sa||org===orgA&&[oa,writer,reader,clientA].includes(actor)||org===orgB&&[oaB,clientB].includes(actor);
      const canWrite=allowed&&(actor===sa||[oa,oaB,writer].includes(actor));
      const c=await context(actor,org),rows=await list(actor,org);
      assert(allowed?!c.error&&c.data[0].can_create===canWrite:c.error?.code==='42501',label+': context scope and explicit write capability.');
      assert(allowed?!rows.error&&rows.data.length===1&&rows.data[0].is_general_support:rows.error?.code==='42501',label+': one scoped automatic General Support.');
      const web=await page(actor,path(org));
      assert(web.headers.get('cache-control')?.includes('no-store'),label+': project list has private/no-store.');
      assert(allowed?web.html.includes('data-project-record='):!web.html.includes('data-project-record='),label+': list visibility.');
      assert(canWrite?web.html.includes('data-project-form="create"'):!web.html.includes('data-project-form="create"'),label+': write form only with explicit permission.');
      const detail=await page(actor,path(org)+'/'+gs(org));
      assert(detail.headers.get('cache-control')?.includes('no-store'),label+': detail has private/no-store.');
      assert(allowed?detail.html.includes('data-project-detail='):!detail.html.includes('data-project-detail='),label+': project detail scope.');
      assert(canWrite?detail.html.includes('data-project-form="update"'):!detail.html.includes('data-project-form="update"'),label+': edit form capability.');
    }
    if(actor)for(const method of ['insert','update','delete']){
      const query=method==='insert'?actor.client.from('projects').insert({organization_id:orgA,name:'Bypass',description:'Bypass',created_by_user_id:actor.id}):method==='update'?actor.client.from('projects').update({name:'Bypass'}).eq('id',supportA):actor.client.from('projects').delete().eq('id',supportA);
      assert((await query).error?.code==='42501',label+': direct '+method+' is denied.');
    }
    matrix.push({role:label,checks:checks-before,result:'PASS'});
  }

  stage='native creation, input and action forgery';
  const manager=form(await page(oa,path(orgA)),'data-project-form="create"'),id=formField(manager,'project_id');
  const marker='<script>projectProbe()</script>',draft={name:'Fictional network review '+marker,description:'A fictional active project.'};
  assert(Boolean(id),'Real create form includes a unique submission ID.');
  for(const actor of [null,clientA,clientB,pending,reader,unassigned,oaB]){
    const r=await post(actor,manager,{...draft,app_role:'super_admin',can_create_project:'true'});
    assert(r.location!==path(orgA)+'/'+id+'?notice=created'&&project(id)===null,'Copied form and forged role cannot create project.');
  }
  const cross=await post(oa,manager,{...draft,organization_id:orgB});
  assert(!cross.location&&project(id)===null,'Foreign organization field cannot widen OA scope.');
  assert((await post(oa,manager,{name:' ',description:'X'})).html.includes('Enter a project name'),'Native action validates empty name.');
  const csrf=await post(oa,manager,draft,'https://foreign.example.invalid');
  assert([403,500].includes(csrf.status)&&project(id)===null,'Foreign-Origin create is rejected without mutation.');
  const created=await post(oa,manager,{...draft,created_by_user_id:sa.id,status:'inactive',is_general_support:'true',revision:'999',user_id:sa.id});
  assert(created.location===path(orgA)+'/'+id+'?notice=created','Native OA create succeeds.');
  const stored=project(id);
  assert(stored.created_by_user_id===oa.id&&stored.organization_id===orgA&&stored.status==='active'&&!stored.is_general_support,'Actor, tenant and system fields come from verified workflow.');
  assert((await post(oa,manager,draft)).location===created.location,'Exact same create submission is idempotent.');
  assert(sql('select count(*)::integer from public.audit_logs where target_id='+q(id)+" and event_type='project.created'")===1,'Replayed create has one audit event.');
  const clientPage=await page(clientA,path(orgA)+'/'+id);
  assert(clientPage.html.includes('data-project-detail=')&&!clientPage.html.includes(marker)&&clientPage.html.includes('&lt;script&gt;projectProbe()&lt;/script&gt;'),'Client sees active project with escaped display text.');
  assert(!clientPage.html.includes('data-project-form='),'Client sees no edit form.');
  for(const [org,target] of [[orgB,id],[orgA,supportB],[orgA,randomUUID()],[orgA,'invalid-project-id']]){
    const r=await page(clientA,path(org)+'/'+target);
    assert(r.html.includes('Organization not available')&&!r.html.includes('data-project-detail='),'Foreign, wrong-tenant, missing and invalid project IDs have generic unavailable view.');
  }
  const rejectedDetails=await writer.client.rpc('create_organization_project',await newArgs(writer,orgA,randomUUID(),{name:'Forged',description:'Forged',status:'active'}));
  assert(rejectedDetails.error?.code==='22023','RPC independently rejects unknown details fields.');
  for(const actor of [clientA,reader,unassigned,oaB])assert((await actor.client.rpc('create_organization_project',{p_organization_id:orgA,p_project_id:randomUUID(),p_expected_access_revision:revision(actor.id),p_expected_assignment_revision:null,p_details:{name:'Bypass',description:'Bypass'}})).error?.code==='42501','RPC cannot bypass project create permission.');
  stage='native edit, General Support and concurrent revision';
  const oaEdit=form(await page(oa,path(orgA)+'/'+id),'data-project-form="update"');
  for(const actor of [clientA,pending,reader,unassigned,oaB]){
    const r=await post(actor,oaEdit,{name:'Unauthorized edit',description:'Bypass'});
    assert(!r.location&&project(id).revision===stored.revision,'Copied edit cannot bypass current permission.');
  }
  const writerEdit=form(await page(writer,path(orgA)+'/'+id),'data-project-form="update"');
  assert((await post(writer,writerEdit,{name:'Fictional network review updated',description:'Updated by assigned Staff.'})).location===path(orgA)+'/'+id+'?notice=updated','Explicitly permitted Staff edits active project through native form.');
  assert((await post(oa,oaEdit,{name:'Stale edit',description:'Old form.'})).html.includes('project or your permissions have changed'),'Old project revision cannot overwrite Staff edit.');
  const current=project(id),racing=await Promise.all([oa,writer].map(async(actor,n)=>actor.client.rpc('update_organization_project',{...await newArgs(actor,orgA,id,{name:'Fictional concurrent review '+n,description:'Only one revision wins.'}),p_expected_revision:String(current.revision)})));
  assert(racing.filter(r=>!r.error).length===1&&racing.filter(r=>r.error?.code==='PT409').length===1,'Concurrent edits accept one revision and reject one stale update.');
  assert(project(id).revision===current.revision+1,'Concurrent edits advance revision only once.');
  const supportForm=form(await page(oa,path(orgA)+'/'+supportA),'data-project-form="update"');
  assert(supportForm.markup.includes('readOnly')||supportForm.markup.includes('readonly'),'General Support name input is fixed.');
  const rename=await post(oa,supportForm,{name:'Renamed General Support',description:'Invalid rename.'});
  assert(rename.html.includes('General Support has a fixed name')&&project(supportA).name==='General Support','Even a forged native field cannot rename General Support.');
  assert((await post(oa,supportForm,{name:'General Support',description:'For fictional company support requests.'})).location===path(orgA)+'/'+supportA+'?notice=updated','Admin may edit General Support description.');
  assert(sql('select count(*)::integer from public.projects where organization_id='+q(orgA)+' and is_general_support')===1,'General Support edit retains exactly one default project.');
  const bForm=form(await page(sa,path(orgB)),'data-project-form="create"'),bId=formField(bForm,'project_id');
  assert((await post(sa,bForm,{name:'Fictional B infrastructure',description:'Global administrator creation.'})).location===path(orgB)+'/'+bId+'?notice=created','SA creates in another active company.');
  stage='Staff revocation and old forms after regrant';
  const staffCreate=form(await page(writer,path(orgA)),'data-project-form="create"'),staffId=formField(staffCreate,'project_id');
  await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(writer,true,false),'Revoke only project-writing permission.');
  assert((await context(writer,orgA)).data[0].can_create===false&&(await list(writer,orgA)).data.length===2,'Same Staff JWT retains reading but loses project write capability.');
  assert((await post(writer,staffCreate,{name:'Revoked create',description:'Must fail.'})).html.includes('project-writing access is unavailable')&&project(staffId)===null,'Same cookie cannot submit old create after permission revoke.');
  await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(writer,true,true),'Regrant permission at new assignment revision.');
  assert((await post(writer,staffCreate,{name:'Old permission create',description:'Must fail.'})).html.includes('project or your permissions have changed')&&project(staffId)===null,'Regrant does not revive old form.');
  const freshStaff=form(await page(writer,path(orgA)),'data-project-form="create"'),freshStaffId=formField(freshStaff,'project_id');
  assert((await post(writer,freshStaff,{name:'Fictional Staff project',description:'New permission form.'})).location===path(orgA)+'/'+freshStaffId+'?notice=created','Fresh Staff form creates under current permission.');
  await allowedRpc(oa.client,'set_staff_organization_assignment',staffArgs(writer,false,false),'Revoke full Staff company assignment.');
  assert((await list(writer,orgA)).error?.code==='42501'&&!(await page(writer,path(orgA))).html.includes('data-project-record='),'Same Staff JWT/cookie immediately loses all company project reading.');
  assert(!(await page(writer,path(orgA)+'/'+freshStaffId)).html.includes('data-project-detail='),'Project authorhood grants no reading after assignment revocation.');
  stage='pagination, filters and inactive states';
  for(let n=0;n<26;n++)await allowedRpc(oa.client,'create_organization_project',await newArgs(oa,orgA,randomUUID(),{name:'Fictional page project '+String(n).padStart(2,'0'),description:'Pagination fixture.'}),'Create scoped pagination project.');
  const first=await list(clientA,orgA),secondPage=await list(clientA,orgA,'active',25);
  assert(first.data.length===26&&first.data[0].id===supportA&&secondPage.data.length===4,'General Support first and bounded 25-row lookahead.');
  const firstWeb=await page(clientA,path(orgA)),secondWeb=await page(clientA,path(orgA)+'?page=2'),empty=await page(clientA,path(orgA)+'?page=3');
  assert((firstWeb.html.match(/data-project-record=/g)??[]).length===25&&firstWeb.html.includes('Next page'),'First native list page is bounded with next link.');
  assert((secondWeb.html.match(/data-project-record=/g)??[]).length===4&&secondWeb.html.includes('Previous page'),'Second native list page shows remaining projects.');
  assert(empty.html.includes('No matching projects')&&empty.html.includes('Go to first page'),'Empty later page has a recovery link.');
  for(const args of [{p_status:'wrong'},{p_offset:-1},{p_offset:250000}]) assert((await oa.client.rpc('organization_projects',{p_organization_id:orgA,...args})).error?.code==='22023','RPC validates project filters.');
  assert((await list(reader,orgA,'all')).error?.code==='42501','Assigned Staff cannot request inactive admin history.');
  assert((await page(clientA,path(orgA)+'?status=all&page=-1')).html.replace(/<!--.*?-->/g,'').includes('Page 1'),'Client forged filter falls back to first active page.');
  sql('with changed as(update public.projects set status=\'inactive\' where id='+q(id)+' returning id) select count(*)::integer from changed');
  assert(!(await page(clientA,path(orgA)+'/'+id)).html.includes('data-project-detail='),'Inactive project disappears from Client details.');
  assert((await list(oa,orgA,'inactive')).data.some(p=>p.id===id)&&(await page(oa,path(orgA)+'?status=inactive')).html.includes(id),'OA can read existing inactive project history.');
  assert(!(await page(oa,path(orgA)+'/'+id)).html.includes('data-project-form='),'Inactive project has no edit form.');
  const inactiveUpdate=await oa.client.rpc('update_organization_project',{...await newArgs(oa,orgA,id,{name:'Inactive edit',description:'Denied.'}),p_expected_revision:String(project(id).revision)});
  assert(inactiveUpdate.error?.code==='22023','Direct RPC cannot edit an inactive project.');
  stage='transfer and revoked OA scope with same sessions';
  const originalCookie=[...clientA.cookies],codeB=(await allowedRpc(oaB.client,'manage_organization_access_code',{p_organization_id:orgB,p_expected_code_id:null,p_intent:'issue'},'Issue transfer fixture code.'))[0];
  assert((await clientA.client.rpc('submit_organization_transfer',{p_code:codeB.code})).data==='submitted','Client requests transfer while retaining current projects.');
  const transfer=sql('select to_jsonb(r) from public.organization_change_requests r where user_id='+q(clientA.id)+' and status=\'pending\'');
  assert((await sa.client.rpc('review_organization_transfer',{p_request_id:transfer.id,p_expected_revision:String(transfer.revision),p_intent:'approve',p_side:'super_admin'})).data==='approved','SA completes fixture transfer.');
  assert((await list(clientA,orgA)).error?.code==='42501'&&(await list(clientA,orgB)).data.length===2,'Same Client JWT immediately changes project company scope.');
  assert(!(await page(clientA,path(orgA)+'/'+supportA)).html.includes('data-project-detail=')&&(await page(clientA,path(orgB)+'/'+bId)).html.includes('data-project-detail='),'Same cookie loses old project detail and gains destination detail.');
  assert(JSON.stringify([...clientA.cookies])===JSON.stringify(originalCookie),'Transfer requires no replacement browser session.');
  const savedOA=form(await page(oa,path(orgA)),'data-project-form="create"');
  await allowedRpc(sa.client,'set_organization_admin_assignment',oaArgs(oa,orgA,false),'Revoke OA fixture company.');
  assert((await context(oa,orgA)).error?.code==='42501'&&!(await page(oa,path(orgA))).html.includes('data-project-record='),'Same OA session immediately loses project scope.');
  assert((await post(oa,savedOA,{name:'Revoked OA project',description:'Denied.'})).html.includes('project-writing access is unavailable'),'Copied old OA form cannot bypass revoked scope.');
  sql('with changed as(update public.organizations set status=\'inactive\' where id='+q(orgB)+' returning id) select count(*)::integer from changed');
  assert((await context(sa,orgB)).data[0].can_create===false&&!((await page(sa,path(orgB))).html.includes('data-project-form="create"')),'SA has read-only project history for inactive company.');
  assert((await sa.client.rpc('create_organization_project',await newArgs(sa,orgB,randomUUID(),{name:'Inactive company project',description:'Denied.'}))).error?.code==='22023','Inactive company cannot receive new projects via RPC.');
  assert((await list(clientB,orgB)).error?.code==='42501','Inactive company removes Client project access under current policy.');
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
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/organization-projects-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Organization project API/native-form matrix: '+checks+' checks / '+(failed?'FAILED.':'PASS.'));if(failed)process.exitCode=1;

