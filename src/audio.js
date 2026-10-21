// Browser audio is unlocked only by a deliberate user interaction.
// A local recording, when supplied, is layered with a quiet procedural road bed.
class DriveAudio {
  constructor() {
    this.muted = false;
    this.active = false;
    this.sampleAvailable = false;
    this.sample = new Audio('/audio/r8-engine.mp3');
    this.sample.preload = 'none';
    this.revSample = new Audio('/audio/r8-rev.mp3');
    this.revSample.preload = 'none';
    this.cruise = new Audio('/audio/r8-cruise.mp3');
    this.cruise.preload = 'none';
    this.cruise.loop = true;
    this.sample.addEventListener('canplaythrough', () => { this.sampleAvailable = true; });
    this.sample.addEventListener('error', () => { this.sampleAvailable = false; });
  }
  async unlock() {
    if (!this.ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      this.ctx = new Context();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.3;
      this.master.connect(this.ctx.destination);
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineGain.connect(this.master);
      this.oscillators = [1, 2, 5, 7.5].map((harmonic, i) => {
        const oscillator = this.ctx.createOscillator();
        oscillator.type = i === 0 ? 'sawtooth' : 'sine';
        oscillator.frequency.value = 38 * harmonic;
        const gain = this.ctx.createGain();
        gain.gain.value = [0.23, 0.15, 0.04, 0.02][i];
        oscillator.connect(gain).connect(this.engineGain);
        oscillator.start();
        return { oscillator, harmonic };
      });
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < channel.length; i++) { last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02; channel[i] = last * 3; }
      this.wind = this.ctx.createBufferSource();
      this.wind.buffer = buffer; this.wind.loop = true;
      this.windGain = this.ctx.createGain(); this.windGain.gain.value = 0;
      this.wind.connect(this.windGain).connect(this.master); this.wind.start();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }
  async start() {
    await this.unlock(); this.active = true; this.sample.load();
    this.playSample();
    this.update(0);
    clearTimeout(this.cruiseTimeout);
    this.cruiseTimeout = setTimeout(() => {
      if (this.active && !document.hidden) { this.cruise.volume = 0.22; this.cruise.play().catch(() => {}); }
    }, 6500);
  }
  playSample() {
    if (this.muted) return;
    this.sample.currentTime = 0;
    this.sample.volume = 0.5;
    this.sample.play().catch(() => {});
  }
  update(speed, rev = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.oscillators.forEach(({ oscillator, harmonic }) => oscillator.frequency.setTargetAtTime((35 + speed * 0.26 + rev * 85) * harmonic, now, 0.15));
    this.engineGain.gain.setTargetAtTime(this.active ? (this.sampleAvailable && !this.sample.paused ? 0.15 : 0.4) + rev * 0.4 : 0, now, 0.25);
    this.windGain.gain.setTargetAtTime(this.active ? speed / 500 : 0, now, 0.5);
    this.cruise.playbackRate = 0.85 + speed / 400;
  }
  async rev() {
    await this.unlock();
    const wasActive = this.active;
    this.active = true;
    this.revSample.currentTime = 0; this.revSample.volume = 0.6;
    this.revSample.play().catch(() => {});
    this.update(0, 1);
    clearTimeout(this.revTimeout);
    this.revTimeout = setTimeout(() => { this.active = wasActive; this.update(0); }, 1700);
  }
  async horn() {
    await this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [349, 440].forEach(frequency => {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = 'sawtooth'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.setValueAtTime(0.1, now + 0.22); gain.gain.linearRampToValueAtTime(0, now + 0.32);
      oscillator.connect(gain).connect(this.master); oscillator.start(); oscillator.stop(now + 0.35);
    });
  }
  async garage() {
    this.stop(); await this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const motor = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    motor.type = 'triangle'; motor.frequency.setValueAtTime(90, now);
    motor.frequency.linearRampToValueAtTime(45, now + 1.2);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.22, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);
    motor.connect(gain).connect(this.master); motor.start(); motor.stop(now + 1.5);
  }
  stop() { clearTimeout(this.revTimeout); clearTimeout(this.cruiseTimeout); this.active = false; this.sample.pause(); this.revSample.pause(); this.cruise.pause(); this.update(0); }
  toggleMute() {
    this.muted = !this.muted; this.sample.muted = this.muted; this.revSample.muted = this.muted; this.cruise.muted = this.muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.3, this.ctx.currentTime, 0.1);
    return this.muted;
  }
}

export const audio = new DriveAudio();
