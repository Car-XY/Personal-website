export const GARAGE_OBJECTS = [
  { id:'projects', number:'01', title:'Projects', object:'The workbench', point:[-3.75,1.52,.15], fallback:[23,71] },
  { id:'teams', number:'02', title:'Design Teams', object:'The racing rack', point:[8.8,3.6,-9.5], fallback:[86,43] },
  { id:'journey', number:'03', title:'About', object:'The story wall', point:[-3.8,2.25,-13.9], fallback:[37,40] },
  { id:'skills', number:'04', title:'Skills', object:'The tool chest', point:[-6.5,1.45,-4.4], fallback:[13,57] },
  { id:'contact', number:'05', title:'Contact', object:'The contact station', point:[6,2,-3.7], fallback:[88,66] },
  { id:'drive', number:'06', title:'Test Drive', object:'Car-XY', point:[.7,.8,2.1], fallback:[65,75] },
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
