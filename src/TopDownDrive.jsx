import { useEffect, useRef } from 'react';
import { exitPose } from './drive.js';

export function CarSprite({ turning = false, honking = false }) {
  return <g className={honking ? 'map-car honking-car' : 'map-car'}>
    <defs><linearGradient id="map-r8-paint" x1="0" x2="1"><stop stopColor="#102a55"/><stop offset=".3" stopColor="#4271a5"/><stop offset=".52" stopColor="#1d4678"/><stop offset=".84" stopColor="#112e57"/><stop offset="1" stopColor="#08192e"/></linearGradient><linearGradient id="map-r8-glass" x2=".25" y2="1"><stop stopColor="#8ba7ba"/><stop offset=".4" stopColor="#203b51"/><stop offset="1" stopColor="#102332"/></linearGradient></defs>
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
    {turning && <g className="map-turn-signal" fill="#ffb34d"><rect x="25" y="-47" width="3" height="8" rx="1"/><rect x="24" y="46" width="3" height="7" rx="1"/></g>}
    {honking && <g fill="none" stroke="#dcecff" strokeWidth="2" className="horn-ripples"><path d="M-37-48Q-46-66-31-79M37-48Q46-66 31-79"/><path d="M-47-49Q-57-70-39-88M47-49Q57-70 39-88"/></g>}
  </g>;
}

const RAMP = 'M500 510 C500 325 770 405 770 180';

export default function TopDownDrive({ speed, branchVisible, maneuver, maneuverProgress, selectedExit, honking }) {
  const host = useRef(null);
  const svg = useRef(null);
  const roadMarks = useRef(null);
  const verge = useRef(null);
  const currentSpeed = useRef(speed);
  currentSpeed.current = speed;
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const {width,height} = entry.contentRect;
      svg.current?.setAttribute('viewBox', width / height < .8 ? '300 -160 560 1040' : '0 0 1000 760');
    });
    observer.observe(host.current); return () => observer.disconnect();
  },[]);
  useEffect(() => {
    let frame, previous = performance.now(), offset = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    function animate(now) {
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      if (!reduce.matches && !document.hidden) {
        offset = (offset + currentSpeed.current * dt * 1.45) % 3000;
        roadMarks.current?.setAttribute('stroke-dashoffset', String(offset % 84));
        verge.current?.setAttribute('patternTransform', `translate(0 ${offset % 250})`);
      }
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  const pose = exitPose(maneuverProgress);
  return <div className={`topdown-world ${branchVisible ? 'branch-visible' : ''}`} ref={host}>
    <svg ref={svg} className="highway-map" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Top-down 2D view of navy Car-XY ${maneuver === 'exiting' ? 'taking the shared right-hand off-ramp' : maneuver === 'returning' ? 'merging back onto Highway 401' : 'driving along Highway 401'}`}>
      <defs>
        <pattern id="land-grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#c4d8cd" strokeWidth=".6" opacity=".045"/></pattern>
        <g id="map-tree"><ellipse cy="5" rx="18" ry="15" fill="#0e211d" opacity=".3"/><circle r="17" fill="#3b564b"/><circle cx="-5" cy="-4" r="12" fill="#4d6b58"/><circle cx="7" cy="3" r="10" fill="#405e4d"/><circle cx="-4" cy="-6" r="5" fill="#6a8463" opacity=".5"/></g>
        <pattern id="map-verge" ref={verge} width="220" height="250" patternUnits="userSpaceOnUse"><use href="#map-tree" x="35" y="45"/><use href="#map-tree" x="155" y="112" transform="rotate(32 155 112)"/><use href="#map-tree" x="62" y="204" transform="scale(.8)"/><circle cx="192" cy="235" r="5" fill="#6a7e60" opacity=".4"/><circle cx="85" cy="93" r="4" fill="#9d9c75" opacity=".3"/></pattern>
        <pattern id="asphalt-grain" width="15" height="15" patternUnits="userSpaceOnUse"><rect width="15" height="15" fill="#48515b"/><circle cx="3" cy="4" r=".7" fill="#5d6873" opacity=".5"/><circle cx="11" cy="10" r=".6" fill="#26333c" opacity=".5"/></pattern>
      </defs>
      <rect x="-1000" y="-1000" width="3000" height="3000" fill="#283c37"/>
      <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#land-grid)"/>
      <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#map-verge)"/>
      <path d="M-50 650C80 570 90 530 180 570" fill="none" stroke="#57736c" strokeWidth="20" opacity=".4"/>
      <g className="map-branch">
        <path d={RAMP} stroke="#263a34" strokeWidth="135" fill="none"/>
        <path d={RAMP} stroke="#89958f" strokeWidth="92" fill="none"/>
        <path d={RAMP} stroke="#f0efdc" strokeWidth="83" fill="none"/>
        <path d={RAMP} stroke="#48515b" strokeWidth="79" fill="none"/>
        <path d={RAMP} stroke="#e7e8dd" strokeWidth="2" strokeDasharray="11 12" fill="none"/>
        <rect x="720" y="105" width="100" height="110" rx="10" fill="#374551" stroke="#788b99" strokeWidth="2"/>
        <path d="M728 125H812M728 191H812" stroke="#c0cbd1" strokeWidth="2"/>
        <text x="770" y="91" textAnchor="middle" fontFamily="monospace" fontSize="9" letterSpacing="1.5" fill="#d7e5dc">{selectedExit ? `EXIT ${selectedExit.number}` : 'YOUR NEXT STOP'}</text>
      </g>
      <rect x="185" y="-1000" width="152" height="3000" fill="#1a2929"/>
      <rect x="193" y="-1000" width="136" height="3000" fill="#424c56"/>
      <path d="M199-1000V2000M323-1000V2000" stroke="#dadbc9" strokeWidth="2"/>
      <path d="M261-1000V2000" stroke="#cbd0c7" strokeWidth="2" strokeDasharray="25 40" opacity=".6"/>
      <rect x="338" y="-1000" width="10" height="3000" fill="#738576"/>
      <rect x="347" y="-1000" width="310" height="3000" fill="#1a2929"/>
      <rect x="352" y="-1000" width="300" height="3000" fill="url(#asphalt-grain)"/>
      <path d="M361-1000V2000" stroke="#e1c680" strokeWidth="2.5"/>
      <path d="M642-1000V2000" stroke="#efedde" strokeWidth="2.5"/>
      <g ref={roadMarks} stroke="#f0eee2" strokeWidth="3" strokeDasharray="30 54"><path d="M450-1000V2000"/><path d="M550-1000V2000"/></g>
      <g className="map-branch"><path d="M628 392 643 386 650 372M610 412 623 405M590 432 601 424" fill="none" stroke="#f2eee0" strokeWidth="3"/><path d="M691 336 703 315 718 311" stroke="#ececde" strokeWidth="3" fill="none"/></g>
      <g opacity=".45" fill="#d0d8ce" fontFamily="monospace" letterSpacing="5" fontSize="11"><text transform="translate(391 315) rotate(-90)">401 · EAST</text><text transform="translate(289 404) rotate(90)">WESTBOUND</text></g>
      <g transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle})`}><CarSprite turning={maneuver !== 'cruising'} honking={honking}/></g>
      <g fill="#afbfae" opacity=".5"><circle cx="669" cy="623" r="3"/><circle cx="177" cy="135" r="3"/></g>
    </svg>
  </div>;
}
