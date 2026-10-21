import { useEffect, useRef } from 'react';
import { exitPose, entryPose, advanceWorld, OFF_RAMP, ON_RAMP, rampPath, highwayEdgePath } from './drive.js';

export function CarSprite({ turning = false, turnSide = 'right', honking = false, speed = 0 }) {
  return <g className={honking ? 'map-car honking-car' : 'map-car'}>
    <defs><linearGradient id="map-r8-paint" x1="0" x2="1"><stop stopColor="#102a55"/><stop offset=".3" stopColor="#4271a5"/><stop offset=".52" stopColor="#1d4678"/><stop offset=".84" stopColor="#112e57"/><stop offset="1" stopColor="#08192e"/></linearGradient><linearGradient id="map-r8-glass" x2=".25" y2="1"><stop stopColor="#8ba7ba"/><stop offset=".4" stopColor="#203b51"/><stop offset="1" stopColor="#102332"/></linearGradient><linearGradient id="r8-slipstream" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d9edff" stopOpacity=".85"/><stop offset="1" stopColor="#c6e3ff" stopOpacity="0"/></linearGradient></defs>
    {speed > 45 && <g className="r8-wake" opacity={Math.min(1,(speed-45)/135)} fill="none" stroke="url(#r8-slipstream)" strokeWidth="1.8" strokeLinecap="round">
      <path d={`M-22 64C-28 88-29 114-25 ${95+speed*.35}`}/><path d={`M22 64C28 88 29 114 25 ${95+speed*.35}`}/>
      <path d={`M-34 54C-41 77-44 98-41 ${83+speed*.24}`} strokeWidth="1"/><path d={`M34 54C41 77 44 98 41 ${83+speed*.24}`} strokeWidth="1"/>
      <path d={`M0 78V${104+speed*.22}`} strokeWidth="1" opacity=".4"/>
    </g>}
    <ellipse cx="4" cy="7" rx="35" ry="68" fill="#071018" opacity=".4"/>
    <g fill="#111820"><rect x="-31" y="-36" width="10" height="26" rx="3"/><rect x="21" y="-36" width="10" height="26" rx="3"/><rect x="-31" y="22" width="10" height="28" rx="3"/><rect x="21" y="22" width="10" height="28" rx="3"/></g>
    <path d="M-21-61Q-29-57-29-42L-27 47Q-26 61-19 63H19Q26 61 27 47L29-42Q29-57 21-61Q0-67-21-61Z" fill="url(#map-r8-paint)" stroke="#82a4c0" strokeWidth="1.3"/>
    <path d="M-19-53 19-53 21-30Q0-36-21-30Z" fill="#244c7c" stroke="#6d92b6" strokeWidth=".65"/>
    <path d="M-22-28Q0-36 22-28L17-5H-17Z" fill="url(#map-r8-glass)" stroke="#7893a7" strokeWidth=".9"/>
    <path d="M-16-3H16L18 28Q0 23-18 28Z" fill="#163962" stroke="#547da5" strokeWidth=".7"/>
    <path d="M-18 30Q0 24 18 30L22 45H-22Z" fill="#172c3e" stroke="#637d90" strokeWidth=".8"/>
    {[0,1,2,3].map(n=><path key={n} d={`M-14 ${33+n*2.8}H14`} stroke="#637b90" strokeWidth="1"/>)}
    <path d="M-24-14-19-9-20 25-25 34ZM24-14 19-9 20 25 25 34Z" fill="#b5c4cf" opacity=".8"/>
    <path d="M-25-12-33-9-33-4-26-5ZM25-12 33-9 33-4 26-5Z" fill="#b7c6cf" stroke="#304c68" strokeWidth="1"/>
    <path d="M-23-52-12-49-13-46-23-48ZM23-52 12-49 13-46 23-48Z" fill="#eaf5ff"/>
    <path d="M-23 53H-10M10 53H23" stroke="#ec5a59" strokeWidth="3"/>
    <path d="M-24 59H24" stroke="#0b1826" strokeWidth="4"/>
    <rect x="-10" y="54" width="20" height="6" rx="1" fill="#f3f5e9"/><text x="0" y="58.4" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="4.3" fill="#143969">Car-XY</text>
    <path d="M-18-60Q0-63 18-60" stroke="#c5dcf0" opacity=".7" fill="none"/>
    {turning && <g className="map-turn-signal" transform={turnSide === 'left' ? 'scale(-1 1)' : undefined} fill="#ffb34d"><rect x="25" y="-47" width="3" height="8" rx="1"/><rect x="24" y="46" width="3" height="7" rx="1"/></g>}
    {honking && <g fill="none" stroke="#dcecff" strokeWidth="2" className="horn-ripples"><path d="M-37-48Q-46-66-31-79M37-48Q46-66 31-79"/><path d="M-47-49Q-57-70-39-88M47-49Q57-70 39-88"/></g>}
  </g>;
}

function Ramp({ ramp, name }) {
  const path=rampPath(ramp);
  return <g className="map-ramp" data-ramp={name}>
    <path d={path} stroke="#718174" strokeWidth="96" fill="none"/>
    <path d={path} stroke="#eff0df" strokeWidth="84" fill="none"/>
    <path d={path} stroke="url(#asphalt-grain)" strokeWidth="80" fill="none"/>
  </g>;
}

