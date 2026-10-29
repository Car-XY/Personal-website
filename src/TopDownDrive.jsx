import { useEffect, useId, useRef } from 'react';
import { exitPose, entryPose, advanceWorld, OFF_RAMP, ON_RAMP, rampPath, highwayEdgePath } from './drive.js';
import { exhaustIntensityAt } from './exhaust.js';

const EXHAUST_X=[-18.7,18.7],EXHAUST_Y=61.5;

export function ExhaustJet2D({intensity,progress,prefix,seed=0}) {
  const generated=useId().replaceAll(':',''),id=prefix||`exhaust-${generated}`;
  if(intensity<.005)return null;
  const flutter=.88+.12*Math.sin(progress*230+seed*2.3);
  const length=(12+intensity*43)*flutter,width=3.8+intensity*3;
  return <g className="map-exhaust" data-effect="exhaust-jet" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#bce9ff"/><stop offset=".15" stopColor="#6ac5ff"/><stop offset=".48" stopColor="#5c9bfa"/><stop offset=".72" stopColor="#ffbd6a"/><stop offset="1" stopColor="#f57c45" stopOpacity="0"/></linearGradient>
      <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff"/><stop offset=".3" stopColor="#e5f8ff"/><stop offset="1" stopColor="#9ad7ff" stopOpacity="0"/></linearGradient>
    </defs>
    <g className="map-exhaust-motion" opacity={Math.sqrt(intensity)}>
      <path d={`M-4 0Q${-width*1.5} ${length*.42} 0 ${length*1.15}Q${width*1.5} ${length*.42} 4 0Z`} fill="#58a9ff" opacity=".13"/>
      <path d={`M-2.5 0C${-width} ${length*.16} ${-width*.5} ${length*.32} ${-width*.8} ${length*.47}L${-width*.3} ${length*.44} 0 ${length} ${width*.4} ${length*.59} ${width*.65} ${length*.69}Q${width*1.1} ${length*.21} 2.5 0Z`} fill={`url(#${id}-flame)`}/>
      <path d={`M-1.5 0Q-3.4 ${length*.27} 0 ${length*.66}Q3.8 ${length*.25} 1.5 0Z`} fill={`url(#${id}-core)`}/>
      {[0,1,2,3,4].map(n=>{
        const travel=(progress*10+n*.197+seed*.11)%1;
        return <circle key={n} className="jet-spark" cx={Math.sin(n*4.7+seed)*travel*5} cy={5+travel*(length+18)} r={.35+.65*(1-travel)} fill={n%2?'#ffd191':'#a8dbff'} opacity={(1-travel)*.8}/>;
      })}
    </g>
    <circle className="map-exhaust-steady" cy="2" r="3.4" fill="#8acbff" opacity=".35"/>
  </g>;
}

function ExhaustJets({intensity,progress}) {
  if(intensity<.005)return null;
  return <g data-effect="rev-exhaust">{EXHAUST_X.map((x,side)=><g key={x} transform={`translate(${x} ${EXHAUST_Y})`} data-exhaust-origin={`${x},${EXHAUST_Y}`}><ExhaustJet2D intensity={intensity} progress={progress} seed={side}/></g>)}</g>;
}

