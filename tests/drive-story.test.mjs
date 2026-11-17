import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BEATS, SIGN_LAYOUT, PARK_DISTANCE, PARK_LANE, INTRO_DISTANCE, distanceAt, laneAt, signalAt, carPoseAt, cameraAt, narrationState, beatAt } from '../src/drive-story.js';
import { SIGNS } from '../src/signs.js';

test('beats run in order without overlapping, and every sign beat has artwork and a position', () => {
  for (let i = 1; i < BEATS.length; i++) assert.ok(BEATS[i].start >= BEATS[i - 1].end - 1e-9, `${BEATS[i].id} overlaps ${BEATS[i - 1].id}`);
  for (const beat of BEATS.filter(b => b.sign)) {
    assert.ok(SIGNS[beat.sign], `missing artwork for ${beat.sign}`);
    assert.ok(SIGN_LAYOUT[beat.sign], `missing layout for ${beat.sign}`);
    assert.ok(SIGNS[beat.sign].label.length > 10, 'each sign has a text alternative');
    assert.ok(beat.at > 0 && beat.at < PARK_DISTANCE);
  }
  assert.equal(BEATS.at(-1).id, 'arrive');
});

test('the car never reverses, starts parked on the shoulder, merges in the intro, and ends parked', () => {
  let previous = -Infinity;
  for (let i = 0; i <= 200; i++) { const d = carPoseAt(0, i / 200).distance; assert.ok(d >= previous - 1e-9, 'intro never reverses'); previous = d; }
  for (let i = 0; i <= 2000; i++) { const d = distanceAt(i / 2000); assert.ok(d >= previous - 1e-9); previous = d; }
  const parked = carPoseAt(0, 0), merged = carPoseAt(0, 1);
  assert.equal(parked.x, PARK_LANE); assert.equal(parked.distance, -INTRO_DISTANCE);
  assert.equal(merged.x, 0, 'the intro ends in the middle lane, ready to drive'); assert.equal(merged.distance, 0);
  assert.deepEqual(carPoseAt(0, 1), carPoseAt(0), 'the scroll drive picks up exactly where the intro ends');
  assert.equal(distanceAt(0), 0);
  assert.equal(distanceAt(1), PARK_DISTANCE);
  assert.equal(laneAt(0), 0);
  assert.ok(Math.abs(laneAt(1) - PARK_LANE) < 1e-9);
  assert.ok(Math.abs(laneAt(.3)) < 1e-9, 'drives in the middle lane between exits');
});

test('each sign is ahead of the car and close enough to read while its line is on screen', () => {
  for (const beat of BEATS.filter(b => b.sign)) {
    const mid = beat.start + (beat.end - beat.start) * .5, gap = beat.at - carPoseAt(mid).distance;
    assert.ok(gap > 20 && gap < 90, `${beat.id}: sign is ${gap.toFixed(1)} m ahead`);
  }
});

test('the camera starts (behind the start screen) and ends in front of the car, on the road side, and chases from behind in between', () => {
  for (const [p, intro] of [[0, 0], [1, 1]]) {
    const car = carPoseAt(p, intro), { position } = cameraAt(p, { intro });
    assert.ok(position[2] < car.z, 'camera is in front of the car (further down the road)');
    assert.ok(position[0] < car.x, 'camera is on the road side, not behind the guardrail');
  }
  for (let t = 0; t <= 1; t += .05) assert.ok(cameraAt(0, { intro: t }).position[0] < carPoseAt(0, t).x + .01, 'the intro swing stays on the road side');
  assert.ok(cameraAt(0).position[2] > carPoseAt(0).z, 'after the intro the camera waits behind the car');
  for (const p of [.3, .5, .7]) assert.ok(cameraAt(p).position[2] > carPoseAt(p).z, 'camera is behind the car while driving');
});

test('narration types in with scroll and is complete before it fades', () => {
  for (const beat of BEATS.filter(b => b.sign)) {
    const early = narrationState(beat.start + .001), full = narrationState(beat.start + (beat.end - beat.start) * .5);
    assert.ok(early.shown < full.shown);
    assert.equal(full.shown, beat.narration.lead.length + 1 + beat.narration.word.length);
    assert.equal(full.opacity, 1);
  }
  assert.equal(beatAt(.12), null, 'no narration while the car pulls out');
  assert.equal(narrationState(1).beat.id, 'arrive');
});

test('the landing page has no free-flight or garage leftovers', () => {
  const page = readFileSync('src/DriveStory.jsx', 'utf8');
  assert.doesNotMatch(page, /garage|free.?flight|TopDown/i);
  assert.match(page, /href="\/portfolio\/"/);
});

test('the car stays in the exit lane between back-to-back exits instead of weaving', () => {
  const utfr = BEATS.find(b => b.id === 'utfr'), bluesky = BEATS.find(b => b.id === 'bluesky');
  for (let p = utfr.start + .05; p <= bluesky.end - .025; p += .002) assert.ok(Math.abs(laneAt(p) - 3.75) < 1e-6, `lane at ${p.toFixed(3)} is ${laneAt(p).toFixed(2)}`);
});

test('turn signals come on before each lane change, point the right way, and are off while cruising', () => {
  const lateral = p => laneAt(Math.min(1, p + .002)) - laneAt(Math.max(0, p - .002));
  for (let p = 0; p <= 1; p += .001) {
    const v = lateral(p);
    if (Math.abs(v) > .1) assert.equal(signalAt(p), Math.sign(v), `signal while moving at ${p.toFixed(3)}`);
  }
  assert.equal(signalAt(0, 0), 0, 'off while parked behind the start screen');
  assert.equal(signalAt(0, .3), -1, 'left while merging off the shoulder in the intro');
  assert.equal(signalAt(.05), 0, 'off while waiting in the lane');
  assert.equal(signalAt(.3), 0, 'off while cruising');
  assert.equal(signalAt(.395), 1, 'right before moving over for the exits');
  assert.equal(signalAt(.5), 0, 'off while staying in the exit lane');
  assert.equal(signalAt(.75), 0);
  assert.equal(signalAt(.9), 1, 'right before pulling onto the shoulder to park');
  assert.equal(signalAt(1), 0, 'off once parked');
});
