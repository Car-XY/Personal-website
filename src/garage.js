export const GARAGE_OBJECTS = [
  { id:'projects', number:'01', title:'Projects', object:'The workbench', point:[-5.4,1.65,-2.6], fallback:[32,45] },
  { id:'teams', number:'02', title:'Design Teams', object:'The racing rack', point:[5.1,2.5,-3.5], fallback:[73,41] },
  { id:'journey', number:'03', title:'The Journey', object:'The story wall', point:[-7.2,3.4,.6], fallback:[20,42] },
  { id:'skills', number:'04', title:'Under the Hood', object:'The tool chest', point:[-5.5,1.35,3.3], fallback:[30,68] },
  { id:'contact', number:'05', title:'Let’s Connect', object:'The contact station', point:[5.9,2.4,2.5], fallback:[78,67] },
  { id:'drive', number:'06', title:'Test Drive', object:'Car-XY · the R8', point:[.5,.65,2.4], fallback:[53,72] },
];

export function garageDestination(id) { return GARAGE_OBJECTS.find(object => object.id === id) || null; }
export function canReturnToRoad({ mode, maneuver, transition }, consumed) {
  return mode === 'drive' && maneuver === 'parked' && !transition && !consumed;
}

export function layoutGarageLabels(points,width,height) {
  const placed=[];
  const offsets=[[0,-35],[0,40],[-100,-25],[100,-25],[-150,25],[150,25],[0,-100],[0,100],[-210,-45],[210,-45]];
  for(const point of points) {
    const candidates=offsets.map(([dx,dy])=>({ ...point, anchorX:point.x, anchorY:point.y,
      x:Math.max(80,Math.min(width-80,point.x+dx)), y:Math.max(32,Math.min(height-32,point.y+dy)) }));
    const position=candidates.find(candidate=>placed.every(other=>Math.abs(candidate.x-other.x)>=154||Math.abs(candidate.y-other.y)>=60))||candidates[0];
    placed.push(position);
  }
  return placed;
}
