// Ignition, revs, cruising, and the horn use local recordings exclusively.
// Audio starts only after a user gesture, and pauses when the page is hidden.
export class DriveAudio {
  constructor() {
    this.muted = false;
    this.active = false;
    this.isRevving = false;
    this.lastSpeed = 0;
    this.generation = 0;
    this.sample = new Audio('/audio/r8-engine.mp3');
    this.revSample = new Audio('/audio/r8-rev.mp3');
    this.cruise = new Audio('/audio/r8-cruise-steady.wav');
    this.hornSample = new Audio('/audio/car-horn.mp3');
    this.clips = [this.sample, this.revSample, this.cruise, this.hornSample];
    this.clips.forEach(clip => { clip.preload = 'none'; });
    this.cruise.loop = true;
    this.revSample.addEventListener('ended', () => this.finishRev());
  }
  async prepareCruise() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    this.ctx ??= new Context();
    this.ctx.resume().catch(() => {});
    if (!this.cruiseGain) {
      this.cruiseGain = this.ctx.createGain();
      this.cruiseGain.connect(this.ctx.destination);
      this.update(this.lastSpeed);
    }
    this.cruiseBufferPromise ??= fetch('/audio/r8-cruise-steady.wav')
      .then(response => {
        if (!response.ok) throw new Error('Cruise recording unavailable');
        return response.arrayBuffer();
      })
      .then(bytes => this.ctx.decodeAudioData(bytes))
      .catch(() => { this.cruiseBufferPromise = null; return null; });
    return this.cruiseBufferPromise;
  }
  async playCruise() {
    const generation = this.generation;
    const buffer = await this.prepareCruise().catch(() => null);
    if (!this.active || generation !== this.generation || document.hidden) return;
    this.sample.pause();
    if (!buffer) { this.play(this.cruise, this.isRevving ? 0.07 : 0.22, false); return; }
    if (!this.cruiseSource) {
      // Decode the real recording once and loop its PCM frames without seek gaps.
      const source = this.ctx.createBufferSource();
      source.buffer = buffer; source.loop = true;
      source.connect(this.cruiseGain); source.start();
      this.cruiseSource = source;
    }
    this.update(this.lastSpeed);
  }
  play(clip, volume, restart = true) {
    clip.muted = this.muted; clip.volume = volume;
    if (restart) clip.currentTime = 0;
    clip.play().catch(() => {});
  }
  async start() {
    this.stop(); this.active = true;
    this.prepareCruise().catch(() => {});
    this.play(this.sample, 0.5);
    this.cruiseTimeout = setTimeout(() => {
      if (this.active && !document.hidden) this.playCruise();
    }, 6500);
  }
  update(speed) {
    this.lastSpeed = speed;
    // Cruising stays at one pitch and level. Only a manual rev briefly ducks it.
    this.cruise.volume = this.isRevving ? 0.07 : 0.22;
    if (this.cruiseGain) this.cruiseGain.gain.setTargetAtTime(this.muted ? 0 : this.cruise.volume, this.ctx.currentTime, 0.08);
  }
  finishRev() {
    clearTimeout(this.revTimeout); this.isRevving = false;
    this.update(this.lastSpeed);
  }
  async rev() {
    this.isRevving = true;
    this.play(this.revSample, 0.6); this.update(this.lastSpeed);
    clearTimeout(this.revTimeout);
    this.revTimeout = setTimeout(() => this.finishRev(), 4000);
  }
  async horn() { this.play(this.hornSample, 0.5); }
  async garage() {
    this.stop();
    // The garage door keeps its separate, brief motor effect.
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context || this.muted) return;
    this.ctx ??= new Context(); await this.ctx.resume();
    const now = this.ctx.currentTime;
    const motor = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    motor.type = 'triangle'; motor.frequency.setValueAtTime(90, now);
    motor.frequency.linearRampToValueAtTime(45, now + 1.2);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.065, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);
    motor.connect(gain).connect(this.ctx.destination); motor.start(); motor.stop(now + 1.5);
    this.garageGain = gain;
  }
  stop() {
    clearTimeout(this.revTimeout); clearTimeout(this.cruiseTimeout);
    this.active = false; this.isRevving = false;
    this.generation++;
    if (this.cruiseSource) {
      this.cruiseSource.stop(); this.cruiseSource.disconnect(); this.cruiseSource = null;
    }
    this.clips.forEach(clip => clip.pause());
    if (this.garageGain && this.ctx) this.garageGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.update(0);
  }
  resume(speed) {
    this.active = true; this.update(speed);
    this.playCruise();
  }
  toggleMute() {
    this.muted = !this.muted;
    this.clips.forEach(clip => { clip.muted = this.muted; });
    this.update(this.lastSpeed);
    if (this.muted && this.garageGain && this.ctx) this.garageGain.gain.setValueAtTime(0, this.ctx.currentTime);
    return this.muted;
  }
}
export const audio = new DriveAudio();
