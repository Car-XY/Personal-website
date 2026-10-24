import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowDown, Volume2, VolumeX, Download, Github, Linkedin, Menu, X, Power, Gauge, MapPin, RotateCcw, CircleHelp, ExternalLink, Check, Navigation, Hand, CarFront, AudioLines, Megaphone } from 'lucide-react';
import { EXITS, speedAt, gearAt, rpmAt, revSpeedAt, revEnvelope, EXIT_DURATION } from './drive.js';
import { links, projects, skills, availability, currently } from './data.js';
import { audio } from './audio.js';
import TopDownDrive from './TopDownDrive.jsx';
import GarageHub from './GarageHub.jsx';
import { garageDestination, canReturnToRoad } from './garage.js';
import { useSceneEnhancement } from './visuals.js';

const Scene = lazy(() => import('./Scene.jsx'));

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Brand({ onClick }) {
  return <button className="brand" onClick={onClick} aria-label="Cary Li home"><span className="brand-symbol">c</span><span>CAR<span className="brand-dash">—</span>XY<small>CARY LI’S PERSONAL GARAGE</small></span></button>;
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
    {landing && <div className="landing-header-note"><span className="status-dot"/> CARY LI · ENGINEERING SCIENCE</div>}
    <div className="header-actions"><a href="/Cary-Li-Resume.pdf" className="resume-link" target="_blank" rel="noreferrer">Résumé <ArrowUpRight size={15}/></a><span className="header-divider"/><button className="icon-button sound-toggle" onClick={onMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={!muted}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><button className="mobile-menu icon-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div>
  </header>;
}

function GarageHero({ onStart, onGarage, onRev, onHorn, revving, honking, landing = false }) {
  const visual=useSceneEnhancement();
  return <section className="garage-hero" id="home" aria-labelledby="hero-title">
    <div className="hero-grid" aria-hidden="true"/>
    <div className="hero-copy">
      <div className="eyebrow"><span className="status-dot"/> UNIVERSITY OF TORONTO</div>
      <h1 id="hero-title">Hey, I’m<br/><span>Cary.</span></h1>
      <p className="hero-intro">First-year Engineering Science at U of T. I build ML models, 3D web apps, and race-car algorithms.</p>
      <p className="hero-description">Hop in — I’ll show you around.</p>
      <div className="hero-cta" id={landing?'mode-choice':undefined}><button className="start-button" onClick={onStart}><Power size={18}/><span>TEST DRIVE CAR-XY</span><ArrowUpRight size={21}/></button><button className="enter-garage-button" onClick={onGarage}>ENTER THE GARAGE <ArrowRight size={18}/></button></div>
      <p className="currently-note">{currently}</p>
      <div className="sound-note"><AudioLines size={15}/><span>Sound is optional.</span></div>
    </div>
    <div className={`car-stage ${visual.ready?'scene-ready':''} ${revving?'revving':''}`} data-render-mode={visual.ready?'interactive':'static'}>
      <div className="garage-wall" aria-hidden="true"><span>CAR-XY</span><div className="wall-line"/><span className="bay-number">01</span></div>
      <img className="car-poster" src="/images/car-poster.svg" width="1000" height="600" fetchPriority="high" alt="Navy Car-XY sports car, viewed from the front and side"/>
      {visual.mount&&<SceneBoundary onError={visual.onError}><Suspense fallback={null}><Scene onReady={visual.onReady} onError={visual.onError}/></Suspense></SceneBoundary>}
      <div className="car-view-label"><span className="view-dot"/> NAVY BLUE · CAR-XY</div>
      <div className="car-visual-controls">{visual.ready&&<span><Hand size={13}/> DRAG TO ROTATE</span>}<button onClick={visual.toggle} aria-pressed={visual.staticOnly}>{visual.staticOnly||visual.failed?'LOAD 3D VIEW':'USE STATIC VIEW'}</button></div>
      <div className="car-spec"><div><strong>CAR-XY</strong><span>CAR-XY · 5.2L V10 · 602 HP</span></div></div>
    </div>
    <div className="hero-bottom"><div className="location"><MapPin size={14}/><span>Toronto, ON</span></div><div className="garage-controls"><button className={revving?'active':''} onClick={onRev}><Gauge size={16}/>{revving?'REVVING…':'REV ENGINE'}<kbd>R</kbd></button><button onClick={onHorn} className={honking?'active':''}><Megaphone size={16}/>{honking?'HONKING…':'HORN'}<kbd>H</kbd></button></div></div>
  </section>;
}

function RouteMap({ onSelect, onStart }) {
  return <section className="route-map" id="route"><div className="route-heading"><div className="route-heading-left"><OntarioShield small/><div><div className="eyebrow">YOUR ROUTE, YOUR PACE</div><h2>Portfolio sections</h2></div></div><button className="text-link" onClick={onStart}>Take the scenic route <ArrowUpRight size={17}/></button></div><div className="route-exits">{EXITS.map(exit => <a key={exit.id} href={`#${exit.id}`} onClick={() => onSelect(exit.id)} className="route-exit"><span className="exit-top"><span>EXIT {exit.number}</span><ArrowUpRight size={17}/></span><h3>{exit.title}</h3><span className="exit-description">{exit.subtitle}</span></a>)}</div><div className="route-footer"><span><span className="status-dot"/> SELECT A SECTION TO READ</span><span>SCROLL TO EXPLORE <ArrowDown size={13}/></span></div></section>;
}

function ProjectArt({ kind }) {
  const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
  const thumbnail={
    anchor:{src:'/images/projects/anchor.webp',alt:'Anchor app: habit tracking, reflections and a goal timeline',width:2288,height:1448},
    kera:{src:'/images/projects/kera.webp',alt:'Kera: Health at your fingertips, a photo-based hemoglobin research project',width:1536,height:1024},
    clearpath:{src:'/images/projects/clearpath.webp',alt:'ClearPath 3D room planner with furniture and clearance checks',width:2858,height:1466},
  }[kind];
  if(!thumbnail)return <RacingArt/>;
  return <div className={`project-art supplied-art ${kind}-thumbnail ${loaded?'image-ready':''}`}>
    {!loaded&&<span className="thumbnail-placeholder">{failed?'Preview unavailable':projects.find(p=>p.visual===kind)?.title}</span>}
    {!failed&&<img src={thumbnail.src} width={thumbnail.width} height={thumbnail.height} alt={thumbnail.alt} loading="lazy" decoding="async" onLoad={event=>{const image=event.currentTarget;image.decode().catch(()=>{}).then(()=>setLoaded(true));}} onError={()=>setFailed(true)}/>}
  </div>;
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
  </svg><span className="art-corner">04—C++</span></div>;
}

function SectionHeading({ number, label, title, text, link }) {
  return <div className="section-heading"><div><div className="eyebrow"><span className="section-number">{number}</span>{label}</div><h2>{title}</h2></div><div className="section-heading-right">{text && <p>{text}</p>}{link}</div></div>;
}

function Projects({ compact = false }) {
  return <section className={`content-section projects-section ${compact?'compact':''}`} id={compact?undefined:'projects'}>
    <SectionHeading number="01" label="SELECTED WORK" title="Projects"/>
    <div className="projects-grid">{projects.map(project=><article className="project-card" key={project.title}>
      <ProjectArt kind={project.visual}/><div className="project-card-body">
        <div className="project-category">{project.kind}<span>{project.year}</span></div>
        <div className="project-title-row"><h3>{project.title}</h3><span className={`project-status status-${project.status.toLowerCase().replaceAll(' ','-')}`}>{project.status}</span></div>
        <p>{project.description}</p>
        <ul className="project-contributions">{project.contributions.map(point=><li key={point}>{point}</li>)}</ul>
        <p className="project-outcome">{project.outcome}</p><p className="project-note">{project.note}</p>
        <details><summary>Technical details <span>+</span></summary><p>{project.detail}</p></details>
        <div className="project-tags">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
        <div className="project-links">{project.links.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={15}/></a>)}{project.privateSource&&<span className="private-source">Code private</span>}</div>
      </div></article>)}</div>
  </section>;
}

