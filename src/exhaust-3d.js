import * as THREE from 'three';
import { exhaustIntensityAt, exhaustParticleAt } from './exhaust.js';

export function findExhaustAnchors(car) {
  car.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(car.matrixWorld).invert(),vertices=[];
  car.traverse(mesh=>{
    if(!mesh.isMesh||!/ExhaustSystem/i.test(mesh.name))return;
    const positions=mesh.geometry.getAttribute('position'),point=new THREE.Vector3();
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);
      vertices.push(point.clone());
    }
  });
  if(vertices.length){
    const rear=Math.min(...vertices.map(point=>point.z));
    const mouth=vertices.filter(point=>point.z<rear+.035);
    return [-1,1].map(side=>{
      const points=mouth.filter(point=>Math.sign(point.x)===side);
      const bounds=new THREE.Box3().setFromPoints(points);
      const center=bounds.getCenter(new THREE.Vector3());
      center.z=rear-.018;
      return center;
    });
  }
  const bounds=new THREE.Box3().setFromObject(car).applyMatrix4(inverse),size=bounds.getSize(new THREE.Vector3());
  return [-1,1].map(side=>new THREE.Vector3(side*size.x*.36,bounds.min.y+size.y*.22,bounds.min.z-.018));
}

const flameVertex=`
  uniform vec3 uSide;
  uniform float uLength;
  uniform float uWidth;
  varying vec2 vUv;
  void main(){
    vUv=uv;
    vec3 p=uSide*(uv.x-.5)*uWidth+vec3(0.,0.,-uv.y*uLength);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  }
`;
const flameFragment=`
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  void main(){
    float t=vUv.y;
    float turbulence=sin(t*29.-uTime*36.)*.026+sin(t*57.-uTime*49.+1.7)*.018;
    float center=sin(t*13.-uTime*21.)*.018*t;
    float width=.06+pow(max(0.,sin(t*3.14159)),.85)*.37*(1.-t*.45)+turbulence*t;
    float distance=abs(vUv.x-.5-center);
    float silhouette=1.-smoothstep(width*.58,width,distance);
    float core=1.-smoothstep(width*.12,width*.53,distance);
    float blue=1.-smoothstep(.12,.43,t);
    vec3 outer=mix(vec3(1.,.19,.015),vec3(.06,.22,1.),blue);
    vec3 inner=mix(vec3(1.,.72,.20),vec3(.65,.86,1.),blue);
    vec3 colour=mix(outer,inner,core*.92);
    float tip=1.-smoothstep(.72,1.,t);
    float alpha=silhouette*tip*(.48+core*.4)*uIntensity;
    if(alpha<.015)discard;
    gl_FragColor=vec4(colour,alpha);
  }
`;
const sparkVertex=`
  attribute float particleSize;
  attribute float particleAlpha;
  uniform float uViewportHeight;
  varying float vAlpha;
  void main(){
    vec4 p=modelViewMatrix*vec4(position,1.);
    float scale=length(modelMatrix[0].xyz);
    gl_PointSize=clamp(particleSize*uViewportHeight*scale/max(.2,-p.z),1.,18.);
    gl_Position=projectionMatrix*p;
    vAlpha=particleAlpha;
  }
`;
const sparkFragment=`
  varying float vAlpha;
  void main(){
    float radius=length(gl_PointCoord-.5)*2.;
    float alpha=(1.-smoothstep(.12,1.,radius))*vAlpha;
    if(alpha<.01)discard;
    gl_FragColor=vec4(mix(vec3(1.,.26,.025),vec3(1.,.88,.47),1.-radius),alpha);
  }
`;

