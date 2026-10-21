import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

class Recording {
  constructor(src) { this.src=src;this.paused=true;this.duration=3.7;this.events=new Map();this.plays=0; }
  addEventListener(name,fn) { const listeners=this.events.get(name)||new Set();listeners.add(fn);this.events.set(name,listeners); }
  removeEventListener(name,fn) { this.events.get(name)?.delete(fn); }
  emit(name) { [...this.events.get(name)||[]].forEach(fn=>fn()); }
  play() { this.plays++;this.paused=false;return this.reject?Promise.reject(new Error('blocked')):Promise.resolve(); }
  pause() { this.paused=true; }
}
globalThis.Audio=Recording;globalThis.document={hidden:false};globalThis.window={};
const {DriveAudio}=await import('../src/audio.js');
function setup(t,webAudio=true) {
  const sources=[],gain={gain:{value:0,setTargetAtTime(value){this.value=value;}},connect(){}};
  globalThis.document.hidden=false;
  globalThis.window=webAudio?{AudioContext:class {
    currentTime=0;resume(){return Promise.resolve();}createGain(){return gain;}
    decodeAudioData(){return Promise.resolve({recording:true});}
    createBufferSource(){const source={playbackRate:{value:1},connect(){},start(){this.started=true;},stop(){this.stopped=true;},disconnect(){}};sources.push(source);return source;}
  }}:{};
  t.mock.method(globalThis,'fetch',async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const engine=new DriveAudio();t.after(()=>engine.stop());return {engine,sources,gain};
}

test('revs and horn are recordings; UI follows clip completion rather than a fixed timer',t=>{
  const {engine}=setup(t,false),states=[];engine.subscribe(state=>states.push(state.revving));
  engine.rev();const old=engine.revSample,oldToken=engine.revToken;
  engine.rev();assert.equal(old.paused,true);engine.finishRev(oldToken);assert.equal(engine.isRevving,true);
  engine.revSample.emit('ended');assert.equal(engine.isRevving,false);assert.equal(engine.active,false);
  assert.deepEqual(states,[false,true,true,false]);
  engine.horn();assert.equal(engine.hornSample.plays,1);assert.equal(engine.hornSample.currentTime,0);
  assert.equal(engine.toggleMute(),true);assert.ok(engine.clips.every(clip=>clip.muted));
  engine.stop();assert.ok(engine.clips.every(clip=>clip.paused));
});

test('cruising reuses one real buffer with constant level and pitch at every speed',async t=>{
  const {engine,sources,gain}=setup(t);engine.active=true;await engine.playCruise();
  for(const speed of [0,65,100,180,180]){engine.update(speed);assert.equal(gain.gain.value,.22);}
  engine.resume(180);await engine.playCruise();
  assert.equal(sources.length,1);assert.equal(sources[0].loop,true);assert.equal(sources[0].buffer.recording,true);assert.equal(sources[0].playbackRate.value,1);
  engine.toggleMute();assert.equal(gain.gain.value,0);engine.toggleMute();assert.equal(gain.gain.value,.22);
});

test('five destination returns each play one rev, silence the hum, then restore the same source',async t=>{
  const {engine,sources,gain}=setup(t);engine.active=true;await engine.playCruise();
  for(let i=0;i<5;i++) {
    engine.park();assert.equal(gain.gain.value,0);
    engine.beginMerge();await engine.playCruise();assert.equal(engine.revSample.plays,1);assert.equal(gain.gain.value,0);
    engine.update(180);engine.revSample.emit('ended');assert.equal(gain.gain.value,.22);
  }
  assert.equal(sources.length,1);
});

test('manual rev replaces merge rev; stale completion cannot release its ducking',async t=>{
  const {engine,gain}=setup(t);engine.beginMerge();await engine.playCruise();
  const old=engine.revSample,oldToken=engine.revToken;
  engine.rev();const current=engine.revSample;
  assert.equal(old.paused,true);old.emit('ended');engine.finishRev(oldToken);assert.equal(gain.gain.value,0);assert.equal(engine.isRevving,true);
  engine.toggleMute();current.emit('ended');assert.equal(gain.gain.value,0);engine.toggleMute();assert.equal(gain.gain.value,.22);
});

test('stop cancels in-flight loading and rev completion; visibility resume does not rev again',async t=>{
  const {engine,sources,gain}=setup(t);engine.beginMerge();await engine.playCruise();const voice=engine.revSample,token=engine.revToken;
  engine.stop();voice.emit('ended');engine.finishRev(token);assert.equal(gain.gain.value,0);assert.ok(sources[0].stopped);
  engine.resume(100);await engine.playCruise();assert.equal(engine.isRevving,false);assert.equal(voice.plays,1);
  const delayed=new DriveAudio();let finish;delayed.prepareCruise=()=>new Promise(resolve=>{finish=resolve;});delayed.active=true;
  const pending=delayed.playCruise();delayed.stop();finish({recording:true});await pending;assert.equal(delayed.cruiseSource,undefined);
  engine.stop();engine.resume(0,{parked:true});await engine.playCruise();assert.equal(gain.gain.value,0);
});

test('recording fallback loops without restarting; rejected rev recovers and has a duration fallback',async t=>{
  const {engine}=setup(t,false);engine.active=true;await engine.playCruise();engine.resume(180);await engine.playCruise();
  assert.equal(engine.cruise.plays,1);assert.equal(engine.cruise.loop,true);
  const clip=engine.clip.bind(engine);engine.clip=src=>{const voice=clip(src);voice.reject=true;return voice;};
  engine.beginMerge();await Promise.resolve();await Promise.resolve();assert.equal(engine.isRevving,false);assert.equal(engine.cruise.volume,.22);
  engine.clip=clip;t.mock.timers.enable({apis:['setTimeout']});engine.rev();engine.revSample.emit('loadedmetadata');t.mock.timers.tick(4300);assert.equal(engine.isRevving,false);
});

test('late garage audio cannot start after navigating home',async t=>{
  const {engine}=setup(t);let release,motors=0;
  engine.ctx={resume:()=>new Promise(resolve=>{release=resolve;}),createOscillator(){motors++;}};
  const pending=engine.garage();engine.stop();release();await pending;assert.equal(motors,0);
});

function pcmWave(file) {
  assert.equal(file.subarray(0,4).toString(),'RIFF');assert.equal(file.subarray(8,12).toString(),'WAVE');
  let format,data;
  for(let offset=12;offset+8<=file.length;) {
    const id=file.subarray(offset,offset+4).toString(),size=file.readUInt32LE(offset+4),start=offset+8;
    assert.ok(start+size<=file.length);
    if(id==='fmt ')format={encoding:file.readUInt16LE(start),channels:file.readUInt16LE(start+2),rate:file.readUInt32LE(start+4),bits:file.readUInt16LE(start+14)};
    if(id==='data')data=file.subarray(start,start+size);
    offset=start+size+(size%2);
  }
  assert.equal(format.encoding,1);assert.equal(format.bits,16);assert.ok(data);
  return {...format,samples:new Int16Array(data.buffer,data.byteOffset,data.length/2)};
}
test('the longer cruise recording has a level envelope and a continuous PCM seam',()=>{
  const {samples,channels,rate}=pcmWave(readFileSync('public/audio/r8-cruise-steady.wav'));
  assert.ok(samples.length/channels/rate>6);assert.ok(samples.length/channels/rate<12);
  const block=Math.round(rate*.1)*channels,levels=[];
  for(let i=0;i+block<=samples.length;i+=block){let sum=0;for(let j=i;j<i+block;j++)sum+=samples[j]**2;levels.push(Math.sqrt(sum/block));}
  const mean=levels.reduce((a,b)=>a+b)/levels.length;
  const deviation=Math.sqrt(levels.reduce((sum,value)=>sum+(value-mean)**2,0)/levels.length);
  assert.ok(deviation/mean<.15);assert.ok(levels[0]>mean*.75&&levels.at(-1)>mean*.75);
  let steps=0,seam=0;for(let i=channels;i<samples.length;i++)steps+=(samples[i]-samples[i-channels])**2;
  for(let c=0;c<channels;c++)seam+=(samples[c]-samples[samples.length-channels+c])**2;
  assert.ok(Math.sqrt(seam/channels)/Math.sqrt(steps/(samples.length-channels))<3);
});
