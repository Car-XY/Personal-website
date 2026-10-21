import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXITS, speedAt, gearAt, rpmAt, exitPose } from '../src/drive.js';
import { existsSync, readFileSync } from 'node:fs';

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
  for (const asset of ['models/audi-r8.glb', 'draco/draco_decoder.wasm', 'Cary-Li-Resume.pdf', 'audio/r8-engine.mp3', 'audio/r8-rev.mp3', 'audio/r8-cruise.mp3', 'audio/car-horn.mp3', 'images/projects/anchor.png', 'images/projects/kera.png', 'images/projects/clearpath.png']) {
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

test('the shared ramp connects highway and parking bay with a continuous heading', () => {
  assert.deepEqual(exitPose(0), {x:500,y:510,angle:0});
  assert.deepEqual(exitPose(1), {x:770,y:180,angle:0});
  let previous = exitPose(0);
  for (let i=1;i<=100;i++) {
    const next = exitPose(i/100);
    assert.ok(next.x>=previous.x && next.y<previous.y);
    assert.ok(Math.hypot(next.x-previous.x,next.y-previous.y)<8);
    assert.ok(Math.abs(next.angle-previous.angle)<4);
    previous = next;
  }
  assert.deepEqual(exitPose(-1),exitPose(0));
  assert.deepEqual(exitPose(2),exitPose(1));
});