export function createExhaustFlames(car) {
  const anchors=findExhaustAnchors(car),group=new THREE.Group();
  group.name='CarXY_ExhaustFlames';group.visible=false;car.add(group);
  const quad=new THREE.PlaneGeometry(1,1),jets=[],particleCount=28;
  for(const anchor of anchors){
    const material=new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0},uIntensity:{value:0},uLength:{value:1},uWidth:{value:.6},uSide:{value:new THREE.Vector3(1,0,0)}},
      vertexShader:flameVertex,fragmentShader:flameFragment,transparent:true,
      blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false,
    });
    const flame=new THREE.Mesh(quad,material);flame.position.copy(anchor);flame.frustumCulled=false;group.add(flame);
    const positions=new Float32Array(particleCount*3),sizes=new Float32Array(particleCount),alpha=new Float32Array(particleCount);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('particleSize',new THREE.BufferAttribute(sizes,1).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('particleAlpha',new THREE.BufferAttribute(alpha,1).setUsage(THREE.DynamicDrawUsage));
    const sparksMaterial=new THREE.ShaderMaterial({uniforms:{uViewportHeight:{value:800}},vertexShader:sparkVertex,fragmentShader:sparkFragment,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false});
    const sparks=new THREE.Points(geometry,sparksMaterial);sparks.position.copy(anchor);sparks.frustumCulled=false;group.add(sparks);
    const light=new THREE.PointLight('#ff793a',0,1.5,2);light.position.copy(anchor).add(new THREE.Vector3(0,.03,-.15));group.add(light);
    jets.push({anchor,flame,material,geometry,sparksMaterial,positions,sizes,alpha,light});
  }
  const direction=new THREE.Vector3(0,0,-1),cameraLocal=new THREE.Vector3(),toCamera=new THREE.Vector3(),side=new THREE.Vector3();
  let disposed=false;
  function update({active=false,progress=0,time=0,camera,viewportHeight=800,reducedMotion=false}) {
    const intensity=active&&!reducedMotion?exhaustIntensityAt(progress):0;
    group.visible=intensity>.001;
    if(!group.visible)return intensity;
    camera.getWorldPosition(cameraLocal);car.worldToLocal(cameraLocal);
    for(let jetIndex=0;jetIndex<jets.length;jetIndex++){
      const jet=jets[jetIndex];
      toCamera.copy(cameraLocal).sub(jet.anchor);
      side.crossVectors(direction,toCamera).normalize();
      if(side.lengthSq()<.01)side.set(1,0,0);
      jet.material.uniforms.uSide.value.copy(side);
      jet.material.uniforms.uTime.value=time+jetIndex*.23;
      jet.material.uniforms.uIntensity.value=intensity;
      jet.material.uniforms.uLength.value=.55+intensity*1.15;
      jet.material.uniforms.uWidth.value=.38+intensity*.30;
      jet.sparksMaterial.uniforms.uViewportHeight.value=viewportHeight;
      jet.light.intensity=2.3*intensity;
      for(let i=0;i<particleCount;i++){
        const particle=exhaustParticleAt(i+jetIndex*particleCount,time,intensity);
        jet.positions[i*3]=particle.x;jet.positions[i*3+1]=particle.y;jet.positions[i*3+2]=particle.z;
        jet.sizes[i]=particle.size;jet.alpha[i]=particle.opacity*.7;
      }
      Object.values(jet.geometry.attributes).forEach(attribute=>attribute.needsUpdate=true);
    }
    return intensity;
  }
  function project(camera,width,height) {
    car.updateMatrixWorld(true);camera.updateMatrixWorld();
    return {width,height,anchors:anchors.map(anchor=>{
      const start=car.localToWorld(anchor.clone()).project(camera);
      const end=car.localToWorld(anchor.clone().add(direction)).project(camera);
      return {x:(start.x+1)/2,y:(1-start.y)/2,dx:(end.x-start.x)/2,dy:(start.y-end.y)/2};
    })};
  }
  function dispose(){
    if(disposed)return;disposed=true;group.removeFromParent();quad.dispose();
    jets.forEach(jet=>{jet.material.dispose();jet.geometry.dispose();jet.sparksMaterial.dispose();});
  }
  return {group,anchors,update,project,dispose};
}