function Teams({ compact = false }) {
  return <section className="content-section teams-section" id={compact ? undefined : 'teams'}><SectionHeading number="02" label="THE DESIGN TEAMS" title="Design Teams"/><div className="teams-grid"><article className="team-card formula"><div className="team-art" aria-hidden="true"><span className="team-giant">F<span>SAE</span></span><div className="team-track"/><span className="team-art-meta">U OF T · FORMULA RACING</span></div><div className="team-content"><span className="project-category">FORMULA SAE · DRIVERLESS</span><h3>U of T Formula Racing</h3><p>I develop C++ pathfinding algorithms that convert cone maps into racing lines, optimizing path length and straightness for the team’s driverless car.</p><div className="team-role"><span className="status-dot"/> PATHFINDING & PERCEPTION SOFTWARE</div><a href="https://fsaeutoronto.ca" target="_blank" rel="noreferrer" className="text-link">Meet the team <ArrowUpRight size={16}/></a></div></article><article className="team-card solar"><div className="team-art" aria-hidden="true"><div className="solar-sun"/><div className="solar-panel"/><span className="solar-word">BLUE SKY</span><span className="team-art-meta">U OF T · SOLAR RACING</span></div><div className="team-content"><span className="project-category">SOLAR VEHICLES · RACE STRATEGY</span><h3>Blue Sky Solar Racing</h3><p>I build energy-use simulations to find efficient racing speeds, and implement local caching to avoid repeating simulation work during the strategy search.</p><div className="team-role"><span className="status-dot"/> ENERGY SIMULATION & RACE STRATEGY</div><a href="https://www.blueskysolar.org/" target="_blank" rel="noreferrer" className="text-link">Meet the team <ArrowUpRight size={16}/></a></div></article></div></section>;
}

