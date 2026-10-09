import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';

// Local real Auth/RPC checks. Retains three fictional accounts, two organizations and audited history.
// The temporary fixture Super Admin is restored; no real user credentials are used.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321';
const inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
let checks=0,stage='setup',reviewerId,baselineAdmins;const accounts=[];const ids=[];
const q=value=>"'"+value.replaceAll("'","''")+"'";
const assert=(condition,label)=>{if(!condition)throw new CheckError(label); checks++;console.log('PASS: '+label);};
function command(executable,args,input) {
  const r=spawnSync(executable,args,{cwd:root,env:process.env,input,encoding:'utf8',timeout:30000});
  if(r.error||r.status!==0)throw new CheckError('Local verification failed; private output withheld.');
  return r.stdout;
}
function sql(query){const output=command(docker,['exec','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1','-c',query]).trim();return output?JSON.parse(output):null;}
async function register(client,email) {
  const password=randomBytes(24).toString('base64url')+'aA8!';
  const signup=await client.auth.signUp({email,password,options:{data:{full_name:'Fictional API Review Account',phone:'+12025550901',company_name:'Fictional API Review Company',message:'Local controlled registration workflow test.'}}});
  assert(!signup.error&&signup.data.user?.id&&signup.data.session===null,'Real signup creates a pending account without session.');
  let messageId;
  for(let n=0;n<20&&!messageId;n++){
    const response=await fetch(inbox+'/api/v1/messages',{signal:AbortSignal.timeout(5000)});
    const listing=await response.json();
    const message=(listing.messages??listing.Messages??[]).find(x=>(x.To??x.to??[]).some(to=>(to.Address??to.address)===email));
    messageId=message?.ID??message?.id;
    if(!messageId)await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!messageId)throw new CheckError('Local confirmation message not available.');
  const response=await fetch(inbox+'/api/v1/message/'+encodeURIComponent(messageId),{signal:AbortSignal.timeout(5000)});
  const mail=await response.json();
  const content=[mail.HTML,mail.html,mail.Text,mail.text].filter(x=>typeof x==='string').join(' ').replaceAll('&amp;','&');
  let token;
  for(const match of content.matchAll(/https?:\/\/[^\s<>"']+/g)){
    const link=new URL(match[0]);
    if(link.origin==='http://127.0.0.1:3000'&&link.pathname==='/auth/confirm'&&link.searchParams.get('type')==='email')token=link.searchParams.get('token_hash');
  }
  if(!token)throw new CheckError('Expected local application confirmation link.');
  const confirmed=await client.auth.verifyOtp({token_hash:token,type:'email'});
  assert(!confirmed.error&&confirmed.data.user?.id===signup.data.user.id,'Real local email confirmation verifies the same identity.');
  // Close the confirmation session before creating a separate password-login session.
  const confirmationSignout=await client.auth.signOut({scope:'local'});
  if(confirmationSignout.error)throw new CheckError('Confirmation session cleanup failed.');
  const login=await client.auth.signInWithPassword({email,password});
  assert(!login.error&&login.data.user?.id===signup.data.user.id,'Confirmed account receives a real password-login session.');
  return signup.data.user.id;
}
async function run(){
  if(process.argv.slice(2).length!==1||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo to retain three fictional accounts and two organizations.');
  const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
  if(env.NEXT_PUBLIC_SUPABASE_URL!==api||env.SITE_URL!=='http://127.0.0.1:3000'||process.env.DOCKER_HOST)throw new CheckError('Refusing a nonlocal target.');
  const host=JSON.parse(command(docker,['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
  if(!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host)&&host!=='unix:///var/run/docker.sock')throw new CheckError('Expected local Docker context.');
  const labels=JSON.parse(command(docker,['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
  if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw new CheckError('Unexpected project/workspace.');
  const local=JSON.parse(command(process.execPath,['node_modules/supabase/dist/supabase.js','status','-o','json']));
  if(local.API_URL!==api||!local.ANON_KEY||env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!==local.ANON_KEY)throw new CheckError('Expected local SecureDesk public key.');
  const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
  const suffix=randomUUID().slice(0,8);
  baselineAdmins=sql("select count(*)::integer from public.profiles where app_role='super_admin'");
  stage='signup/email/login';
  for(const label of ['reviewer','admin','staff']){
    const client=createClient(api,local.ANON_KEY,options);accounts.push(client);
    ids.push(await register(client,'access-'+label+'-'+suffix+'@securedesk.example.invalid'));
  }
  const [sa,oa,staff]=accounts;const [saId,oaId,staffId]=ids;reviewerId=saId;
  stage='owner fixture setup';
  // Owner fixture setup is strictly local; all tested business mutations below use real JWT RPCs.
  sql("update public.profiles set app_role='super_admin',account_status='active' where id="+q(saId)+";select to_jsonb(true)");
  const orgA=randomUUID(),orgB=randomUUID();
  for(const [org,label] of [[orgA,'A'],[orgB,'B']])sql("insert into public.organizations(id,name,description,address,email,phone,status) values("+q(org)+","+q('Fictional Access '+label+' '+suffix)+",'Local access test company.','Fixture address','access-org@securedesk.example.invalid','+12025550511','active');insert into public.projects(organization_id,name,description,is_general_support,created_by_user_id) values("+q(org)+",'General Support','Fixture support.',true,"+q(saId)+");select to_jsonb(true)");
  const access=id=>sql('select access_revision from public.profiles where id='+q(id));
  const request=id=>sql('select to_jsonb(r) from public.registration_requests r where user_id='+q(id)+' order by attempt_number desc limit 1');
  const assignment=(org,id,isStaff=true)=>sql('select to_jsonb(a) from public.'+(isStaff?'staff_organization_assignments':'organization_admin_assignments')+' a where organization_id='+q(org)+' and '+(isStaff?'staff_user_id':'admin_user_id')+'='+q(id))??null;
  const setStaff=(client,org,active,permission,expected=assignment(org,staffId)?.revision??null,userVersion=access(staffId))=>client.rpc('set_staff_organization_assignment',{p_organization_id:org,p_staff_user_id:staffId,p_expected_access_revision:userVersion,p_expected_assignment_revision:expected,p_active:active,p_can_create_project:permission,p_reason:'Fictional local Staff assignment decision.'});
  const setAdmin=(active,expected=assignment(orgA,oaId,false)?.revision??null)=>sa.rpc('set_organization_admin_assignment',{p_organization_id:orgA,p_admin_user_id:oaId,p_expected_access_revision:access(oaId),p_expected_assignment_revision:expected,p_active:active,p_reason:'Fictional local Admin scope decision.'});
  const changeRole=(id,newRole,expected=access(id))=>sa.rpc('change_account_role',{p_user_id:id,p_expected_access_revision:expected,p_new_role:newRole,p_reason:'Fictional local role decision.'});
  const privateRows=async(client,table)=>client.from(table).select('id').in(table==='organizations'?'id':'organization_id',[orgA,orgB]);
  const staffRequest=request(staffId),adminRequest=request(oaId);
  const anon=createClient(api,local.ANON_KEY,options);
  assert((await anon.rpc('approve_privileged_registration',{p_request_id:staffRequest.id,p_role:'staff',p_reason:'Not authorized.'})).error?.code==='42501','Anonymous API cannot approve privileged roles.');
  assert((await staff.rpc('approve_privileged_registration',{p_request_id:staffRequest.id,p_role:'staff',p_reason:'Self approval.'})).error?.code==='42501','Pending account cannot approve its own Staff role.');
  stage='concurrent privileged approval';
  const approvals=await Promise.all([1,2].map(()=>sa.rpc('approve_privileged_registration',{p_request_id:staffRequest.id,p_role:'staff',p_reason:'Approved fictional Staff.'})));
  assert(approvals.filter(x=>!x.error).length===1&&approvals.filter(x=>x.error?.code==='42501').length===1,'Concurrent privileged approvals yield exactly one success.');
  assert(request(staffId).status==='approved'&&request(staffId).message===staffRequest.message,'Staff approval retains original request content.');
  assert(sql("select count(*)::integer from public.audit_logs where event_type='registration.privileged_approved' and target_id="+q(staffRequest.id))===1,'Concurrent approval creates exactly one audit event.');
  assert(!(await sa.rpc('approve_privileged_registration',{p_request_id:adminRequest.id,p_role:'admin',p_reason:'Approved fictional Admin.'})).error,'SA approves Admin through real authenticated RPC.');
  const roleNow=await staff.rpc('current_account_role');
  assert(!roleNow.error&&roleNow.data==='staff','Session issued while pending immediately sees stored Staff role.');
  const beforeAssignment=await privateRows(staff,'organizations');assert(!beforeAssignment.error&&beforeAssignment.data.length===0,'Staff role without assignment gives no organization access.');
  assert(!(await setAdmin(true)).error,'SA assigns Admin organization A explicitly.');
  assert(!(await setStaff(oa,orgA,true,false)).error,'OA assigns existing Staff to own company.');
  assert((await setStaff(oa,orgB,true,false)).error?.code==='42501','OA cannot assign Staff to another company.');
  assert(!(await setStaff(sa,orgB,true,false)).error,'SA can assign Staff to a second company.');
  const multi=await privateRows(staff,'projects');assert(!multi.error&&multi.data.length===2,'Same Staff session reads projects in both assigned companies.');
  assert(!assignment(orgA,staffId).can_create_project,'Staff assignment does not automatically grant project creation.');
  stage='concurrent permission update';
  const version=assignment(orgA,staffId).revision;
  const permissions=await Promise.all([1,2].map(()=>setStaff(oa,orgA,true,true,version)));
  assert(permissions.filter(x=>!x.error).length===1&&permissions.filter(x=>x.error?.code==='42501').length===1,'Concurrent permission changes reject the stale assignment revision.');
  assert(assignment(orgA,staffId).revision===version+1&&assignment(orgA,staffId).can_create_project,'Permission changes only once and advances assignment revision.');
  const forged=await staff.auth.updateUser({data:{app_role:'super_admin',organization_id:orgB}});
  assert(!forged.error&&(await staff.rpc('change_account_role',{p_user_id:oaId,p_expected_access_revision:access(oaId),p_new_role:'staff',p_reason:'Forged role.'})).error?.code==='42501','Editable Auth metadata cannot turn Staff into Super Admin.');
  stage='Admin revocation race';
  const race=await Promise.all([setAdmin(false),setStaff(oa,orgA,true,false)]);
  assert(!race[0].error&&(!race[1].error||race[1].error.code==='42501'),'Admin revocation and in-flight scoped write serialize safely.');
  const revokedAdmin=await privateRows(oa,'organizations');assert(!revokedAdmin.error&&revokedAdmin.data.length===0,'Existing Admin token loses company scope after revocation.');
  assert((await setStaff(oa,orgA,true,true)).error?.code==='42501','Revoked Admin token cannot perform another company write.');
  assert(!(await setAdmin(true)).error,'Fresh explicit revision can regrant Admin scope.');
  stage='role change race';
  const oldRoleVersion=access(staffId),oldAssignmentVersion=assignment(orgA,staffId).revision;
  const roleRace=await Promise.all([changeRole(staffId,'admin'),setStaff(oa,orgA,true,!assignment(orgA,staffId).can_create_project)]);
  assert(!roleRace[0].error&&(!roleRace[1].error||roleRace[1].error.code==='42501'),'Global role change and scoped permission update serialize safely.');
  assert([orgA,orgB].every(org=>!assignment(org,staffId).active&&!assignment(org,staffId).can_create_project),'Role change disables every old Staff assignment and project permission.');
  const scopedAudit=await oa.from('audit_logs').select('id,organization_id').eq('event_type','staff.assignment_revoked_by_role_change').eq('metadata_redacted->>user_id',staffId);
  assert(!scopedAudit.error&&scopedAudit.data.length===1&&scopedAudit.data[0].organization_id===orgA,'OA reads own company role-change revocation without other company audit.');
  const globalAudit=await oa.from('audit_logs').select('id').eq('event_type','account.role_changed').eq('target_id',staffId);
  assert(!globalAudit.error&&globalAudit.data.length===0,'OA cannot read global role-change metadata.');
  const noOldAdminAccess=await privateRows(staff,'projects');assert(!noOldAdminAccess.error&&noOldAdminAccess.data.length===0,'New Admin role does not inherit old Staff organization access.');
  assert(!(await changeRole(staffId,'staff')).error,'SA restores Staff role without restoring old assignments.');
  assert((await setStaff(sa,orgA,true,false,null,oldRoleVersion)).error?.code==='42501','Old role revision cannot regrant after Staff/Admin/Staff cycle.');
  assert((await setStaff(sa,orgA,true,false,oldAssignmentVersion)).error?.code==='42501','Old assignment version cannot overwrite role-change revocation.');
  assert(!(await setStaff(sa,orgA,true,false)).error,'Explicit fresh role and assignment revisions allow new Staff grant.');
  const one=await privateRows(staff,'projects');assert(!one.error&&one.data.length===1,'Fresh Staff assignment grants only the chosen company.');
  const currentVersion=assignment(orgA,staffId).revision;
  assert(!(await setStaff(sa,orgA,false,false)).error,'SA revokes Staff organization A.');
  const none=await privateRows(staff,'projects');assert(!none.error&&none.data.length===0,'Unchanged Staff session loses project access immediately.');
  assert((await setStaff(sa,orgA,true,false,currentVersion)).error?.code==='42501','Pre-revocation form cannot recreate access.');
  assert(sql('select count(*)::integer from public.organization_members where user_id in ('+q(staffId)+','+q(oaId)+')')===0,'Privileged role and assignment flows create no Client membership.');
  stage='demotion and cleanup';
  assert(!(await changeRole(oaId,'client')).error&&!(await changeRole(staffId,'client')).error,'SA can revoke both privileged roles to unassigned Clients.');
  const finalRole=await oa.rpc('current_account_role');assert(!finalRole.error&&finalRole.data==='client','Existing demoted Admin token immediately sees Client role.');
  const finalAdmin=await privateRows(oa,'organizations');assert(!finalAdmin.error&&finalAdmin.data.length===0,'Demoted Admin has no former organization access.');
}
let failed=false;
try{await run();}catch(error){failed=true;console.error('FAIL at '+stage+': '+(error instanceof CheckError?error.message:'Private failure details withheld.'));}
finally{
  try{
    if(ids.length){
      const targets=ids.map(q).join(',');
      // Fixture-only fail-safe cleanup preserves request/audit history and revokes all test privileges.
      try{sql('update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id in ('+targets+') and (active or can_create_project);update public.organization_admin_assignments set active=false where admin_user_id in ('+targets+') and active;update public.profiles set app_role=\'client\' where id in ('+targets+');'+(reviewerId?'update public.profiles set account_status=\'pending\' where id='+q(reviewerId)+';':'')+'select to_jsonb(true)');}catch{failed=true;console.error('FAIL: Fixture role cleanup needs attention.');}
    }
    const signouts=await Promise.allSettled(accounts.map(account=>account.auth.signOut({scope:'local'})));
    if(signouts.some(r=>r.status!=='fulfilled'||r.value.error))throw new CheckError('Fixture signout failed.');
    if(baselineAdmins!==undefined)assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===baselineAdmins,'Fixture Super Admin is restored; persistent Super Admin count unchanged.');
    if(ids.length)assert(sql('select count(*)::integer from auth.sessions where user_id in ('+ids.map(q).join(',')+')')===0,'All fixture Auth sessions are closed.');
  }catch{failed=true;console.error('FAIL: Fixture cleanup requires attention; private details withheld.');}
}
console.log('Local access management: '+checks+' checks'+(failed?' / FAILED.':' / PASS.'));
if(failed)process.exitCode=1;
