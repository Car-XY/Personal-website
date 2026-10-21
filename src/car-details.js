import * as THREE from 'three';

export function addCarDetails(car) {
  // The source model is about 4.4 m long, centred on X/Z, with Y up.
  const trim = new THREE.MeshStandardMaterial({ color: '#111820', roughness: .82, metalness: .15 });
  const leather = new THREE.MeshStandardMaterial({ color: '#1a222c', roughness: .9 });
  const details = new THREE.Group(); details.name = 'CarXY_InteriorAndUnderbody';
  function solid(name, size, position, material = trim) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name; mesh.position.set(...position);
    mesh.castShadow = true; mesh.receiveShadow = true; details.add(mesh); return mesh;
  }
  solid('Sealed_Underbody', [1.65,.14,3.65], [0,.22,0]);
  solid('Cabin_Floor', [1.4,.1,1.5], [0,.48,-.05]);
  solid('Rear_Cabin_Bulkhead', [1.45,.58,.1], [0,.7,-.72]);
  solid('Dashboard', [1.45,.2,.32], [0,.78,.48]);
  [-.38,.38].forEach((x,i) => {
    solid(`Seat_${i+1}_Cushion`, [.42,.13,.5], [x,.6,-.2], leather);
    const back = solid(`Seat_${i+1}_Back`, [.43,.48,.12], [x,.85,-.45], leather);
    back.rotation.x = -.15;
    solid(`Seat_${i+1}_Headrest`, [.26,.16,.12], [x,1.05,-.48], leather);
  });
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.14,.025,8,24), trim);
  wheel.name = 'Interior_SteeringWheel'; wheel.position.set(-.4,.84,.23); wheel.rotation.x = -.35; details.add(wheel);

  const plateCanvas = document.createElement('canvas'); plateCanvas.width = 768; plateCanvas.height = 220;
  const ctx = plateCanvas.getContext('2d');
  ctx.fillStyle = '#f2f4eb'; ctx.fillRect(0,0,768,220);
  ctx.strokeStyle = '#9caabd'; ctx.lineWidth = 9; ctx.strokeRect(8,8,752,204);
  ctx.textAlign = 'center'; ctx.fillStyle = '#15356b';
  ctx.font = '600 27px Arial'; ctx.fillText('ONTARIO',384,43);
  ctx.font = 'bold 110px Arial'; ctx.fillText('Car-XY',384,150);
  ctx.font = '18px Arial'; ctx.fillText('YOURS TO DISCOVER',384,194);
  const texture = new THREE.CanvasTexture(plateCanvas); texture.colorSpace = THREE.SRGBColorSpace;
  const plateMaterial = new THREE.MeshBasicMaterial({ map:texture, side:THREE.DoubleSide });
  const originals = [];
  car.updateMatrixWorld(true);
  car.traverse(node => { if (node.isMesh && /NumbrePlate/i.test(node.name)) originals.push(node); });
  originals.forEach((original,i) => {
    const bounds = new THREE.Box3().setFromObject(original);
    const center = car.worldToLocal(bounds.getCenter(new THREE.Vector3()));
    const front = center.z > 0;
    original.visible = false;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.5,.143), plateMaterial);
    plate.name = `CarXY_LicensePlate_${i}`;
    plate.position.copy(center); plate.position.z += front ? .022 : -.022;
    plate.rotation.y = front ? 0 : Math.PI;
    plate.renderOrder = 2; details.add(plate);
  });
  car.add(details);
  return details;
}
