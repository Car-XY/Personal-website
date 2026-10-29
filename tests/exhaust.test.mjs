import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {NodeIO} from '@gltf-transform/core';
import {KHRDracoMeshCompression} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
import {exhaustIntensityAt,exhaustParticleAt} from '../src/exhaust.js';
import {findExhaustAnchors,createExhaustFlames} from '../src/exhaust-3d.js';

test('exhaust bursts follow recording progress and fade completely at both ends',()=>{
  for(const progress of [-1,0,1,2,NaN,Infinity])assert.equal(exhaustIntensityAt(progress),0);
  assert.ok(exhaustIntensityAt(.001)<.003);
  assert.ok(exhaustIntensityAt(.999)<.003);
  const levels=Array.from({length:120},(_,index)=>exhaustIntensityAt(.1+index/150));
  assert.ok(levels.every(level=>level>0&&level<=1));
  assert.ok(Math.max(...levels)-Math.min(...levels)>.5,'individual bursts must vary, not form one constant cone');
  assert.deepEqual(levels,Array.from({length:120},(_,index)=>exhaustIntensityAt(.1+index/150)));
});

test('sparks always travel rearwards and disappear when rev intensity is zero',()=>{
  for(const time of [0,.05,.5,6,30])for(let i=0;i<56;i++){
    const spark=exhaustParticleAt(i,time,1);
    assert.ok(Object.values(spark).every(Number.isFinite));
    assert.ok(spark.z<0&&spark.z>=-1.9);
    assert.ok(Math.abs(spark.x)<.15&&spark.y>-.05&&spark.y<.15);
    assert.ok(spark.opacity>=0&&spark.opacity<=1);
    assert.equal(exhaustParticleAt(i,time,0).opacity,0);
  }
});

test('nozzle anchors come from the actual rear exhaust mesh in local model coordinates',async()=>{
  const io=new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
  const document=await io.read('public/models/car-xy.glb');
  const exhaust=document.getRoot().listNodes().find(node=>/ExhaustSystem/.test(node.getName()));
  assert.ok(exhaust,'the shipped model must retain its physical exhaust system');
  const lamps=kind=>document.getRoot().listNodes().find(node=>new RegExp(`Light${kind}Highlight`).test(node.getName())).getMesh().listPrimitives()[0].getAttribute('POSITION');
  assert.ok(lamps('Front').getMin([])[2]>1.6,'headlamps establish that positive Z is the nose');
  assert.ok(lamps('Back').getMax([])[2]<-1.7,'rear lamps establish that negative Z is the tail');
  const positions=exhaust.getMesh().listPrimitives()[0].getAttribute('POSITION').getArray();
  const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(positions,3));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());mesh.name=exhaust.getName();
  const car=new THREE.Group();car.position.set(2,.2,-1);car.scale.setScalar(1.4);car.add(mesh);
  const anchors=findExhaustAnchors(car);
  assert.equal(anchors.length,2);
  assert.ok(anchors[0].x<-.6&&anchors[1].x>.6);
  assert.ok(Math.abs(anchors[0].x+anchors[1].x)<.01);
  for(const anchor of anchors){assert.ok(anchor.y>.25&&anchor.y<.36);assert.ok(anchor.z< -2.13&&anchor.z> -2.18);}
  geometry.dispose();mesh.material.dispose();
});

test('the particle pool survives repeated revs, respects static motion preferences, and disposes once',()=>{
  const car=new THREE.Group();car.add(new THREE.Mesh(new THREE.BoxGeometry(2,1.2,4.4),new THREE.MeshBasicMaterial()));
  const camera=new THREE.PerspectiveCamera(35,1.6,.1,100);camera.position.set(8,2.3,7);camera.lookAt(0,.8,0);camera.updateMatrixWorld();
  const flames=createExhaustFlames(car),resources=new Set();
  flames.group.traverse(object=>{if(object.geometry)resources.add(object.geometry);if(object.material)resources.add(object.material);});
  const state={active:true,progress:.4,time:2,camera,viewportHeight:900};
  assert.ok(flames.update(state)>0);assert.equal(flames.group.visible,true);
  assert.equal(flames.update({...state,reducedMotion:true}),0);assert.equal(flames.group.visible,false);
  assert.equal(flames.update({...state,active:false}),0);assert.equal(flames.group.visible,false);
  assert.equal(flames.update({...state,progress:1}),0);
  assert.ok(flames.update({...state,progress:.6,time:4})>0);
  const after=new Set();flames.group.traverse(object=>{if(object.geometry)after.add(object.geometry);if(object.material)after.add(object.material);});
  assert.deepEqual(after,resources,'revving must reuse all geometry and materials');
  const layout=flames.project(camera,1440,900);
  assert.equal(layout.anchors.length,2);
  assert.ok(layout.anchors.every(anchor=>Object.values(anchor).every(Number.isFinite)&&Math.hypot(anchor.dx,anchor.dy)>.01));
  const disposed=new Map();for(const resource of resources){disposed.set(resource,0);resource.addEventListener('dispose',()=>disposed.set(resource,disposed.get(resource)+1));}
  flames.dispose();flames.dispose();
  assert.ok(!car.children.includes(flames.group));
  assert.ok([...disposed.values()].every(count=>count===1));
});
