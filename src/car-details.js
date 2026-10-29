import * as THREE from 'three';

export function disposeSceneResources(root, extraTextures = []) {
  const geometries=new Set(),materials=new Set(),textures=new Set(extraTextures);
  root.traverse(object=>{
    if(object.geometry)geometries.add(object.geometry);
    (Array.isArray(object.material)?object.material:[object.material]).forEach(material=>{
      if(!material)return;materials.add(material);
      Object.values(material).forEach(value=>{if(value?.isTexture)textures.add(value);});
    });
  });
  geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());textures.forEach(value=>value.dispose());
}

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
  // Follow the tapered nose and tail rather than exposing rectangular corners
  // through the bumper openings. Keep the closure above the lower body trim.
  const footprint=[[-.53,1.83],[.53,1.83],[.70,1.35],[.73,.65],[.73,-1.35],[.55,-1.84],[-.55,-1.84],[-.73,-1.35],[-.73,.65],[-.70,1.35]];
  const outline=new THREE.Shape(footprint.map(([x,z])=>new THREE.Vector2(x,-z)));
  const underbody=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.055,bevelEnabled:false}),trim);
  underbody.name='Sealed_Underbody';underbody.rotation.x=-Math.PI/2;underbody.position.y=.14;
  underbody.castShadow=true;underbody.receiveShadow=true;details.add(underbody);
  solid('Cabin_Floor', [1.4,.1,1.5], [0,.48,-.05]);
  solid('Rear_Cabin_Bulkhead', [1.1,.42,.1], [0,.67,-.72]);
  solid('Dashboard', [1.22,.14,.32], [0,.71,.48]);
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
