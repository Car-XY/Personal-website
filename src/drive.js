export const EXITS = [
  { id: 'projects', number: '01', title: 'Projects', subtitle: 'Ideas, built into reality', km: '1.2' },
  { id: 'teams', number: '02', title: 'Design Teams', subtitle: 'Code that moves cars', km: '2.4' },
  { id: 'journey', number: '03', title: 'The Journey', subtitle: 'The road so far', km: '3.6' },
  { id: 'skills', number: '04', title: 'Under the Hood', subtitle: 'My technical toolkit', km: '4.8' },
  { id: 'contact', number: '05', title: 'Let’s Connect', subtitle: 'The next adventure', km: '6.0' },
];

export function speedAt(elapsed, duration = 5800) {
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  return Math.round(180 * (1 - (1 - progress) ** 2));
}

export function gearAt(speed) {
  if (speed === 0) return 'P';
  return Math.min(6, Math.floor(speed / 34) + 1);
}

export function rpmAt(speed, rev = 0) {
  return Math.min(8500, 1100 + (speed % 34) * 125 + Math.min(speed, 160) * 11 + rev * 4200);
}

export const EXIT_DURATION = 2100;
export const HIGHWAY = { left:350, right:650 };
export const OFF_RAMP = { start:{x:600,y:330}, end:{x:1020,y:-238.2352941176} };
export const ON_RAMP = { start:{x:600,y:600}, end:{x:1000,y:1174.1176470588} };
export const WORLD_PERIOD = 10500; // A whole number of every repeating pattern.
// A 126-unit sprite represents roughly 4.5 m; 80% scale keeps the map readable.
export const WORLD_UNITS_PER_METRE = 126 / 4.5;
export const MOTION_SCALE = .8;

export function advanceWorld(offset,speed,seconds) {
  return (offset + Math.max(0,speed) / 3.6 * WORLD_UNITS_PER_METRE * MOTION_SCALE * Math.max(0,seconds)) % WORLD_PERIOD;
}

function cubicPose(points,t) {
  const s = 1 - t;
  const [a,b,c,d] = points;
  const x = s**3*a.x + 3*s*s*t*b.x + 3*s*t*t*c.x + t**3*d.x;
  const y = s**3*a.y + 3*s*s*t*b.y + 3*s*t*t*c.y + t**3*d.y;
  const dx = 3*s*s*(b.x-a.x) + 6*s*t*(c.x-b.x) + 3*t*t*(d.x-c.x);
  const dy = 3*s*s*(b.y-a.y) + 6*s*t*(c.y-b.y) + 3*t*t*(d.y-c.y);
  return { x, y, angle: Math.atan2(dy, dx) * 180 / Math.PI + 90 };
}

function linePose(a,b,t) {
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+90};
}

// The road itself is straight. A short lane change joins its centre line.
export function exitPose(progress) {
  const t=Math.max(0,Math.min(1,progress));
  if (t<.55) return cubicPose([{x:500,y:510},{x:500,y:440},{x:565,y:377.3529411765},OFF_RAMP.start],t/.55);
  return linePose(OFF_RAMP.start,{x:770,y:100},(t-.55)/.45);
}

// Enter from the lower right, travel forward, then straighten into the highway.
export function entryPose(progress) {
  const t=Math.max(0,Math.min(1,progress));
  if(t<.55) return linePose({x:770,y:844},ON_RAMP.start,t/.55);
  return cubicPose([ON_RAMP.start,{x:565,y:549.7647058824},{x:500,y:570},{x:500,y:510}],(t-.55)/.45);
}

export function rampPath(ramp) {
  return `M${ramp.start.x} ${ramp.start.y}L${ramp.end.x} ${ramp.end.y}`;
}

// Intersect each ramp edge with the highway edge, leaving a real open junction.
export function rampGap(ramp,x=HIGHWAY.right,width=84) {
  const dx=ramp.end.x-ramp.start.x,dy=ramp.end.y-ramp.start.y,length=Math.hypot(dx,dy);
  const nx=-dy/length,ny=dx/length;
  const crossings=[-1,1].map(side=>{
    const px=ramp.start.x+nx*width/2*side,py=ramp.start.y+ny*width/2*side;
    return py+(x-px)*dy/dx;
  }).sort((a,b)=>a-b);
  return {top:crossings[0],bottom:crossings[1]};
}

export function highwayEdgePath(ramp,x=HIGHWAY.right,width=84) {
  if(!ramp) return `M${x} -2000V2400`;
  const gap=rampGap(ramp,x,width);
  return `M${x} -2000V${gap.top}M${x} ${gap.bottom}V2400`;
}