function Journey({ compact = false }) {
  return <section className="content-section journey-section" id={compact ? undefined : 'journey'}><SectionHeading number="03" label="THE ROAD SO FAR" title="About"/><div className="journey-layout"><div className="journey-intro"><span className="outline-monogram">CL.</span><h3>Cary Li</h3><p>I’m a first-year Engineering Science student at the University of Toronto’s St. George campus. I like the places where software meets something tangible: a room, a race car, a person’s day.</p><a href="/Cary-Li-Resume.pdf" target="_blank" rel="noreferrer" className="text-link">Résumé <Download size={16}/></a></div><div className="timeline"><article><span className="timeline-date">SEP 2026 — PRESENT</span><h3>University of Toronto</h3><span className="timeline-subtitle">B.A.Sc. · Engineering Science</span><p>First-year Engineering Science student. Software work with U of T Formula Racing and Blue Sky Solar Racing.</p></article><article><span className="timeline-date">MAR 2025 — PRESENT</span><h3>The Fundamental Why</h3><span className="timeline-subtitle">Founder · Physics & philosophy podcast</span><p>Conversations with STEM researchers, physics students, and curious minds about how the world works, and why.</p><div className="podcast-stats"><span><strong>7</strong>EPISODES</span><span><strong>2.1k+</strong>SUBSCRIBERS</span><span><strong>14.1k+</strong>VIEWS</span></div></article><article><span className="timeline-date">SEP 2024 — JUN 2026</span><h3>Champion Swim School</h3><span className="timeline-subtitle">Competitive Swim Instructor</span><p>Teaching all four strokes to swimmers aged 6–16. Named Instructor of the Month twice, among a team of 30.</p></article><article><span className="timeline-date">2022 — 2026</span><h3>Dr. G.W. Williams Secondary School</h3><span className="timeline-subtitle">IB Diploma · 41/45</span><p>UofT National Book Award, Pay It Forward Scholarship, and DECA ICDC qualifier.</p></article></div></div></section>;
}

