import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { BEATS, SCROLL_LENGTH_VH, INTRO_SECONDS, narrationState, smooth, distanceAt, carPoseAt } from './drive-story.js';
import { SIGNS, renderSign, loadSignFonts } from './signs.js';
import { prefersStaticVisuals } from './visuals.js';
import { links } from './data.js';
import { audio } from './audio.js';
import Wordmark from './Wordmark.jsx';
import EmailLink from './EmailLink.jsx';

const DriveScene = lazy(() => import('./DriveScene.jsx'));
const BEAT_LABELS = { hero: 'Start', onramp: 'The 401', gantry: 'Cary Li', distance: 'What I build', utfr: 'Formula Racing', bluesky: 'Blue Sky Solar', projects: 'Projects', podcast: 'Podcast', construction: 'Building now', message: 'Internships', arrive: 'Contact' };

// The scrollable height is cached (and refreshed on resize) so reading progress each frame never forces a layout.
let scrollMax = 0;
function measureScroll() { scrollMax = document.documentElement.scrollHeight - window.innerHeight; }
function scrollProgress() {
  return scrollMax > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollMax)) : 0;
}

function scrollToProgress(p) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: p * max, behavior: 'smooth' });
}

function SoundIcon({ on }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="currentColor"/>{on ? <path d="M13 7a4 4 0 0 1 0 6M15 5a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/> : <path d="M13.5 8l4 4m0-4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}</svg>;
}

function Header({ soundOn, onSound, showSound }) {
  return <header className="drive-header">
    <Wordmark/>
    <nav className="drive-nav" aria-label="Site">
      <a className="plain-link hide-small" href="/Cary-Li-Resume.pdf" target="_blank" rel="noreferrer">Résumé</a>
      {showSound && <button className="sound-button" onClick={onSound} aria-pressed={soundOn} aria-label={soundOn ? 'Turn engine sound off' : 'Turn engine sound on'}><SoundIcon on={soundOn}/></button>}
      <a className="sign-button" href="/portfolio/">Full portfolio <span aria-hidden="true">→</span></a>
    </nav>
  </header>;
}

function Narration({ state }) {
  if (!state) return null;
  const { beat, leadShown, wordShown, opacity } = state, { lead, word } = beat.narration;
  return <div className={`narration narration-${beat.id} ${beat.sign ? 'is-side' : ''}`} style={{ opacity }} aria-hidden="true">
    <p className="narration-lead">{lead.slice(0, leadShown)}<span className="ghost">{lead.slice(leadShown)}</span></p>
    <p className="narration-word">{word.slice(0, wordShown)}<span className="ghost">{word.slice(wordShown)}</span></p>
    {beat.id === 'hero' && <p className="narration-intro">First-year Engineering Science at U of T. I build ML models, web apps, and help machines see the world around them.</p>}
    {beat.id === 'hero' && <p className="scroll-cue">Scroll to drive</p>}
  </div>;
}

// The fill and km readout change every frame, so the drive loop writes them straight to the DOM
// (fillRef, kmRef); React only re-renders when a tick is passed.
function LaneProgress({ progress, fillRef, kmRef }) {
  const ticks = BEATS.filter(b => b.id !== 'hero');
  return <nav className="lane-progress" aria-label="Jump along the drive">
    <span ref={fillRef} className="lane-fill"/>
    {ticks.map(beat => {
      const mid = beat.id === 'arrive' ? 1 : beat.start + (beat.end - beat.start) * .55;
      return <button key={beat.id} className={`lane-tick ${progress >= beat.start ? 'passed' : ''}`} style={{ top: `${mid * 100}%` }} onClick={() => scrollToProgress(mid)} aria-label={`Jump to ${BEAT_LABELS[beat.id]}`}><span>{BEAT_LABELS[beat.id]}</span></button>;
    })}
    <span ref={kmRef} className="lane-km" aria-hidden="true"/>
  </nav>;
}

// Live (during the drive) the fade is written by the drive loop through elRef; React only flips `active`.
function Ending({ live = false, active = true, elRef }) {
  return <section ref={elRef} className={`ending ${live ? 'is-live' : ''} ${active ? 'is-active' : ''}`} aria-label="Contact" inert={!active}>
    <div className="ending-actions">
      <a className="sign-button large" href="/portfolio/">Full portfolio <span aria-hidden="true">→</span></a>
      <EmailLink/>
      <a className="plain-link" href="/Cary-Li-Resume.pdf" target="_blank" rel="noreferrer">Résumé</a>
    </div>
    <p className="ending-links"><a href={links.github} target="_blank" rel="noreferrer">GitHub</a><a href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a href={links.devpost} target="_blank" rel="noreferrer">Devpost</a></p>
  </section>;
}

