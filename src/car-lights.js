import * as THREE from 'three';

export function createCarHeadlights(car) {
  const lamps=[],covers=[],originals=new Set();
  car.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    const headlamp=/LightFrontHighlight|FarLight/i.test(mesh.name);
    const glass=/GlassFrontHighlight/i.test(mesh.name);
    if(!headlamp&&!glass)return;
    const copies=materials.map(source=>{
      originals.add(source);
      const material=source.clone();
      if(headlamp)lamps.push({material,intensity:material.emissiveIntensity});
      if(glass)covers.push({material,opacity:material.opacity});
      return material;
    });
    mesh.material=Array.isArray(mesh.material)?copies:copies[0];
  });
  car.traverse(mesh=>(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(material=>originals.delete(material)));
  originals.forEach(material=>material.dispose());
  const beams=[-1,1].map(side=>{
    const light=new THREE.PointLight('#d8ecff',0,3,2);light.position.set(side*.69,.57,2.04);car.add(light);return light;
  });
  let active=false;
  return {
    setActive(next){
      next=!!next;if(next===active)return false;active=next;
      lamps.forEach(({material,intensity})=>{material.emissiveIntensity=active?18:intensity;});
      covers.forEach(({material,opacity})=>{material.opacity=active ? .15 : opacity;});
      beams.forEach(light=>{light.intensity=active?7:0;});
      return true;
    }
  };
}
