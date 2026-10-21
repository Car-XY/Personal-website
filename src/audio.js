// Road audio uses local recordings. The garage door has its own brief motor effect.
export class DriveAudio {
  constructor() {
    this.muted = false; this.active = false; this.parked = false;
    this.isRevving = false; this.lastSpeed = 0;
    this.generation = 0; this.revToken = 0; this.listeners = new Set();
    this.sample = this.clip('/audio/r8-engine.mp3');
    this.revSample = this.clip('/audio/r8-rev.mp3');
    this.cruise = this.clip('/audio/r8-cruise-steady.wav');
    this.hornSample = this.clip('/audio/car-horn.mp3');
    this.cruise.loop = true;
  }
  clip(src) { const clip = new Audio(src); clip.preload = 'none'; return clip; }
  get clips() { return [this.sample, this.revSample, this.cruise, this.hornSample]; }
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
    this.cruiseBufferPromise ??= fetch('/audio/r8-cruise-steady.wav')
      .then(response => { if (!response.ok) throw new Error('Recording unavailable'); return response.arrayBuffer(); })
      .then(bytes => this.ctx.decodeAudioData(bytes))
      .catch(() => { this.cruiseBufferPromise = null; return null; });
    return this.cruiseBufferPromise;
  }
  async playCruise() {
    const generation = this.generation;
    const buffer = await this.prepareCruise().catch(() => null);
    if (!this.active || generation !== this.generation || document.hidden) return;
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
    this.stop(); this.active = true;
    const generation = this.generation;
    this.prepareCruise().catch(() => {});
    this.play(this.sample, .5);
    this.cruiseTimeout = setTimeout(() => {
      if (this.generation === generation && this.active && !document.hidden) this.playCruise();
    }, 6500);
  }
  update(speed) { this.lastSpeed = speed; this.syncVolume(); }
  syncVolume() {
    const volume = this.active && !this.parked && !this.isRevving ? .22 : 0;
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
    this.clearRev(); this.isRevving = true;
    const token = this.revToken;
    const voice = this.clip('/audio/r8-rev.mp3'); this.revSample = voice;
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
  }
  beginMerge() {
    this.active = true; this.parked = false;
    this.rev(); this.playCruise();
  }
  park() {
    this.parked = true; this.clearRev(); this.sample.pause();
    this.syncVolume(); this.notify();
  }
  horn() { this.play(this.hornSample, .5); }
  async garage() {
    this.stop();
    const generation=this.generation;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context || this.muted) return;
    try {
      this.ctx ??= new Context(); await this.ctx.resume();
      if(generation!==this.generation||this.muted||document.hidden)return;
      const now = this.ctx.currentTime;
      const motor = this.ctx.createOscillator(), gain = this.ctx.createGain();
      motor.type = 'triangle'; motor.frequency.setValueAtTime(90, now);
      motor.frequency.linearRampToValueAtTime(45, now + 1.2);
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.065, now + .2);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);
      motor.connect(gain).connect(this.ctx.destination); motor.start(); motor.stop(now + 1.5);
      this.garageGain = gain;
    } catch { /* Navigation still works without audio support. */ }
  }
  stop() {
    clearTimeout(this.cruiseTimeout);
    this.active = false; this.parked = false; this.generation++;
    this.clearRev(); this.clips.forEach(clip => clip.pause());
    if (this.cruiseSource) {
      this.cruiseSource.stop(); this.cruiseSource.disconnect(); this.cruiseSource = null;
    }
    if (this.garageGain && this.ctx) this.garageGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.syncVolume(); this.notify();
  }
  resume(speed, { parked = false } = {}) {
    this.active = true; this.parked = parked; this.update(speed); this.playCruise();
  }
  toggleMute() {
    this.muted = !this.muted;
    this.clips.forEach(clip => { clip.muted = this.muted; }); this.syncVolume();
    if (this.muted && this.garageGain && this.ctx) this.garageGain.gain.setValueAtTime(0, this.ctx.currentTime);
    return this.muted;
  }
}
export const audio = new DriveAudio();
