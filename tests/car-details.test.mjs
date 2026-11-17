import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { addCarDetails, disposeSceneResources } from '../src/car-details.js';
import {NodeIO} from '@gltf-transform/core';
import {KHRDracoMeshCompression} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
import {createCarLights} from '../src/car-lights.js';

test('the Car-XY coupe has a closed floor and front and rear Car-XY plates', () => {
  const text = [];
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect(){}, strokeRect(){}, fillText: value => text.push(value) }) }) };
  const car = new THREE.Group();
  for (const z of [-2.2,2.2]) {
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.5,.14),new THREE.MeshBasicMaterial());
    plate.name = `o_NumbrePlate_${z}`; plate.position.set(0,.35,z); car.add(plate);
  }
  const details = addCarDetails(car);
  const floor = details.getObjectByName('Sealed_Underbody');
  assert.ok(floor && new THREE.Box3().setFromObject(floor).getSize(new THREE.Vector3()).y > 0);
  car.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0,-1,0),new THREE.Vector3(0,1,0));
  assert.ok(ray.intersectObject(floor).length > 0,'underside must be closed when viewed from below');
  const bumperCorner=new THREE.Raycaster(new THREE.Vector3(.8,-1,1.8),new THREE.Vector3(0,1,0));
  assert.equal(bumperCorner.intersectObject(floor).length,0,'underbody must not protrude through the outer front bumper opening');
  const bulkhead=new THREE.Box3().setFromObject(details.getObjectByName('Rear_Cabin_Bulkhead'));
  assert.equal(bulkhead.containsPoint(new THREE.Vector3(.7,.96,-.72)),false,'rear panel must not poke out beside the side window');
  const plates=car.children.filter(child=>child.name.startsWith('CarXY_LicensePlate'));
  assert.equal(plates.length,2);
  for(const plate of plates){
    assert.ok(plate.visible&&plate.material.map?.isCanvasTexture);
    assert.equal(Math.abs(plate.position.z),2.2,'lettering must stay on the model’s original mounted plate');
    assert.equal(plate.geometry.getAttribute('position').count,4,'no detached overlay geometry');
    assert.equal(plate.geometry.getAttribute('uv').count,4);
  }
  assert.ok(text.includes('Car-XY'));
  assert.ok(details.getObjectByName('Interior_SteeringWheel'));
});

test('lettering uses the shipped front and rear plate surfaces without moving either mount',async()=>{
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  const io=new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
  const source=await io.read('public/models/car-xy.glb'),car=new THREE.Group();
  const mounts=source.getRoot().listNodes().filter(node=>/NumbrePlate/i.test(node.getName())).map(node=>{
    const position=node.getMesh().listPrimitives()[0].getAttribute('POSITION').getArray();
    const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(position,3));
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());mesh.name=node.getName();car.add(mesh);return mesh;
  });
  car.scale.setScalar(1.4);car.rotation.y=.6;car.position.set(3,.2,-2);car.updateMatrixWorld(true);
  const before=mounts.map(mesh=>new THREE.Box3().setFromObject(mesh));
  addCarDetails(car);car.updateMatrixWorld(true);
  assert.equal(mounts.length,2);
  mounts.forEach((mesh,i)=>{
    assert.ok(new THREE.Box3().setFromObject(mesh).equals(before[i]));
    assert.ok(mesh.visible&&mesh.material.map?.isCanvasTexture);
    const uv=mesh.geometry.getAttribute('uv');
    assert.ok([...uv.array].every(value=>value>=0&&value<=1));
    const localZ=mesh.geometry.getAttribute('position').getZ(0);
    assert.equal(uv.getX(0),localZ>0?0:1,'rear plate lettering faces the right way');
  });
  disposeSceneResources(car);
});

test('shared geometry, materials, and detached textures are released once on scene teardown',()=>{
  const geometry=new THREE.BoxGeometry(),texture=new THREE.Texture(),detached=new THREE.Texture();
  const material=new THREE.MeshStandardMaterial({map:texture});
  const root=new THREE.Group();root.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,material));
  const disposed={geometry:0,material:0,texture:0,detached:0};
  for(const [name,resource]of Object.entries({geometry,material,texture,detached}))resource.addEventListener('dispose',()=>disposed[name]++);
  disposeSceneResources(root,[detached,texture]);assert.deepEqual(disposed,{geometry:1,material:1,texture:1,detached:1});
});

