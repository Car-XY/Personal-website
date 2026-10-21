import { Component, Suspense, lazy, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, CarFront, Flag, Gauge, Laptop, Map, Megaphone, Radio, Volume2, VolumeX, Wrench } from 'lucide-react';
import { GARAGE_OBJECTS, garageDestination, layoutGarageLabels } from './garage.js';

const GarageRoom = lazy(()=>import('./GarageRoom.jsx'));
const icons={projects:Laptop,teams:Flag,journey:Map,skills:Wrench,contact:Radio,drive:CarFront};
class RoomBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true};}
  componentDidCatch(){this.props.onError();}
  render(){return this.state.failed?null:this.props.children;}
}

function RoomFallback() {
  return <div className="garage-room-backup" aria-hidden="true"><svg viewBox="0 0 1000 560">
    <defs><linearGradient id="backup-wall"><stop stopColor="#b2bdc3"/><stop offset="1" stopColor="#6d7e8c"/></linearGradient></defs>
    <path d="M120 300 570 140 910 310 490 510Z" fill="#788389"/><path d="M120 300V90L570 0V140Z" fill="url(#backup-wall)"/><path d="M570 0 910 150V310L570 140Z" fill="#8b9ca7"/>
    <path d="M610 70 780 145V270L610 195Z" fill="#314758"/>{[0,1,2,3,4].map(i=><path key={i} d={`M610 ${95+i*21} 780 ${170+i*21}`} stroke="#526b7a" strokeWidth="3"/>)}
    <path d="M190 250V175L355 137V210Z" fill="#284c6b"/><path d="M174 175 350 130 395 150 218 197Z" fill="#bda078"/>
    <path d="M205 335V290L340 245V290Z" fill="#173b60"/><path d="M650 295V210L770 250V330Z" fill="#223b4c"/>
    <path d="M150 190V130L285 100V160Z" fill="#e0ddd0" stroke="#31506b" strokeWidth="5"/>
    <path d="M780 350V285L830 308V373Z" fill="#21495b"/><path d="M770 282V242L840 274V315Z" fill="#a5cfce"/>
    <path d="M375 310 510 260 665 340 520 399Z" fill="none" stroke="#d9bd7c" strokeWidth="3"/>
  </svg><img src="/images/r8-reference.png" alt=""/></div>;
}

export default function GarageHub({brand,onStart,onSection,onReadAll,muted,onMute,onRev,onHorn,revving,honking,locked}) {
  const [highlighted,setHighlighted]=useState(null),[layout,setLayout]=useState(null),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
  const choose=(id,fromCanvas=false)=>{
    if(locked||!garageDestination(id))return;
    if(fromCanvas){
      const selector=window.matchMedia('(max-width:700px)').matches?'data-garage-link':'data-garage-object';
      document.querySelector(`[${selector}="${id}"]`)?.focus({preventScroll:true});
    }
    if(id==='drive')onStart();else onSection(id);
  };
  const labels=layout?layoutGarageLabels(layout.points,layout.width,layout.height):[];
  return <main className="garage-hub" id="garage-room" tabIndex="-1">
    <header className="site-header garage-hub-header">{brand}<div className="garage-open"><span className="status-dot"/> CARY’S WORKSHOP <span>EST. 2026</span></div><div className="garage-header-actions"><button onClick={onReadAll} className="garage-read-button"><BookOpen size={15}/><span>READ PORTFOLIO</span></button><a href="/Cary-Li-Resume.pdf" target="_blank" rel="noreferrer" aria-label="Open résumé" className="garage-resume">RÉSUMÉ <ArrowUpRight size={14}/></a><button onClick={onMute} className="icon-button" aria-label={muted?'Unmute sound':'Mute sound'}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button></div></header>
    <div className="garage-room-intro"><div><div className="eyebrow"><span className="status-dot"/> BAY 01 / THE GARAGE</div><h1>Good ideas start here.</h1></div><p>A few tools. A little curiosity.<br/>Pick an object to see what I’m building.</p></div>
    <div className={`garage-room-stage ${failed?'room-visual-failed':''}`}>
      <div className="garage-room-grid"/>
      {failed&&<RoomFallback/>}
      {!failed&&<RoomBoundary onError={()=>setFailed(true)}><Suspense fallback={null}><GarageRoom highlighted={highlighted} disabled={locked} onSelect={id=>choose(id,true)} onHover={setHighlighted} onLayout={setLayout} onReady={()=>setLoaded(true)} onError={()=>setFailed(true)}/></Suspense></RoomBoundary>}
      {!loaded&&!failed&&<div className="room-loading" role="status"><span className="loading-spinner"/> TURNING ON THE LIGHTS</div>}
      <div className="garage-object-hotspots" aria-label="Garage objects">
        {layout&&<svg className="garage-leaders" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">{labels.map(label=><g key={label.id} className={highlighted===label.id?'active':''}><path d={`M${label.anchorX} ${label.anchorY}L${label.x} ${label.y}`}/><circle cx={label.anchorX} cy={label.anchorY} r="3"/></g>)}</svg>}
        {GARAGE_OBJECTS.map(object=>{
          const position=labels.find(label=>label.id===object.id),Icon=icons[object.id];
          return <button key={object.id} className={`garage-hotspot ${highlighted===object.id?'is-highlighted':''}`} data-garage-object={object.id} style={{left:position?`${position.x/layout.width*100}%`:`${object.fallback[0]}%`,top:position?`${position.y/layout.height*100}%`:`${object.fallback[1]}%`}} onClick={()=>choose(object.id)} onPointerEnter={()=>setHighlighted(object.id)} onPointerLeave={()=>setHighlighted(null)} onFocus={()=>setHighlighted(object.id)} onBlur={()=>setHighlighted(null)} disabled={locked} aria-label={`${object.title} — ${object.object}`}><span className="garage-pin"><Icon size={15}/></span><span><small>{object.number} / {object.object}</small><strong>{object.title}</strong></span><ArrowUpRight size={13}/></button>;
        })}
      </div>
      <div className="garage-room-caption"><span>ONE CAR. A LOT OF POSSIBILITIES.</span><span>{failed?'USE THE LABELS OR DIRECTORY TO EXPLORE':'CLICK AN OBJECT TO EXPLORE'} <ArrowUpRight size={12}/></span></div>
    </div>
    <nav className="garage-object-directory" id="garage-directory" tabIndex="-1" aria-label="Garage directory">{GARAGE_OBJECTS.map(object=>{const Icon=icons[object.id];return <button key={object.id} data-garage-link={object.id} onClick={()=>choose(object.id)} onFocus={()=>setHighlighted(object.id)} onBlur={()=>setHighlighted(null)} onPointerEnter={()=>setHighlighted(object.id)} onPointerLeave={()=>setHighlighted(null)} disabled={locked}><Icon size={17}/><span><small>{object.object}</small><strong>{object.title}</strong></span><ArrowUpRight size={13}/></button>;})}</nav>
    <div className="garage-room-bottom"><div className="garage-r8-spec"><span className="r8-emblem"><i/>R8</span><span>AUDI R8 · 5.2L V10 · 602 HP · QUATTRO<small>NAVY BLUE / CAR-XY</small></span></div><div className="garage-room-controls"><button onClick={onRev}><Gauge size={16}/>{revving?'REVVING…':'REV ENGINE'}<kbd>R</kbd></button><button onClick={onHorn}><Megaphone size={16}/>{honking?'BEEP BEEP!':'HORN'}<kbd>H</kbd></button><button onClick={onReadAll}><BookOpen size={16}/>READ ALL <ArrowRight size={15}/></button></div></div>
  </main>;
}
