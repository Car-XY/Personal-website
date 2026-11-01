import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { addCarDetails, disposeSceneResources } from '../src/car-details.js';
import {NodeIO} from '@gltf-transform/core';
import {KHRDracoMeshCompression} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';

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
