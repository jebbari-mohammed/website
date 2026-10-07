import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {rebuildObjectOnlyVideo} from './object-only-video.mjs';

test('independent WAV narration becomes an actual video and audio MP4',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'izem-real-fallback-'));
 let output;
 try {
  const input=path.join(root,'test-tone.wav');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','sine=frequency=440:duration=3','-y',input]);
  const post={title:'Article test',description:'A technical test, not a public release.',url:'https://youraicoach.life/blog/test-article',html:'<main><h2>First</h2><p>First paragraph.</p><h2>Second</h2><p>Second paragraph.</p></main>'};
  const slides=[{heading:'First',body:'Text only.'},{heading:'Second',body:'No pictures of people.'},{heading:'Third',body:'Not a publication approval.'}];
  const result=await rebuildObjectOnlyVideo(input,post,{slides,narrationSource:'gemini-tts-canonical-script',durationWeights:[1,2,1]});output=result.outputFile;
  const metadata=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',output],{encoding:'utf8'}));
  assert.equal(result.renderMethod,'gemini-tts-canonical-object-v1');assert.equal(result.slideCount,3);
  assert.ok(metadata.streams.some(s=>s.codec_type==='video'));assert.ok(metadata.streams.some(s=>s.codec_type==='audio'));
  assert.ok(Math.abs(Number(metadata.format.duration)-3)<1);
  await assert.rejects(()=>rebuildObjectOnlyVideo(input,post,{slides,durationWeights:[1,-1,1]}),/timing/);
 } finally {fs.rmSync(root,{recursive:true,force:true});if(output)fs.rmSync(path.dirname(output),{recursive:true,force:true});}
});
