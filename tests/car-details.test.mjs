import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { addCarDetails } from '../src/car-details.js';

test('the R8 has a closed floor and front and rear Car-XY plates', () => {
  const text = [];
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect(){}, strokeRect(){}, fillText: value => text.push(value) }) }) };
  const car = new THREE.Group();
  for (const z of [-2.2,2.2]) {
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.5,.14),new THREE.MeshBasicMaterial());
    plate.name = `o_NumbrePlate_${z}`; plate.position.set(0,.35,z); car.add(plate);
  }
  const details = addCarDetails(car);
  const floor = details.getObjectByName('Sealed_Underbody');
  assert.ok(floor && floor.geometry.parameters.height > 0);
  car.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0,-1,0),new THREE.Vector3(0,1,0));
  assert.ok(ray.intersectObject(floor).length > 0,'underside must be closed when viewed from below');
  assert.equal(details.children.filter(child=>child.name.startsWith('CarXY_LicensePlate')).length,2);
  assert.ok(text.includes('Car-XY'));
  assert.ok(details.getObjectByName('Interior_SteeringWheel'));
});
