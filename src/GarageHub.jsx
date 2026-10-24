import { Component, Suspense, lazy, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, CarFront, Flag, Gauge, Laptop, Map, Megaphone, Radio, Volume2, VolumeX, Wrench } from 'lucide-react';
import { GARAGE_OBJECTS, garageDestination, layoutGarageLabels } from './garage.js';
import { useSceneEnhancement } from './visuals.js';

const GarageRoom = lazy(()=>import('./GarageRoom.jsx'));
const icons={projects:Laptop,teams:Flag,journey:Map,skills:Wrench,contact:Radio,drive:CarFront};
class RoomBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true};}
  componentDidCatch(){this.props.onError();}
  render(){return this.state.failed?null:this.props.children;}
}

function RoomFallback() {
  return <div className="garage-room-backup" aria-hidden="true"><img src="/images/garage-poster.svg" width="1200" height="750" alt="" fetchPriority="high"/></div>;
}

export default function GarageHub({brand,onStart,onSection,onReadAll,muted,onMute,onRev,onHorn,revving,honking,locked}) {
  const [highlighted,setHighlighted]=useState(null),[layout,setLayout]=useState(null);
  const visual=useSceneEnhancement();
  const choose=(id,fromCanvas=false)=>{
    if(locked||!garageDestination(id))return;
    if(fromCanvas){
      const selector=window.matchMedia('(max-width:700px)').matches?'data-garage-link':'data-garage-object';
      document.querySelector(`[${selector}="${id}"]`)?.focus({preventScroll:true});
    }
    if(id==='drive')onStart();else onSection(id);
  };
  const labels=visual.ready&&layout?layoutGarageLabels(layout.points,layout.width,layout.height):[];
  return <main className="garage-hub" id="garage-room" tabIndex="-1">
    <header className="site-header garage-hub-header">{brand}<div className="garage-open"><span className="status-dot"/> CARY’S WORKSHOP</div><div className="garage-header-actions"><button onClick={onReadAll} className="garage-read-button"><BookOpen size={15}/><span>READ PORTFOLIO</span></button><a href="/Cary-Li-Resume.pdf" target="_blank" rel="noreferrer" aria-label="Open résumé" className="garage-resume">RÉSUMÉ <ArrowUpRight size={14}/></a><button onClick={onMute} className="icon-button" aria-label={muted?'Unmute sound':'Mute sound'}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button></div></header>
    <div className="garage-room-intro"><div><div className="eyebrow"><span className="status-dot"/> BAY 01 / THE GARAGE</div><h1>The garage</h1></div><p>Projects, teams, background and skills.</p></div>
    <div className={`garage-room-stage ${visual.ready?'scene-ready':'scene-static'}`} data-render-mode={visual.ready?'interactive':'static'}>
      <div className="garage-room-grid"/>
      <RoomFallback/>
      {visual.mount&&<RoomBoundary onError={visual.onError}><Suspense fallback={null}><GarageRoom highlighted={highlighted} disabled={locked} onSelect={id=>choose(id,true)} onHover={setHighlighted} onLayout={setLayout} onReady={visual.onReady} onError={visual.onError}/></Suspense></RoomBoundary>}

      <div className="garage-object-hotspots" aria-label="Garage objects">
        {visual.ready&&layout&&<svg className="garage-leaders" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">{labels.map(label=><g key={label.id} className={highlighted===label.id?'active':''}><path d={`M${label.anchorX} ${label.anchorY}L${label.x} ${label.y}`}/><circle cx={label.anchorX} cy={label.anchorY} r="3"/></g>)}</svg>}
        {GARAGE_OBJECTS.map(object=>{
          const position=labels.find(label=>label.id===object.id),Icon=icons[object.id];
          return <button key={object.id} className={`garage-hotspot ${highlighted===object.id?'is-highlighted':''}`} data-garage-object={object.id} style={{left:position?`${position.x/layout.width*100}%`:`${object.fallback[0]}%`,top:position?`${position.y/layout.height*100}%`:`${object.fallback[1]}%`}} onClick={()=>choose(object.id)} onPointerEnter={()=>setHighlighted(object.id)} onPointerLeave={()=>setHighlighted(null)} onFocus={()=>setHighlighted(object.id)} onBlur={()=>setHighlighted(null)} disabled={locked} aria-label={`${object.title} — ${object.object}`}><span className="garage-pin"><Icon size={15}/></span><span><small>{object.number} / {object.object}</small><strong>{object.title}</strong></span><ArrowUpRight size={13}/></button>;
        })}
      </div>
      <div className="garage-room-caption"><span>SELECT A SECTION</span><button onClick={visual.toggle} aria-pressed={visual.staticOnly}>{visual.staticOnly||visual.failed?'LOAD 3D VIEW':'USE STATIC VIEW'}</button></div>
    </div>
    <nav className="garage-object-directory" id="garage-directory" tabIndex="-1" aria-label="Garage directory">{GARAGE_OBJECTS.map(object=>{const Icon=icons[object.id];return <button key={object.id} data-garage-link={object.id} onClick={()=>choose(object.id)} onFocus={()=>setHighlighted(object.id)} onBlur={()=>setHighlighted(null)} onPointerEnter={()=>setHighlighted(object.id)} onPointerLeave={()=>setHighlighted(null)} disabled={locked}><Icon size={17}/><span><small>{object.object}</small><strong>{object.title}</strong></span><ArrowUpRight size={13}/></button>;})}</nav>
    <div className="garage-room-bottom"><div className="garage-car-spec"><span>CAR-XY · 5.2L V10 · 602 HP<small>NAVY BLUE</small></span></div><div className="garage-room-controls"><button onClick={onRev}><Gauge size={16}/>{revving?'REVVING…':'REV ENGINE'}<kbd>R</kbd></button><button onClick={onHorn}><Megaphone size={16}/>{honking?'HONKING…':'HORN'}<kbd>H</kbd></button><button onClick={onReadAll}><BookOpen size={16}/>READ ALL <ArrowRight size={15}/></button></div></div>
  </main>;
}