test('both original door panels remain visible from inside and outside the cabin',async()=>{
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  const io=new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
  const source=await io.read('public/models/car-xy.glb');
  const primitive=source.getRoot().listNodes().find(node=>/Doors_Plane/.test(node.getName())).getMesh().listPrimitives()[0];
  const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(primitive.getAttribute('POSITION').getArray(),3));
  geometry.setIndex(new THREE.BufferAttribute(primitive.getIndices().getArray(),1));
  const material=new THREE.MeshStandardMaterial();material.name=primitive.getMaterial().getName();
  const doors=new THREE.Mesh(geometry,material),car=new THREE.Group();car.add(doors);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial({transparent:true,opacity:.84}));
  glass.material.name='WindscreenGlassGrey';car.add(glass);
  addCarDetails(car);car.updateMatrixWorld(true);
  for(const side of [-1,1]){
    const inside=new THREE.Raycaster(new THREE.Vector3(0,.6,0),new THREE.Vector3(side,0,0));
    const outside=new THREE.Raycaster(new THREE.Vector3(side*3,.6,0),new THREE.Vector3(-side,0,0));
    assert.ok(inside.intersectObject(doors).length,'far door must remain visible through the windshield');
    assert.ok(outside.intersectObject(doors).length,'exterior door must remain visible');
  }
  assert.equal(glass.material.side,THREE.FrontSide,'glass keeps its existing transparency rendering');
  disposeSceneResources(car);
});

test('cabin windows reveal the interior without changing shared headlamp glass',()=>{
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  const car=new THREE.Group(),glass=new THREE.MeshStandardMaterial({transparent:true,opacity:.84});
  const windshield=new THREE.Mesh(new THREE.PlaneGeometry(),glass);windshield.name='o_Windscreen(Front)_Plane023';windshield.castShadow=true;
  const lamp=new THREE.Mesh(new THREE.PlaneGeometry(),glass);lamp.name='o_GlassFrontHighlight_Plane007';car.add(windshield,lamp);
  const details=addCarDetails(car);car.updateMatrixWorld(true);
  assert.notEqual(windshield.material,glass);
  assert.ok(windshield.material.opacity<.35);
  assert.equal(windshield.material.depthWrite,false);
  assert.equal(windshield.castShadow,false,'glass must not cast an opaque shadow over the cabin');
  assert.equal(lamp.material.opacity,.84);
  const cabin=details.getObjectByName('Cabin_Interior'),wheel=cabin.getObjectByName('Interior_SteeringWheel');
  const driver=cabin.getObjectByName('Driver_Seat'),passenger=cabin.getObjectByName('Passenger_Seat');
  assert.ok(driver&&passenger&&wheel);
  assert.ok(wheel.position.x>0&&driver.position.x>0&&passenger.position.x<0,'left-hand-drive orientation follows the model’s +Z nose');
  assert.ok(wheel.position.z>driver.getObjectByName('Seat_Cushion').position.z);
  assert.ok(wheel.position.z<cabin.getObjectByName('Dashboard').position.z);
  const bounds=new THREE.Box3().setFromObject(cabin);
  assert.ok(bounds.max.y<1.15&&bounds.min.y>.25,'seats and trim stay below the roof and above the underbody');
  assert.ok(bounds.max.x<.83&&bounds.min.x>-.83,'door cards stay inside the body shell');
  assert.ok(cabin.getObjectByName('Instrument_Panel')&&cabin.getObjectByName('Steering_Rim'));
  const geometries=new Set();cabin.traverse(node=>{if(node.geometry)geometries.add(node.geometry);});
  assert.ok([...geometries].reduce((sum,g)=>sum+g.getAttribute('position').count,0)<25000,'cabin detail keeps the scene lightweight');
  disposeSceneResources(car);
});

