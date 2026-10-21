import { test } from 'node:test';
import assert from 'node:assert/strict';

test('repeated garage revs do not leave the engine running; revs preserve cruising speed', async (t) => {
  globalThis.Audio = class {
    addEventListener() {}
    play() { return Promise.resolve(); }
    pause() {}
  };
  const { audio } = await import('../src/audio.js');
  audio.unlock = async () => {};
  audio.update = speed => { audio.lastSpeed = speed; };
  t.mock.timers.enable({ apis: ['setTimeout'] });
  await audio.rev();
  t.mock.timers.tick(500);
  await audio.rev();
  t.mock.timers.tick(2000);
  assert.equal(audio.active, false);
  assert.equal(audio.isRevving, false);
  audio.active = true;
  audio.lastSpeed = 180;
  await audio.rev();
  t.mock.timers.tick(2000);
  assert.equal(audio.active, true);
  assert.equal(audio.lastSpeed, 180);
  audio.stop();
});
