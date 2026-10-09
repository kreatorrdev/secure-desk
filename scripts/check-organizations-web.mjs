import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Organization screen Auth/Data API/SSR checks; six new fictional accounts and two retained companies.
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
  const email='securedesk-org-ui-'+label+'-'+randomUUID().slice(0,8)+'@securedesk.example.invalid',password=randomBytes(24).toString('base64url')+'aA8!';
  const client=createClient(api,key,options),account={label,email,client,cookies:new Map()};accounts.push(account);
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional Organization Screen Account',phone:'+12025550602',company_name:'Fictional Gate 2 Company',message:'Final local access matrix.',app_role:'super_admin',account_status:'active'}}});
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
  const host = JSON.parse(command(['context', 'inspect', '--format', '{{json .Endpoints.docker.Host}}']));
  if (!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host) && host !== 'unix:///var/run/docker.sock') throw new CheckError('Expected local Docker context.');
  const labels = JSON.parse(command(['inspect', 'supabase_db_secure-desk', '--format', '{{json .Config.Labels}}']));
  if (labels['com.supabase.cli.project'] !== 'secure-desk' || labels['com.supabase.cli.workdir'] !== root.replace(/[\\/]$/, '')) throw new CheckError('Unexpected local project/workspace.');
  baseline = snapshot();
  adminCount = sql("select count(*)::integer from public.profiles where app_role='super_admin'");
  stage = 'signup/email/session';
  for (const label of ['super-admin','org-admin','staff','client-a','client-b','pending']) await register(label);
  const [sa, oa, staff, clientA, clientB, pending] = accounts;
  const anonymous = createClient(api, key, options);
  stage = 'controlled fixture approvals';
  assert(sql("with changed as(update public.profiles set app_role='super_admin',account_status='active' where id=" + q(sa.id) + " and full_name='Fictional Organization Screen Account' and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed") === 1, 'Only the new fixture receives temporary SA bootstrap.');
  for (const [target, role] of [[staff,'staff'],[oa,'admin']]) await allowedRpc(sa.client, 'approve_privileged_registration', {p_request_id:requestFor(target.id).id,p_role:role,p_reason:'Fictional organization screen approval.'}, 'Approve fixture ' + role);
  const marker = '<script>window.organizationProbe=true</script>';
  const details = label => ({name:'Fictional Organization UI '+label+' '+randomUUID().slice(0,8),address:'Fictional office, 12 Example Lane',email:'org-ui-'+label.toLowerCase()+'@securedesk.example.invalid',phone:'+12025550644',description:'Company '+label+' profile. '+marker});
  const a = details('A'), b = details('B');
  orgA = await allowedRpc(sa.client, 'approve_registration_new_organization', {p_request_id:requestFor(clientA.id).id,p_details:a}, 'Create company A and Client membership atomically.');
  orgB = await allowedRpc(sa.client, 'approve_registration_new_organization', {p_request_id:requestFor(clientB.id).id,p_details:b}, 'Create company B and Client membership atomically.');
  await allowedRpc(sa.client, 'set_organization_admin_assignment', {p_organization_id:orgA,p_admin_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_expected_assignment_revision:null,p_active:true,p_reason:'Fictional OA scope A.'}, 'Assign OA to A.');
  await allowedRpc(oa.client, 'set_staff_organization_assignment', {p_organization_id:orgA,p_staff_user_id:staff.id,p_expected_access_revision:revision(staff.id),p_expected_assignment_revision:null,p_active:true,p_can_create_project:false,p_reason:'Fictional Staff scope A.'}, 'Assign Staff to A.');
  await allowedRpc(sa.client, 'route_registration_request', {p_request_id:requestFor(pending.id).id,p_organization_id:orgA}, 'Route Pending request without granting membership.');

  stage = 'organization API and web matrix';
  for (const account of [null, ...accounts]) {
    const label = account?.label ?? 'anonymous', before = checks;
    const authorized = account && account !== pending;
    const expected = account === sa ? [orgA, orgB] : [oa,staff,clientA].includes(account) ? [orgA] : account === clientB ? [orgB] : [];
    const client = account?.client ?? anonymous;
    const apiRows = await client.from('organizations').select('id,name,description,address,email,phone,industry,contact_person,status').in('id', [orgA,orgB]).order('id');
    assert(account ? !apiRows.error && JSON.stringify(apiRows.data.map(row=>row.id)) === JSON.stringify([...expected].sort()) : apiRows.error?.code === '42501', label + ': exact API scope.');
    const list = await page(account, '/organizations');
    assert(list.headers.get('cache-control')?.includes('no-store'), label + ': organization list is not cached.');
    if (!authorized) {
      assert(list.location === (account ? '/account' : '/login') && !list.html.includes('data-organization='), label + ': organization list denied.');
    } else {
      const apiList = await client.from('organizations').select('id').order('name').order('id').limit(13);
      const visibleIds = [...list.html.matchAll(/data-organization="([^"]+)"/g)].map(match=>match[1]);
      assert(list.status === 200 && !list.location && JSON.stringify(visibleIds) === JSON.stringify(apiList.data.slice(0,12).map(row=>row.id)), label + ': rendered list matches RLS page exactly.');
      assert(list.html.includes('aria-label="Organization pages"') === (apiList.data.length > 12), label + ': pagination matches visible rows.');
      assert(!list.html.includes(a.email) && !list.html.includes(b.email), label + ': list does not include contact detail payload.');
    }
    for (const [id, company] of [[orgA,a],[orgB,b]]) {
      const detail = await page(account, '/organizations/' + id);
      const allowed = expected.includes(id);
      assert(detail.headers.get('cache-control')?.includes('no-store'), label + ': profile is not cached.');
      if (!authorized) assert(detail.location === (account ? '/account' : '/login'), label + ': profile denied before read.');
      else if (allowed) {
        assert(detail.status === 200 && detail.html.includes('data-organization-profile="'+id+'"') && detail.html.includes(company.email) && detail.html.includes(company.address), label + ': allowed contact profile is rendered.');
        assert(detail.html.includes('&lt;script&gt;window.organizationProbe=true&lt;/script&gt;') && !detail.html.includes(marker), label + ': company text is escaped.');
        assert(detail.html.includes('Not provided') && detail.html.includes('Industry not provided'), label + ': optional fields have readable fallbacks.');
      } else assert(detail.html.includes('Organization not available') && !detail.html.includes(company.name) && !detail.html.includes(company.email) && !detail.html.includes('data-organization-profile='), label + ': foreign profile is hidden.');
    }
    if (account) {
      const accountPage = await page(account, '/account');
      assert(accountPage.html.includes('href="/organizations"') === Boolean(authorized), label + ': account navigation matches approval.');
    }
    matrix.push({role:label,checks:checks-before,result:'PASS'});
    console.log('PASS: '+label+' / '+(checks-before)+' organization checks.');
  }

  // Only fictional Client B content is saved for local visual QA; no cookies/session data.
  const previewDir = new URL('../.tools/verification/organization-preview/', import.meta.url);
  mkdirSync(previewDir, {recursive:true});
  for (const [name, path] of [['list','/organizations'],['profile','/organizations/'+orgB],['unavailable','/organizations/'+orgA]]) {
    const rendered = await page(clientB, path);
    writeFileSync(new URL(name+'.html',previewDir), rendered.html);
  }
  stage = 'pagination, malformed IDs and metadata';
  const second = await page(sa, '/organizations?page=2');
  const expectedSecond = await sa.client.from('organizations').select('id').order('name').order('id').range(12,23);
  assert(JSON.stringify([...second.html.matchAll(/data-organization="([^"]+)"/g)].map(m=>m[1])) === JSON.stringify(expectedSecond.data.map(r=>r.id)), 'Second page has exact ordered RLS rows.');
  const emptyPage = await page(clientA, '/organizations?page=9999');
  assert(emptyPage.html.includes('No organizations on this page') && !emptyPage.html.includes('data-organization='), 'Out-of-range page has an empty state.');
  for (const query of ['?page=-1','?page=1&page=2','?page=1%20or%201=1','?page=10000000000']) {
    const r = await page(clientA, '/organizations'+query);
    assert(r.html.includes('data-organization="'+orgA+'"') && !r.html.includes('data-organization="'+orgB+'"'), 'Invalid page safely falls back to the first scoped page.');
  }
  for (const id of [orgB, randomUUID(), 'invalid-id']) {
    const r = await page(clientA, '/organizations/'+id);
    assert(r.html.includes('Organization not available') && !r.html.includes(b.name) && !r.html.includes(b.email) && !r.html.includes('data-organization-profile='), 'Foreign, missing and malformed IDs share an unavailable view.');
  }
  assert(!(await clientA.client.auth.updateUser({data:{app_role:'super_admin',organization_id:orgB,account_status:'active'}})).error, 'Fixture metadata update succeeds without changing authority.');
  const forged = await page(clientA, '/organizations/'+orgB+'?role=super_admin&organization_id='+orgA+'&user_id='+sa.id);
  assert(forged.html.includes('Organization not available') && !forged.html.includes(b.email), 'Forged metadata and query fields cannot expand scope.');
  const rsc = await fetch(site+'/organizations/'+orgB+'?_rsc', {headers:{cookie:[...clientA.cookies].map(([k,v])=>k+'='+v).join('; '),RSC:'1'},redirect:'manual'});
  const rscText = await rsc.text();
  assert(rsc.headers.get('content-type')?.includes('text/x-component') && !rscText.includes(b.name) && !rscText.includes(b.email) && !rscText.includes('data-organization-profile'), 'Direct RSC navigation cannot expose a foreign profile.');
  assert(rsc.headers.get('cache-control')?.includes('no-store'), 'RSC response is private/no-store.');

  stage = 'pending and inactive company scope';
  for (const state of ['pending','inactive']) {
    assert(sql('with changed as(update public.organizations set status='+q(state)+' where id='+q(orgA)+' returning id) select count(*)::integer from changed') === 1, 'Change only new company A fixture status.');
    for (const account of [clientA,staff,oa]) {
      const r = await page(account, '/organizations/'+orgA);
      assert(r.html.includes('Organization not available') && !r.html.includes(a.email), state+': non-SA profile is closed.');
    }
    assert((await page(sa, '/organizations/'+orgA)).html.includes(a.email), state+': SA retains existing global read scope.');
  }
  sql('with changed as(update public.organizations set status=\'active\' where id='+q(orgA)+' returning id) select count(*)::integer from changed');

  stage = 'same-session revocation and empty state';
  await allowedRpc(oa.client, 'set_staff_organization_assignment', {p_organization_id:orgA,p_staff_user_id:staff.id,p_expected_access_revision:revision(staff.id),p_expected_assignment_revision:String(sql('select revision from public.staff_organization_assignments where staff_user_id='+q(staff.id)+' and organization_id='+q(orgA))),p_active:false,p_can_create_project:false,p_reason:'Fictional screen revocation.'}, 'Revoke Staff assignment through scoped RPC.');
  await allowedRpc(sa.client, 'set_organization_admin_assignment', {p_organization_id:orgA,p_admin_user_id:oa.id,p_expected_access_revision:revision(oa.id),p_expected_assignment_revision:String(sql('select revision from public.organization_admin_assignments where admin_user_id='+q(oa.id)+' and organization_id='+q(orgA))),p_active:false,p_reason:'Fictional screen revocation.'}, 'Revoke OA assignment through SA RPC.');
  assert(sql("with changed as(update public.organization_members set status='ended',ended_at=greatest(now(),joined_at) where user_id="+q(clientA.id)+' and organization_id='+q(orgA)+" and status='active' returning id) select count(*)::integer from changed") === 1, 'End only the new Client A fixture membership.');
  for (const account of [clientA,staff,oa]) {
    const list = await page(account, '/organizations');
    const detail = await page(account, '/organizations/'+orgA);
    const apiRows = await account.client.from('organizations').select('id').eq('id',orgA);
    assert(list.html.includes('No organizations available') && !list.html.includes(a.name), account.label+': same cookie sees the empty state after revocation.');
    assert(detail.html.includes('Organization not available') && !detail.html.includes(a.email), account.label+': same cookie loses profile access.');
    assert(!apiRows.error && apiRows.data.length === 0, account.label+': same API session loses scope.');
  }
  writeFileSync(new URL('../.tools/verification/organization-preview/empty.html', import.meta.url), (await page(clientA, '/organizations')).html);
  await allowedRpc(sa.client, 'reject_registration_request', {p_request_id:requestFor(pending.id).id,p_reason:'Fictional screen rejection.'}, 'Reject Pending fixture through RPC.');
  assert((await page(pending, '/organizations')).location === '/account' && (await page(pending, '/organizations/'+orgA)).location === '/account', 'Rejected user remains restricted to account status.');
  assert(!(await page(pending, '/account')).html.includes('href="/organizations"'), 'Rejected user has no organization navigation.');
  assert((await page({cookies:new Map([['sb-127-auth-token','forged']])}, '/organizations/'+orgB)).location === '/login', 'Forged cookies cannot view a profile.');
  assert((await page(null, '/dashboard')).location === '/login', 'Anonymous dashboard requires sign-in.');
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
mkdirSync(new URL('../.tools/verification/',import.meta.url),{recursive:true});writeFileSync(new URL('../.tools/verification/organization-screen-result.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,result:failed?'FAIL':'PASS',matrix,retained_accounts:accounts.map(({id,label})=>({id,label})),retained_organizations:[orgA,orgB].filter(Boolean)},null,2));
console.log('Organization screen API/cookie matrix: '+checks+' checks / '+(failed?'FAILED.':'PASS.'));if(failed)process.exitCode=1;