export function CarSprite({ turning = false, turnSide = 'right', speed = 0, revving = false, revProgress = 0 }) {
  const intensity=revving?exhaustIntensityAt(revProgress):0;
  return <g className="map-car">
    <defs>
      <linearGradient id="map-car-paint" x1="0" x2="1"><stop stopColor="#091c37"/><stop offset=".16" stopColor="#38618d"/><stop offset=".31" stopColor="#12355e"/><stop offset=".68" stopColor="#173c69"/><stop offset=".86" stopColor="#3d648d"/><stop offset="1" stopColor="#08192e"/></linearGradient>
      <linearGradient id="map-car-glass" x2=".25" y2="1"><stop stopColor="#9aafbd"/><stop offset=".27" stopColor="#354d60"/><stop offset="1" stopColor="#091521"/></linearGradient>
      <linearGradient id="map-car-blade" x2="1" y2=".2"><stop stopColor="#658097"/><stop offset=".45" stopColor="#c9d6df"/><stop offset="1" stopColor="#758ca0"/></linearGradient>
      <linearGradient id="car-slipstream" gradientUnits="userSpaceOnUse" x1="0" y1="64" x2="0" y2={100+speed*.35}><stop stopColor="#d9edff" stopOpacity=".75"/><stop offset="1" stopColor="#c6e3ff" stopOpacity="0"/></linearGradient>
    </defs>
    {speed > 45 && <g className="car-wake" data-effect="slipstream" opacity={Math.min(1,(speed-45)/135)} fill="none" stroke="url(#car-slipstream)" strokeWidth="1.5" strokeLinecap="round">
      <line x1="-27" y1="66" x2="-27" y2={100+speed*.35}/><line x1="27" y1="66" x2="27" y2={100+speed*.35}/>
      <line x1="-35" y1="77" x2="-35" y2={94+speed*.25} strokeWidth=".8"/><line x1="35" y1="77" x2="35" y2={94+speed*.25} strokeWidth=".8"/>
    </g>}
    <ellipse className="map-car-shadow" cx="3" cy="5" rx="34" ry="66" fill="#071018" opacity=".4"/>
    <ExhaustJets intensity={intensity} progress={revProgress}/>
    <g fill="#080e17" stroke="#243344" strokeWidth=".7"><rect x="-31.5" y="-37" width="9" height="26" rx="2.5"/><rect x="22.5" y="-37" width="9" height="26" rx="2.5"/><rect x="-32" y="23" width="10" height="27" rx="2.5"/><rect x="22" y="23" width="10" height="27" rx="2.5"/></g>
    <path data-feature="body" d="M-18-61Q-25-61-27-54L-29-37-28-14-26 4-29 20-30 40-27 55Q-25 62-18 63H18Q25 62 27 55L30 40 29 20 26 4 28-14 29-37 27-54Q25-61 18-61Q0-65-18-61Z" fill="url(#map-car-paint)" stroke="#829cb5" strokeWidth="1.1"/>
    <path d="M-24-55Q0-60 24-55M-25 58Q0 62 25 58" fill="none" stroke="#061423" strokeWidth="3.6"/>
    <path d="M-16-51H16L21-28Q0-33-21-28Z" fill="#193b65" stroke="#7290ae" strokeWidth=".6"/>
    <path d="M-15-48-18-31M15-48 18-31" stroke="#8ba6bf" strokeWidth=".65" opacity=".6"/>
    <g data-feature="headlights" fill="#e4f2ff"><path d="M-25-53-13-49-14-45-24-47-26-50ZM25-53 13-49 14-45 24-47 26-50Z"/><path d="M-24-44-15-43M24-44 15-43" stroke="#2c3f57" strokeWidth="1.4"/></g>
    <path d="M-27-29-24-32-20-8-19 13-23 15-26-4ZM27-29 24-32 20-8 19 13 23 15 26-4Z" fill="#0a1827" stroke="#507391" strokeWidth=".6"/>
    <g data-feature="cockpit">
      <path d="M-23-25Q0-34 23-25L17-7H-17Z" fill="url(#map-car-glass)" stroke="#849eaf" strokeWidth=".8"/>
      <path d="M-17-5H17L18 17Q0 21-18 17Z" fill="#13365d" stroke="#6687a9" strokeWidth=".75"/>
      <path d="M-14-2V14M14-2V14" stroke="#4e7195" strokeWidth=".5" opacity=".65"/>
      <path d="M-22-21-19-9-20 10-23 11ZM22-21 19-9 20 10 23 11Z" fill="url(#map-car-glass)" opacity=".8"/>
    </g>
    <g data-feature="side-blades">
      <path d="M-27 12-19 18-20 34-28 41-29 25ZM27 12 19 18 20 34 28 41 29 25Z" fill="url(#map-car-blade)" stroke="#a0b4c6" strokeWidth=".45"/>
      <path d="M-26 19-22 22-23 32-27 37ZM26 19 22 22 23 32 27 37Z" fill="#071725"/>
      <path d="M-27 22-23 24M-27 26-23 27M-27 30-24 31M27 22 23 24M27 26 23 27M27 30 24 31" stroke="#536d81" strokeWidth=".5"/>
    </g>
    <path d="M-25-12-33-9-33-5-26-6ZM25-12 33-9 33-5 26-6Z" fill="#58748e" stroke="#b1c3d1" strokeWidth=".65"/>
    <g data-feature="engine-bay">
      <path d="M-18 22Q0 26 18 22L21 44H-21Z" fill="#0a1723" stroke="#6e8799" strokeWidth=".85"/>
      <path d="M-11 29-3 27V39H-13ZM11 29 3 27V39H13Z" fill="#587087" opacity=".55"/>
      <path d="M0 26V41" stroke="#1c3c59" strokeWidth="2"/>
      {[0,1,2,3,4].map(n=><path key={n} d={`M-14 ${29+n*2.4}H-4M4 ${29+n*2.4}H14`} stroke="#a1afba" strokeWidth=".65" opacity=".8"/>)}
    </g>
    <path d="M-25 48H25L24 52H-24Z" fill="#07121e"/>
    <path d="M-25 52H-11M11 52H25" stroke="#f35d63" strokeWidth="2.4"/>
    <path d="M-26 58-21 63H21L26 58" stroke="#07111b" strokeWidth="3"/>
    {[-10,-5,0,5,10].map(x=><path key={x} d={`M${x} 59V63`} stroke="#405368" strokeWidth=".9"/>)}
    <g data-feature="exhaust-outlets" fill="#040a11" stroke="#91a4b6" strokeWidth="1">{EXHAUST_X.map(x=><ellipse key={x} cx={x} cy={EXHAUST_Y} rx="3.1" ry="2.1" data-exhaust-nozzle={`${x},${EXHAUST_Y}`}/>)}</g>
    <rect x="-9.5" y="54" width="19" height="5.8" rx=".7" fill="#e8eee9"/><text x="0" y="58.25" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="4" fill="#173c67">Car-XY</text>
    {turning && <g className="map-turn-signal" transform={turnSide === 'left' ? 'scale(-1 1)' : undefined} fill="#ffb34d"><rect x="26" y="-47" width="2.5" height="7" rx="1"/><rect x="26" y="46" width="2.5" height="6" rx="1"/></g>}
  </g>;
}

