import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentSecurityPolicy,responseContentSecurityPolicy,securityHeaders,transportHeaders} from '../lib/security/headers.ts';
import {AttemptLimiter} from '../lib/security/rate-limit.ts';
import {validateAuthForm,readText} from '../lib/auth/validation.ts';
test('Production CSP permits only matching nonce scripts and exact origins',()=>{
 const csp=contentSecurityPolicy('QUJDREVGR0hJSktMTU5PUFFSU1Q=','https://example.supabase.co','https://desk.example.invalid',false);
 assert.match(csp,/nonce-QUJDREVGR0hJSktMTU5PUFFSU1Q=/);assert.match(csp,/strict-dynamic/);assert.doesNotMatch(csp,/unsafe-inline|unsafe-eval|\*/);
 assert.match(csp,/connect-src 'self' https:\/\/example\.supabase\.co wss:\/\/example\.supabase\.co/);
 for(const d of ["object-src 'none'","frame-ancestors 'none'","base-uri 'none'","form-action 'self'","script-src-attr 'none'","upgrade-insecure-requests"])assert.ok(csp.includes(d));
});
test('Local debugging does not upgrade localhost HTTP',()=>{
 const csp=contentSecurityPolicy('QUJDREVGR0hJSktMTU5PUFFSU1Q=','http://127.0.0.1:54321','http://127.0.0.1:3000',true);
 assert.match(csp,/unsafe-eval/);assert.match(csp,/ws:\/\/127\.0\.0\.1:3000/);assert.doesNotMatch(csp,/upgrade-insecure-requests/);
});
test('Nonce and origin injection are rejected',()=>{
 for(const n of ["bad' 'unsafe-inline",''])assert.throws(()=>contentSecurityPolicy(n,'https://example.invalid','https://desk.invalid',false));
 for(const api of ['javascript:alert(1)','https://user:password@example.invalid'])assert.throws(()=>contentSecurityPolicy('QUJDREVGR0hJSktMTU5PUFFSU1Q=',api,'https://desk.invalid',false));
});
test('Basic headers prevent framing, MIME guessing and device use',()=>{
 const h=Object.fromEntries(securityHeaders.map(h=>[h.key,h.value]));assert.equal(h['X-Frame-Options'],'DENY');assert.equal(h['X-Content-Type-Options'],'nosniff');assert.equal(h['Referrer-Policy'],'no-referrer');assert.match(h['Permissions-Policy'],/camera=\(\)/);
});
test('HSTS belongs to HTTPS and is absent from local HTTP',()=>{
 assert.deepEqual(transportHeaders('http://127.0.0.1:3000'),[]);assert.deepEqual(transportHeaders('https://desk.invalid'),[{key:'Strict-Transport-Security',value:'max-age=31536000'}]);
});
test('Attempt boundary expires without extending on denial',()=>{
 const l=new AttemptLimiter();for(let i=0;i<10;i++)assert.equal(l.take('fictional',10,600000,0).allowed,true);
 assert.deepEqual(l.take('fictional',10,600000,1000),{allowed:false,retryAfterSeconds:599});assert.equal(l.take('fictional',10,600000,599999).allowed,false);assert.equal(l.take('fictional',10,600000,600000).allowed,true);
});
test('Subjects are independent; capacity fails closed and frees expired entries',()=>{
 const l=new AttemptLimiter(2);assert.equal(l.take('a',1,1000,0).allowed,true);assert.equal(l.take('b',1,1000,0).allowed,true);assert.equal(l.take('c',1,1000,0).allowed,false);assert.equal(l.take('c',1,1000,60000).allowed,true);
});
test('Duplicate auth fields are rejected',()=>{
 const f=new FormData();f.append('email','fictional@example.invalid');f.append('email','other@example.invalid');f.set('password','OnlyFictionalPassword8!');
 assert.equal(readText(f,'email'),'');assert.equal(validateAuthForm(f).valid,false);f.delete('email');f.set('email','fictional@example.invalid');f.append('password','SecondValue');assert.equal(validateAuthForm(f).valid,false);
});
test('Validation state never echoes password',()=>{
 const f=new FormData();f.set('email','bad');f.set('password','OnlyFictionalPassword8!');assert.ok(!JSON.stringify(validateAuthForm(f).state).includes('OnlyFictionalPassword8!'));
});

test('Private downloads keep sandbox rather than the page script policy',()=>{
 for(const parent of ['tickets','proposals']){assert.equal(responseContentSecurityPolicy('/organizations/a/'+parent+'/b/attachments/c','page nonce policy'),"sandbox; default-src 'none'");assert.equal(responseContentSecurityPolicy('/organizations/a/'+parent+'/b/attachments','page nonce policy'),'page nonce policy');assert.equal(responseContentSecurityPolicy('/organizations/a/'+parent+'/b','page nonce policy'),'page nonce policy');}
});
