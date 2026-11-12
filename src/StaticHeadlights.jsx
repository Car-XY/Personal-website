import {useId} from 'react';

const views={
  // Projected from the headlamp mesh using each poster's camera. The far lamp is hidden by the body.
  hero:{width:1200,height:720,origin:[.33911,.57011],end:[.01450,.63985],points:[[.33586,.56874],[-.00506,.61957],[.03666,.66282],[.34240,.57149]]},
  garage:{width:1600,height:900,origin:[.64808,.69031],end:[.83308,.85158],points:[[.64486,.69141],[.79292,.87571],[.86983,.82951],[.65129,.68922]]},
  mobile:{width:750,height:1200,origin:[.67447,.60320],end:[.90688,.67198],points:[[.66920,.60395],[.84837,.68297],[.96245,.66154],[.67972,.60246]]},
};

export default function StaticHeadlights({honking,view='hero'}) {
  const id=`headlight-${useId().replaceAll(':','')}`;
  if(!honking)return null;
  const {width,height,origin,end,points}=views[view];
  return <svg className={`poster-headlights poster-headlights-${view}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={view==='hero'?'xMidYMid meet':'xMidYMid slice'} aria-hidden="true" data-effect="horn-headlights">
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={origin[0]*width} y1={origin[1]*height} x2={end[0]*width} y2={end[1]*height}><stop stopColor="#ffe2a4" stopOpacity=".5"/><stop offset=".35" stopColor="#ffd36b" stopOpacity=".25"/><stop offset="1" stopColor="#ffcc62" stopOpacity="0"/></linearGradient>
      <filter id={`${id}-soft`} x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>
    <path data-light-cone={view} d={`${points.map(([x,y],index)=>`${index?'L':'M'}${x*width} ${y*height}`).join('')}Z`} fill={`url(#${id})`} filter={`url(#${id}-soft)`}/>
  </svg>;
}
