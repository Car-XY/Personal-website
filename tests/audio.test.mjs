import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('repeated garage revs do not leave the engine running; revs preserve cruising speed', async (t) => {
  globalThis.Audio = class {
    addEventListener() {}
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  };
  globalThis.window = { AudioContext: class { constructor() { throw new Error('Rev and horn must not synthesize sound'); } } };
  const { audio } = await import('../src/audio.js');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  await audio.rev();
  t.mock.timers.tick(500);
  await audio.rev();
  t.mock.timers.tick(4500);
  assert.equal(audio.active, false);
  assert.equal(audio.isRevving, false);
  audio.active = true;
  audio.lastSpeed = 180;
  await audio.rev();
  t.mock.timers.tick(4500);
  assert.equal(audio.active, true);
  assert.equal(audio.lastSpeed, 180);
  await audio.horn();
  assert.equal(audio.hornSample.paused, false);
  assert.equal(audio.hornSample.currentTime, 0);
  assert.equal(audio.toggleMute(), true);
  assert.ok(audio.clips.every(clip => clip.muted));
  assert.equal(audio.toggleMute(), false);
  audio.stop();
  assert.ok(audio.clips.every(clip => clip.paused));
});

test('cruise uses one continuous recorded buffer at constant volume, and obeys mute and stop', async (t) => {
  const sources=[];
  const gain={gain:{setTargetAtTime(value) { this.value=value; }},connect(){}};
  globalThis.document={hidden:false};
  globalThis.window={AudioContext:class {
    currentTime=0;
    resume(){return Promise.resolve();}
    createGain(){return gain;}
    decodeAudioData(){return Promise.resolve({recording:true});}
    createBufferSource(){
      const source={connect(){},start(){this.started=true;},stop(){this.stopped=true;},disconnect(){}};
      sources.push(source); return source;
    }
  }};
  t.mock.method(globalThis,'fetch',async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const {DriveAudio}=await import('../src/audio.js');
  const engine=new DriveAudio();
  engine.active=true;
  await engine.playCruise();
  assert.equal(sources.length,1);
  assert.equal(sources[0].loop,true);
  assert.equal(sources[0].buffer.recording,true);
  for(const speed of [65,100,180,180,180]) {
    engine.update(speed);
    assert.equal(gain.gain.value,.22);
  }
  engine.resume(180); await engine.playCruise();
  assert.equal(sources.length,1,'returning must not restart the cruise recording');
  engine.toggleMute(); assert.equal(gain.gain.value,0);
  engine.toggleMute(); assert.equal(gain.gain.value,.22);
  engine.stop(); assert.equal(sources[0].stopped,true);
  const delayed=new DriveAudio();
  let finish;
  delayed.prepareCruise=()=>new Promise(resolve=>{finish=resolve;});
  delayed.active=true;
  const pending=delayed.playCruise(); delayed.stop(); finish({recording:true});
  await pending;
  assert.equal(sources.length,1,'a late decode must not restart audio after leaving the road');
});

test('the cruise recording has a level envelope and no silent loop seam', () => {
  const wav=readFileSync('public/audio/r8-cruise-steady.wav');
  assert.equal(wav.subarray(0,4).toString(),'RIFF');
  assert.equal(wav.readUInt16LE(34),16);
  const channels=wav.readUInt16LE(22),rate=wav.readUInt32LE(24);
  const samples=new Int16Array(wav.buffer,wav.byteOffset+44,(wav.length-44)/2);
  const block=Math.round(rate*.03)*channels;
  const levels=[];
  for(let i=0;i+block<=samples.length;i+=block) {
    let sum=0;
    for(let j=i;j<i+block;j++)sum+=samples[j]**2;
    levels.push(Math.sqrt(sum/block));
  }
  const mean=levels.reduce((a,b)=>a+b)/levels.length;
  const deviation=Math.sqrt(levels.reduce((sum,value)=>sum+(value-mean)**2,0)/levels.length);
  assert.ok(deviation/mean<.15,'cruise should not swell then fade every loop');
  assert.ok(levels[0]>mean*.75 && levels.at(-1)>mean*.75);
  let steps=0,seam=0;
  for(let i=channels;i<samples.length;i++)steps+=(samples[i]-samples[i-channels])**2;
  for(let c=0;c<channels;c++)seam+=(samples[c]-samples[samples.length-channels+c])**2;
  assert.ok(Math.sqrt(seam/channels)/Math.sqrt(steps/(samples.length-channels))<3,'loop boundary must be comparable to normal waveform steps');
});
