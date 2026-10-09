import { randomBytes, randomUUID } from 'node:crypto';
import { runLocalProcess as spawnSync } from './local-db-process.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';

// Local API test, with two retained fictional accounts and one fictional approved organization.
// The reviewer is promoted only during the test and restored in finally; no user credentials used.
class CheckError extends Error {}
const root=fileURLToPath(new URL('../',import.meta.url));
const api='http://127.0.0.1:54321';
const inbox='http://127.0.0.1:54324';
const docker=process.platform==='win32'?'docker.exe':'docker';
let checks=0, stage='setup', reviewer, applicant, reviewerId, promoted=false;
const q=value=>"'"+value.replaceAll("'","''")+"'";
const assert=(condition,label)=>{if(!condition)throw new CheckError(label); checks++;console.log('PASS: '+label);};
function command(executable,args,input) {
  const r=spawnSync(executable,args,{cwd:root,env:process.env,input,encoding:'utf8',timeout:30000});
  if(r.error||r.status!==0)throw new CheckError('Local verification failed; private output withheld.');
  return r.stdout;
}
function sql(query){return JSON.parse(command(docker,['exec','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1','-c',query]));}
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
  if(process.argv.slice(2).length!==1||process.argv[2]!=='--create-demo')throw new CheckError('Use --create-demo to retain two fictional accounts and one approved organization.');
  const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
  if(env.NEXT_PUBLIC_SUPABASE_URL!==api||env.SITE_URL!=='http://127.0.0.1:3000')throw new CheckError('Refusing a nonlocal app target.');
  if(process.env.DOCKER_HOST)throw new CheckError('Refusing a Docker host override.');
  const host=JSON.parse(command(docker,['context','inspect','--format','{{json .Endpoints.docker.Host}}']));
  if(!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host)&&host!=='unix:///var/run/docker.sock')throw new CheckError('Expected a local Docker context.');
  const labels=JSON.parse(command(docker,['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));
  if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw new CheckError('Unexpected local database project/workspace.');
  const local=JSON.parse(command(process.execPath,['node_modules/supabase/dist/supabase.js','status','-o','json']));
  if(local.API_URL!==api||!local.ANON_KEY)throw new CheckError('Expected the local SecureDesk stack.');
  const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
  reviewer=createClient(api,local.ANON_KEY,options);
  applicant=createClient(api,local.ANON_KEY,options);
  const anonymous=createClient(api,local.ANON_KEY,options);
  const suffix=randomUUID().slice(0,8);
  const reviewEmail='securedesk-reviewer-'+suffix+'@securedesk.example.invalid';
  const clientEmail='securedesk-applicant-'+suffix+'@securedesk.example.invalid';
  const existingAdmins=sql("select count(*)::integer from public.profiles where app_role='super_admin'");
  stage='signup/email/login';
  reviewerId=await register(reviewer,reviewEmail);
  const applicantId=await register(applicant,clientEmail);
  const request=await applicant.from('registration_requests').select('id,status,attempt_number').eq('user_id',applicantId).single();
  assert(!request.error&&request.data.status==='pending'&&request.data.attempt_number===1,'Session reads its own first pending request.');
  stage='permission denial';
  const anonymousList=await anonymous.rpc('admin_registration_requests');
  assert(anonymousList.error?.code==='42501','Anonymous API cannot call the administrator review list.');
  const metadata=await applicant.auth.updateUser({data:{app_role:'super_admin',account_status:'active'}});
  assert(!metadata.error,'Caller metadata may change without granting business rights.');
  const selfList=await applicant.rpc('admin_registration_requests');
  assert(selfList.error?.code==='42501','Forged metadata does not unlock the review RPC.');
  const selfReview=await applicant.rpc('reject_registration_request',{p_request_id:request.data.id,p_reason:'Self decision'});
  assert(selfReview.error?.code==='42501','Client cannot review its own request.');
  const earlyRetry=await applicant.rpc('resubmit_registration',{p_company_name:'Retry',p_phone:'+12025550901',p_message:'Retry'});
  assert(earlyRetry.error?.code==='42501','Pending Client cannot submit a duplicate retry.');
  stage='temporary fictional reviewer fixture';
  sql('with changed as (update public.profiles set app_role=\'super_admin\',account_status=\'active\' where id='+q(reviewerId)+" and app_role='client' and account_status='pending' returning id) select count(*)::integer from changed");
  promoted=true;
  assert(sql("select to_json(app_role='super_admin' and account_status='active') from public.profiles where id="+q(reviewerId)),'Only the newly created fictional reviewer receives the temporary fixture role.');
  let listing;
  for(let offset=0;offset<1000100;offset+=100){const batch=await reviewer.rpc('admin_registration_requests',{p_limit:100,p_offset:offset});if(batch.error){listing=batch;break;}const found=batch.data.filter(row=>row.user_id===applicantId);if(found.length||batch.data.length<100){listing={data:found,error:null};break;}}
  if(!listing)throw new CheckError('Fictional applicant absent from paginated administrator list.');
  assert(!listing.error&&listing.data.length===1&&listing.data[0].email===clientEmail,'Actual reviewer session receives scoped submitted details.');
  const badReason=await reviewer.rpc('reject_registration_request',{p_request_id:request.data.id,p_reason:'   '});
  assert(badReason.error?.code==='22023','Actual RPC requires a nonempty rejection explanation.');
  const rejection=await reviewer.rpc('reject_registration_request',{p_request_id:request.data.id,p_reason:'Please clarify these fictional company details.'});
  assert(!rejection.error&&rejection.data===request.data.id,'Reviewer rejection commits the controlled decision.');
  const rejected=await applicant.from('registration_requests').select('status,rejection_reason').eq('id',request.data.id).single();
  assert(!rejected.error&&rejected.data.status==='rejected'&&rejected.data.rejection_reason==='Please clarify these fictional company details.','Same Client session sees its rejection and reason.');
  const rejectedProjects=await applicant.from('projects').select('id');
  assert(!rejectedProjects.error&&rejectedProjects.data.length===0,'Rejected Client still has no private project access.');
  stage='concurrent retry';
  const retries=await Promise.all([1,2].map(()=>applicant.rpc('resubmit_registration',{p_company_name:'Fictional Updated Company '+suffix,p_phone:'+12025550902',p_message:'Clarified fictional company information.'})));
  assert(retries.filter(x=>!x.error).length===1&&retries.filter(x=>x.error?.code==='42501').length===1,'Two real concurrent retries produce exactly one success.');
  const nextId=retries.find(x=>!x.error).data;
  const history=await applicant.from('registration_requests').select('id,status,attempt_number,rejection_reason').eq('user_id',applicantId).order('attempt_number');
  assert(!history.error&&history.data.length===2&&history.data[0].status==='rejected'&&history.data[1].status==='pending'&&history.data[1].attempt_number===2,'New attempt preserves the old rejection in the same identity history.');
  assert(sql('select jsonb_build_object(\'pending\',count(*) filter(where status=\'pending\'),\'unrouted\',bool_and(target_organization_id is null) filter(where status=\'pending\')) from public.registration_requests where user_id='+q(applicantId)).unrouted,'Retry routing is reset rather than chosen by the Client.');
  stage='new organization approval';
  const details={name:'Fictional API Review Org '+suffix,address:'Example address',email:'company-'+suffix+'@securedesk.example.invalid',phone:'+12025550900',description:'Fictional company verified for the local API test.'};
  const forged=await reviewer.rpc('approve_registration_new_organization',{p_request_id:nextId,p_details:{...details,status:'active'}});
  assert(forged.error?.code==='22023','RPC rejects extra organization status fields.');
  const approvals=await Promise.all([1,2].map(()=>reviewer.rpc('approve_registration_new_organization',{p_request_id:nextId,p_details:details})));
  assert(approvals.filter(x=>!x.error).length===1&&approvals.filter(x=>x.error?.code==='42501').length===1,'Two real concurrent approvals produce exactly one organization.');
  const orgId=approvals.find(x=>!x.error).data;
  const state=sql("select jsonb_build_object('state',p.account_status,'role',p.app_role,'members',(select count(*) from public.organization_members where user_id=p.id and status='active'),'default_projects',(select count(*) from public.projects where organization_id="+q(orgId)+" and is_general_support),'orgs',(select count(*) from public.organizations where name="+q(details.name)+"),'audit',(select count(*) from public.audit_logs where target_id="+q(nextId)+" and event_type='registration.approved')) from public.profiles p where id="+q(applicantId));
  assert(state.state==='active'&&state.role==='client'&&state.members===1&&state.default_projects===1&&state.orgs===1&&state.audit===1,'Approval stores one active Client membership, one General Support and one decision audit.');
  const projects=await applicant.from('projects').select('organization_id,name,is_general_support');
  assert(!projects.error&&projects.data.length===1&&projects.data[0].organization_id===orgId&&projects.data[0].name==='General Support','Same approved Client session now sees only its organization support project.');
  const audit=await applicant.from('audit_logs').select('id');
  assert(!audit.error&&audit.data.length===0,'Approved Client cannot read raw administrator audit.');
  const roleUpdate=await applicant.from('profiles').update({app_role:'super_admin'}).eq('id',applicantId);
  assert(roleUpdate.error?.code==='42501','Approved Client still cannot change its stored role.');
  const rawReview=await reviewer.from('registration_requests').update({status:'approved'}).eq('id',nextId);
  assert(rawReview.error?.code==='42501','Even the real reviewer session cannot perform direct review UPDATE.');
  const afterRetry=await applicant.rpc('resubmit_registration',{p_company_name:'Transfer','p_phone':'+12025550902',p_message:'Wrong workflow'});
  assert(afterRetry.error?.code==='42501','Approved Client cannot use retry as an organization transfer.');
  await restoreReviewer();
  assert(sql("select count(*)::integer from public.profiles where app_role='super_admin'")===existingAdmins,'Original Super Admin count is restored.');
  const removed=await reviewer.rpc('admin_registration_requests');
  assert(removed.error?.code==='42501','Existing reviewer token loses privilege immediately after restoring its fixture role.');
  console.log('Local registration API checks: '+checks+' passed. Retained fictional applicant: '+clientEmail);
  console.log('Retained fictional reviewer is client/pending: '+reviewEmail);
  console.log('One fictional approved organization and its history are retained; credentials/tokens stay only in memory.');
}
async function restoreReviewer(){
  if(!promoted)return;
  const count=sql('with changed as (update public.profiles set app_role=\'client\',account_status=\'pending\' where id='+q(reviewerId)+" and app_role='super_admin' returning id) select count(*)::integer from changed");
  if(count!==1)throw new CheckError('Could not restore the fictional reviewer role; inspect the local fixture.');
  promoted=false;
}
try { await run(); } catch(error){
  console.error('FAIL during '+stage+': '+(error instanceof CheckError?error.message:'Local API check failed; private details withheld.'));
  process.exitCode=1;
} finally {
  try {await restoreReviewer();} catch {console.error('Local fictional reviewer cleanup needs inspection.');process.exitCode=1;}
  for(const client of [reviewer,applicant])if(client){try {const result=await client.auth.signOut({scope:'local'});if(result.error)process.exitCode=1;} catch {process.exitCode=1;}}
}
