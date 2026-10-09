import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=new URL('../.tools/verification/gate6/',import.meta.url),docker=process.platform==='win32'?'docker.exe':'docker',results=[];
mkdirSync(dir,{recursive:true});
if(process.argv[2]!=='--create-demo'||process.argv.length!==3)throw Error('Use --create-demo for retained fictional local Gate 6 fixtures.');
const env=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));if(env.NEXT_PUBLIC_SUPABASE_URL!=='http://127.0.0.1:54321'||env.SITE_URL!=='http://127.0.0.1:3000'||process.env.DOCKER_HOST)throw Error('Gate 6 requires this local application.');
const sync=(args,input)=>{const r=spawnSync(docker,args,{cwd:root,input,encoding:'utf8',timeout:30000});if(r.status||r.error)throw Error('Local Gate 6 database control failed');return r.stdout.trim();};
const labels=JSON.parse(sync(['inspect','supabase_db_secure-desk','--format','{{json .Config.Labels}}']));if(labels['com.supabase.cli.project']!=='secure-desk'||labels['com.supabase.cli.workdir']!==root.replace(/[\\/]$/,''))throw Error('Unexpected local database project');
const sql=s=>sync(['exec','-i','supabase_db_secure-desk','psql','-U','postgres','-d','postgres','-X','-q','-At','-v','ON_ERROR_STOP=1'],s);
if(process.env.SECUREDESK_GATE6_RESUME!=='1'||!existsSync(new URL('integrity-before.json',dir))){const capture=spawnSync(process.execPath,['scripts/check-gate6-integrity.mjs','--capture'],{cwd:root,encoding:'utf8',timeout:30000});if(capture.status||capture.error)throw Error('Gate 6 integrity baseline failed');}
const backups=['phase5-step2/database-web-before.json','phase5-step2/attachments-web-result.json','phase5-resolution-ui/practice.json','phase5-resolution-ui/web-result.json','phase5-autoclose/practice.json','phase5-autoclose/fixtures.json','phase5-autoclose/runtime-result.json','ticket-client-preview.html','ticket-owner-preview.html','ticket-browser-target.json','ticket-dashboard-client.html','ticket-dashboard-admin.html','tickets-result.json'];
for(const name of backups){if(process.env.SECUREDESK_GATE6_RESUME==='1'&&existsSync(new URL('before-'+name.replaceAll('/','-'),dir)))continue;const source=new URL('../.tools/verification/'+name,import.meta.url);if(existsSync(source))copyFileSync(source,new URL('before-'+name.replaceAll('/','-'),dir));}
const previous=process.env.SECUREDESK_GATE6_RESUME==='1'&&existsSync(new URL('suite-result.json',dir))?JSON.parse(readFileSync(new URL('suite-result.json',dir))).results:[];
async function run(name,args){if(previous.some(r=>r.name===name&&r.result==='PASS')){results.push(previous.find(r=>r.name===name));console.log(name+': earlier PASS reused');return;}console.log('Checking '+name+'…');const child=spawn(process.execPath,args,{cwd:root,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);const code=await new Promise(resolve=>child.on('close',resolve));writeFileSync(new URL(name+'.log',dir),output);const result={name,result:code===0?'PASS':'FAIL',exit_code:code};results.push(result);if(code!==0)throw Error(name+' failed; inspect its local log.');console.log(name+': PASS');}
let paused=false,failed=false;
try{
 await run('security-controls',['--test','scripts/security-controls.test.mjs']);
 await run('bootstrap-guards',['--test','scripts/bootstrap-local-super-admin.test.mjs']);
 await run('validators',['--test','scripts/attachment-validation.test.mjs']);
 if(!process.env.npm_execpath)throw Error('Run this check through its npm script.');
 if(process.env.SECUREDESK_GATE6_SQL_ALREADY_VERIFIED!=='1')await run('sql',[process.env.npm_execpath,'run','db:test']);
 else results.push({name:'sql',result:'PASS',evidence:'phase6/sql-attempt1.log; same source hashes checked in final report'});
 for(const [name,file]of [['auth-local','check-local-auth'],['auth-web','check-auth-web'],['registration-local','check-registration-review'],['registration-web','check-registration-review-web'],['registration-retry','check-own-registration-retry-web'],['access-local','check-access-management'],['access-web','check-access-management-web'],['organizations','check-organizations-web'],['people','check-organization-people-web'],['codes','check-organization-codes-web'],['transfers','check-organization-transfers-web'],['projects','check-organization-projects-web'],['proposals','check-organization-proposals-web']])await run(name,['scripts/'+file+'.mjs','--create-demo']);
 await run('tickets',['scripts/check-tickets-web.mjs','--create-demo']);
 await run('attachments',['scripts/check-ticket-attachments-web.mjs','--create-demo']);
 if(sql("select count(*) from cron.job where jobname='securedesk-ticket-auto-close' and active and username='postgres';")!=='1')throw Error('Expected active auto-close job');
 sql("select cron.alter_job(jobid,active:=false) from cron.job where jobname='securedesk-ticket-auto-close' and username='postgres';");paused=true;
 try{await run('resolution',['scripts/check-ticket-resolution-web.mjs','--create-demo']);}finally{sql("select cron.alter_job(jobid,active:=true) from cron.job where jobname='securedesk-ticket-auto-close' and username='postgres';");paused=false;}
 // Finish any now-expired, new resolution fixtures before the next script snapshots the prior rows.
 sql('select securedesk_private.auto_close_resolved_tickets(1000);');
 await run('autoclose',['scripts/check-ticket-auto-close.mjs','--create-demo']);
 await run('audit',['scripts/check-audit-web.mjs','--create-demo']);
 await run('security-web',['scripts/check-security-web.mjs','--create-demo']);
 await run('integrity',['scripts/check-gate6-integrity.mjs','--cleanup-test-access']);
 for(const [source,name] of [['tickets-result.json','tickets-result.json'],['phase5-step2/attachments-web-result.json','attachments-result.json'],['phase5-resolution-ui/web-result.json','resolution-result.json'],['phase5-autoclose/runtime-result.json','autoclose-result.json'],['phase5-audit/runtime-result.json','audit-result.json']])copyFileSync(new URL('../.tools/verification/'+source,import.meta.url),new URL(name,dir));
}catch(error){failed=true;console.error(error.message);}finally{if(paused)try{sql("select cron.alter_job(jobid,active:=true) from cron.job where jobname='securedesk-ticket-auto-close' and username='postgres';");}catch{failed=true;console.error('Restore auto-close job failed');}}
const audited=['scripts/check-audit-web.mjs','supabase/migrations/20261008190000_audit_retention.sql','supabase/tests/audit_retention.test.sql'].map(file=>({file,sha256:createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex')}));
writeFileSync(new URL('suite-result.json',dir),JSON.stringify({date:new Date().toISOString(),result:failed?'FAIL':'PASS',results,audited},null,2));if(failed)process.exitCode=1;
