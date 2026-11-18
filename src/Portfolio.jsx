import { useEffect, useState } from 'react';
import { SIGNS, renderSign, loadSignFonts } from './signs.js';
import { links, projects, skills, availability, currently, portrait, about, teams, journey } from './data.js';
import Wordmark from './Wordmark.jsx';
import EmailLink from './EmailLink.jsx';

const PROJECT_IMAGES = {
  kera: { src: '/images/projects/kera.webp', width: 1536, height: 1024, alt: 'Kera: a photo-based hemoglobin estimation app' },
  clearpath: { src: '/images/projects/clearpath.webp', width: 2858, height: 1466, alt: 'ClearPath 3D room planner with furniture and clearance checks' },
  anchor: { src: '/images/projects/anchor.webp', width: 2288, height: 1448, alt: 'Anchor app: habit tracking, reflections and a goal timeline' },
};

const External = ({ href, children, className = '' }) => <a className={`ink-link ${className}`} href={href} target="_blank" rel="noreferrer">{children}<span className="ext" aria-hidden="true">↗</span></a>;

function Portrait() {
  const [failed, setFailed] = useState(false);
  if (portrait.ready && !failed) return <figure className="portrait"><img src={portrait.src} alt={portrait.alt} width={portrait.width} height={portrait.height} onError={() => setFailed(true)}/></figure>;
  return <figure className="portrait portrait-placeholder" aria-label="Photo of Cary coming soon"><span>Photo coming soon</span></figure>;
}

// The same highway sign the visitor drove past, reused as the team's picture.
function SignPicture({ id }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { let live = true; loadSignFonts().then(() => { if (live) setSrc(renderSign(id, 90).toDataURL()); }); return () => { live = false; }; }, [id]);
  return <figure className="team-visual team-sign">{src && <img src={src} alt={SIGNS[id].label}/>}</figure>;
}

function Header() {
  return <header className="log-header">
    <Wordmark/>
    <nav aria-label="Sections">
      <a href="#work">Work</a><a href="#teams">Teams</a><a href="#journey">Journey</a><a href="#contact">Contact</a>
    </nav>
    <a className="sign-button" href="/"><span aria-hidden="true">←</span> Back to the drive</a>
  </header>;
}

function Intro() {
  return <section className="log-intro" aria-labelledby="intro-title">
    <div className="intro-text">
      <h1 id="intro-title">Cary Li</h1>
      <p className="intro-lede">{about}</p>
      <p className="intro-now"><strong>Right now:</strong> {currently.replace(/^Currently /, '').replace(/^./, c => c.toUpperCase())}</p>
      <p className="intro-available">{availability}</p>
      <p className="intro-links">
        <a className="ink-link" href="/Cary-Li-Resume.pdf" target="_blank" rel="noreferrer">Résumé (PDF)</a>
        <EmailLink className="ink-link">Email</EmailLink>
        <External href={links.github}>GitHub</External>
        <External href={links.linkedin}>LinkedIn</External>
        <External href={links.devpost}>Devpost</External>
      </p>
    </div>
    <Portrait/>
  </section>;
}

function ProjectVisual({ project }) {
  const image = PROJECT_IMAGES[project.visual];
  if (image) return <figure className="project-visual"><img {...image} loading="lazy" decoding="async"/></figure>;
  if (!project.notes) return null;
  return <div className="project-notes">
    {project.notes.map(note => <section key={note.heading}>
      <h4>{note.heading}</h4>
      <ul>{note.points.map(point => <li key={point}>{point}</li>)}</ul>
    </section>)}
  </div>;
}

function Work() {
  return <section className="log-section" id="work" aria-labelledby="work-title">
    <h2 id="work-title">Selected work</h2>
    <div className="projects">
      {projects.map((project, i) => <article className={`project ${i % 2 ? 'flip' : ''}`} key={project.title}>
        <ProjectVisual project={project}/>
        <div className="project-body">
          <p className="meta">{project.kind.toLowerCase().replace(/(^|× )(\w)/g, (m, a, b) => a + b.toUpperCase())} · {project.year} · {project.status}</p>
          <h3>{project.title}</h3>
          <p className="project-desc">{project.description}</p>
          <h4>What I did</h4>
          <ul>{project.contributions.map(point => <li key={point}>{point}</li>)}</ul>
          <p className="project-outcome">{project.outcome}</p>
          <p className="project-note">{project.note}</p>
          {project.detail && <details><summary>Technical details</summary><p>{project.detail}</p></details>}
          <p className="stack">{project.tags.join(' / ')}</p>
          <p className="project-links">{project.links.map(link => <External key={link.href} href={link.href}>{link.label}</External>)}</p>
        </div>
      </article>)}
    </div>
  </section>;
}

function Teams() {
  return <section className="log-section" id="teams" aria-labelledby="teams-title">
    <h2 id="teams-title">Design teams</h2>
    <div className="teams">
      {teams.map(team => <article className="team" key={team.name}>
        {team.image ? <figure className="team-visual"><img {...team.image} loading="lazy" decoding="async"/></figure> : <SignPicture id={team.sign}/>}
        <p className="meta">{team.group}</p>
        <h3>{team.name}</h3>
        <p>{team.role}</p>
        <p className="stack">{team.stack.join(' / ')}</p>
        <External href={team.href}>Team website</External>
      </article>)}
    </div>
  </section>;
}

function Journey() {
  return <section className="log-section" id="journey" aria-labelledby="journey-title">
    <h2 id="journey-title">The road so far</h2>
    <ol className="road">
      {journey.map(stop => <li key={stop.title}>
        <p className="road-when">{stop.when}</p>
        <div className="road-stop">
          <h3>{stop.title}</h3>
          <p className="road-sub">{stop.subtitle}</p>
          <p>{stop.text}</p>
          {stop.stats && <p className="road-stats">{stop.stats.map(([n, l]) => <span key={l}><strong>{n}</strong> {l}</span>)}</p>}
          {stop.link && <External href={stop.link.href}>{stop.link.label}</External>}
        </div>
      </li>)}
    </ol>
  </section>;
}

function Skills() {
  return <section className="log-section" id="skills" aria-labelledby="skills-title">
    <h2 id="skills-title">Toolkit</h2>
    <div className="skills">
      {skills.map(group => <div key={group.name}><h3>{group.name}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}
    </div>
  </section>;
}

function Contact() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(links.email); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { window.location.href = `mailto:${links.email}`; }
  }
  return <section className="log-contact" id="contact" aria-labelledby="contact-title">
    <h2 id="contact-title">Let’s build something.</h2>
    <p>{availability} If you’re great at hardware, I’d love to connect and learn from you.</p>
    <a className="big-email" href={`mailto:${links.email}`}>{links.email}</a>
    <button className="copy" onClick={copy}>{copied ? 'Copied' : 'Copy email address'}</button>
    <p className="intro-links">
      <External href={links.github}>GitHub</External>
      <External href={links.linkedin}>LinkedIn</External>
      <External href={links.devpost}>Devpost</External>
    </p>
  </section>;
}

export default function Portfolio() {
  return <div className="logbook">
    <a className="skip-link" href="#work">Skip to selected work</a>
    <Header/>
    <main>
      <Intro/><Work/><Teams/><Journey/><Skills/><Contact/>
    </main>
    <footer className="log-footer">
      <span>© {new Date().getFullYear()} Cary Li · Toronto</span>
      <span>Set in Overpass and Source Serif</span>
      <a className="ink-link" href="/">Back to the drive</a>
    </footer>
  </div>;
}
