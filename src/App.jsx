import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowDown, Volume2, VolumeX, Download, Github, Linkedin, Menu, X, Power, Gauge, MapPin, RotateCcw, CircleHelp, ExternalLink, Check, Navigation, Hand, CarFront, AudioLines, Megaphone } from 'lucide-react';
import { EXITS, speedAt, gearAt, rpmAt, EXIT_DURATION } from './drive.js';
import { links, projects, skills } from './data.js';
import { audio } from './audio.js';
import TopDownDrive from './TopDownDrive.jsx';

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

function Header({ onStart, muted, onMute, garage, landing = false }) {
  const [menu, setMenu] = useState(false);
  return <header className="site-header">
    <Brand onClick={garage} />
    {!landing && <nav className={menu ? 'nav open' : 'nav'} aria-label="Main navigation">
      <a href="#home" className="nav-active" onClick={() => setMenu(false)}>The Garage <span>01</span></a>
      <a href="#route" onClick={() => setMenu(false)}>The Route <span>02</span></a>
      <a href="#contact" onClick={() => setMenu(false)}>Let’s Talk <ArrowUpRight size={14} /></a>
    </nav>}
    {landing && <div className="landing-header-note"><span className="status-dot"/> TWO WAYS TO EXPLORE. ONE CURIOUS MIND.</div>}
    <div className="header-actions"><a href="/Cary-Li-Resume.pdf" className="resume-link" target="_blank" rel="noreferrer">Résumé <ArrowUpRight size={15}/></a><span className="header-divider"/><button className="icon-button sound-toggle" onClick={onMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={!muted}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><button className="mobile-menu icon-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div>
  </header>;
}

function GarageHero({ onStart, onGarage, onRev, onHorn, revving, honking, landing = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <section className="garage-hero" id="home" aria-labelledby="hero-title">
    <div className="hero-grid" aria-hidden="true" />
    <div className="hero-copy">
      <div className="eyebrow"><span className="status-dot"/> ENGINEERING SCIENCE · UNIVERSITY OF TORONTO</div>
      <h1 id="hero-title">DRIVEN BY<br/><span>CURIOSITY.</span><span className="heading-period"/></h1>
      <p className="hero-intro">Hey, I’m <strong>Cary.</strong> Engineer in the making.<br/>Builder by nature. Always taking the scenic route.</p>
      <p className="hero-description">From neural networks to racing lines, I build things that move us forward. Hop in. I’ll show you around.</p>
      <div className="hero-cta" id={landing ? 'mode-choice' : undefined}><button className="start-button" onClick={onStart}><Power size={18}/><span>{landing ? 'TEST DRIVE CAR-XY' : 'START THE ENGINE'}</span><ArrowUpRight size={21}/></button>{landing ? <button className="enter-garage-button" onClick={onGarage}>ENTER THE GARAGE <ArrowRight size={18}/></button> : <a className="skip-link" href="#projects">Or, explore at your own pace <ArrowDown size={14}/></a>}</div>
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
  const thumbnail = {
    anchor: { src:'/images/projects/anchor.png', alt:'Anchor app home screen with habit tracking, daily reflection, and goal timeline' },
    kera: { src:'/images/projects/kera.png', alt:'Kera Devpost thumbnail: Health at your fingertips, showing a photo-based hemoglobin estimate' },
    clearpath: { src:'/images/projects/clearpath.png', alt:'ClearPath room planner showing furniture, clearance checks, and a route through a 3D room' },
  }[kind];
  if (thumbnail) return <div className={`project-art supplied-art ${kind}-thumbnail`}><img src={thumbnail.src} alt={thumbnail.alt} loading="lazy" decoding="async"/></div>;
  return <RacingArt/>;
}

function RacingArt() {
  const path = useRef(null);
  const [markers,setMarkers] = useState([]);
  const [pose,setPose] = useState(null);
  useEffect(()=>{
    const line = path.current;
    const length = line.getTotalLength();
    const samples = [];
    for (let distance=18;distance<length-12;distance+=23) {
      const p=line.getPointAtLength(distance), next=line.getPointAtLength(distance+1);
      const dx=next.x-p.x, dy=next.y-p.y, mag=Math.hypot(dx,dy);
      for (const side of [-1,1]) samples.push({x:p.x-dy/mag*17*side,y:p.y+dx/mag*17*side,side});
    }
    setMarkers(samples);
    const at=length*.56, p=line.getPointAtLength(at), next=line.getPointAtLength(at+2);
    setPose({x:p.x,y:p.y,angle:Math.atan2(next.y-p.y,next.x-p.x)*180/Math.PI+90});
  },[]);
  const route='M-30 224C60 224 75 60 160 78S282 261 375 207 411 52 535 58';
  return <div className="project-art racing-art" aria-hidden="true"><div className="art-grid"/><span className="art-meta">RACING / THE OPTIMAL LINE</span><svg viewBox="0 0 500 270">
    <path d={route} fill="none" stroke="#8ea8bb18" strokeWidth="50"/>
    <path ref={path} className="racing-line" d={route}/>
    {markers.map((cone,i)=><g key={i} transform={`translate(${cone.x} ${cone.y})`}><ellipse cy="3" rx="4" ry="1.8" fill="#0c1525" opacity=".5"/><path d="M0-5-3.5 3h7Z" fill={cone.side<0?'#e9ad59':'#a7cee8'}/><path d="M-1.7-.5h3.4" stroke="#f9f1db" strokeWidth="1"/></g>)}
    {pose && <g transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle})`}><rect x="-7" y="-14" width="14" height="28" rx="5" fill="#9abcec" stroke="#d4e3f7" strokeWidth=".7"/><path d="M-5-7H5L4-1H-4Z" fill="#193149"/><rect x="-10" y="-11" width="20" height="3" fill="#121d2a"/><rect x="-10" y="8" width="20" height="3" fill="#121d2a"/><path d="M-5-12h3m4 0h3" stroke="#f2f8ff" strokeWidth="1.5"/></g>}
  </svg><span className="telemetry-label">PATH OPTIMIZED <span className="status-dot"/></span><span className="art-corner">04—C++</span></div>;
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
  return <section className="content-section teams-section" id={compact ? undefined : 'teams'}><SectionHeading number="02" label="THE DESIGN TEAMS" title="Built for the real world." text="The best part of writing code? Watching it move something."/><div className="teams-grid"><article className="team-card formula"><div className="team-art" aria-hidden="true"><span className="team-giant">F<span>SAE</span></span><div className="team-track"/><span className="team-art-meta">U OF T · FORMULA RACING</span></div><div className="team-content"><span className="project-category">FORMULA SAE · DRIVERLESS</span><h3>U of T Formula Racing</h3><p>Turning a track full of cones into a racing line. I develop C++ pathfinding algorithms that optimize path length and straightness for the team’s driverless car.</p><div className="team-role"><span className="status-dot"/> PATHFINDING & PERCEPTION SOFTWARE</div><a href="https://fsaeutoronto.ca" target="_blank" rel="noreferrer" className="text-link">Meet the team <ArrowUpRight size={16}/></a></div></article><article className="team-card solar"><div className="team-art" aria-hidden="true"><div className="solar-sun"/><div className="solar-panel"/><span className="solar-word">BLUE SKY</span><span className="team-art-meta">U OF T · SOLAR RACING</span></div><div className="team-content"><span className="project-category">SOLAR VEHICLES · RACE STRATEGY</span><h3>Blue Sky Solar Racing</h3><p>A different kind of horsepower. I simulate energy use to find efficient racing speeds, using local caching to make the search faster. Every watt has a job to do.</p><div className="team-role"><span className="status-dot"/> ENERGY SIMULATION & RACE STRATEGY</div><a href="https://www.blueskysolar.org/" target="_blank" rel="noreferrer" className="text-link">Meet the team <ArrowUpRight size={16}/></a></div></article></div></section>;
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

function Drive({ speed, ready, activeExit, navigatingExit, maneuver, maneuverProgress, onSelect, onBack, onGarage, onRev, onHorn, rev, honking, muted, onMute }) {
  const [help, setHelp] = useState(false);
  const movingToExit = maneuver === 'exiting' || maneuver === 'returning';
  return <div className={`drive-screen topdown-screen maneuver-${maneuver}`}>
    <TopDownDrive speed={activeExit ? 0 : speed} branchVisible={ready || maneuver !== 'cruising'} maneuver={maneuver} maneuverProgress={maneuverProgress} selectedExit={navigatingExit} honking={honking}/>
    <div className="drive-header"><Brand onClick={onGarage}/><div className="drive-location"><span className="status-dot"/> THE SCENIC ROUTE <span>TOP-DOWN TOUR · ONTARIO</span></div><button className="return-garage" onClick={onGarage}><RotateCcw size={15}/><span>RETURN TO GARAGE</span></button></div>
    <aside className={`map-directory ${ready ? 'directory-visible' : ''}`} aria-hidden={!ready} inert={!ready}>
      <div className="map-sign-heading"><OntarioShield small/><div><span>EASTBOUND</span><h2>Choose your exit.</h2></div><ArrowUpRight size={26}/></div>
      <nav aria-label="Highway exits">{EXITS.map(exit=><button key={exit.id} className="map-exit-sign" onClick={()=>onSelect(exit)}><span className="map-exit-number">{exit.number}</span><span><strong>{exit.title}</strong><small>{exit.subtitle}</small></span><ArrowUpRight size={20}/></button>)}</nav>
      <div className="map-directory-note">FIVE DESTINATIONS. ONE SCENIC OFF-RAMP.</div>
    </aside>
    {!ready && !activeExit && <div className="map-drive-message"><span className="eyebrow">{maneuver === 'returning' ? 'JOINING THE ON-RAMP' : movingToExit ? 'FOLLOWING THE OFF-RAMP' : 'THE OPEN ROAD IS CALLING'}</span><h2>{maneuver === 'exiting' ? `Next stop: ${navigatingExit.title}.` : maneuver === 'returning' ? 'Back to the open road.' : speed < 40 ? 'Here we go.' : 'Finding your next adventure.'}</h2><p>{movingToExit ? 'Car-XY is taking the scenic route.' : 'Your exit signs will appear at cruising speed.'}</p></div>}
    <div className="map-compass" aria-hidden="true"><Navigation size={20}/><span>E</span></div>
    <div className="map-telemetry" aria-label={`Speed ${speed} kilometres per hour, gear ${gearAt(speed)}`}><div className="map-telemetry-top"><span>AUDI R8 · CAR-XY</span><span className="status-dot"/></div><div className="map-speed"><span>{activeExit ? 'P' : gearAt(speed)}</span><strong>{speed.toString().padStart(3,'0')}</strong><small>KM/H</small></div><div className="map-rpm"><span style={{width:`${rpmAt(speed,rev)/8500*100}%`}}/></div><div className="map-drive-state">{activeExit ? 'PARKED · ENJOY THE STOP' : maneuver === 'exiting' ? 'INDICATOR ON · TAKING EXIT' : maneuver === 'returning' ? 'MERGING ONTO HIGHWAY 401' : ready ? 'CRUISING · PICK A DESTINATION' : 'ACCELERATING'}</div></div>
    <div className="drive-controls" id="drive-controls"><button onClick={onRev} className={rev ? 'active' : ''}><Gauge size={17}/><span>{rev ? 'REVVING…' : 'REV ENGINE'}</span><kbd>R</kbd></button><button onClick={onHorn} className={honking ? 'active' : ''}><Megaphone size={17}/><span>{honking ? 'BEEP BEEP!' : 'HORN'}</span><kbd>H</kbd></button><div className="drive-controls-divider"/><button className="control-icon" onClick={onMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><button className="control-icon" onClick={()=>setHelp(!help)} aria-label="Show driving help" aria-expanded={help}><CircleHelp size={18}/></button></div>
    {help && <div className="drive-help"><button className="icon-button" onClick={()=>setHelp(false)} aria-label="Close help"><X size={16}/></button><h3>A little road trip.</h3><p>Choose a green sign. Car-XY will take the off-ramp and park at your destination. “Back on the road” merges you onto the highway again.</p><p><kbd>R</kbd> Recorded rev <kbd>H</kbd> Recorded horn <kbd>M</kbd> Sound</p><small>Return to the garage anytime for the full portfolio.</small></div>}
    {activeExit && <StopDialog key={activeExit.id} exit={activeExit} onBack={onBack} onGarage={onGarage}/>}
  </div>;
}

export default function App() {
  const [mode, setMode] = useState('landing');
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [ready, setReady] = useState(false);
  const [activeExit, setActiveExit] = useState(null);
  const [navigatingExit, setNavigatingExit] = useState(null);
  const [maneuver, setManeuver] = useState('cruising');
  const [maneuverProgress, setManeuverProgress] = useState(0);
  const [rev, setRev] = useState(0);
  const [honking, setHonking] = useState(false);
  const [transition, setTransition] = useState(null);
  const [run, setRun] = useState(0);
  const timers = useRef({});
  const initialSpeed = useRef(0);
  const latest = useRef({mode,speed,transition});
  latest.current = {mode,speed,transition};

  useEffect(()=>{
    document.body.classList.toggle('in-drive', mode === 'drive');
    document.body.classList.toggle('on-landing', mode === 'landing');
    return ()=>{ document.body.classList.remove('in-drive','on-landing'); };
  },[mode]);

  useEffect(()=>{
    if (mode !== 'drive' || maneuver !== 'cruising' || transition) return;
    const started = performance.now();
    const from = initialSpeed.current;
    setReady(false);
    let frame;
    function tick(now) {
      const next = Math.round(from + (180-from) * speedAt(now-started,run > 1 ? 2600 : 5800)/180);
      setSpeed(next);
      if (next < 180) frame = requestAnimationFrame(tick);
      else setReady(true);
    }
    frame = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[mode,maneuver,transition,run]);

  useEffect(()=>{
    if (mode !== 'drive' || transition || !['exiting','returning'].includes(maneuver)) return;
    const started = performance.now();
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : EXIT_DURATION;
    let frame;
    function tick(now) {
      const progress = Math.min(1,(now-started)/duration);
      const eased = progress*progress*(3-2*progress);
      setManeuverProgress(eased);
      setSpeed(Math.round(maneuver === 'exiting' ? 180*(1-eased) : 65*eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else if (maneuver === 'exiting') { setManeuver('parked'); setActiveExit(navigatingExit); }
      else { initialSpeed.current = 65; setManeuverProgress(0); setManeuver('cruising'); setNavigatingExit(null); setRun(value=>value+1); }
    }
    frame = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[mode,maneuver,navigatingExit,transition]);

  useEffect(()=>{ audio.update(activeExit ? 0 : speed); },[speed,activeExit]);
  useEffect(()=>{
    const visibility = ()=>{
      if (document.hidden) audio.stop();
      else if (latest.current.mode === 'drive' && !latest.current.transition) audio.resume(latest.current.speed);
    };
    document.addEventListener('visibilitychange',visibility);
    return ()=>document.removeEventListener('visibilitychange',visibility);
  },[]);
  useEffect(()=>()=>{ Object.values(timers.current).forEach(clearTimeout); audio.stop(); },[]);

  function mute() { setMuted(audio.toggleMute()); }
  function revEngine() { audio.rev(); setRev(1); clearTimeout(timers.current.rev); timers.current.rev=setTimeout(()=>setRev(0),4000); }
  function horn() { audio.horn(); setHonking(true); clearTimeout(timers.current.horn); timers.current.horn=setTimeout(()=>setHonking(false),1800); }
  function start() {
    if (transition || mode === 'drive') return;
    audio.start(); setTransition('ignition'); setSpeed(0); setReady(false); setRun(1); initialSpeed.current=0;
    setActiveExit(null); setNavigatingExit(null); setManeuver('cruising'); setManeuverProgress(0);
    timers.current.start=setTimeout(()=>{ setMode('drive'); setTransition(null); },1800);
  }
  function garage() {
    if (transition) return;
    if (mode === 'garage') { document.getElementById('home')?.scrollIntoView({behavior:'smooth'}); return; }
    setTransition('garage'); audio.garage(); setActiveExit(null); setReady(false);
    timers.current.garage=setTimeout(()=>{
      setMode('garage'); setSpeed(0); setTransition(null); setNavigatingExit(null); setManeuver('cruising'); setManeuverProgress(0);
      requestAnimationFrame(()=>window.scrollTo({top:0}));
    },1000);
  }
  function home() {
    Object.values(timers.current).forEach(clearTimeout); audio.stop();
    setMode('landing'); setSpeed(0); setReady(false); setRev(0); setHonking(false); setTransition(null);
    setActiveExit(null); setNavigatingExit(null); setManeuver('cruising'); setManeuverProgress(0);
    requestAnimationFrame(()=>window.scrollTo({top:0}));
  }
  function chooseExit(exit) {
    if (!ready || maneuver !== 'cruising') return;
    setReady(false); setNavigatingExit(exit); setManeuver('exiting');
  }
  function back() { setActiveExit(null); setReady(false); setManeuverProgress(0); setManeuver('returning'); audio.resume(0); }

  useEffect(()=>{
    function key(event) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable || latest.current.transition) return;
      if (event.key.toLowerCase()==='r') { event.preventDefault(); revEngine(); }
      if (event.key.toLowerCase()==='h') { event.preventDefault(); horn(); }
      if (event.key.toLowerCase()==='m') { event.preventDefault(); mute(); }
    }
    window.addEventListener('keydown',key); return ()=>window.removeEventListener('keydown',key);
  },[]);

  const landing = mode === 'landing';
  return <>
    <a href={mode==='drive'?'#drive-controls':landing?'#mode-choice':'#projects'} className="skip-navigation">Skip to {mode==='drive'?'ride controls':landing?'mode choice':'projects'}</a>
    {mode === 'drive' ? <Drive speed={speed} ready={ready} activeExit={activeExit} navigatingExit={navigatingExit} maneuver={maneuver} maneuverProgress={maneuverProgress} onSelect={chooseExit} onBack={back} onGarage={garage} onRev={revEngine} onHorn={horn} rev={rev} honking={honking} muted={muted} onMute={mute}/> : <>
      <Header landing={landing} onStart={start} muted={muted} onMute={mute} garage={home}/>
      <main className={landing ? 'landing-page' : 'garage-page'}><GarageHero landing={landing} onGarage={garage} onStart={start} onRev={revEngine} onHorn={horn} revving={!!rev} honking={honking}/>
        {!landing && <><RouteMap onStart={start} onSelect={()=>{}}/><Projects/><Teams/><Journey/><Skills/><Contact/></>}
      </main>{!landing && <Footer onStart={start}/>}
    </>}
    <div className="sr-only" role="status" aria-live="polite">{maneuver === 'exiting' ? `Taking the off-ramp to ${navigatingExit?.title}.` : maneuver === 'returning' ? 'Merging back onto Highway 401.' : rev ? 'Engine revving' : honking ? 'Horn honking' : ready && mode==='drive' ? 'Cruising at 180 kilometres per hour. Choose an exit to explore.' : ''}</div>
    {transition && <div className={`transition-screen ${transition}`} role="status"><div className="transition-mark"><Power size={27}/></div><div className="eyebrow">{transition==='ignition'?'5.2 LITRES. TEN CYLINDERS. ONE ADVENTURE.':'OPENING THE GARAGE.'}</div><h2>{transition==='ignition'?'Let’s go for a ride.':'Welcome to the garage.'}</h2><div className="transition-line"><span/></div><span className="transition-caption">{transition==='ignition'?'ENGINE STARTING · OPENING THE ROAD':'PARKING UP · OPENING YOUR PORTFOLIO'}</span></div>}
  </>;
}