test('the engine stays below the bonnet and the radiator closes the see-through grille',()=>{
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  const car=new THREE.Group(),details=addCarDetails(car);car.updateMatrixWorld(true);
  const engine=details.getObjectByName('Engine_Assembly'),bounds=new THREE.Box3().setFromObject(engine);
  assert.ok(engine.getObjectByName('Left_Cylinder_Bank')&&engine.getObjectByName('Right_Cylinder_Bank'));
  assert.ok(bounds.max.y<.76&&bounds.min.y>.2,'engine bay fits between the undertray and bonnet');
  assert.ok(bounds.max.x<.8&&bounds.min.x>-.8,'components stay inside the wheel wells');
  for(const x of [-.4,0,.4]){
    const ray=new THREE.Raycaster(new THREE.Vector3(x,.5,3),new THREE.Vector3(0,0,-1));
    assert.ok(ray.intersectObject(engine.getObjectByName('Cooling_Pack')).length,'radiator must block a view through the nose into the cabin');
  }
  const geometries=new Set();engine.traverse(node=>{if(node.geometry)geometries.add(node.geometry);});
  assert.ok([...geometries].reduce((sum,g)=>sum+g.getAttribute('position').count,0)<10000);
  disposeSceneResources(car);
});

test('lamps: running lights, brake lights, indicators on the correct side, and steady headlamps',()=>{
  globalThis.document={createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
  const car=new THREE.Group(),source=new THREE.MeshStandardMaterial({emissive:'#d8ecff',emissiveIntensity:2});
  const glass=new THREE.MeshStandardMaterial({transparent:true,opacity:.84});
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(),source);lamp.name='o_LightFrontHighlight_Plane008';
  const lens=new THREE.Mesh(new THREE.BoxGeometry(),glass);lens.name='o_GlassFrontHighlight_Plane007';
  const rear=new THREE.Mesh(new THREE.BoxGeometry(),source);rear.name='LightBackHighlight';
  const rearLens=new THREE.Mesh(new THREE.BoxGeometry(),glass);rearLens.name='GlassBackHighlight';
  const windscreen=new THREE.Mesh(new THREE.BoxGeometry(),glass);windscreen.name='Windscreen';
  car.add(lamp,lens,rear,rearLens,windscreen);
  const lights=createCarLights(car);
  let lightSources=0;car.traverse(node=>{if(node.isLight)lightSources++;});
  assert.equal(lightSources,0,'no projected lights or beams, only lit lenses and glows');
  assert.ok(lens.material.opacity<.3&&rearLens.material.opacity<.3,'lamp covers are clear');
  assert.equal(windscreen.material,glass,'the windscreen keeps its own glass');
  const camera=new THREE.PerspectiveCamera();camera.position.set(0,1,-12);camera.updateMatrixWorld();
  const {front,rear:back}=lights.lamps,step=(o,n=60)=>{for(let i=0;i<n;i++)lights.update({dt:1/60,camera,...o,time:(o.time??0)+i/60});};
  step({time:0,signal:0,braking:false});
  const tail=back.uniforms.uInner.value.r,head=front.uniforms.uInner.value.clone();
  assert.ok(tail>.5,'tail lights are on while driving');assert.ok(head.r>1&&head.b>1,'headlamps are on, white');
  assert.equal(front.uniforms.uLeft.value+front.uniforms.uRight.value<.01,true,'no indicators while cruising');
  step({time:1,signal:0,braking:true});assert.ok(back.uniforms.uInner.value.r>tail*2.5,'brake lights are much brighter than tail lights');
  // Left signal blinks the left (+x in model space) side only, on and off.
  const left=[],right=[];
  for(let i=0;i<120;i++){lights.update({time:2+i/60,dt:1/60,camera,signal:-1,braking:false});left.push(front.uniforms.uLeft.value);right.push(front.uniforms.uRight.value);}
  assert.ok(Math.max(...left)>.95&&Math.min(...left.slice(30))<.05,'left indicator blinks');assert.ok(Math.max(...right)<.01,'right indicator stays off');
  // Headlamps hold steady: no greeting flash, no hazards.
  step({time:5,signal:0,braking:false},30);
  assert.ok(front.uniforms.uInner.value.equals(head),'headlamps stay steadily on');
  assert.ok(front.uniforms.uLeft.value<.01&&front.uniforms.uRight.value<.01,'no hazards');
  disposeSceneResources(car);
});
