import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowDown, Volume2, VolumeX, Download, Github, Linkedin, Menu, X, Power, Gauge, MapPin, RotateCcw, CircleHelp, ChevronRight, Mail, ExternalLink, Check, Navigation, Hand, CarFront, AudioLines, Megaphone } from 'lucide-react';
import { EXITS, speedAt, gearAt, rpmAt } from './drive.js';
import { links, projects, skills } from './data.js';
import { audio } from './audio.js';

const Scene = lazy(() => import('./Scene.jsx'));

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="scene-fallback"><CarFront size={64} /><span>The garage is open. Explore the portfolio below.</span></div> : this.props.children; }
}

function Brand({ onClick }) {
  return <button className="brand" onClick={onClick} aria-label="Cary Li home"><span className="brand-symbol">c<span>↗</span></span><span>CAR<span className="brand-dash">—</span>XY<small>CARY LI’S PERSONAL GARAGE</small></span></button>;
}

function OntarioShield({ small = false }) {
  return <span className={`ontario-shield ${small ? 'small' : ''}`}><span className="shield-crown">♛</span><strong>401</strong><span>ONTARIO</span></span>;
}

function Header({ onStart, muted, onMute, garage }) {
  const [menu, setMenu] = useState(false);
  return <header className="site-header">
    <Brand onClick={garage} />
    <nav className={menu ? 'nav open' : 'nav'} aria-label="Main navigation">
      <a href="#home" className="nav-active" onClick={() => setMenu(false)}>The Garage <span>01</span></a>
      <a href="#route" onClick={() => setMenu(false)}>The Route <span>02</span></a>
      <a href="#contact" onClick={() => setMenu(false)}>Let’s Talk <ArrowUpRight size={14} /></a>
    </nav>
    <div className="header-actions"><a href="/Cary-Li-Resume.pdf" className="resume-link" target="_blank" rel="noreferrer">Résumé <ArrowUpRight size={15}/></a><span className="header-divider"/><button className="icon-button sound-toggle" onClick={onMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={!muted}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><button className="mobile-menu icon-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div>
  </header>;
}

function GarageHero({ onStart, onRev, onHorn, revving, honking }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <section className="garage-hero" id="home" aria-labelledby="hero-title">
    <div className="hero-grid" aria-hidden="true" />
    <div className="hero-copy">
      <div className="eyebrow"><span className="status-dot"/> ENGINEERING SCIENCE · UNIVERSITY OF TORONTO</div>
      <h1 id="hero-title">DRIVEN BY<br/><span>CURIOSITY.</span><span className="heading-period"/></h1>
      <p className="hero-intro">Hey, I’m <strong>Cary.</strong> Engineer in the making.<br/>Builder by nature. Always taking the scenic route.</p>
      <p className="hero-description">From neural networks to racing lines, I build things that move us forward. Hop in. I’ll show you around.</p>
      <div className="hero-cta"><button className="start-button" onClick={onStart}><Power size={18}/><span>START THE ENGINE</span><ArrowUpRight size={21}/></button><a className="skip-link" href="#projects">Or, explore at your own pace <ArrowDown size={14}/></a></div>
      <div className="sound-note"><AudioLines size={15}/><span>Sound on. Seatbelt optional.</span></div>
    </div>
    <div className={`car-stage ${revving ? 'revving' : ''}`}>
      <div className="garage-wall" aria-hidden="true"><span>THE GARAGE</span><div className="wall-line"/><span className="bay-number">01</span></div>
      <div className="ceiling-light light-one"/><div className="ceiling-light light-two"/>
      <div className="garage-floor"/><div className="floor-ring"/>
      <SceneBoundary><Suspense fallback={null}><Scene onReady={() => setLoaded(true)} onError={() => { setFailed(true); setLoaded(true); }}/></Suspense></SceneBoundary>
      {!loaded && <div className="model-loading"><span className="loading-spinner"/><span>ROLLING INTO THE GARAGE</span></div>}
      {failed && <div className="scene-fallback"><img src="/images/r8-reference.png" alt="Navy Audi R8 reference"/><p>Explore the garage below, or start your ride.</p></div>}
      <div className="car-view-label"><span className="view-dot"/> {revving ? 'V10 · 8,000 RPM' : 'NAVY BLUE · V10 PLUS'}</div>
      <div className="drag-hint"><Hand size={13}/><span>DRAG TO EXPLORE</span><span>↔</span></div>
      <div className="car-spec"><span className="r8-emblem"><i/>R8</span><div><strong>AUDI R8</strong><span>AUDI R8 · 5.2L V10 · 602 HP · QUATTRO</span></div><span className="car-spec-number">001 / 001</span></div>
    </div>
    <div className="hero-bottom"><div className="location"><MapPin size={14}/><span>TORONTO, ON</span><span className="tiny-dot"/><span>43.6532° N, 79.3832° W</span></div><div className="garage-controls"><button className={revving ? 'active' : ''} onClick={onRev}><Gauge size={16}/>{revving ? 'REVVING…' : 'REV ENGINE'}<kbd>R</kbd></button><button className={honking ? 'active' : ''} onClick={onHorn}><Megaphone size={16}/>{honking ? 'BEEP BEEP!' : 'GIVE IT A HONK'}<kbd>H</kbd></button></div></div>
  </section>;
}

function RouteMap({ onSelect, onStart }) {
  return <section className="route-map" id="route"><div className="route-heading"><div className="route-heading-left"><OntarioShield small/><div><div className="eyebrow">YOUR ROUTE, YOUR PACE</div><h2>A few exits worth taking.</h2></div></div><button className="text-link" onClick={onStart}>Take the scenic route <ArrowUpRight size={17}/></button></div><div className="route-exits">{EXITS.map(exit => <a key={exit.id} href={`#${exit.id}`} onClick={() => onSelect(exit.id)} className="route-exit"><span className="exit-top"><span>EXIT {exit.number}</span><ArrowUpRight size={17}/></span><h3>{exit.title}</h3><span className="exit-description">{exit.subtitle}</span></a>)}</div><div className="route-footer"><span><span className="status-dot"/> ALL ROADS LEAD TO SOMETHING INTERESTING.</span><span>SCROLL TO EXPLORE <ArrowDown size={13}/></span></div></section>;
}

function ProjectArt({ kind }) {
  if (kind === 'kera') return <div className="project-art kera-art" aria-hidden="true"><div className="art-grid"/><span className="art-meta">KERA / HEALTH INTELLIGENCE</span><div className="kera-orb"><span>k.</span><i/><i/><i/></div><div className="kera-readout"><span>COLOUR → INSIGHT</span><svg viewBox="0 0 180 30"><path d="M0 18h29l8-9 7 17 9-23 8 15h28l9-11 7 16 8-13 7 8h60"/></svg></div><span className="art-corner">01—ML</span></div>;
  if (kind === 'clearpath') return <div className="project-art room-art" aria-hidden="true"><div className="art-grid"/><span className="art-meta">CLEARPATH / MAKE ROOM</span><div className="room"><div className="room-floor"/><div className="room-wall back"/><div className="room-wall side"/><div className="room-window"/><div className="room-sofa"><i/><i/></div><div className="room-table"/><div className="room-plant"/><div className="room-path"/></div><span className="art-corner">02—3D</span><span className="room-label">A NEW PERSPECTIVE.</span></div>;
  if (kind === 'anchor') return <div className="project-art anchor-art" aria-hidden="true"><div className="art-grid"/><span className="art-meta">ANCHOR / STAY THE COURSE</span><div className="anchor-window"><div className="window-bar"><span/><span/><span/><b>anchor.</b></div><div className="anchor-window-body"><span>ONE DAY AT A TIME.</span><h4>Build your momentum.</h4><div className="habit-row"><Check size={13}/> Morning run <span>07</span></div><div className="habit-row"><Check size={13}/> Read 20 pages <span>12</span></div><div className="habit-row"><span className="habit-empty"/> Make something <span>03</span></div><div className="habit-week">{['M','T','W','T','F','S','S'].map((d,i)=><span key={i} className={i<5?'checked':''}>{d}</span>)}</div></div></div><span className="art-corner">03—APP</span></div>;
  return <div className="project-art racing-art" aria-hidden="true"><div className="art-grid"/><span className="art-meta">RACING / THE OPTIMAL LINE</span><svg viewBox="0 0 500 270"><path className="track-edge" d="M-30 210C50 210 63 47 164 56S287 244 362 197 393 26 535 37"/><path className="track-edge second" d="M-30 255C88 255 100 95 158 101S266 299 391 229 427 77 535 80"/><path className="racing-line" d="M-30 239C83 239 85 70 160 79S283 269 375 212 410 52 535 58"/>{[[42,170],[89,98],[177,69],[240,137],[322,219],[388,161],[447,58]].map(([x,y],i)=><g key={i}><path d={`M${x} ${y-5}l-5 10h10z`} fill="#e9af63"/><path d={`M${x-19} ${y+25}l-5 10h10z`} fill="#a6c8e3"/></g>)}<g transform="translate(268 183) rotate(42)"><rect x="-7" y="-15" width="14" height="30" rx="5" fill="#d5f0a0"/><rect x="-10" y="-12" width="20" height="3" fill="#7c8e6b"/><rect x="-10" y="9" width="20" height="3" fill="#7c8e6b"/></g></svg><span className="telemetry-label">PATH OPTIMIZED <span className="status-dot"/></span><span className="art-corner">04—C++</span></div>;
}

function SectionHeading({ number, label, title, text, link }) {
  return <div className="section-heading"><div><div className="eyebrow"><span className="section-number">{number}</span>{label}</div><h2>{title}</h2></div><div className="section-heading-right">{text && <p>{text}</p>}{link}</div></div>;
}

function Projects({ compact = false }) {
  return <section className={`content-section projects-section ${compact ? 'compact' : ''}`} id={compact ? undefined : 'projects'}>
    <SectionHeading number="01" label="THE BUILDS" title={<>Ideas in the<br className="desktop-break"/> fast lane.</>} text="A little machine learning. A little spatial thinking. A lot of figuring things out." link={<a className="text-link" href={links.github} target="_blank" rel="noreferrer">More on GitHub <ArrowUpRight size={16}/></a>}/>
    <div className="projects-grid">{projects.map((project, i)=><article className="project-card" key={project.title}><ProjectArt kind={project.visual}/><div className="project-card-body"><div className="project-category">{project.kind}<span>{project.year}</span></div><div className="project-title-row"><h3>{project.title}</h3><a href={project.href} target="_blank" rel="noreferrer" className="project-arrow" aria-label={project.cta}><ArrowUpRight size={23}/></a></div><p>{project.description}</p><details><summary>Under the hood <span>+</span></summary><p>{project.detail}</p></details><div className="project-tags">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div></article>)}</div>
  </section>;
}

function Teams({ compact = false }) {
  return <section className="content-section teams-section" id={compact ? undefined : 'teams'}><SectionHeading number="02" label="THE DESIGN TEAMS" title="Built for the real world." text="The best part of writing code? Watching it move something."/><div className="teams-grid"><article className="team-card formula"><div className="team-art" aria-hidden="true"><span className="team-giant">F<span>SAE</span></span><div className="team-track"/><span className="team-art-meta">U OF T · FORMULA RACING</span></div><div className="team-content"><span className="project-category">FORMULA SAE · DRIVERLESS</span><h3>U of T Formula Racing</h3><p>Turning a track full of cones into a racing line. I develop C++ pathfinding algorithms that optimize path length and straightness for the team’s driverless car.</p><div className="team-role"><span className="status-dot"/> PATHFINDING & PERCEPTION SOFTWARE</div><a href="https://fsaeutoronto.ca" target="_blank" rel="noreferrer" className="text-link">Meet the team <ArrowUpRight size={16}/></a></div></article><article className="team-card solar"><div className="team-art" aria-hidden="true"><div className="solar-sun"/><div className="solar-panel"/><span className="solar-word">BLUE SKY</span><span className="team-art-meta">U OF T · SOLAR RACING</span></div><div className="team-content"><span className="project-category">SOLAR VEHICLES · RACE STRATEGY</span><h3>Blue Sky Solar Racing</h3><p>A different kind of horsepower. I simulate energy use to find efficient racing speeds, using local caching to make the search faster. Every watt has a job to do.</p><div className="team-role"><span className="status-dot"/> ENERGY SIMULATION & RACE STRATEGY</div><a href="https://www.blueskysolar.utoronto.ca" target="_blank" rel="noreferrer" className="text-link">Meet the team <ArrowUpRight size={16}/></a></div></article></div></section>;
}

function Journey({ compact = false }) {
  return <section className="content-section journey-section" id={compact ? undefined : 'journey'}><SectionHeading number="03" label="THE ROAD SO FAR" title="A few miles of backstory." text="Curiosity tends to take me places. Here are a few of them."/><div className="journey-layout"><div className="journey-intro"><span className="outline-monogram">CL.</span><h3>Engineer. Builder.<br/>Perpetual question-asker.</h3><p>I’m a first-year Engineering Science student at the University of Toronto’s St. George campus. I like the places where software meets something tangible: a room, a race car, a person’s day.</p><a href="/Cary-Li-Resume.pdf" target="_blank" rel="noreferrer" className="text-link">The full story <Download size={16}/></a></div><div className="timeline"><article><span className="timeline-date">SEP 2026 — PRESENT</span><h3>University of Toronto</h3><span className="timeline-subtitle">B.A.Sc. · Engineering Science</span><p>Learning the fundamentals. Building with Formula Racing and Blue Sky Solar Racing. Following the questions wherever they lead.</p></article><article><span className="timeline-date">MAR 2025 — PRESENT</span><h3>The Fundamental Why</h3><span className="timeline-subtitle">Founder · Physics & philosophy podcast</span><p>Conversations with STEM researchers, physics students, and curious minds about how the world works, and why.</p><div className="podcast-stats"><span><strong>7</strong>EPISODES</span><span><strong>2.1k+</strong>SUBSCRIBERS</span><span><strong>14.1k+</strong>VIEWS</span></div></article><article><span className="timeline-date">SEP 2024 — JUN 2026</span><h3>Champion Swim School</h3><span className="timeline-subtitle">Competitive Swim Instructor</span><p>Teaching all four strokes to swimmers aged 6–16. Named Instructor of the Month twice, among a team of 30.</p></article><article><span className="timeline-date">2022 — 2026</span><h3>Dr. G.W. Williams Secondary School</h3><span className="timeline-subtitle">IB Diploma · 41/45</span><p>UofT National Book Award, Pay It Forward Scholarship, and DECA ICDC qualifier.</p></article></div></div></section>;
}

function Skills({ compact = false }) {
  return <section className="content-section skills-section" id={compact ? undefined : 'skills'}><SectionHeading number="04" label="UNDER THE HOOD" title="The toolkit. Always growing." text="Different problems need different tools. Here’s what’s in the garage."/><div className="skills-grid">{skills.map(skill=><article key={skill.name} className="skill-column"><div className="skill-top"><span>{skill.number}</span><Gauge size={22}/></div><h3>{skill.name}</h3><span className="skill-subtitle">{skill.subtitle}</span><ul>{skill.items.map(item=><li key={item}>{item}<span>↗</span></li>)}</ul></article>)}</div></section>;
}

function Contact({ compact = false }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(links.email); setCopied(true); setTimeout(()=>setCopied(false), 2200); } catch { window.location.href = `mailto:${links.email}`; } }
  return <section className={`contact-section ${compact ? 'compact' : ''}`} id={compact ? undefined : 'contact'}><div className="contact-top"><div className="eyebrow"><span className="status-dot"/> EXIT 05 · THE NEXT ADVENTURE</div><span>TORONTO, ON ↗ EVERYWHERE</span></div><h2>GOT SOMETHING<br/>WORTH <span>BUILDING?</span></h2><div className="contact-bottom"><div><p>Projects, opportunities, or a good conversation.<br/>I’m always up for a new road.</p><a className="email-link" href={`mailto:${links.email}`}>{links.email}<ArrowUpRight size={21}/></a><button className="copy-email" onClick={copy}>{copied ? <><Check size={13}/> Copied to clipboard</> : 'Copy email address'}</button></div><div className="social-links"><a href={links.github} target="_blank" rel="noreferrer"><Github size={18}/> GitHub <ArrowUpRight size={15}/></a><a href={links.linkedin} target="_blank" rel="noreferrer"><Linkedin size={18}/> LinkedIn <ArrowUpRight size={15}/></a><a href={links.devpost} target="_blank" rel="noreferrer"><ExternalLink size={18}/> Devpost <ArrowUpRight size={15}/></a></div></div></section>;
}

