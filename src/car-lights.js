import * as THREE from 'three';

export function findHeadlightAnchors(car) {
  car.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(car.matrixWorld).invert(),vertices=[];
  car.traverse(mesh=>{
    if(!mesh.isMesh||!/LightFrontHighlight/i.test(mesh.name))return;
    const positions=mesh.geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++)vertices.push(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse));
  });
  return [-1,1].map(side=>{
    const points=vertices.filter(point=>Math.sign(point.x)===side);
    if(!points.length)return new THREE.Vector3(side*.62,.574,1.87);
    const center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
    return points.reduce((nearest,point)=>point.distanceToSquared(center)<nearest.distanceToSquared(center)?point:nearest).clone().add(new THREE.Vector3(0,0,.02));
  });
}

const beamVertex=`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main(){
    vUv=uv;
    vec4 p=modelViewMatrix*vec4(position,1.);
    vNormal=normalMatrix*normal;vViewDirection=-p.xyz;
    gl_Position=projectionMatrix*p;
  }
`;
const beamFragment=`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main(){
    float edge=pow(abs(dot(normalize(vNormal),normalize(vViewDirection))),.65);
    float fade=(1.-smoothstep(.15,1.,vUv.y))*smoothstep(0.,.025,vUv.y);
    gl_FragColor=vec4(1.,.70,.19,edge*fade*.22);
  }
`;

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
      if(headlamp)lamps.push({material,intensity:material.emissiveIntensity,emissive:material.emissive.clone()});
      if(glass)covers.push({material,opacity:material.opacity});
      return material;
    });
    mesh.material=Array.isArray(mesh.material)?copies:copies[0];
  });
  car.traverse(mesh=>(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(material=>originals.delete(material)));
  originals.forEach(material=>material.dispose());
  const group=new THREE.Group();group.name='Headlight_Beams';group.visible=false;
  const geometry=new THREE.CylinderGeometry(.4,.025,1.9,32,1,true);
  const material=new THREE.ShaderMaterial({vertexShader:beamVertex,fragmentShader:beamFragment,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
  const beams=findHeadlightAnchors(car).map(anchor=>{
    const cone=new THREE.Mesh(geometry,material);cone.name='Headlight_Cone';cone.rotation.x=Math.PI/2;cone.position.copy(anchor);cone.position.z+=.95;group.add(cone);
    const light=new THREE.SpotLight('#ffce62',0,5,.22,.85,2);light.position.copy(anchor);
    light.target.position.copy(anchor).add(new THREE.Vector3(0,-.35,2.8));group.add(light,light.target);return light;
  });
  car.add(group);
  const warm=new THREE.Color('#ffb62e');
  let active=false;
  return {
    setActive(next){
      next=!!next;if(next===active)return false;active=next;
      lamps.forEach(({material,intensity,emissive})=>{material.emissive.copy(active?warm:emissive);material.emissiveIntensity=active?4:intensity;});
      covers.forEach(({material,opacity})=>{material.opacity=active ? .15 : opacity;});
      group.visible=active;beams.forEach(light=>{light.intensity=active?24:0;});
      return true;
    }
  };
}