function Skills({ compact = false }) {
  return <section className="content-section skills-section" id={compact ? undefined : 'skills'}><SectionHeading number="04" label="UNDER THE HOOD" title="Skills"/><div className="skills-grid">{skills.map(skill=><article key={skill.name} className="skill-column"><div className="skill-top"><span>{skill.number}</span><Gauge size={22}/></div><h3>{skill.name}</h3><ul>{skill.items.map(item=><li key={item}>{item}</li>)}</ul></article>)}</div></section>;
}

function Contact({ compact = false }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(links.email); setCopied(true); setTimeout(()=>setCopied(false), 2200); } catch { window.location.href = `mailto:${links.email}`; } }
  return <section className={`contact-section ${compact ? 'compact' : ''}`} id={compact ? undefined : 'contact'}><div className="contact-top"><div className="eyebrow"><span className="status-dot"/> CONTACT</div><span>Toronto, ON</span></div><h2>Get in touch</h2><div className="contact-bottom"><div><p className="availability-line">{availability}</p><a className="email-link" href={`mailto:${links.email}`}>{links.email}<ArrowUpRight size={21}/></a><button className="copy-email" onClick={copy}>{copied ? <><Check size={13}/> Copied to clipboard</> : 'Copy email address'}</button></div><div className="social-links"><a href={links.github} target="_blank" rel="noreferrer"><Github size={18}/> GitHub <ArrowUpRight size={15}/></a><a href={links.linkedin} target="_blank" rel="noreferrer"><Linkedin size={18}/> LinkedIn <ArrowUpRight size={15}/></a><a href={links.devpost} target="_blank" rel="noreferrer"><ExternalLink size={18}/> Devpost <ArrowUpRight size={15}/></a></div></div></section>;
}

function Footer({ onStart }) {
  return <footer className="footer"><div><span className="footer-brand">CAR—XY</span><span>{`© ${new Date().getFullYear()} Cary Li`}</span></div><button onClick={onStart}>TEST DRIVE <ArrowUpRight size={15}/></button></footer>;
}

const sectionComponents = { projects: Projects, teams: Teams, journey: Journey, skills: Skills, contact: Contact };

function StopDialog({ exit, onBack, onGarage, origin = 'drive' }) {
  const modal = useRef(null);
  const lastFocus = useRef(null);
  useEffect(()=>{
    lastFocus.current = document.activeElement;
    const dialog = modal.current;
    dialog.showModal();
    function cancel(event) { event.preventDefault(); onBack(); }
    function click(event) { if (event.target === dialog) onBack(); }
    dialog.addEventListener('cancel', cancel); dialog.addEventListener('click', click);
    return ()=>{ dialog.removeEventListener('cancel', cancel); dialog.removeEventListener('click', click); dialog.close(); requestAnimationFrame(()=>{
      const target=lastFocus.current;
      if(target?.isConnected&&!target.disabled)target.focus();
      else document.querySelector('#drive-controls button, .garage-read-button, .brand')?.focus();
    }); };
  },[]);
  const Content = sectionComponents[exit.id];
  return <dialog className={`stop-dialog ${origin==='garage'?'garage-stop':''}`} ref={modal} aria-labelledby="stop-title"><div className="stop-shell"><div className="stop-header"><span><Navigation size={17}/><span id="stop-title">{origin==='garage'?'THE GARAGE':'EXIT '+exit.number} · {exit.title.toUpperCase()}</span></span><button className="icon-button" onClick={onBack} aria-label={origin==='garage'?'Close and return to the garage':'Close and return to the road'}><X size={20}/></button></div><div className="stop-scroll"><Content compact/></div><div className="stop-bottom">{origin==='drive'&&<button className="text-link" onClick={onGarage}><RotateCcw size={15}/> Return to garage</button>}<button className="start-button" onClick={onBack}>{origin==='garage'?'BACK TO GARAGE':'BACK ON THE ROAD'} <ArrowRight size={18}/></button></div></div></dialog>;
}