export default function TopDownDrive({ speed, branchVisible, maneuver, maneuverProgress, honking }) {
  const host=useRef(null),svg=useRef(null);
  const lanes=useRef(null),trees=useRef(null),grid=useRef(null),asphalt=useRef(null);
  const currentSpeed=useRef(speed); currentSpeed.current=speed;
  useEffect(()=>{
    const observer=new ResizeObserver(([entry])=>{
      const {width,height}=entry.contentRect;
      const worldWidth=760*width/height;
      // Keep the entire ramp junction in view on wide screens instead of cropping it.
      svg.current?.setAttribute('viewBox',width/height < .8 ? '300 -160 560 1040' : `${500-worldWidth/2} 0 ${worldWidth} 760`);
    });
    observer.observe(host.current); return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    let frame,previous=performance.now(),offset=0;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    function animate(now) {
      const dt=Math.min((now-previous)/1000,.05); previous=now;
      if(!reduce.matches && !document.hidden) {
        offset=advanceWorld(offset,currentSpeed.current,dt);
        const transform=`translate(0 ${offset})`;
        // Every world texture uses the exact same phase and direction.
        [lanes,trees,grid,asphalt].forEach(ref=>ref.current?.setAttribute('patternTransform',transform));
        svg.current?.setAttribute('data-world-offset',String(offset));
      }
      frame=requestAnimationFrame(animate);
    }
    frame=requestAnimationFrame(animate); return ()=>cancelAnimationFrame(frame);
  },[]);
  const entering=maneuver==='returning';
  const exitVisible=branchVisible && !entering;
  const activeRamp=entering ? ON_RAMP : exitVisible ? OFF_RAMP : null;
  const pose=entering ? entryPose(maneuverProgress) : exitPose(maneuverProgress);
  return <div className="topdown-world" ref={host}>
    <svg ref={svg} className="highway-map" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Top-down 2D view of navy Car-XY ${maneuver==='exiting' ? 'taking the straight off-ramp' : entering ? 'entering Highway 401 via a separate on-ramp' : 'driving along Highway 401'}`}>
      <defs>
        <pattern id="land-grid" ref={grid} width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#c4d8cd" strokeWidth=".6" opacity=".04"/></pattern>
        <g id="map-tree"><path d="M5-23 23-1H16L30 22H8V36H1V22H-23L-9-1H-16Z" fill="#122b24" opacity=".3" transform="translate(5 6)"/><rect x="-3" y="15" width="6" height="20" rx="1" fill="#73634b"/><path d="M0-31 17-8H9L24 12H13L29 29H-29L-13 12H-24L-9-8H-17Z" fill="#264b3e"/><path d="M0-31V29H-29L-13 12H-24L-9-8H-17Z" fill="#42634c"/><path d="M0-27 12-10H2M0-7 17 10H3M0 13 21 26H4" fill="none" stroke="#72906a" strokeWidth="1.5" opacity=".45"/></g>
        <pattern id="map-verge" ref={trees} width="220" height="250" patternUnits="userSpaceOnUse"><use href="#map-tree" transform="translate(39 44) scale(.95)"/><use href="#map-tree" transform="translate(156 127) scale(1.12)"/><use href="#map-tree" transform="translate(66 213) scale(.78)"/></pattern>
        <pattern id="asphalt-grain" ref={asphalt} width="15" height="15" patternUnits="userSpaceOnUse"><rect width="15" height="15" fill="#48515b"/><circle cx="3" cy="4" r=".7" fill="#5d6873" opacity=".5"/><circle cx="11" cy="10" r=".6" fill="#26333c" opacity=".5"/></pattern>
        <pattern id="map-lane-lines" ref={lanes} width="100" height="84" patternUnits="userSpaceOnUse"><rect x="48.5" width="3" height="30" fill="#f0eee2"/></pattern>
      </defs>
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="#283c37"/>
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#land-grid)"/>
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#map-verge)"/>
      {exitVisible && <Ramp ramp={OFF_RAMP} name="off-ramp"/>}
      {entering && <Ramp ramp={ON_RAMP} name="on-ramp"/>}
      <rect x="342" y="-2000" width="8" height="4400" fill="#718174"/>
      <rect x="350" y="-2000" width="300" height="4400" fill="url(#asphalt-grain)"/>
      <path d={highwayEdgePath(activeRamp,654,96)} stroke="#718174" strokeWidth="8" fill="none"/>
      <path d="M358-2000V2400" stroke="#e1c680" strokeWidth="2.5"/>
      <path className="highway-edge" data-junction={activeRamp ? entering ? 'on-ramp' : 'off-ramp' : 'closed'} d={highwayEdgePath(activeRamp)} stroke="#efedde" strokeWidth="2.5" fill="none"/>
      <rect className="highway-lane-markings" x="400" y="-2000" width="200" height="4400" fill="url(#map-lane-lines)"/>
      <g transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle})`} data-car-pose="true"><CarSprite speed={speed} turning={maneuver==='exiting' || entering} turnSide={entering ? 'left' : 'right'} honking={honking}/></g>
    </svg>
  </div>;
}
