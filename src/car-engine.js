import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createCarEngine() {
  const engine=new THREE.Group();engine.name='Engine_Assembly';
  const metal=new THREE.MeshStandardMaterial({color:'#687581',metalness:.7,roughness:.4});
  const cover=new THREE.MeshStandardMaterial({color:'#202b35',metalness:.35,roughness:.6});
  const black=new THREE.MeshStandardMaterial({color:'#0a1016',roughness:.9});
  const accent=new THREE.MeshStandardMaterial({color:'#264c71',metalness:.5,roughness:.45});
  const shapes=new Map();
  function box(name,size,position,material,parent=engine) {
    const key=size.join(',');
    if(!shapes.has(key))shapes.set(key,new RoundedBoxGeometry(...size,1,Math.min(.018,...size.map(v=>v/2))));
    const mesh=new THREE.Mesh(shapes.get(key),material);mesh.name=name;mesh.position.set(...position);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  const hoseGeometry=new THREE.CylinderGeometry(.035,.035,.28,10);
  // Keep the assembly below the bonnet and inside the front wheel wells.
  box('Engine_Sump',[.52,.12,.62],[0,.31,1.42],black);
  box('Engine_Bay_Firewall',[1.2,.4,.06],[0,.54,1.04],black);
  box('Engine_Block',[.60,.22,.62],[0,.45,1.42],metal);
  box('Intake_Plenum',[.20,.12,.58],[0,.605,1.42],accent);
  for(const side of [-1,1]){
    const bank=new THREE.Group();bank.name=side<0?'Left_Cylinder_Bank':'Right_Cylinder_Bank';
    bank.position.set(side*.25,.56,1.42);bank.rotation.z=-side*.28;engine.add(bank);
    box('Cam_Cover',[.22,.12,.66],[0,0,0],cover,bank);
    for(let i=0;i<5;i++){
      box('Cam_Cover_Rib',[.21,.013,.017],[0,.068,-.24+i*.12],metal,bank);
      box('Ignition_Coil',[.055,.028,.065],[0,.077,-.24+i*.12],black,bank);
    }
    const hose=new THREE.Mesh(hoseGeometry,black);hose.position.set(side*.38,.46,1.79);hose.rotation.z=side*.55;engine.add(hose);
    box('Airbox',[.24,.18,.29],[side*.45,.43,1.74],cover);
  }
  box('Oil_Cap',[.07,.025,.07],[.27,.66,1.17],accent);
  box('Cooling_Pack',[1.05,.36,.07],[0,.40,2.005],black);
  for(let i=0;i<19;i++)box('Radiator_Fin',[.014,.30,.012],[-.45+i*.05,.40,2.047],metal);
  for(const x of [-.65,.65])box('Intake_Backing',[.20,.27,.06],[x,.36,1.88],black);
  return engine;
}