function Gate({ onStart, leaving }) {
  // Focus the dialog itself (not the button) so nothing shows a focus ring until someone tabs.
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.focus({ preventScroll: true }); }, []);
  return <div className={`gate ${leaving ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-labelledby="gate-title" inert={leaving}>
    <div ref={dialog} className="gate-inner" tabIndex={-1}>
      <h1 id="gate-title">Cary Li</h1>
      <p>Engineering Science · University of Toronto</p>
      <div className="gate-buttons">
        <button className="sign-button large" onClick={() => onStart(true)}>Start the drive</button>
        <button className="plain-link" onClick={() => onStart(false)}>Drive without sound</button>
      </div>
    </div>
  </div>;
}

function SignImage({ id }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { let live = true; loadSignFonts().then(() => { if (live) setSrc(renderSign(id, 70).toDataURL()); }); return () => { live = false; }; }, [id]);
  const spec = SIGNS[id];
  return src ? <img src={src} alt={spec.label} width={Math.round(spec.w * 70)} height={Math.round(spec.h * 70)}/> : <div className="sign-slot" style={{ aspectRatio: `${spec.w} / ${spec.h}` }}/>;
}

// Reduced motion, save-data, ?view=static, or no WebGL: the same story as a still page.
function StaticDrive() {
  return <main className="static-drive">
    <section className="static-hero">
      <h1>Hey, I’m <span>Cary.</span></h1>
      <p>First-year Engineering Science at U of T. I build ML models, web apps, and help machines see the world around them.</p>
      <img src="/images/car-poster.png" width="1200" height="720" alt="Navy Car-XY sports car"/>
    </section>
    <ol className="static-signs">
      {BEATS.filter(b => b.sign).map(beat => <li key={beat.id}>
        <p className="narration-lead">{beat.narration.lead} <strong>{beat.narration.word}</strong></p>
        <SignImage id={beat.sign}/>
      </li>)}
    </ol>
    <section className="static-end">
      <p className="narration-lead">I build <strong>things that move.</strong></p>
      <Ending/>
    </section>
  </main>;
}

export default function DriveStory() {
  const [staticOnly] = useState(() => prefersStaticVisuals({ reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches, saveData: !!navigator.connection?.saveData, search: window.location.search }));
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  // gate (start screen) → intro (the car merges onto the 401 on a timer) → drive (scroll takes over).
  const [phase, setPhase] = useState(() => !staticOnly && window.scrollY < 40 ? 'gate' : 'drive');
  const [soundOn, setSoundOn] = useState(false);
  const [view, setView] = useState({ p: 0, narration: narrationState(0), endingOn: false });
  const progress = useRef(0), velocity = useRef(0);
  const fillRef = useRef(null), kmRef = useRef(null), endingRef = useRef(null);
  const intro = useRef(phase === 'gate' ? 0 : 1), introClock = useRef(null), readyRef = useRef(false);
  readyRef.current = ready;
  const showStatic = staticOnly || failed;
  const driving = phase === 'drive';

  // The page can't scroll until the car has merged and is waiting in its lane.
  useEffect(() => {
    document.documentElement.classList.toggle('gate-open', !driving && !showStatic);
    return () => document.documentElement.classList.remove('gate-open');
  }, [driving, showStatic]);

  useEffect(() => {
    if (showStatic || ready) return;
    const timer = setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(timer);
  }, [showStatic, ready]);

  // One loop: ease toward the scroll position, then derive everything from the eased value.
  useEffect(() => {
    if (showStatic) return;
    measureScroll();
    const remeasure = () => measureScroll();
    window.addEventListener('resize', remeasure);
    const observer = new ResizeObserver(remeasure); observer.observe(document.body);
    progress.current = scrollProgress();
    let frame, last = performance.now(), lastKey = '', lastDistance = distanceAt(progress.current);
    const tick = now => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      // The intro clock only runs once the car is on screen, so a slow load doesn't skip the merge.
      if (introClock.current != null && intro.current < 1 && readyRef.current) {
        introClock.current += dt;
        intro.current = Math.min(1, introClock.current / INTRO_SECONDS);
        if (intro.current >= 1) setPhase('drive');
      }
      // A critically damped spring toward the scroll position: each wheel notch eases in and out instead
      // of kicking the car to a new speed, and it settles without overshooting (the car never rolls back).
      // If the page is already scrolled behind the start screen (e.g. restored scroll), skip the intro.
      const target = scrollProgress();
      if (introClock.current == null && intro.current < 1 && target > .005) { intro.current = 1; setPhase('drive'); }
      const w = 6.5, x0 = progress.current - target, v0 = velocity.current;
      const decay = Math.exp(-w * dt), x1 = (x0 + (v0 + w * x0) * dt) * decay;
      velocity.current = (v0 - w * (v0 + w * x0) * dt) * decay;
      if (x1 * x0 < 0 || (Math.abs(x1) < 1e-5 && Math.abs(velocity.current) < 1e-4)) { progress.current = target; velocity.current = 0; }
      else progress.current = target + x1;
      const p = progress.current;
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${p})`;
      if (kmRef.current) kmRef.current.textContent = `${(distanceAt(p) / 1000).toFixed(2)} km`;
      const ending = smooth(.955, .99, p);
      if (endingRef.current) { endingRef.current.style.opacity = ending; endingRef.current.style.transform = `translateY(${(1 - ending) * 18}px)`; }
      // The engine follows how fast the car is actually moving (m/s), not raw scroll.
      const distance = carPoseAt(progress.current, intro.current).distance;
      audio.drive(Math.abs(distance - lastDistance) / Math.max(dt, 1e-3), dt); lastDistance = distance;
      // React only re-renders when something discrete changes: a letter, a fade step, a passed tick.
      const n = narrationState(p), passed = BEATS.filter(b => p >= b.start).length;
      const key = `${n?.beat.id}|${n?.shown}|${n?.opacity.toFixed(2)}|${passed}|${ending > .6}`;
      if (key !== lastKey) { lastKey = key; setView({ p, narration: n, endingOn: ending > .6 }); }
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', remeasure); observer.disconnect(); };
  }, [showStatic]);

  useEffect(() => {
    const visibility = () => { if (document.hidden) audio.suspend(); else audio.wake(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('visibilitychange', visibility); audio.stop(); };
  }, []);

  // Starting the drive brings up the engine hum (if sound is on) and plays the merge onto the 401.
  const start = useCallback(withSound => {
    setPhase('intro'); introClock.current = 0;
    if (withSound) { if (audio.muted) audio.toggleMute(); audio.start({ horn: false }); setSoundOn(true); }
    else { if (!audio.muted) audio.toggleMute(); setSoundOn(false); }
  }, []);

  const toggleSound = useCallback(() => {
    if (!soundOn) { if (audio.muted) audio.toggleMute(); if (!audio.active) audio.start({ horn: false }); setSoundOn(true); }
    else { if (!audio.muted) audio.toggleMute(); setSoundOn(false); }
  }, [soundOn]);

  if (showStatic) return <div className="drive-page is-static"><Header showSound={false}/><StaticDrive/></div>;

  return <div className={`drive-page ${phase === 'gate' ? 'with-gate' : ''}`}>
    <a className="skip-link" href="/portfolio/">Skip the drive and read the full portfolio</a>
    <div className="drive-stage">
      <Suspense fallback={null}><DriveScene progress={progress} intro={intro} onReady={() => setReady(true)} onError={() => setFailed(true)}/></Suspense>
      {!ready && <p className="drive-loading" role="status">Warming up the engine…</p>}
    </div>
    <Header soundOn={soundOn} onSound={toggleSound} showSound/>
    {driving && <Narration state={view.narration}/>}
    {driving && <LaneProgress progress={view.p} fillRef={fillRef} kmRef={kmRef}/>}
    <Ending live active={view.endingOn} elRef={endingRef}/>
    {!driving && <Gate onStart={start} leaving={phase === 'intro'}/>}
    <main className="scroll-track" style={{ height: `${SCROLL_LENGTH_VH}vh` }}>
      <h1 className="sr-only">Cary Li — Engineering Science, University of Toronto</h1>
      <ol className="sr-only">
        {BEATS.filter(b => b.sign).map(beat => <li key={beat.id}>{SIGNS[beat.sign].label}</li>)}
      </ol>
    </main>
  </div>;
}
