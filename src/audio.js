// Engine sound for the scroll drive: one looping recording whose loudness and pitch follow the car's
// speed, plus the horn. Scrolling revs the engine up; as scrolling slows it eases back down until,
// with the car stopped, only a low idle hum is left.
export const IDLE_GAIN = .05, MAX_GAIN = .3, IDLE_RATE = .7, MAX_RATE = 1.3;
const RISE = .12, FALL = .9; // seconds: revs up quickly, settles slowly
const HORN_VOLUME = .5;

// Car speed in m/s → throttle 0–1. A gentle scroll lands around a third, a fast fling near full.
export function throttleFor(speed) { return 1 - Math.exp(-Math.max(0, speed || 0) / 55); }

export class DriveAudio {
  constructor() {
    this.muted = false; this.active = false; this.throttle = 0; this.isHonking = false;
    this.generation = 0; this.hornToken = 0; this.listeners = new Set();
    this.engine = this.clip('/audio/engine-cruise.wav'); this.engine.loop = true;
    this.hornSample = this.clip('/audio/car-horn.mp3');
  }
  clip(src) { const clip = new Audio(src); clip.preload = 'none'; return clip; }
  get clips() { return [this.engine, this.hornSample]; }
  state() { return { honking: this.isHonking, active: this.active }; }
  subscribe(listener) { this.listeners.add(listener); listener(this.state()); return () => this.listeners.delete(listener); }
  notify() { this.listeners.forEach(listener => listener(this.state())); }

  gain() { return this.active && !this.muted ? IDLE_GAIN + (MAX_GAIN - IDLE_GAIN) * this.throttle : 0; }
  rate() { return IDLE_RATE + (MAX_RATE - IDLE_RATE) * this.throttle; }

  async prepareEngine() {
    const Context = window.AudioContext || window.webkitAudioContext; if (!Context) return null;
    this.ctx ??= new Context(); this.ctx.resume().catch(() => {});
    if (!this.engineGain) { this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0; this.engineGain.connect(this.ctx.destination); }
    this.engineBufferPromise ??= fetch('/audio/engine-cruise.wav')
      .then(response => { if (!response.ok) throw new Error('Recording unavailable'); return response.arrayBuffer(); })
      .then(bytes => this.ctx.decodeAudioData(bytes)).catch(() => { this.engineBufferPromise = null; return null; });
    return this.engineBufferPromise;
  }
  async playEngine() {
    const generation = this.generation, buffer = await this.prepareEngine().catch(() => null);
    if (!this.active || generation !== this.generation || document.hidden) return;
    if (!buffer) { this.apply(true); if (this.engine.paused !== false) this.play(this.engine, this.engine.volume, false); return; }
    if (!this.engineSource) {
      const source = this.ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
      source.playbackRate.value = this.rate(); source.connect(this.engineGain); this.engineSource = source; source.start();
    }
    this.apply(true);
  }
  play(clip, volume, restart = true, onError = () => {}) {
    clip.muted = this.muted; clip.volume = volume;
    try { if (restart) clip.currentTime = 0; Promise.resolve(clip.play()).catch(onError); } catch { onError(); }
  }

  // Called every frame with the car's speed (m/s) and the frame time (s).
  drive(speed, dt) {
    const target = throttleFor(speed), tau = target > this.throttle ? RISE : FALL;
    this.throttle += (target - this.throttle) * (1 - Math.exp(-Math.max(0, dt) / tau));
    this.apply();
  }
  apply(force = false) {
    const gain = this.gain(), rate = this.rate();
    // Only touch the audio graph when something audible changed.
    if (!force && Math.abs(gain - this.appliedGain) < .002 && Math.abs(rate - this.appliedRate) < .004) return;
    this.appliedGain = gain; this.appliedRate = rate;
    this.engine.muted = this.muted; this.engine.volume = gain;
    try { this.engine.preservesPitch = false; this.engine.playbackRate = rate; } catch { /* fixed pitch fallback */ }
    if (this.engineGain) {
      const now = this.ctx.currentTime;
      this.engineGain.gain.setTargetAtTime(this.engineSource ? gain : 0, now, .06);
      this.engineSource?.playbackRate.setTargetAtTime(rate, now, .06);
    }
  }

  // "Start the drive": a honk, and the engine settles into its idle hum.
  start({ horn = true } = {}) {
    this.stop(); this.active = true; this.throttle = 0;
    if (horn) this.horn();
    this.playEngine(); this.notify();
  }
  clearHorn() { this.hornCleanup?.(); this.hornCleanup = null; this.hornSample.pause(); this.hornToken++; this.isHonking = false; }
  horn() {
    this.clearHorn(); this.isHonking = true;
    const token = this.hornToken, voice = this.clip('/audio/car-horn.mp3'); this.hornSample = voice;
    const finish = () => { if (token !== this.hornToken || !this.isHonking) return; this.clearHorn(); this.notify(); };
    let timer;
    const safety = () => { clearTimeout(timer); const s = Number.isFinite(voice.duration) && voice.duration > 0 ? voice.duration : 2; timer = setTimeout(finish, Math.min(15000, s * 1000 + 500)); };
    voice.addEventListener('ended', finish); voice.addEventListener('error', finish); voice.addEventListener('loadedmetadata', safety); safety();
    this.hornCleanup = () => { clearTimeout(timer); voice.removeEventListener('ended', finish); voice.removeEventListener('error', finish); voice.removeEventListener('loadedmetadata', safety); };
    this.notify(); this.play(voice, HORN_VOLUME, true, finish);
  }
  // Tab hidden: silence everything without forgetting where the engine was.
  suspend() { this.ctx?.suspend?.().catch?.(() => {}); this.engine.pause(); }
  wake() { if (!this.active) return; this.ctx?.resume().catch(() => {}); this.playEngine(); }
  stop() {
    this.active = false; this.generation++; this.clearHorn(); this.clips.forEach(clip => clip.pause());
    if (this.engineSource) { this.engineSource.stop(); this.engineSource.disconnect(); this.engineSource = null; }
    this.apply(true); this.notify();
  }
  toggleMute() { this.muted = !this.muted; this.clips.forEach(clip => { clip.muted = this.muted; }); this.apply(true); return this.muted; }
}
export const audio = new DriveAudio();
