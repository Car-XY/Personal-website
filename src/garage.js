import { GARAGE_POSTER } from './posters.js';

export const GARAGE_OBJECTS = [
  { id:'projects', number:'01', title:'Projects', object:'The workbench', point:[-3.75,1.52,.15], fallback:[34.30125,55.22577] },
  { id:'teams', number:'02', title:'Design Teams', object:'The racing rack', point:[8.8,3.6,-9.5], fallback:[64.651,30.33039] },
  { id:'journey', number:'03', title:'About', object:'The story wall', point:[-3.8,2.25,-13.9], fallback:[27.16178,37.1891] },
  { id:'skills', number:'04', title:'Skills', object:'The tool chest', point:[-6.5,1.45,-4.4], fallback:[13.76137,49.28946] },
  { id:'contact', number:'05', title:'Contact', object:'The contact station', point:[6,2,-3.7], fallback:[70.64372,40.32117] },
  { id:'drive', number:'06', title:'Test Drive', object:'Car-XY', point:[.7,.8,2.1], fallback:[73.39883,64.77982] },
];

export function garageDestination(id) { return GARAGE_OBJECTS.find(object => object.id === id) || null; }
export function garagePosterLayout(width,height) {
  const {width:posterWidth,height:posterHeight}=GARAGE_POSTER;
  const scale=Math.max(width/posterWidth,height/posterHeight);
  const left=(width-posterWidth*scale)/2,top=(height-posterHeight*scale)/2;
  return {width,height,points:GARAGE_OBJECTS.map(object=>({
    id:object.id,x:left+object.fallback[0]/100*posterWidth*scale,y:top+object.fallback[1]/100*posterHeight*scale,
  }))};
}
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
