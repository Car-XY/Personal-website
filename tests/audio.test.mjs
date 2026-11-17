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
const {DriveAudio,throttleFor,IDLE_GAIN,IDLE_RATE}=await import('../src/audio.js');
function setup(t,webAudio=true) {
  const sources=[],gain={gain:{value:0,setTargetAtTime(value){this.value=value;}},connect(){}};
  globalThis.document.hidden=false;
  globalThis.window=webAudio?{AudioContext:class {
    currentTime=0;resume(){return Promise.resolve();}suspend(){return Promise.resolve();}createGain(){return gain;}
    decodeAudioData(){return Promise.resolve({recording:true});}
    createBufferSource(){const source={playbackRate:{value:1,setTargetAtTime(value){this.value=value;}},connect(){},start(){this.started=true;},stop(){this.stopped=true;},disconnect(){}};sources.push(source);return source;}
  }}:{};
  t.mock.method(globalThis,'fetch',async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const engine=new DriveAudio();t.after(()=>engine.stop());return {engine,sources,gain};
}
const close=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const run=(engine,speed,seconds,step=1/60)=>{for(let t=0;t<seconds;t+=step)engine.drive(speed,step);};

test('starting the drive honks and settles into the idle hum, with no ignition or rev clip',async t=>{
  const {engine,sources,gain}=setup(t);
  engine.start();await engine.playEngine();
  assert.equal(engine.hornSample.src,'/audio/car-horn.mp3');assert.equal(engine.hornSample.plays,1);assert.equal(engine.isHonking,true);
  assert.equal(sources.length,1);assert.equal(sources[0].loop,true);assert.equal(sources[0].buffer.recording,true);
  close(gain.gain.value,IDLE_GAIN);close(sources[0].playbackRate.value,IDLE_RATE);
  assert.ok(!engine.clips.some(clip=>/engine-(start|rev)/.test(clip.src)));
  engine.hornSample.emit('ended');assert.equal(engine.isHonking,false);
});

test('turning sound on later starts the engine without a honk',async t=>{
  const {engine,sources}=setup(t);engine.start({horn:false});await engine.playEngine();
  assert.equal(engine.hornSample.plays,0);assert.equal(sources.length,1);
});

test('scrolling revs the engine up; slowing fades it back to the idle hum, never to silence',async t=>{
  const {engine,sources,gain}=setup(t);engine.start({horn:false});await engine.playEngine();
  run(engine,120,1.5);
  const revved=gain.gain.value;assert.ok(revved>.25,`revved gain ${revved}`);assert.ok(sources[0].playbackRate.value>1.15);
  // Rising is quick, falling is gradual: half a second after stopping it is still well above idle.
  run(engine,0,.5);assert.ok(gain.gain.value>IDLE_GAIN+(revved-IDLE_GAIN)*.4,'fades out gradually');
  run(engine,0,6);close(gain.gain.value,IDLE_GAIN,.003);close(sources[0].playbackRate.value,IDLE_RATE,.01);
  assert.ok(gain.gain.value>0,'the stopped car still hums');
  // Faster scrolling is louder than slower scrolling.
  run(engine,20,3);const slow=gain.gain.value;run(engine,90,3);assert.ok(gain.gain.value>slow);
  assert.equal(sources.length,1,'one continuous loop, never restarted');
});

test('throttle is monotone in speed and bounded',()=>{
  let previous=-1;for(const speed of [0,5,15,40,80,200,1000]){const v=throttleFor(speed);assert.ok(v>=previous&&v>=0&&v<=1);previous=v;}
  assert.equal(throttleFor(0),0);assert.equal(throttleFor(NaN),0);
});

test('mute silences the engine and horn; unmute restores the current level',async t=>{
  const {engine,gain}=setup(t);engine.start();await engine.playEngine();run(engine,60,2);const level=gain.gain.value;
  assert.equal(engine.toggleMute(),true);assert.equal(gain.gain.value,0);assert.ok(engine.clips.every(clip=>clip.muted));
  engine.horn();assert.equal(engine.hornSample.muted,true);
  engine.toggleMute();close(gain.gain.value,level,.003);
});

test('stop cancels in-flight loading and silences everything; a hidden tab pauses and resumes',async t=>{
  const {engine,sources,gain}=setup(t);engine.start();await engine.playEngine();
  engine.stop();assert.equal(gain.gain.value,0);assert.ok(sources[0].stopped);assert.ok(engine.clips.every(clip=>clip.paused));
  const delayed=new DriveAudio();let finish;delayed.prepareEngine=()=>new Promise(resolve=>{finish=resolve;});delayed.active=true;
  const pending=delayed.playEngine();delayed.stop();finish({recording:true});await pending;assert.equal(delayed.engineSource,undefined);
  engine.start({horn:false});await engine.playEngine();engine.suspend();engine.wake();await engine.playEngine();assert.equal(sources.length,2);
});

test('without Web Audio the recording loops on an audio element, following the same level and pitch',async t=>{
  const {engine}=setup(t,false);engine.start({horn:false});await engine.playEngine();await engine.playEngine();
  assert.equal(engine.engine.plays,1);assert.equal(engine.engine.loop,true);close(engine.engine.volume,IDLE_GAIN);
  run(engine,120,2);assert.ok(engine.engine.volume>.25);assert.ok(engine.engine.playbackRate>1.15);
});

test('the horn replays cleanly, has a duration fallback, and recovers when playback is blocked',async t=>{
  const {engine}=setup(t,false);engine.horn();const first=engine.hornSample;engine.horn();
  first.emit('ended');assert.equal(first.paused,true);assert.equal(engine.isHonking,true);
  const clip=engine.clip.bind(engine);engine.clip=src=>{const voice=clip(src);voice.reject=true;return voice;};
  engine.horn();await Promise.resolve();await Promise.resolve();assert.equal(engine.isHonking,false);
  engine.clip=clip;t.mock.timers.enable({apis:['setTimeout']});engine.horn();engine.hornSample.emit('loadedmetadata');t.mock.timers.tick(4300);assert.equal(engine.isHonking,false);
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
