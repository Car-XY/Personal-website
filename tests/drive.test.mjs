import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXITS, speedAt, gearAt, rpmAt, exitPose, entryPose, OFF_RAMP, ON_RAMP, rampGap, highwayEdgePath, advanceWorld, WORLD_PERIOD, WORLD_UNITS_PER_METRE, MOTION_SCALE } from '../src/drive.js';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

test('a ride accelerates smoothly, reaches 180, and never exceeds it', () => {
  let previous = 0;
  for (let elapsed = 0; elapsed < 20000; elapsed += 17) {
    const speed = speedAt(elapsed);
    assert.ok(speed >= previous && speed >= 0 && speed <= 180);
    assert.ok(speed - previous <= 2);
    previous = speed;
  }
  assert.equal(speedAt(-100), 0);
  assert.equal(speedAt(5800), 180);
  assert.equal(speedAt(2600, 2600), 180);
});

test('instruments stay within vehicle ranges, including a rev at cruising speed', () => {
  assert.equal(gearAt(0), 'P');
  assert.equal(gearAt(180), 6);
  for (let speed = 1; speed <= 180; speed++) {
    assert.ok(gearAt(speed) >= 1 && gearAt(speed) <= 6);
    assert.ok(rpmAt(speed, 1) <= 8500);
    assert.ok(rpmAt(speed, 1) > rpmAt(speed));
  }
});

test('all highway exits have matching readable portfolio content', () => {
  assert.equal(new Set(EXITS.map(exit => exit.id)).size, 5);
  const app = readFileSync('src/App.jsx', 'utf8');
  for (const exit of EXITS) {
    assert.ok(app.includes(`'${exit.id}'`));
    assert.ok(Number(exit.km) > 0);
  }
});

test('the optimized real model, local decoder, resume, and recorded engine clips ship together', () => {
  assert.deepEqual(readdirSync('public/audio').sort(),['engine-cruise.wav','engine-rev.mp3','engine-start.mp3']);
  for (const asset of ['models/audi-r8.glb', 'draco/draco_decoder.wasm', 'Cary-Li-Resume.pdf', 'audio/engine-start.mp3', 'audio/engine-rev.mp3', 'audio/engine-cruise.wav', 'images/projects/anchor.png', 'images/projects/kera.png', 'images/projects/clearpath.png']) {
    assert.ok(existsSync(`public/${asset}`), asset);
  }
  assert.equal(readFileSync('public/models/audi-r8.glb').subarray(0, 4).toString(), 'glTF');
  const glb = readFileSync('public/models/audi-r8.glb');
  const model = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
  const body = model.materials.find(material => /BodyMaterials/.test(material.name));
  const tyres = model.materials.find(material => /undercarriage|Tyre/.test(material.name));
  assert.ok(body && tyres, 'car paint and rubber must keep distinct materials');
  assert.notDeepEqual(body.pbrMetallicRoughness.baseColorFactor, tyres.pbrMetallicRoughness.baseColorFactor);
});

test('the exit and separate entrance always move forward and join the highway smoothly', () => {
  assert.deepEqual(exitPose(0), {x:500,y:510,angle:0});
  assert.equal(exitPose(1).x, 770);
  assert.ok(Math.abs(exitPose(1).y-100)<1e-8);
  assert.equal(entryPose(0).x, 770);
  assert.equal(entryPose(0).y, 844);
  assert.equal(entryPose(1).x,500);
  assert.equal(entryPose(1).y,510);
  assert.ok(Math.abs(entryPose(1).angle)<1e-8);
  for (const pose of [exitPose,entryPose]) {
    let previous = pose(0);
    for (let i=1;i<=200;i++) {
      const next = pose(i/200);
      assert.ok(next.y<previous.y, 'car must travel north, never reverse');
      assert.ok(Math.hypot(next.x-previous.x,next.y-previous.y)<6);
      assert.ok(Math.abs(next.angle-previous.angle)<6);
      previous = next;
    }
    assert.deepEqual(pose(-1),pose(0));
    assert.deepEqual(pose(2),pose(1));
  }
  assert.ok(exitPose(1).angle>0 && entryPose(0).angle<0);
});

test('highway border opens across the full width of both straight ramps', () => {
  for (const ramp of [OFF_RAMP,ON_RAMP]) {
    const gap=rampGap(ramp);
    const centre=ramp.start.y+(650-ramp.start.x)*(ramp.end.y-ramp.start.y)/(ramp.end.x-ramp.start.x);
    assert.ok(gap.top<centre && centre<gap.bottom);
    assert.ok(gap.bottom-gap.top>84, 'oblique ramp needs a wider junction');
    assert.equal(highwayEdgePath(ramp),`M650 -2000V${gap.top}M650 ${gap.bottom}V2400`);
  }
  assert.ok(rampGap(OFF_RAMP).bottom<rampGap(ON_RAMP).top);
});

test('world moves downward at frame-rate-independent speed with a seamless repeat', () => {
  const once=advanceWorld(0,180,1);
  for(const fps of [30,60,120]) {
    let frames=0;
    for(let i=0;i<fps;i++)frames=advanceWorld(frames,180,1/fps);
    assert.ok(Math.abs(once-frames)<1e-8);
  }
  assert.equal(once,1120);
  assert.equal(once,50*WORLD_UNITS_PER_METRE*MOTION_SCALE);
  assert.equal(advanceWorld(123,0,1),123);
  for(const period of [84,250,15,60]) assert.equal(WORLD_PERIOD%period,0);
  assert.ok(Math.abs(advanceWorld(WORLD_PERIOD-1,180,.1)-111)<1e-8);
});
