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

test('recorded rev UI follows clip completion rather than a fixed timer',t=>{
  const {engine}=setup(t,false),states=[];engine.subscribe(state=>states.push(state.revving));
  engine.rev();const old=engine.revSample,oldToken=engine.revToken;
  engine.rev();assert.equal(old.paused,true);engine.finishRev(oldToken);assert.equal(engine.isRevving,true);
  engine.revSample.emit('ended');assert.equal(engine.isRevving,false);assert.equal(engine.active,false);
  assert.deepEqual(states,[false,true,true,false]);
  assert.equal(engine.revSample.src,'/audio/engine-rev.wav');
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

test('five destination returns each play ignition once, silence the hum, then restore the same source',async t=>{
  const {engine,sources,gain}=setup(t);engine.active=true;await engine.playCruise();
  for(let i=0;i<5;i++) {
    engine.park();assert.equal(gain.gain.value,0);
    engine.beginMerge();await engine.playCruise();assert.equal(engine.sample.plays,1);assert.equal(engine.sample.src,'/audio/engine-start.wav');assert.equal(engine.isRevving,false);assert.equal(gain.gain.value,0);
    engine.update(180);engine.sample.emit('ended');await engine.playCruise();assert.equal(gain.gain.value,.22);
  }
  assert.equal(sources.length,1);
});

test('manual rev replaces merge ignition; stale completion cannot release its ducking',async t=>{
  const {engine,gain}=setup(t);engine.beginMerge();await engine.playCruise();
  const old=engine.sample;
  engine.rev();const current=engine.revSample;
  await engine.playCruise();
  assert.equal(old.paused,true);old.emit('ended');assert.equal(engine.starting,false);assert.equal(gain.gain.value,0);assert.equal(engine.isRevving,true);
  engine.toggleMute();current.emit('ended');assert.equal(gain.gain.value,0);engine.toggleMute();assert.equal(gain.gain.value,.22);
});

test('stop cancels in-flight loading and rev completion; visibility resume does not rev again',async t=>{
  const {engine,sources,gain}=setup(t);engine.active=true;engine.rev();await engine.playCruise();const voice=engine.revSample,token=engine.revToken;
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
  engine.rev();await Promise.resolve();await Promise.resolve();assert.equal(engine.isRevving,false);assert.equal(engine.cruise.volume,.22);
  engine.clip=clip;t.mock.timers.enable({apis:['setTimeout']});engine.rev();engine.revSample.emit('loadedmetadata');t.mock.timers.tick(4300);assert.equal(engine.isRevving,false);
});

test('ignition ends before cruising; parking and garage cancel stale ignition completion',async t=>{
  const {engine,sources,gain}=setup(t);
  engine.start();await engine.playCruise();assert.equal(sources.length,0);assert.equal(engine.sample.plays,1);
  engine.sample.emit('ended');await engine.playCruise();assert.equal(sources.length,1);assert.equal(gain.gain.value,.22);
  engine.start();engine.park();engine.sample.emit('ended');await engine.playCruise();assert.equal(gain.gain.value,0);
  engine.garage();engine.sample.emit('ended');await engine.playCruise();assert.equal(engine.active,false);assert.ok(engine.clips.every(clip=>clip.paused));
});

test('trimmed manual rev progress follows the current recording and resets on completion',async t=>{
  const {engine,gain}=setup(t);t.mock.timers.enable({apis:['setTimeout']});
  engine.start();engine.rev();engine.revSample.duration=6.15;engine.revSample.emit('loadedmetadata');
  engine.sample.emit('ended');await engine.playCruise();assert.equal(engine.starting,false);assert.equal(gain.gain.value,0);
  engine.revSample.currentTime=3.075;assert.equal(engine.getRevProgress(),.5);
  t.mock.timers.tick(6150);assert.equal(engine.isRevving,true);
  engine.revSample.emit('ended');assert.equal(engine.isRevving,false);assert.equal(gain.gain.value,.22);
  assert.equal(engine.getRevProgress(),0);engine.rev();assert.equal(engine.getRevProgress(),0);
});

test('re-entering during ignition cancels the old voice; horn obeys mute, replays, and stop',async t=>{
  const {engine}=setup(t);engine.beginMerge();const old=engine.sample;engine.beginMerge();
  old.emit('ended');assert.equal(old.paused,true);assert.equal(engine.starting,true);
  engine.horn();const horn=engine.hornSample;assert.equal(horn.src,'/audio/car-horn.mp3');assert.equal(horn.plays,1);
  engine.horn();horn.emit('ended');assert.equal(horn.paused,true);assert.equal(engine.isHonking,true);
  engine.toggleMute();assert.equal(engine.hornSample.muted,true);engine.hornSample.emit('ended');assert.equal(engine.isHonking,false);
  engine.stop();assert.ok(engine.clips.every(clip=>clip.paused));assert.equal(engine.starting,false);
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
test('trimmed rev and ignition have quiet fade boundaries, correct lengths, and headroom',()=>{
  for(const [name,seconds] of [['engine-rev.wav',6.15],['engine-start.wav',6]]){
    const {samples,channels,rate}=pcmWave(readFileSync(`public/audio/${name}`));
    assert.ok(Math.abs(samples.length/channels/rate-seconds)<.002);
    const rms=part=>Math.sqrt(part.reduce((sum,value)=>sum+value**2,0)/part.length);
    const window=Math.round(rate*channels*.04);
    assert.ok(rms(samples.subarray(0,window))<rms(samples.subarray(window*5,window*10))*.4);
    assert.ok(rms(samples.subarray(-window))<rms(samples.subarray(-window*20,-window*15))*.2);
    assert.ok(samples.subarray(0,channels).every(value=>Math.abs(value)<5));
    assert.ok(samples.subarray(-channels).every(value=>Math.abs(value)<5));
    assert.ok(samples.every(value=>Math.abs(value)<32700));
  }
});
test('the longer cruise recording has a level envelope and a continuous PCM seam',()=>{
  const {samples,channels,rate}=pcmWave(readFileSync('public/audio/engine-cruise.wav'));
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