function Footer({ onStart }) {
  return <footer className="footer"><div><span className="footer-brand">CAR—XY</span><span>© {new Date().getFullYear()} Cary Li</span></div><span className="footer-message">BUILT WITH CURIOSITY. FUELLED BY QUESTIONS.</span><button onClick={onStart}>ONE MORE RIDE? <ArrowUpRight size={15}/></button></footer>;
}

const sectionComponents = { projects: Projects, teams: Teams, journey: Journey, skills: Skills, contact: Contact };

function StopDialog({ exit, onBack, onGarage }) {
  const modal = useRef(null);
  const lastFocus = useRef(null);
  useEffect(()=>{
    lastFocus.current = document.activeElement;
    const dialog = modal.current;
    dialog.showModal();
    function cancel(event) { event.preventDefault(); onBack(); }
    function click(event) { if (event.target === dialog) onBack(); }
    dialog.addEventListener('cancel', cancel); dialog.addEventListener('click', click);
    return ()=>{ dialog.removeEventListener('cancel', cancel); dialog.removeEventListener('click', click); dialog.close(); lastFocus.current?.focus(); };
  },[]);
  const Content = sectionComponents[exit.id];
  return <dialog className="stop-dialog" ref={modal} aria-labelledby="stop-title"><div className="stop-shell"><div className="stop-header"><span><Navigation size={17}/><span id="stop-title">EXIT {exit.number} · {exit.title.toUpperCase()}</span></span><button className="icon-button" onClick={onBack} aria-label="Close and return to the road"><X size={20}/></button></div><div className="stop-scroll"><Content compact/></div><div className="stop-bottom"><button className="text-link" onClick={onGarage}><RotateCcw size={15}/> Return to garage</button><button className="start-button" onClick={onBack}>BACK ON THE ROAD <ArrowRight size={18}/></button></div></div></dialog>;
}

