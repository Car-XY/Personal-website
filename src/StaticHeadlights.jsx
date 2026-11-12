const views={hero:[1200,720],garage:[1600,900],mobile:[750,1200]};

export default function StaticHeadlights({honking,view='hero'}) {
  if(!honking)return null;
  const [width,height]=views[view];
  return <svg className={`poster-headlights poster-headlights-${view}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={view==='hero'?'xMidYMid meet':'xMidYMid slice'} aria-hidden="true" data-effect="horn-headlights">
    <image href={`/images/headlights-${view}.svg`} width={width} height={height}/>
  </svg>;
}
