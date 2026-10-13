import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { slideSvg, rebuildObjectOnlyVideo } from './object-only-video.mjs';
import { assertPermittedSlide, compareEveryFrame, assertTypographyVideoIsPeopleFree } from './typography-video-validation.mjs';

const post={slug:'test-article',title:'A useful training brief',url:'https://youraicoach.life/blog/test-article',description:'Start with the actual week.',html:'<link rel="canonical" href="https://youraicoach.life/blog/test-article"><main data-owner-visual-policy="objects-only-v1"><article><h2>Equipment</h2><p>Describe the equipment you have.</p><h2>Record</h2><p>Keep an accurate training record.</p></article></main>'};
const slide={heading:'Check the plan',body:'Use the days you can keep.',label:'IZEM'};
test('only the reviewed text-and-rectangle constructor is permitted',()=>{
 const svg=slideSvg(slide,0,3);assert.doesNotThrow(()=>assertPermittedSlide(svg,slide,0,3));
 for(const altered of [svg.replace('</svg>','<image href="photo.jpg"/></svg>'),svg.replace('</svg>','<path d="M1 1L3 3"/></svg>'),svg.replace('DejaVu Sans','Unknown Font')])assert.throws(()=>assertPermittedSlide(altered,slide,0,3));
 assert.throws(()=>assertPermittedSlide(slideSvg({...slide,body:'o /|\\'},0,3),{...slide,body:'o /|\\'},0,3),/drawing/);
});
test('every frame matters, including one altered frame, timing and truncation',()=>{
 const a='a'.repeat(64),b='b'.repeat(64),rows=`#hash: SHA256\n0,0,0,1,100,${a}\n0,1,1,1,100,${b}\n`;
 assert.equal(compareEveryFrame(rows,rows).frameCount,2);
 for(const changed of [rows.replace(b,a),rows.replace('0,1,1','0,2,2'),rows.split('\n').slice(0,2).join('\n')])assert.throws(()=>compareEveryFrame(changed,rows));
 assert.throws(()=>compareEveryFrame('#empty',''),/missing/);
});
test('missing, forged, changed-source and unbounded recipes cannot approve a video',async()=>{
 for(const recipe of [undefined,{version:1,articleSha256:'wrong',durationSeconds:2},{version:1,articleSha256:'wrong',durationSeconds:Infinity}])await assert.rejects(()=>assertTypographyVideoIsPeopleFree('missing.mp4',post,recipe),/recipe/);
});
test('actual encoded typography passes; one foreign visual track is rejected',async()=>{
 const work=fs.mkdtempSync(path.join(os.tmpdir(),'izem-proof-test-'));let rendered;
 try{
  const input=path.join(work,'native.mp4');
  execFileSync('ffmpeg',['-v','error','-y','-f','lavfi','-i','color=red:s=1280x720:r=24:d=2','-f','lavfi','-i','sine=frequency=440:duration=2','-c:v','libx264','-c:a','aac','-shortest',input]);
  rendered=await rebuildObjectOnlyVideo(input,post);
  const verdict=await assertTypographyVideoIsPeopleFree(rendered.outputFile,post,rendered.visualRecipe);
  assert.equal(verdict.safe,true);assert.equal(verdict.containsHuman,false);assert.ok(verdict.frameCount>=48);
  await assert.rejects(()=>assertTypographyVideoIsPeopleFree(input,post,rendered.visualRecipe),/differs/);
  const hidden=path.join(work,'extra-track.mp4');
  execFileSync('ffmpeg',['-v','error','-y','-i',rendered.outputFile,'-i',input,'-map','0','-map','1:v:0','-c','copy',hidden]);
  await assert.rejects(()=>assertTypographyVideoIsPeopleFree(hidden,post,rendered.visualRecipe),/single visual\/audio track/);
  await assert.rejects(()=>assertTypographyVideoIsPeopleFree(rendered.outputFile,{...post,title:'Changed article'},rendered.visualRecipe),/recipe/);
 }finally{fs.rmSync(work,{recursive:true,force:true});if(rendered)fs.rmSync(path.dirname(rendered.outputFile),{recursive:true,force:true});}
});