function Cockpit({ speed, rev, onHorn, honking }) {
  const rpm = rpmAt(speed, rev);
  return <div className="cockpit" aria-label={`Speed ${speed} kilometres per hour, gear ${gearAt(speed)}`}><div className="windshield-pillar left"/><div className="windshield-pillar right"/><div className="hood-line"/><div className="dashboard"><div className="dash-stitch"/><div className="vent left-vent"><i/><i/><i/></div><div className="instrument-cluster"><div className="rpm-scale">{[1,2,3,4,5,6,7,8].map(n=><span key={n} className={rpm >= n*1000 ? 'lit' : ''}>{n}</span>)}</div><div className="rpm-bar"><span style={{width:`${rpm/8500*100}%`}}/></div><div className="speed-readout"><span className="gear-display">{gearAt(speed)}</span><strong>{speed.toString().padStart(3,'0')}</strong><span className="speed-unit">KM/H</span></div><div className="instrument-bottom"><span>R8 <i>V10</i></span><span>{speed >= 180 ? 'CRUISING' : speed > 0 ? 'ACCELERATING' : 'QUATTRO'}</span><span>22°C</span></div></div><div className="vent right-vent"><i/><i/><i/></div><div className="passenger-dash">CAR—XY <span>DRIVEN BY CURIOSITY</span></div><button className={honking ? 'steering-wheel honking' : 'steering-wheel'} onClick={onHorn} aria-label="Honk horn"><div className="wheel-spoke left-spoke"/><div className="wheel-spoke right-spoke"/><div className="wheel-spoke bottom-spoke"/><div className="wheel-center"><span className="audi-rings"><i/><i/><i/><i/></span><small>AIRBAG</small></div><span className="wheel-mark"/></button><div className="dash-red-line"/></div></div>;
}

