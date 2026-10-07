import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { sourceDigest, canonicalBody, narrationPlan, audioFromResponse, requestSpeech, claimNativeAttempt, persistCheckpoint, generateNarrationFallback } from './article-video-fallback.mjs';
const slug = 'test-article';
const url = `https://youraicoach.life/blog/${slug}`;
const paragraph = 'Choose the days you can reliably keep and compare your actual week before adding another training session. These schedules are examples rather than individualized exercise prescriptions. A missed appointment changes the calendar but does not measure your recovery or the amount of exercise you completed.';
const post = {slug,url,title:'A reviewed article',html:`<link rel="canonical" href="${url}"><main><article data-owner-visual-policy="objects-only-v1"><h2>One</h2><p>${paragraph}</p><h2>Two</h2><p>${paragraph}</p><h2>Three</h2><p>${paragraph}</p></article></main>`};
const slides = ['One','Two','Three'].map(heading => ({heading,body:paragraph,narration:paragraph}));
const wav = Buffer.alloc(12000); wav.write('RIFF',0); wav.write('WAVE',8);
const response = {status:'completed',steps:[{type:'model_output',content:[{type:'audio',mime_type:'audio/wav',data:wav.toString('base64')}]}]};
function manifest() { return {version:1,slug,canonicalUrl:url,sourceSha256:sourceDigest(post),slides}; }
async function fixture(fn) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'izem-fallback-test-'));
 try { await fn(root); } finally { fs.rmSync(root,{recursive:true,force:true}); }
}
function installManifest(root, value=manifest()) {const file=path.join(root,'data/marketing-employee/narrations',`${slug}.json`);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));}
function options(extra={}) {return {env:{},now:1_800_000_000_000,speech:async()=>wav,storyboard:()=>slides,render:async(file,p,opts)=>{assert.ok(fs.existsSync(file));assert.equal(p.slug,slug);assert.equal(opts.narrationSource,'gemini-tts-canonical-script');return {outputFile:'actual-render.mp4'};},probe:()=>JSON.stringify({format:{duration:'60'},streams:[{codec_type:'audio'}]}),...extra};}

