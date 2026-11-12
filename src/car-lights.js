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
      if(headlamp)lamps.push({material,intensity:material.emissiveIntensity,emissive:material.emissive.clone(),color:material.color.clone()});
      if(glass)covers.push({material,opacity:material.opacity});
      return material;
    });
    mesh.material=Array.isArray(mesh.material)?copies:copies[0];
  });
  car.traverse(mesh=>(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(material=>originals.delete(material)));
  originals.forEach(material=>material.dispose());
  const warm=new THREE.Color('#ffcf00');
  let active=false;
  return {
    setActive(next){
      next=!!next;if(next===active)return false;active=next;
      lamps.forEach(({material,intensity,emissive,color})=>{material.color.copy(active?warm:color);material.emissive.copy(active?warm:emissive);material.emissiveIntensity=active?4:intensity;});
      covers.forEach(({material,opacity})=>{material.opacity=active ? .15 : opacity;});
      return true;
    }
  };
}