function Drive({ speed, ready, activeExit, navigatingExit, maneuver, maneuverProgress, onSelect, onBack, onGarage, onRev, onHorn, rev, revProgress, honking, muted, onMute }) {
  const [help, setHelp] = useState(false);
  const movingToExit = maneuver === 'exiting' || maneuver === 'returning';
  return <div className={`drive-screen topdown-screen maneuver-${maneuver}`}>
    <TopDownDrive speed={activeExit ? 0 : speed} branchVisible={ready || maneuver !== 'cruising'} maneuver={maneuver} maneuverProgress={maneuverProgress} selectedExit={navigatingExit}/>
    <div className="drive-header"><Brand onClick={onGarage}/><div className="drive-location"><span className="status-dot"/> THE SCENIC ROUTE <span>TOP-DOWN TOUR · ONTARIO</span></div><button className="return-garage" onClick={onGarage}><RotateCcw size={15}/><span>RETURN TO GARAGE</span></button></div>
    <aside className={`map-directory ${ready ? 'directory-visible' : ''}`} aria-hidden={!ready} inert={!ready}>
      <div className="map-sign-heading"><OntarioShield small/><div><span>EASTBOUND</span><h2>Choose your exit.</h2></div><ArrowUpRight size={26}/></div>
      <nav aria-label="Highway exits">{EXITS.map(exit=><button key={exit.id} className="map-exit-sign" onClick={()=>onSelect(exit)}><span className="map-exit-number">{exit.number}</span><span><strong>{exit.title}</strong><small>{exit.subtitle}</small></span><ArrowUpRight size={20}/></button>)}</nav>
      <div className="map-directory-note">SELECT A SECTION TO VIEW</div>
    </aside>
    {!ready && !activeExit && <div className="map-drive-message"><span className="eyebrow">{maneuver === 'returning' ? 'JOINING THE ON-RAMP' : movingToExit ? 'FOLLOWING THE OFF-RAMP' : 'THE OPEN ROAD IS CALLING'}</span><h2>{maneuver === 'exiting' ? `Next stop: ${navigatingExit.title}.` : maneuver === 'returning' ? 'Back to the open road.' : speed < 40 ? 'Here we go.' : 'Finding your next adventure.'}</h2><p>{movingToExit ? 'Car-XY is taking the scenic route.' : 'Your exit signs will appear at cruising speed.'}</p></div>}
    <div className="map-compass" aria-hidden="true"><Navigation size={20}/><span>E</span></div>
    <div className="map-telemetry" aria-label={`Speed ${speed} kilometres per hour, gear ${gearAt(speed)}`}><div className="map-telemetry-top"><span>CAR-XY</span><span className="status-dot"/></div><div className="map-speed"><span>{activeExit ? 'P' : gearAt(speed)}</span><strong>{speed.toString().padStart(3,'0')}</strong><small>KM/H</small></div><div className="map-rpm"><span style={{width:`${rpmAt(speed,rev?revEnvelope(revProgress):0)/8500*100}%`}}/></div><div className="map-drive-state">{activeExit ? 'PARKED · ENJOY THE STOP' : maneuver === 'exiting' ? 'INDICATOR ON · TAKING EXIT' : maneuver === 'returning' ? 'MERGING ONTO HIGHWAY 401' : ready ? 'CRUISING · PICK A DESTINATION' : 'ACCELERATING'}</div></div>
    <div className="drive-controls" id="drive-controls"><button onClick={onRev} className={rev ? 'active' : ''}><Gauge size={17}/><span>{rev ? 'REVVING…' : 'REV ENGINE'}</span><kbd>R</kbd></button><button onClick={onHorn} className={honking?'active':''}><Megaphone size={17}/><span>{honking?'HONKING…':'HORN'}</span><kbd>H</kbd></button><div className="drive-controls-divider"/><button className="control-icon" onClick={onMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><button className="control-icon" onClick={()=>setHelp(!help)} aria-label="Show driving help" aria-expanded={help}><CircleHelp size={18}/></button></div>
    {help && <div className="drive-help"><button className="icon-button" onClick={()=>setHelp(false)} aria-label="Close help"><X size={16}/></button><h3>A little road trip.</h3><p>Choose a green sign. Car-XY will take the off-ramp and park at your destination. “Back on the road” merges you onto the highway again.</p><p><kbd>R</kbd> Recorded rev <kbd>H</kbd> Horn <kbd>M</kbd> Sound</p><small>Return to the garage anytime for the full portfolio.</small></div>}
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
  const [revProgress, setRevProgress] = useState(0);
  const [honking, setHonking] = useState(false);
  const [transition, setTransition] = useState(null);
  const [run, setRun] = useState(0);
  const [garageSection, setGarageSection] = useState(null);
  const [readAll, setReadAll] = useState(false);
  const returnConsumed = useRef(false);
  const timers = useRef({});
  const initialSpeed = useRef(0);
  const latest = useRef({mode,speed,transition,maneuver});
  latest.current = {mode,speed,transition,maneuver};

  useEffect(()=>audio.subscribe(({revving,honking})=>{setRev(revving?1:0);setHonking(honking);}),[]);
  useEffect(()=>{
    let frame;
    function tick(){setRevProgress(audio.getRevProgress());frame=requestAnimationFrame(tick);}
    if(rev)tick();else setRevProgress(0);
    return ()=>cancelAnimationFrame(frame);
  },[rev]);

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
      else if (maneuver === 'exiting') { audio.park(); setManeuver('parked'); setActiveExit(navigatingExit); }
      else { initialSpeed.current = 65; setManeuverProgress(0); setManeuver('cruising'); setNavigatingExit(null); setRun(value=>value+1); }
    }
    frame = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[mode,maneuver,navigatingExit,transition]);

  useEffect(()=>{ audio.update(activeExit ? 0 : speed); },[speed,activeExit]);
  useEffect(()=>{
    const visibility = ()=>{
      if (document.hidden) audio.stop();
      else if (latest.current.mode === 'drive' && !latest.current.transition) audio.resume(latest.current.speed,{parked:latest.current.maneuver==='parked'});
    };
    document.addEventListener('visibilitychange',visibility);
    return ()=>document.removeEventListener('visibilitychange',visibility);
  },[]);
  useEffect(()=>()=>{ Object.values(timers.current).forEach(clearTimeout); audio.stop(); },[]);

  function mute() { setMuted(audio.toggleMute()); }
  function revEngine() { audio.rev(); }
  function horn() { audio.horn(); }
  function start() {
    if (transition || mode === 'drive') return;
    audio.start(); setGarageSection(null); setReadAll(false); returnConsumed.current=false; setTransition('ignition'); setSpeed(0); setReady(false); setRun(1); initialSpeed.current=0;
    setActiveExit(null); setNavigatingExit(null); setManeuver('cruising'); setManeuverProgress(0);
    timers.current.start=setTimeout(()=>{ setMode('drive'); setTransition(null); },1800);
  }
  function garage() {
    if (transition) return;
    if (mode === 'garage') { setGarageSection(null); document.getElementById('garage-room')?.scrollIntoView({behavior:'smooth'}); return; }
    setTransition('garage'); audio.garage(); setActiveExit(null); setReady(false);
    timers.current.garage=setTimeout(()=>{
      setMode('garage'); setGarageSection(null); setReadAll(false); setSpeed(0); setTransition(null); setNavigatingExit(null); setManeuver('cruising'); setManeuverProgress(0);
      requestAnimationFrame(()=>window.scrollTo({top:0}));
    },1000);
  }
  function home() {
    Object.values(timers.current).forEach(clearTimeout); audio.stop();
    setMode('landing'); setGarageSection(null); setReadAll(false); setSpeed(0); setReady(false); setRev(0); setTransition(null);
    setActiveExit(null); setNavigatingExit(null); setManeuver('cruising'); setManeuverProgress(0);
    requestAnimationFrame(()=>window.scrollTo({top:0}));
  }
  function chooseExit(exit) {
    if (!ready || maneuver !== 'cruising') return;
    returnConsumed.current=false; setReady(false); setNavigatingExit(exit); setManeuver('exiting');
  }
  function back() {
    if(!canReturnToRoad(latest.current,returnConsumed.current))return;
    returnConsumed.current=true; audio.beginMerge();
    setActiveExit(null); setReady(false); setManeuverProgress(0); setManeuver('returning');
  }
  function openGarageSection(id) {
    if(mode==='garage'&&!transition&&garageDestination(id)&&id!=='drive')setGarageSection(id);
  }
  function showPortfolio() {
    setReadAll(true);requestAnimationFrame(()=>document.getElementById('garage-portfolio')?.scrollIntoView({behavior:'smooth'}));
  }
  function closePortfolio() {
    setReadAll(false);requestAnimationFrame(()=>{document.getElementById('garage-room')?.scrollIntoView({behavior:'smooth'});document.querySelector('.garage-read-button')?.focus({preventScroll:true});});
  }

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
  const rideSpeed = mode==='drive'&&maneuver==='cruising'&&ready ? revSpeedAt(speed,revProgress) : speed;
  return <>
    <a href={mode==='drive'?'#drive-controls':landing?'#mode-choice':'#garage-directory'} className="skip-navigation">{`Skip to ${mode==='drive'?'ride controls':landing?'mode choice':'garage directory'}`}</a>
    {mode === 'drive' ? <Drive speed={rideSpeed} ready={ready} activeExit={activeExit} navigatingExit={navigatingExit} maneuver={maneuver} maneuverProgress={maneuverProgress} onSelect={chooseExit} onBack={back} onGarage={garage} onRev={revEngine} onHorn={horn} honking={honking} rev={rev} revProgress={revProgress} muted={muted} onMute={mute}/> : mode === 'garage' ? <>
      <GarageHub brand={<Brand onClick={home}/>} onStart={start} onSection={openGarageSection} onReadAll={showPortfolio} muted={muted} onMute={mute} onRev={revEngine} onHorn={horn} honking={honking} revving={!!rev} locked={!!transition||!!garageSection}/>
      {readAll&&<><div className="garage-portfolio-header" id="garage-portfolio" tabIndex="-1"><h2>The complete portfolio.</h2><button onClick={closePortfolio}><RotateCcw size={15}/> Back to the garage</button></div><RouteMap onStart={start} onSelect={()=>{}}/><Projects/><Teams/><Journey/><Skills/><Contact/><Footer onStart={start}/></>}
      {garageSection&&<StopDialog origin="garage" exit={garageDestination(garageSection)} onBack={()=>setGarageSection(null)} onGarage={()=>setGarageSection(null)}/>}
    </> : <>
      <Header landing={landing} onStart={start} muted={muted} onMute={mute} garage={home}/>
      <main className={landing ? 'landing-page' : 'garage-page'}><GarageHero landing={landing} onGarage={garage} onStart={start} onRev={revEngine} onHorn={horn} honking={honking} revving={!!rev}/>
        {!landing && <><RouteMap onStart={start} onSelect={()=>{}}/><Projects/><Teams/><Journey/><Skills/><Contact/></>}
      </main>{!landing && <Footer onStart={start}/>}
    </>}
    <div className="sr-only" role="status" aria-live="polite">{maneuver === 'exiting' ? `Taking the off-ramp to ${navigatingExit?.title}.` : maneuver === 'returning' ? 'Merging back onto Highway 401.' : rev ? 'Engine revving' : honking ? 'Horn honking' : ready && mode==='drive' ? 'Cruising at 180 kilometres per hour. Choose an exit to explore.' : ''}</div>
    {transition && <div className={`transition-screen ${transition}`} role="status"><div className="transition-mark"><Power size={27}/></div><div className="eyebrow">{transition==='ignition'?'5.2 LITRES. TEN CYLINDERS. ONE ADVENTURE.':'OPENING THE GARAGE.'}</div><h2>{transition==='ignition'?'Let’s go for a ride.':'Welcome to the garage.'}</h2><div className="transition-line"><span/></div><span className="transition-caption">{transition==='ignition'?'ENGINE STARTING · OPENING THE ROAD':'PARKING UP · OPENING YOUR PORTFOLIO'}</span></div>}
  </>;
}