test('source identity is strict and embedded video does not change source digest',()=>{
 assert.throws(()=>canonicalBody({...post,url:'https://evil.example/test'}));
 assert.throws(()=>canonicalBody({...post,html:post.html.replace('objects-only-v1','unsafe')}));
 assert.equal(sourceDigest(post),sourceDigest({...post,html:post.html.replace('<h2>One','<!-- IZEM_VIDEO_START -->video<!-- IZEM_VIDEO_END --><h2>One')}));
 assert.notEqual(sourceDigest(post),sourceDigest({...post,html:post.html.replace('One','Changed')}));
});
test('manifest must match source or exact approved Git blob',()=>{
 assert.equal(narrationPlan(post,manifest()).slides.length,3);
 assert.throws(()=>narrationPlan(post,{...manifest(),sourceSha256:'wrong'}));
 const blob=createHash('sha1').update(`blob ${Buffer.byteLength(post.html)}\0${post.html}`).digest('hex');
 assert.equal(narrationPlan(post,{...manifest(),sourceSha256:undefined,sourceBlobSha:blob}).words,135);
 assert.throws(()=>narrationPlan(post,{...manifest(),slides:[{heading:'bad',body:'<img>',narration:'bad'}]}));
 assert.throws(()=>narrationPlan(post,{...manifest(),slides:slides.map(s=>({...s,narration:'short'}))}));
});
test('unmanifested fallback reads selected existing passages, not generated claims',()=>{
 const plan=narrationPlan(post,null,slides);
 assert.ok(plan.text.includes('Selected passages from the IZEM guide.'));
 assert.ok(plan.text.includes(paragraph));
});
test('audio parser rejects incomplete, duplicate, oversized, wrong-type and fake WAV output',()=>{
 assert.equal(audioFromResponse(response).length,12000);
 for(const value of [{...response,status:'in_progress'},{steps:[]},{steps:[{type:'model_output',content:[...response.steps[0].content,...response.steps[0].content]}]},{steps:[{type:'model_output',content:[{type:'audio',mime_type:'audio/mpeg',data:'AAAA'}]}]},{steps:[{type:'model_output',content:[{type:'audio',mime_type:'audio/wav',data:Buffer.alloc(12000).toString('base64')}]}]}])assert.throws(()=>audioFromResponse(value));
});
test('REST speech request uses exact transcript and existing credential without logging',async()=>{
 let count=0;
 const result=await requestSpeech('Exact reviewed words.',{env:{GEMINI_API_KEY_2:'test-secret'},fetchImpl:async(endpoint,init)=>{count++;assert.equal(endpoint,'https://generativelanguage.googleapis.com/v1beta/interactions');assert.equal(init.headers['x-goog-api-key'],'test-secret');const body=JSON.parse(init.body);assert.equal(body.model,'gemini-3.8-flash-lite-tts');assert.equal(body.input[0].content[0].text,'Exact reviewed words.');assert.equal(body.response_format.mime_type,'audio/wav');assert.equal(init.redirect,'error');return {ok:true,headers:{get:()=>null},json:async()=>response};}});
 assert.equal(count,1);assert.equal(result.length,wav.length);
});
test('provider failures are not retried or echoed',async()=>{
 let count=0;
 await assert.rejects(()=>requestSpeech('x',{env:{GEMINI_API_KEY:'secret'},fetchImpl:async()=>{count++;throw Error('secret-private-url');}}),e=>!e.message.includes('secret-private-url'));
 assert.equal(count,1);
 await assert.rejects(()=>requestSpeech('x',{env:{GEMINI_API_KEY:'secret'},fetchImpl:async()=>({ok:false,status:429})}),/HTTP 429/);
 await assert.rejects(()=>requestSpeech('x',{env:{}}),/configured/);
});
test('native claim is durable, bounded to one, and cannot reset after editorial changes',async()=>fixture(async root=>{
 claimNativeAttempt(root,post,{env:{}});
 assert.throws(()=>claimNativeAttempt(root,post,{env:{}}),/already attempted/);
 assert.throws(()=>claimNativeAttempt(root,{...post,html:post.html.replace('One','Changed')},{env:{}}),/Article changed/);
}));
test('checkpoint pushes only its own metadata file; failed push stops before a provider call',async()=>fixture(async root=>{
 const file=path.join(root,`data/marketing-employee/video-attempts/${slug}.json`);const calls=[];
 persistCheckpoint(root,file,{slug},{GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'jebbari-mohammed/website',GITHUB_REF:'refs/heads/main'},(cmd,args)=>{calls.push(args);return '';});
 assert.equal(calls.length,3);assert.ok(calls[1].includes('--only'));assert.deepEqual(calls[2],['push','origin','HEAD:main']);
 assert.throws(()=>persistCheckpoint(root,file,{slug},{GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'wrong',GITHUB_REF:'refs/heads/main'},()=>{throw Error('must not call');}),/authorized/);
 fs.rmSync(file);installManifest(root);let spent=false;
 await assert.rejects(()=>generateNarrationFallback(root,post,options({persist:()=>{throw Error('checkpoint failed');},speech:async()=>{spent=true;return wav;}})),/checkpoint failed/);
 assert.equal(spent,false);
}));
test('narration fallback checkpoints first, preserves provenance and uses existing renderer',async()=>fixture(async root=>{
 installManifest(root);const calls=[];
 const result=await generateNarrationFallback(root,post,options({persist:(...args)=>{calls.push('checkpoint');persistCheckpoint(...args);},speech:async()=>{calls.push('speech');return wav;}}));
 assert.deepEqual(calls,['checkpoint','speech']);assert.equal(result.renderMethod,'gemini-tts-canonical-object-v1');assert.equal(result.notebookId,null);assert.equal(result.sourceSha256,sourceDigest(post));
}));
test('scheduled retries have a six-hour cooldown and a hard total budget',async()=>fixture(async root=>{
 installManifest(root);let calls=0;const opts=options({speech:async()=>{calls++;throw Error('provider unavailable');}});
 await assert.rejects(()=>generateNarrationFallback(root,post,opts),/provider unavailable/);
 await assert.rejects(()=>generateNarrationFallback(root,post,{...opts,now:opts.now+1000}),/cooling down/);
 await assert.rejects(()=>generateNarrationFallback(root,post,{...opts,now:opts.now+6*3600*1000}),/provider unavailable/);
 await assert.rejects(()=>generateNarrationFallback(root,post,{...opts,now:opts.now+12*3600*1000}),/budget exhausted/);
 assert.equal(calls,2);
}));
test('invalid manifest prevents spending',async()=>fixture(async root=>{
 installManifest(root,{...manifest(),sourceSha256:'wrong'});let called=false;
 await assert.rejects(()=>generateNarrationFallback(root,post,options({speech:async()=>{called=true;return wav;}})),/does not match/);assert.equal(called,false);
}));
test('missing audio or implausible duration blocks rendering',async()=>fixture(async root=>{
 installManifest(root);let rendered=false;
 await assert.rejects(()=>generateNarrationFallback(root,post,options({probe:()=>JSON.stringify({streams:[],format:{duration:1}}),render:async()=>{rendered=true;}})),/inconsistent/);assert.equal(rendered,false);
}));
