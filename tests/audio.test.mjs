import { test } from 'node:test';
import assert from 'node:assert/strict';

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
