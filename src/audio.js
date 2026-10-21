// Three local excerpts: ignition, rev and an unpitched, continuous cruise loop.
export class DriveAudio {
  constructor() {
    this.muted = false; this.active = false; this.parked = false;
    this.isRevving = false; this.lastSpeed = 0;
    this.generation = 0; this.revToken = 0; this.listeners = new Set();
    this.sample = this.clip('/audio/engine-start.mp3');
    this.revSample = this.clip('/audio/engine-rev.mp3');
    this.cruise = this.clip('/audio/engine-cruise.wav');
    this.cruise.loop = true;
  }
  clip(src) { const clip = new Audio(src); clip.preload = 'none'; return clip; }
  get clips() { return [this.sample, this.revSample, this.cruise]; }
  subscribe(listener) {
    this.listeners.add(listener); listener({ revving:this.isRevving });
    return () => this.listeners.delete(listener);
  }
  notify() { this.listeners.forEach(listener => listener({ revving:this.isRevving })); }
  async prepareCruise() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    this.ctx ??= new Context();
    this.ctx.resume().catch(() => {});
    if (!this.cruiseGain) {
      this.cruiseGain = this.ctx.createGain(); this.cruiseGain.gain.value = 0;
      this.cruiseGain.connect(this.ctx.destination);
    }
    this.cruiseBufferPromise ??= fetch('/audio/engine-cruise.wav')
      .then(response => { if (!response.ok) throw new Error('Recording unavailable'); return response.arrayBuffer(); })
      .then(bytes => this.ctx.decodeAudioData(bytes))
      .catch(() => { this.cruiseBufferPromise = null; return null; });
    return this.cruiseBufferPromise;
  }
  async playCruise() {
    const generation = this.generation;
    const buffer = await this.prepareCruise().catch(() => null);
    if (!this.active || this.starting || generation !== this.generation || document.hidden) return;
    this.sample.pause();
    if (!buffer) {
      this.syncVolume();
      if (this.cruise.paused !== false) this.play(this.cruise, this.cruise.volume, false);
      return;
    }
    if (!this.cruiseSource) {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer; source.loop = true;
      source.connect(this.cruiseGain); this.cruiseSource = source;
      this.gainTarget = null; source.start();
    }
    this.syncVolume();
  }
  play(clip, volume, restart = true, onError = () => {}) {
    clip.muted = this.muted; clip.volume = volume;
    if (restart) clip.currentTime = 0;
    try { Promise.resolve(clip.play()).catch(onError); } catch { onError(); }
  }
  start() {
    this.stop(); this.active = true; this.starting = true;
    const generation = this.generation;
    this.prepareCruise().catch(() => {});
    const finish = () => {
      if (generation !== this.generation || !this.starting) return;
      this.clearStart();
      if (this.active && !this.parked && !document.hidden) this.playCruise();
    };
    const safetyTimer = () => {
      clearTimeout(this.cruiseTimeout);
      const duration = Number.isFinite(this.sample.duration) && this.sample.duration > 0 ? this.sample.duration : 6;
      this.cruiseTimeout = setTimeout(finish, Math.min(15000, duration * 1000 + 500));
    };
    this.sample.addEventListener('ended',finish); this.sample.addEventListener('error',finish);
    this.sample.addEventListener('loadedmetadata',safetyTimer);
    this.startCleanup = () => {
      this.sample.removeEventListener('ended',finish); this.sample.removeEventListener('error',finish);
      this.sample.removeEventListener('loadedmetadata',safetyTimer);
    };
    safetyTimer(); this.play(this.sample,.5,true,finish);
  }
  clearStart() {
    clearTimeout(this.cruiseTimeout); this.startCleanup?.(); this.startCleanup = null;
    this.starting = false; this.sample.pause();
  }
  update(speed) { this.lastSpeed = speed; this.syncVolume(); }
  syncVolume() {
    const volume = this.active && !this.starting && !this.parked && !this.isRevving ? .22 : 0;
    this.cruise.volume = volume; this.cruise.muted = this.muted;
    const target = this.muted || !this.cruiseSource ? 0 : volume;
    if (this.cruiseGain && target !== this.gainTarget) {
      this.cruiseGain.gain.setTargetAtTime(target, this.ctx.currentTime, .09);
      this.gainTarget = target;
    }
  }
  clearRev() {
    clearTimeout(this.revTimeout);
    this.revCleanup?.(); this.revCleanup = null;
    this.revSample.pause(); this.revToken++;
    this.isRevving = false;
  }
  finishRev(token) {
    if (token !== this.revToken || !this.isRevving) return;
    this.clearRev(); this.syncVolume(); this.notify();
  }
  rev() {
    this.clearStart();
    this.clearRev(); this.isRevving = true;
    const token = this.revToken;
    const voice = this.clip('/audio/engine-rev.mp3'); this.revSample = voice;
    const finish = () => this.finishRev(token);
    const safetyTimer = () => {
      if (token !== this.revToken || !this.isRevving) return;
      clearTimeout(this.revTimeout);
      const duration = Number.isFinite(voice.duration) && voice.duration > 0 ? voice.duration : 8;
      this.revTimeout = setTimeout(finish, Math.min(15000, duration * 1000 + 500));
    };
    voice.addEventListener('ended', finish); voice.addEventListener('error', finish);
    voice.addEventListener('loadedmetadata', safetyTimer);
    this.revCleanup = () => {
      voice.removeEventListener('ended', finish); voice.removeEventListener('error', finish);
      voice.removeEventListener('loadedmetadata', safetyTimer);
    };
    this.syncVolume(); this.notify(); safetyTimer();
    this.play(voice, .6, true, finish);
    if (this.active) this.playCruise();
  }
  beginMerge() {
    this.active = true; this.parked = false;
    this.rev(); this.playCruise();
  }
  park() {
    this.parked = true; this.clearStart(); this.clearRev();
    this.syncVolume(); this.notify();
  }
  garage() { this.stop(); }
  stop() {
    this.clearStart();
    this.active = false; this.parked = false; this.generation++;
    this.clearRev(); this.clips.forEach(clip => clip.pause());
    if (this.cruiseSource) {
      this.cruiseSource.stop(); this.cruiseSource.disconnect(); this.cruiseSource = null;
    }
    this.syncVolume(); this.notify();
  }
  resume(speed, { parked = false } = {}) {
    this.active = true; this.parked = parked; this.update(speed); this.playCruise();
  }
  toggleMute() {
    this.muted = !this.muted;
    this.clips.forEach(clip => { clip.muted = this.muted; }); this.syncVolume();
    return this.muted;
  }
}
export const audio = new DriveAudio();
