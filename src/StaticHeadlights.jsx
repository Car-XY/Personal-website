import {useId} from 'react';

const views={
  hero:{width:1200,height:720,points:[[.22654,.53642],[.32255,.57907]]},
  garage:{width:1600,height:900,points:[[.65354,.70298],[.75607,.66660]]},
  mobile:{width:750,height:1200,points:[[.68206,.61002],[.85311,.58520]]},
};

export default function StaticHeadlights({honking,view='hero'}) {
  const id=`headlight-${useId().replaceAll(':','')}`;
  if(!honking)return null;
  const {width,height,points}=views[view];
  return <svg className={`poster-headlights poster-headlights-${view}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={view==='hero'?'xMidYMid meet':'xMidYMid slice'} aria-hidden="true" data-effect="horn-headlights">
    <defs><radialGradient id={id}><stop stopColor="#edf8ff" stopOpacity=".9"/><stop offset=".25" stopColor="#d8ecff" stopOpacity=".55"/><stop offset="1" stopColor="#b4dcff" stopOpacity="0"/></radialGradient></defs>
    {points.map(([x,y],index)=><g key={index} transform={`translate(${x*width} ${y*height})`}><circle r="29" fill={`url(#${id})`}/><ellipse rx="12" ry="4" fill="#f4fbff"/></g>)}
  </svg>;
}
