import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { inspectArticleRelease, checkArticleReleases } from './article-release-gate.mjs';
import { testHtml, testRecord } from './release-test-fixtures.mjs';
const input = () => ({slug:'test-article',html:testHtml,baselineHtml:null,records:[testRecord()],facts:'facts',repository:'jebbari-mohammed/website'});
test('only exact unchanged legacy source is grandfathered',()=>{assert.equal(inspectArticleRelease({...input(),baselineHtml:testHtml,records:[]}).legacyUnchanged,true);assert.equal(inspectArticleRelease({...input(),baselineHtml:testHtml+' '}).legacyUnchanged,false);});
test('a legacy video marker and forged validated=true do not prove safe upload',()=>{const result=inspectArticleRelease({...input(),records:[{slug:'test-article',people_free_validated:true}]});assert.ok(result.errors.length);});
test('source, facts, article slug, duplicate records, and card identity are bound',()=>{for(const change of [{html:testHtml.replace('Fixture','Changed')},{facts:'changed'},{slug:'different'},{records:[testRecord(),testRecord()]},{html:testHtml.replace('/youtube/abcdefghijk/','/youtube/aaaaaaaaaaa/')}]) assert.ok(inspectArticleRelease({...input(),...change}).errors.length);});
test('matching media shape is eligible for independent artifact verification, not editorial release',()=>{const result=inspectArticleRelease(input());assert.deepEqual(result.errors,[]);assert.equal(result.record.youtube_id,'abcdefghijk');});
test('baseline gate persists across later code-only commits and hand-written approval cannot bypass',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'izem-release-test-'));const write=(file,text)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text);};const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  try {git('init');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');write('public/blog/legacy.html','legacy');write('data/brand/product-facts.json','facts');write('tools/ai-marketing/.notebooklm-video-progress.json',JSON.stringify({completed:[]}));git('add','.');git('commit','-m','baseline');const sha=git('rev-parse','HEAD');write('config/seo-release-policy.json',JSON.stringify({legacyBaselineCommit:sha,repository:'jebbari-mohammed/website',editorialApprovalIntegration:'hold-until-authenticated-provider-handoff',saplingMaximumDocumentScore:0.10,saplingMaximumScansPerArticlePerRun:3,humanizerReviewRequired:true}));write('public/blog/test-article.html',testHtml);write('tools/ai-marketing/.notebooklm-video-progress.json',JSON.stringify({completed:[testRecord()]}));write('data/editorial-approvals/test-article.json',JSON.stringify({score:0.01,approved:true}));git('add','.');git('commit','-m','pending article');write('code.js','// unrelated');git('add','.');git('commit','-m','code only');let proofChecks=0;const result=await checkArticleReleases({root,verifyProof:async()=>{proofChecks++;return true;}});assert.equal(result.legacy,1);assert.equal(proofChecks,1);assert.equal(result.failures.length,1);assert.match(result.failures[0].errors.join(' '),/editorial HOLD/);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