function Drive({ speed, ready, activeExit, onSelect, onBack, onGarage, onRev, onHorn, rev, honking, muted, onMute, onSceneReady }) {
  const [help, setHelp] = useState(false);
  return <div className="drive-screen"><SceneBoundary><Suspense fallback={<div className="drive-loading">Finding the open road…</div>}><Scene driving speed={activeExit ? 0 : speed} onReady={onSceneReady} onError={onSceneReady}/></Suspense></SceneBoundary><div className="drive-vignette"/><div className="drive-header"><Brand onClick={onGarage}/><div className="drive-location"><span className="status-dot"/> THE SCENIC ROUTE <span>ONTARIO, CANADA</span></div><button className="return-garage" onClick={onGarage}><RotateCcw size={15}/><span>RETURN TO GARAGE</span></button></div><div className={`highway-signs ${ready ? 'arrived' : ''}`} aria-hidden={!ready} inert={!ready}><div className="gantry"/><div className="sign-top"><OntarioShield small/><span>EAST <ArrowUpRight size={30}/></span><span>YOUR NEXT EXIT<br/><strong>IS UP TO YOU.</strong></span></div><nav className="sign-destinations" aria-label="Highway exits">{EXITS.map(exit=><button className="highway-sign" key={exit.id} onClick={()=>onSelect(exit)}><span className="sign-exit">EXIT {exit.number} <ArrowUpRight size={19}/></span><strong>{exit.title}</strong><span className="sign-distance">{exit.km} km <ArrowDown size={25}/></span></button>)}</nav></div>{!ready && <div className="acceleration-message"><span className="eyebrow">THE OPEN ROAD IS CALLING</span><h2>{speed < 30 ? 'Here we go.' : speed < 130 ? 'Getting up to speed.' : 'Pick your adventure.'}</h2><span>{speed >= 178 ? 'EXITS JUST AHEAD' : 'SETTLE IN. ENJOY THE RIDE.'}</span></div>}<div className="drive-road-label"><span>401</span> EASTBOUND <span className="tiny-dot"/> TORONTO</div><Cockpit speed={activeExit ? 0 : speed} rev={rev} onHorn={onHorn} honking={honking}/><div className="drive-controls" id="drive-controls"><button onClick={onRev} className={rev ? 'active' : ''}><Gauge size={17}/><span>{rev ? 'REVVING…' : 'REV ENGINE'}</span><kbd>R</kbd></button><button onClick={onHorn} className={honking ? 'active' : ''}><Megaphone size={17}/><span>{honking ? 'BEEP BEEP!' : 'HORN'}</span><kbd>H</kbd></button><div className="drive-controls-divider"/><button className="control-icon" onClick={onMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><button className="control-icon" onClick={()=>setHelp(!help)} aria-label="Show driving help" aria-expanded={help}><CircleHelp size={18}/></button></div>{help && <div className="drive-help"><button className="icon-button" onClick={()=>setHelp(false)} aria-label="Close help"><X size={16}/></button><h3>Your ride. Your rules.</h3><p>Choose a green exit sign to explore. “Back on the road” continues your journey.</p><p><kbd>R</kbd> Rev engine <kbd>H</kbd> Horn <kbd>M</kbd> Sound <kbd>Esc</kbd> Close an exit</p><small>Return to the garage anytime for the full portfolio.</small></div>}{activeExit && <StopDialog key={activeExit.id} exit={activeExit} onBack={onBack} onGarage={onGarage}/>}</div>;
}

export default function App() {
  const [mode, setMode] = useState('garage');
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [ready, setReady] = useState(false);
  const [activeExit, setActiveExit] = useState(null);
  const [rev, setRev] = useState(0);
  const [honking, setHonking] = useState(false);
  const [transition, setTransition] = useState(null);
  const [driveSceneReady, setDriveSceneReady] = useState(false);
  const [run, setRun] = useState(0);
  const timers = useRef({});
  const storedScroll = useRef(0);
  const startButton = useRef(null);

  useEffect(()=>{
    document.body.classList.toggle('in-drive', mode === 'drive');
    return ()=>document.body.classList.remove('in-drive');
  },[mode]);

  useEffect(()=>{
    if (mode !== 'drive' || activeExit || !driveSceneReady || transition) return;
    const start = performance.now();
    setReady(false);
    let frame;
    function tick(now) {
      const nextSpeed = speedAt(now-start, run > 1 ? 2600 : 5800);
      setSpeed(nextSpeed); audio.update(nextSpeed, rev);
      if (nextSpeed < 180) frame = requestAnimationFrame(tick);
      else setReady(true);
    }
    frame = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[mode,activeExit,driveSceneReady,transition,run]);

  useEffect(()=>{ audio.update(activeExit ? 0 : speed, rev); },[speed,rev,activeExit]);
  useEffect(()=>{
    const hide = ()=>{ if (document.hidden) { audio.stop(); } else if (mode === 'drive') { audio.active = true; audio.update(speed); } };
    document.addEventListener('visibilitychange', hide);
    return ()=>document.removeEventListener('visibilitychange',hide);
  },[mode,speed]);
  useEffect(()=>()=>{ Object.values(timers.current).forEach(clearTimeout); audio.stop(); },[]);

  function mute() { setMuted(audio.toggleMute()); }
  function revEngine() { audio.rev(); setRev(1); clearTimeout(timers.current.rev); timers.current.rev=setTimeout(()=>setRev(0),1800); }
  function horn() { audio.horn(); setHonking(true); clearTimeout(timers.current.horn); timers.current.horn=setTimeout(()=>setHonking(false),450); }
  function start() {
    if (transition || mode === 'drive') return;
    storedScroll.current = window.scrollY;
    audio.start(); setTransition('ignition'); setSpeed(0); setReady(false); setRun(1);
    timers.current.start = setTimeout(()=>{ setMode('drive'); setDriveSceneReady(false); setTransition(null); },1800);
  }
  function garage() {
    if (mode === 'garage') { document.getElementById('home')?.scrollIntoView({behavior:'smooth'}); return; }
    setTransition('garage'); audio.garage(); setActiveExit(null);
    timers.current.garage=setTimeout(()=>{ setMode('garage'); setSpeed(0); setReady(false); setTransition(null); requestAnimationFrame(()=>window.scrollTo({top:0})); },1000);
  }
  function chooseExit(exit) { audio.update(0); setActiveExit(exit); setSpeed(0); }
  function back() { setActiveExit(null); setReady(false); setRun(v=>v+1); audio.active=true; }

  useEffect(()=>{
    function key(event) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
      if (event.key.toLowerCase()==='r') { event.preventDefault(); revEngine(); }
      if (event.key.toLowerCase()==='h') { event.preventDefault(); horn(); }
      if (event.key.toLowerCase()==='m') { event.preventDefault(); mute(); }
    }
    window.addEventListener('keydown',key); return ()=>window.removeEventListener('keydown',key);
  },[]);

  return <><a href={mode==='drive'?'#drive-controls':'#projects'} className="skip-navigation">Skip to {mode==='drive'?'ride controls':'projects'}</a>{mode==='garage'?<><Header onStart={start} muted={muted} onMute={mute} garage={garage}/><main><GarageHero onStart={start} onRev={revEngine} onHorn={horn} revving={!!rev} honking={honking}/><RouteMap onStart={start} onSelect={()=>{}}/><Projects/><Teams/><Journey/><Skills/><Contact/></main><Footer onStart={start}/></>:<Drive speed={speed} ready={ready} activeExit={activeExit} onSelect={chooseExit} onBack={back} onGarage={garage} onRev={revEngine} onHorn={horn} rev={rev} honking={honking} muted={muted} onMute={mute} onSceneReady={()=>setDriveSceneReady(true)}/>}<div className="sr-only" role="status" aria-live="polite">{rev ? 'Engine revving' : honking ? 'Horn honking' : ready && mode==='drive' ? 'Cruising at 180 kilometres per hour. Choose an exit to explore.' : ''}</div>{transition&&<div className={`transition-screen ${transition}`} role="status"><div className="transition-mark"><Power size={27}/></div><div className="eyebrow">{transition==='ignition'?'5.2 LITRES. TEN CYLINDERS. ONE ADVENTURE.':'TAKING THE OFF-RAMP.'}</div><h2>{transition==='ignition'?'Let’s go for a ride.':'Welcome to the garage.'}</h2><div className="transition-line"><span/></div><span className="transition-caption">{transition==='ignition'?'ENGINE STARTING · OPENING THE ROAD':'PARKING UP · OPENING YOUR PORTFOLIO'}</span></div>}</>;
}
