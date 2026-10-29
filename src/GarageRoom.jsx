import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { addCarDetails, disposeSceneResources } from './car-details.js';
import { GARAGE_OBJECTS } from './garage.js';

export default function GarageRoom(props) {
  const host=useRef(null),live=useRef(props);live.current=props;
  useEffect(()=>{
    const container=host.current;let renderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch{live.current.onError?.();return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.setAttribute('aria-hidden','true');container.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#101620');scene.fog=new THREE.FogExp2('#111a23',.018);
    const camera=new THREE.PerspectiveCamera(54,1,.1,100),pmrem=new THREE.PMREMGenerator(renderer),environment=new RoomEnvironment();
    const environmentMap=pmrem.fromScene(environment,.06);scene.environment=environmentMap.texture;scene.environmentIntensity=.25;environment.dispose();
    const oldTextures=new Set(),targets=new Map();
    const material=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
    const navy=material('#142f51',.38,.6),iron=material('#222b30',.6,.65),steel=material('#9aabb2',.27,.8),wood=material('#74604a',.9);
    const rubber=material('#10151a',.92),yellow=material('#d9a62d',.6,.2),dark=material('#0e151d'),paper=material('#c0ba9f',.96);
    const glow=(color,power=3)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:power,roughness:.3});
    const cyan=glow('#47cbff'),pink=glow('#ed4db8'),fluorescent=glow('#e6f0ef',4);
    function mesh(geometry,mat,position,parent=scene){const o=new THREE.Mesh(geometry,mat);o.position.set(...position);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
    const box=(size,position,mat,parent)=>mesh(new THREE.BoxGeometry(...size),mat,position,parent);
    const cylinder=(r,h,position,mat,parent)=>mesh(new THREE.CylinderGeometry(r,r,h,24),mat,position,parent);
    const group=id=>{const g=new THREE.Group();g.userData.destination=id;scene.add(g);targets.set(id,g);return g;};
    const tube=(points,r,mat,parent=scene)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(2,points.length*4),r,6,false),mat,[0,0,0],parent);
    function print(w,h,draw){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
    const sign=(size,position,texture,parent=scene)=>mesh(new THREE.PlaneGeometry(...size),new THREE.MeshStandardMaterial({map:texture,roughness:.75}),position,parent);
    function lettering(title,subtitle,bg='#142735',fg='#d7e6e5'){
      return print(1024,384,ctx=>{ctx.fillStyle=bg;ctx.fillRect(0,0,1024,384);ctx.strokeStyle=fg;ctx.globalAlpha=.25;ctx.strokeRect(20,20,984,344);ctx.globalAlpha=1;ctx.fillStyle=fg;ctx.font='bold 88px Arial';ctx.fillText(title,52,175);ctx.font='29px monospace';ctx.fillText(subtitle,56,266);});
    }
    let seed=51;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    const concrete=print(1024,1024,ctx=>{
      ctx.fillStyle='#77756f';ctx.fillRect(0,0,1024,1024);
      for(let i=0;i<85000;i++){const v=60+Math.floor(random()*110);ctx.fillStyle=`rgba(${v},${v},${v},.13)`;ctx.fillRect(random()*1024,random()*1024,1+random()*3,1+random()*3);}
      for(let i=0;i<100;i++){ctx.fillStyle='#171f2510';ctx.beginPath();ctx.ellipse(random()*1024,random()*1024,random()*60,random()*30,random()*6,0,7);ctx.fill();}
      ctx.strokeStyle='#393b3a55';ctx.lineWidth=2;ctx.strokeRect(1,1,1022,1022);
    });concrete.wrapS=concrete.wrapT=THREE.RepeatWrapping;concrete.repeat.set(10,12);
    const brick=print(1024,1024,ctx=>{
      ctx.fillStyle='#22282a';ctx.fillRect(0,0,1024,1024);
      for(let row=0;row<16;row++)for(let col=-1;col<5;col++){const v=Math.floor(random()*12);ctx.fillStyle=`rgb(${44+v},${46+v},${44+v})`;ctx.fillRect(col*256+(row%2)*128+3,row*64+3,250,58);ctx.fillStyle='#ffffff06';ctx.fillRect(col*256+(row%2)*128+4,row*64+4,247,2);}
      for(let i=0;i<18000;i++){ctx.fillStyle=i%2?'#00000012':'#ffffff08';ctx.fillRect(random()*1024,random()*1024,2,2);}
    });brick.wrapS=brick.wrapT=THREE.RepeatWrapping;brick.repeat.set(5,2);
    const plate=print(512,512,ctx=>{
      ctx.fillStyle='#657078';ctx.fillRect(0,0,512,512);
      for(let x=-32;x<540;x+=32)for(let y=-32;y<540;y+=32){ctx.save();ctx.translate(x+(y%64?16:0),y);ctx.rotate(y%64?-.7:.7);ctx.fillStyle='#bdc6c6';ctx.fillRect(-2,-11,4,22);ctx.fillStyle='#303d46';ctx.fillRect(2,-10,2,22);ctx.restore();}
    });plate.wrapS=plate.wrapT=THREE.RepeatWrapping;plate.repeat.set(9,10);
    const floorMat=new THREE.MeshStandardMaterial({map:concrete,roughness:.82,metalness:.08}),wallMat=new THREE.MeshStandardMaterial({map:brick,roughness:.95});
    box([34,.18,44],[0,-.12,-6],floorMat);box([34,10,.3],[0,5,-23],wallMat);box([.3,10,44],[-17,5,-1],wallMat);box([.3,10,44],[17,5,-1],wallMat);box([34,.18,44],[0,10,-6],iron);
    // Geometry, car and practical lights share one perspective and shadow system.
    box([7.7,.035,8.6],[0,.01,.5],new THREE.MeshStandardMaterial({map:plate,roughness:.52,metalness:.55}));
    for(const x of [-3.96,3.96]){box([.28,.015,8.9],[x,.04,.5],rubber);for(let z=-3.7;z<5;z+=.48){const stripe=box([.28,.016,.23],[x,.05,z],yellow);stripe.rotation.y=.25;}}
    for(const z of [-3.92,4.92]){box([7.7,.015,.28],[0,.04,z],rubber);for(let x=-3.7;x<3.8;x+=.48){const stripe=box([.23,.017,.28],[x,.05,z],yellow);stripe.rotation.y=.25;}}
    const floorMark=sign([2.2,.7],[.1,.055,3.8],lettering('CAR—XY','BAY 01 / TORONTO','#56626a','#c0c4bc'));floorMark.rotation.x=-Math.PI/2;
    for(let z=-21;z<11;z+=5.5){box([33,.25,.22],[0,9.5,z],iron);for(const x of [-16.7,16.7])box([.28,9.7,.3],[x,4.85,z],iron);}
    for(let x=-16;x<=16;x+=1.2)box([.065,.08,42],[x,9.85,-6],dark);
    // A steel mezzanine fills the upper-left of the workshop, with a stairway at its right.
    box([20,.35,15],[-6,4.9,-15.5],iron);box([20,.12,.12],[-6,4.78,-7.95],cyan);
    for(const x of [-15.8,-9.5,-3,3.8]){box([.2,4.8,.2],[x,2.4,-8.2],iron);box([.4,.08,.4],[x,.07,-8.2],steel);}
    for(let x=-15.8;x<=3.8;x+=1.6)box([.05,1.1,.05],[x,5.6,-8],steel);
    box([20,.06,.06],[-6,6.1,-8],steel);box([20,.045,.045],[-6,5.6,-8],iron);
    for(let x=-14;x<4;x+=3.8){box([.14,.1,4.8],[x,4.65,-11],dark);box([.075,.04,4.6],[x,4.58,-11],fluorescent);}
    for(let i=0;i<17;i++){const y=.16+i*.285,z=-8.4-i*.48;box([2,.09,.49],[4.9,y,z],iron);for(const x of [3.95,5.85])box([.04,1.05,.04],[x,y+.52,z],steel);}
    for(const x of [3.95,5.85])tube([[x,1.2,-8.4],[x,5.75,-16.1]],.035,steel);
    const amber=glow('#cf9558',.7);
    for(const x of [-12,-6,0,10]){box([4.6,1.65,.12],[x,3.5,-22.78],amber);for(let i=-2;i<=2;i++)box([.065,1.7,.16],[x+i*.85,3.5,-22.65],iron);for(const y of [2.7,3.5,4.3])box([4.7,.06,.16],[x,y,-22.65],iron);}
    function neonWrench(x,y,z,mat){
      const parent=new THREE.Group();parent.position.set(x,y,z);scene.add(parent);
      tube([[-.22,-.8,0],[-.36,-.67,0],[-.3,-.48,0],[.34,.35,0],[.22,.62,0],[.32,.85,0],[.55,.94,0],[.43,.64,0],[.65,.48,0],[.86,.65,0],[.78,.37,0],[.57,.23,0],[-.1,-.58,0],[-.06,-.74,0],[-.22,-.8,0]],.018,mat,parent);
      const twin=parent.clone();twin.rotation.z=-Math.PI/2;scene.add(twin);
    }neonWrench(-9,2.5,-22.5,cyan);neonWrench(-2,2.5,-22.5,pink);
    scene.add(new THREE.HemisphereLight('#9daebc','#37332d',.7));
    function point(color,power,position,distance=18){const light=new THREE.PointLight(color,power,distance,2);light.position.set(...position);scene.add(light);return light;}
    for(const [x,z] of [[-3,1.2],[3,-1],[9,-5],[-8,-12]]){box([.24,.13,4.2],[x,7.3,z],iron);box([.14,.035,4],[x,7.22,z],fluorescent);for(const dz of [-1.7,1.7])box([.02,2.6,.02],[x,8.65,z+dz],steel);}
    const key=new THREE.SpotLight('#eef4ff',260,30,.77,.6,1.8);key.position.set(-2.5,7,4);key.target.position.set(0,0,.3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.00015;key.shadow.normalBias=.025;scene.add(key,key.target);
    point('#dce9f0',150,[4,6,-2]);point('#87c7ff',80,[-4,4,-6]);point('#e4ba8a',200,[8,5,-9]);point('#27adff',45,[-8,3,-19],13);point('#e44cb3',35,[-1,3,-19],12);
    const sun=new THREE.SpotLight('#f4bb77',550,35,.6,.25,1.6);sun.position.set(9,7,-18);sun.target.position.set(5,0,-7);scene.add(sun,sun.target);
    const bench=group('projects');box([2.5,.16,1.25],[-3.9,1.05,.5],wood,bench);
    for(const x of [-4.9,-2.9])for(const z of [0,1])box([.075,1,.075],[x,.52,z],iron,bench);box([2.3,.08,1.1],[-3.9,.3,.5],iron,bench);
    box([.96,.045,.66],[-3.75,1.17,.42],dark,bench);box([1,.66,.065],[-3.75,1.52,.11],dark,bench);
    const screen=sign([.9,.56],[-3.75,1.52,.15],lettering('BUILD / SHIP','KERA · CLEARPATH · ANCHOR','#112d40','#bdd8e8'),bench);screen.material.emissive.set('#35638b');screen.material.emissiveMap=screen.material.map;screen.material.emissiveIntensity=.5;
    for(let i=0;i<5;i++)box([.64,.012,.01],[-3.75,1.2,.2+i*.07],steel,bench);
    box([.5,.09,.3],[-4.6,1.2,.75],navy,bench);cylinder(.1,.22,[-2.94,1.25,.65],paper,bench);tube([[-4.2,1.12,.2],[-4.9,1.08,.3],[-5.1,.2,.4],[-4.7,.04,1.5],[-5,.04,2.4]],.018,rubber,bench);
    const chest=group('skills');box([2.8,1.15,1.1],[-6.5,.8,-5],navy,chest);box([3,.13,1.2],[-6.5,1.45,-5],wood,chest);
    for(let i=0;i<5;i++){box([2.65,.18,.045],[-6.5,.35+i*.21,-4.42],navy,chest);box([1.8,.03,.07],[-6.5,.4+i*.21,-4.37],steel,chest);}
    for(const x of [-7.6,-5.4])for(const z of [-5.4,-4.6]){const wheel=cylinder(.12,.1,[x,.14,z],rubber,chest);wheel.rotation.z=Math.PI/2;}
    box([2.7,1.4,.1],[-6.5,2.42,-5.55],iron,chest);
    for(let x=-7.7;x<-5.2;x+=.17)for(let y=1.85;y<3;y+=.17){const peg=mesh(new THREE.SphereGeometry(.013,4,3),steel,[x,y,-5.48],chest);peg.castShadow=false;}
    for(let i=0;i<7;i++){const tool=box([.055,.5,.07],[-7.5+i*.3,2.35,-5.39],i%2?steel:yellow,chest);tool.rotation.z=.2;mesh(new THREE.TorusGeometry(.065,.025,6,10),steel,[-7.45+i*.3,2.6,-5.39],chest);}
    const story=group('journey');box([3.8,2.15,.16],[-3.8,2.25,-14],iron,story);
    const board=print(1024,640,ctx=>{ctx.fillStyle='#bdb7a2';ctx.fillRect(0,0,1024,640);ctx.fillStyle='#1d3448';ctx.font='bold 65px Arial';ctx.fillText('ABOUT CARY',50,100);
      ['UNIVERSITY OF TORONTO','FORMULA + SOLAR','THE FUNDAMENTAL WHY','CHAMPION SWIM SCHOOL'].forEach((text,i)=>{const y=190+i*110;ctx.fillStyle=['#173858','#49645c','#98734e','#526b82'][i];ctx.fillRect(55,y-25,40,40);ctx.fillStyle='#233a4b';ctx.font='bold 31px Arial';ctx.fillText(text,125,y);ctx.font='18px monospace';ctx.fillText(['ENGINEERING SCIENCE','CODE THAT MOVES CARS','CURIOSITY, ON RECORD','TEACHING / LEARNING'][i],125,y+30);});});
    sign([3.6,1.98],[-3.8,2.25,-13.9],board,story);for(const x of [-5.3,-2.3])box([.07,2,.07],[x,1,-14],steel,story);
    const rack=group('teams');for(const x of [6.8,10.8])for(const z of [-11,-9.2])box([.1,4.4,.1],[x,2.2,z],iron,rack);
    for(const y of [.18,1.6,3.1,4.3])box([4.2,.1,2],[8.8,y,-10.1],wood,rack);
    for(const x of [7.3,8.6,9.9]){for(const y of [.9,2.35]){mesh(new THREE.TorusGeometry(.43,.17,12,28),rubber,[x,y,-9.95],rack);const hub=cylinder(.28,.15,[x,y,-9.86],steel,rack);hub.rotation.x=Math.PI/2;for(let i=0;i<5;i++){const spoke=box([.045,.55,.13],[x,y,-9.73],iron,rack);spoke.rotation.z=i*Math.PI/5;}}box([.95,.7,1],[x,3.52,-10],paper,rack);box([.97,.05,1.02],[x,3.85,-10],wood,rack);}
    const helmet=mesh(new THREE.SphereGeometry(.32,24,16),paper,[9.8,4.65,-10],rack);helmet.scale.set(1,1.1,1.1);box([.5,.15,.05],[9.8,4.7,-9.7],navy,rack);
    sign([3.6,.7],[8.8,4.95,-10.1],lettering('RACE DEPT.','FORMULA / BLUE SKY SOLAR'),rack);
    const contact=group('contact');box([.9,1.5,.65],[6,.75,-3.5],navy,contact);box([1.2,.13,.9],[6,1.55,-3.5],iron,contact);box([1.18,.86,.09],[6,2.03,-3.8],dark,contact);
    sign([1.07,.74],[6,2.03,-3.74],lettering('SAY HELLO','CARY LI / LET’S BUILD','#183b42','#c9e6dc'),contact);box([.55,.1,.3],[6,1.67,-3.3],rubber,contact);
    const tank=cylinder(.65,3.4,[8.6,1.08,-4.2],material('#8d9697',.42,.72));tank.rotation.z=Math.PI/2;
    for(const x of [7.2,10]){box([.1,2.2,.12],[x,1.1,-4.2],iron);box([.6,.1,1.7],[x,.1,-4.2],iron);}tube([[9.8,1.1,-4.2],[10.4,1.1,-4.2],[10.6,.1,-3.5],[9.4,.06,-2.4]],.045,rubber);
    for(const [x,z] of [[-4.6,3.4],[-5.7,2.8]]){cylinder(.52,1.1,[x,.6,z],iron);for(const y of [.15,.8,1.12])cylinder(.54,.04,[x,y,z],dark);cylinder(.09,.035,[x+.25,1.18,z],steel);}
    for(let i=0;i<2;i++){const rim=mesh(new THREE.TorusGeometry(.36,.065,8,24),steel,[-2.9,.5,-2.7+i*.65]);rim.rotation.x=.4;for(let j=0;j<5;j++){const spoke=box([.04,.67,.06],[-2.9,.5,-2.7+i*.65],steel);spoke.rotation.z=j*Math.PI/5;}}
    for(let i=0;i<4;i++){box([1.5,.13,1.1],[11.5,.1+i*.2,-3],wood);for(let j=0;j<3;j++)box([.13,.12,1.1],[11+j*.5,.2+i*.2,-3],wood);}
    const carGroup=group('drive'),draco=new DRACOLoader();draco.setDecoderPath('/draco/');const loader=new GLTFLoader();loader.setDRACOLoader(draco);
    let disposed=false,frame,needsRender=true,carLoaded=false,announced=false;
    loader.load('/models/car-xy.glb',gltf=>{
      if(disposed){disposeSceneResources(gltf.scene);return;}const car=gltf.scene,bounds=new THREE.Box3().setFromObject(car),size=bounds.getSize(new THREE.Vector3());car.scale.setScalar(5.1/Math.max(size.x,size.z));
      const scaled=new THREE.Box3().setFromObject(car),centre=scaled.getCenter(new THREE.Vector3());car.position.set(-centre.x,-scaled.min.y+.07,-centre.z);
      car.traverse(object=>{if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;(Array.isArray(object.material)?object.material:[object.material]).forEach(mat=>{
        Object.values(mat).forEach(value=>{if(value?.isTexture)oldTextures.add(value);});
        if(/BodyMaterial|RoofCanvas/i.test(mat.name)){mat.color.set('#102c52');mat.metalness=.68;mat.roughness=.34;mat.map=null;}
        if(/WindscreenGlass|GlassFront|GlassBack/i.test(mat.name)){mat.color.set('#172a31');mat.transparent=true;mat.opacity=.84;mat.roughness=.14;mat.metalness=.65;}
        if(/LightFrontHighlight|FarLight/i.test(mat.name)){mat.emissive.set('#e3f4ff');mat.emissiveIntensity=2;}
        if(/LightBackHighlight/i.test(mat.name)){mat.emissive.set('#ef2424');mat.emissiveIntensity=1.2;}
      });});addCarDetails(car);carGroup.add(car);needsRender=true;carLoaded=true;
    },undefined,()=>{if(!disposed)live.current.onError?.();});
    const composer=new EffectComposer(renderer),bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.12,.35,1.5),outputPass=new OutputPass();
    composer.addPass(new RenderPass(scene,camera));composer.addPass(bloom);composer.addPass(outputPass);
    const selection=new THREE.BoxHelper(undefined,'#a8dfff');selection.visible=false;selection.material.transparent=true;selection.material.opacity=.3;selection.material.depthTest=false;scene.add(selection);
    const resize=()=>{
      const {width,height}=container.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);composer.setSize(width,height);camera.aspect=width/height;
      const portrait=camera.aspect<1,offset=portrait?1.5:1;camera.position.set(-4.8*offset,3*offset,6.9*offset);camera.lookAt(.3,.95,portrait?-1.8:-4);camera.updateProjectionMatrix();camera.updateMatrixWorld();needsRender=true;
      live.current.onLayout?.({width,height,points:GARAGE_OBJECTS.map(object=>{const p=new THREE.Vector3(...object.point).project(camera);return{id:object.id,x:(p.x+1)*width/2,y:(1-p.y)*height/2};})});
    };const observer=new ResizeObserver(resize);observer.observe(container);resize();
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pressed=null,lastHover=null;
    const pick=event=>{
      const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects(scene.children,true).find(intersection=>intersection.object!==selection);let object=hit?.object;
      while(object){if(object.userData.destination)return object.userData.destination;object=object.parent;}return null;
    };
    const down=e=>{pressed=[e.clientX,e.clientY];};const up=e=>{if(!pressed||live.current.disabled)return;const moved=Math.hypot(e.clientX-pressed[0],e.clientY-pressed[1]);pressed=null;if(moved<7){const id=pick(e);if(id)live.current.onSelect?.(id);}};
    const move=e=>{const id=live.current.disabled?null:pick(e);if(id!==lastHover){lastHover=id;renderer.domElement.style.cursor=id?'pointer':'default';live.current.onHover?.(id);}};
    const leave=()=>{pressed=null;lastHover=null;live.current.onHover?.(null);};const lost=e=>{e.preventDefault();live.current.onError?.();};const canvas=renderer.domElement;
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('webglcontextlost',lost);
    let selected=null;const visible=()=>{needsRender=true;};document.addEventListener('visibilitychange',visible);
    function render(){frame=requestAnimationFrame(render);if(document.hidden)return;const next=live.current.disabled?null:live.current.highlighted;if(next!==selected){selected=next;selection.visible=!!targets.get(next);needsRender=true;}if(!needsRender)return;if(selection.visible)selection.setFromObject(targets.get(next));composer.render();needsRender=false;if(carLoaded&&!announced){announced=true;live.current.onReady?.();if(live.current.onSnapshot)live.current.onSnapshot(renderer.domElement.toDataURL('image/png'));}}render();
    return()=>{
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();draco.dispose();document.removeEventListener('visibilitychange',visible);
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('webglcontextlost',lost);
      bloom.dispose();outputPass.dispose();composer.dispose();disposeSceneResources(scene,oldTextures);environmentMap.dispose();pmrem.dispose();renderer.dispose();canvas.remove();
    };
  },[]);
  return <div className="garage-three-room" ref={host} role="img" aria-label="An industrial workshop in three dimensions: navy Car-XY sports car on a metal service bay, fluorescent lights, a steel mezzanine, workbench, racing shelves and tools."/>;
}
