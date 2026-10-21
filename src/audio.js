// Ignition, revs, cruising, and the horn use local recordings exclusively.
// Audio starts only after a user gesture, and pauses when the page is hidden.
class DriveAudio {
  constructor() {
    this.muted = false;
    this.active = false;
    this.isRevving = false;
    this.lastSpeed = 0;
    this.sample = new Audio('/audio/r8-engine.mp3');
    this.revSample = new Audio('/audio/r8-rev.mp3');
    this.cruise = new Audio('/audio/r8-cruise.mp3');
    this.hornSample = new Audio('/audio/car-horn.mp3');
    this.clips = [this.sample, this.revSample, this.cruise, this.hornSample];
    this.clips.forEach(clip => { clip.preload = 'none'; });
    this.cruise.loop = true;
    this.revSample.addEventListener('ended', () => this.finishRev());
  }
  async unlock() {}
  play(clip, volume, restart = true) {
    clip.muted = this.muted; clip.volume = volume;
    if (restart) clip.currentTime = 0;
    clip.play().catch(() => {});
  }
  async start() {
    this.stop(); this.active = true;
    this.play(this.sample, 0.5);
    this.cruiseTimeout = setTimeout(() => {
      if (this.active && !document.hidden) this.play(this.cruise, 0.22);
    }, 6500);
  }
  update(speed) {
    this.lastSpeed = speed;
    this.cruise.volume = this.isRevving ? 0.07 : 0.13 + speed / 180 * 0.09;
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
    this.clips.forEach(clip => clip.pause());
    if (this.garageGain && this.ctx) this.garageGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.update(0);
  }
  resume(speed) {
    this.active = true; this.update(speed);
    this.play(this.cruise, this.cruise.volume, false);
  }
  toggleMute() {
    this.muted = !this.muted;
    this.clips.forEach(clip => { clip.muted = this.muted; });
    if (this.muted && this.garageGain && this.ctx) this.garageGain.gain.setValueAtTime(0, this.ctx.currentTime);
    return this.muted;
  }
}
export const audio = new DriveAudio();
