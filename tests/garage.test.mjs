import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EXITS} from '../src/drive.js';
import {GARAGE_OBJECTS,garageDestination,canReturnToRoad,layoutGarageLabels,garagePosterLayout} from '../src/garage.js';

test('each portfolio section and the test drive has one physical garage destination',()=>{
  assert.deepEqual(new Set(GARAGE_OBJECTS.map(object=>object.id)),new Set([...EXITS.map(exit=>exit.id),'drive']));
  assert.equal(GARAGE_OBJECTS.length,6);assert.equal(garageDestination('missing'),null);
  for(const object of GARAGE_OBJECTS){assert.equal(garageDestination(object.id),object);assert.ok(object.object);assert.equal(object.point.length,3);assert.ok(object.point.every(Number.isFinite));}
});
test('only one accepted parked-road return can trigger the merge; garage panels cannot',()=>{
  const parked={mode:'drive',maneuver:'parked',transition:null};assert.ok(canReturnToRoad(parked,false));
  for(const state of [{...parked,mode:'garage'},{...parked,maneuver:'returning'},{...parked,maneuver:'cruising'},{...parked,transition:'garage'}])assert.equal(canReturnToRoad(state,false),false);
  assert.equal(canReturnToRoad(parked,true),false);
});
test('garage label positions stay inside the viewport and retain their object anchors',()=>{
  const points=[{id:'projects',x:350,y:190},{id:'journey',x:300,y:180},{id:'skills',x:320,y:310},{id:'teams',x:700,y:210},{id:'contact',x:800,y:350},{id:'drive',x:570,y:360}];
  const labels=layoutGarageLabels(points,1100,480);
  for(const label of labels){assert.ok(label.x>=80&&label.x<=1020);assert.ok(label.y>=32&&label.y<=448);assert.equal(label.anchorX,points.find(p=>p.id===label.id).x);}
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)assert.ok(Math.abs(labels[i].x-labels[j].x)>=154||Math.abs(labels[i].y-labels[j].y)>=60);
});

test('static garage labels track the artwork with one uniform scale at different aspect ratios',()=>{
  for(const [width,height] of [[1200,750],[1440,900],[1920,1080],[2560,1080]]){
    const layout=garagePosterLayout(width,height),scale=Math.max(width/1200,height/750);
    for(let i=0;i<GARAGE_OBJECTS.length;i++){
      const source=GARAGE_OBJECTS[i],point=layout.points[i];
      assert.equal(point.id,source.id);
      assert.ok(Math.abs((point.x-width/2)-(source.fallback[0]*12-600)*scale)<1e-8);
      assert.ok(Math.abs((point.y-height/2)-(source.fallback[1]*7.5-375)*scale)<1e-8);
    }
  }
});