function Ramp({ ramp, name }) {
  const path=rampPath(ramp);
  return <g className="map-ramp" data-ramp={name}>
    <path d={path} stroke="#718174" strokeWidth="96" fill="none"/>
    <path d={path} stroke="#eff0df" strokeWidth="84" fill="none"/>
    {/* Pattern-painted strokes can disappear on mobile SVG renderers. The road surface must be solid. */}
    <path d={path} stroke="#48515b" strokeWidth="80" fill="none"/>
  </g>;
}

export default function TopDownDrive({ speed, branchVisible, maneuver, maneuverProgress, revving = false, revProgress = 0 }) {
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
        <pattern id="asphalt-grain" ref={asphalt} width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".7" fill="#5d6873" opacity=".5"/><circle cx="11" cy="10" r=".6" fill="#26333c" opacity=".5"/></pattern>
        <pattern id="map-lane-lines" ref={lanes} width="100" height="84" patternUnits="userSpaceOnUse"><rect x="48.5" width="3" height="30" fill="#f0eee2"/></pattern>
      </defs>
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="#283c37"/>
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#land-grid)"/>
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#map-verge)"/>
      {exitVisible && <Ramp ramp={OFF_RAMP} name="off-ramp"/>}
      {entering && <Ramp ramp={ON_RAMP} name="on-ramp"/>}
      <rect x="342" y="-2000" width="8" height="4400" fill="#718174"/>
      <rect x="350" y="-2000" width="300" height="4400" fill="#48515b"/>
      <rect x="350" y="-2000" width="300" height="4400" fill="url(#asphalt-grain)"/>
      <path d={highwayEdgePath(activeRamp,654,96)} stroke="#718174" strokeWidth="8" fill="none"/>
      <path d="M358-2000V2400" stroke="#e1c680" strokeWidth="2.5"/>
      <path className="highway-edge" data-junction={activeRamp ? entering ? 'on-ramp' : 'off-ramp' : 'closed'} d={highwayEdgePath(activeRamp)} stroke="#efedde" strokeWidth="2.5" fill="none"/>
      <rect className="highway-lane-markings" x="400" y="-2000" width="200" height="4400" fill="url(#map-lane-lines)"/>
      <g transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle})`} data-car-pose="true"><CarSprite speed={speed} turning={maneuver==='exiting' || entering} turnSide={entering ? 'left' : 'right'} revving={revving} revProgress={revProgress}/></g>
    </svg>
  </div>;
}
