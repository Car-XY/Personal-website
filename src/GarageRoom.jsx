import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { addCarDetails, disposeSceneResources } from './car-details.js';
import { GARAGE_OBJECTS } from './garage.js';

export default function GarageRoom({ highlighted, disabled, onSelect, onHover, onLayout, onReady, onError }) {
  const host = useRef(null), live = useRef({});
  live.current = { highlighted, disabled, onSelect, onHover, onLayout, onReady, onError };
  useEffect(() => {
    const container = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' }); }
    catch { live.current.onError?.(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-hidden','true'); container.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-10,10,8,-8,.1,100);
    camera.position.set(17,14,21); camera.lookAt(0,1.7,0); camera.updateMatrixWorld();
    const pmrem = new THREE.PMREMGenerator(renderer), environment = new RoomEnvironment();
    const environmentMap = pmrem.fromScene(environment,.06); scene.environment = environmentMap.texture; environment.dispose();
    const oldTextures = new Set(), targets = new Map();
    const material = (color, roughness=.65, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const navy = material('#183459',.42,.35), dark = material('#18212a',.7,.25), steel = material('#7f919c',.34,.75);
    const wall = material('#b6c0c4'), trim = material('#314457'), wood = material('#ac855a',.7), white = material('#e6ebdf');
    const rubber = material('#192024',.91), yellow = material('#e8bd63');
    const lit = new THREE.MeshStandardMaterial({ color:'#edf4ef',emissive:'#c9e4ff',emissiveIntensity:2.2 });
    function mesh(geometry, mat, position, parent=scene) {
      const object = new THREE.Mesh(geometry,mat); object.position.set(...position);
      object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
    }
    const box = (size,position,mat,parent) => mesh(new THREE.BoxGeometry(...size),mat,position,parent);
    const cylinder = (radius,depth,position,mat,parent) => mesh(new THREE.CylinderGeometry(radius,radius,depth,24),mat,position,parent);
    function group(id) { const value = new THREE.Group(); value.userData.destination = id; scene.add(value); targets.set(id,value); return value; }
    function print(width,height,draw) {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      draw(canvas.getContext('2d'),width,height);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
    }
    function sign(size,position,texture,parent=scene,rotationY=0) {
      const object = mesh(new THREE.PlaneGeometry(...size),new THREE.MeshStandardMaterial({ map:texture,roughness:.75 }),position,parent);
      object.rotation.y = rotationY; return object;
    }
    function lettering(text,subtitle,bg='#173659',fg='#dce9e9') {
      return print(1024,384,ctx => {
        ctx.fillStyle=bg;ctx.fillRect(0,0,1024,384);ctx.strokeStyle=fg;ctx.globalAlpha=.22;ctx.strokeRect(24,24,976,336);ctx.globalAlpha=1;
        ctx.fillStyle=fg;ctx.font='bold 92px Arial';ctx.fillText(text,60,177);ctx.font='30px monospace';ctx.fillText(subtitle,64,263);
      });
    }
    scene.add(new THREE.HemisphereLight('#d4e4f5','#233040',2.3));
    const key = new THREE.DirectionalLight('#fff2db',4.6); key.position.set(3,12,8);key.castShadow=true;
    key.shadow.mapSize.set(2048,2048); Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12});
    key.shadow.normalBias=.035;key.shadow.bias=-.0002;scene.add(key);
    const rim = new THREE.DirectionalLight('#aacfff',2.5);rim.position.set(-8,6,-3);scene.add(rim);
    const warm = new THREE.PointLight('#ffd2a0',24,12,2);warm.position.set(-5,4,-2.3);scene.add(warm);

    // A cutaway room keeps the floor, workshop objects, and car visible together.
    const concrete = print(512,512,ctx => {
      ctx.fillStyle='#747d82';ctx.fillRect(0,0,512,512);
      let seed=51;
      for(let i=0;i<7000;i++) {
        seed=(seed*16807)%2147483647;const x=seed%512;seed=(seed*16807)%2147483647;
        ctx.fillStyle=i%2?'#ffffff08':'#0000000a';ctx.fillRect(x,seed%512,2,2);
      }
    });
    concrete.wrapS=concrete.wrapT=THREE.RepeatWrapping;concrete.repeat.set(3,3);
    box([16.3,.25,12.3],[0,-.16,0],trim);
    box([16,.06,12],[0,0,0],new THREE.MeshStandardMaterial({map:concrete,roughness:.88}));
    box([16,5.3,.18],[0,2.65,-6],wall);box([.18,5.3,12],[-8,2.65,0],wall);
    box([16,1.35,.04],[0,.7,-5.88],navy);box([.04,1.35,12],[-7.88,.7,0],navy);
    box([16,.08,.05],[0,1.43,-5.85],steel);box([.05,.08,12],[-7.85,1.43,0],steel);
    box([16,.14,.3],[0,5.25,-5.95],trim);box([.3,.14,12],[-7.95,5.25,0],trim);
    for(let x=-6;x<=6;x+=4) box([.018,.002,12],[x,.034,0],material('#60696d'));
    for(let z=-4;z<=4;z+=4) box([16,.002,.018],[0,.034,z],material('#60696d'));
    // Sectional door, guide rails, and a glazed transom.
    box([5.6,4.25,.2],[.25,2.2,-5.82],dark);
    for(let y=.3;y<4.2;y+=.32) {
      box([5.35,.3,.08],[.25,y,-5.68],material(y>3.25?'#516c7d':'#6a7e89',.45,.55));
      box([5.3,.014,.018],[.25,y-.13,-5.62],trim);
    }
    [-2.58,3.08].forEach(x=>box([.13,4.5,.2],[x,2.2,-5.55],steel));
    box([.7,.07,.12],[.25,1.0,-5.53],dark);
    sign([4.3,.62],[.25,4.85,-5.83],lettering('CAR—XY','CARY LI / TORONTO / BAY 01'));
    for(const x of [-3,3]) {
      box([.22,.16,4.6],[x,5.2,-.4],dark);
      box([.14,.025,4.2],[x,5.1,-.4],lit);
    }
    for(const x of [-2.2,2.2]) for(const z of [-1.8,3.7]) box([.075,.008,1.05],[x,.042,z],yellow);
    for(const z of [-2.3,4.2]) for(const x of [-1.85,1.85]) box([.75,.008,.075],[x,.042,z],yellow);
    const bay = sign([2.2,.7],[0,.043,4.8],lettering('BAY 01','5.2L V10','#747d82','#ddd7be'));
    bay.rotation.x=-Math.PI/2;

    const bench=group('projects');
    box([4,.17,1.5],[-5.25,1.04,-3.2],wood,bench);
    for(const x of [-6.9,-3.6]) for(const z of [-3.75,-2.65])box([.1,1,.1],[x,.52,z],dark,bench);
    box([1.2,.87,1.25],[-6.25,.52,-3.2],navy,bench);
    for(let i=0;i<3;i++)box([.85,.035,.06],[-6.25,.35+i*.22,-2.54],steel,bench);
    box([1.15,.045,.8],[-5,1.15,-3.08],dark,bench);
    box([1.17,.8,.055],[-5,1.56,-3.46],dark,bench);
    sign([1.06,.68],[-5,1.56,-3.42],lettering('PROJECT LOG','KERA / CLEARPATH / ANCHOR','#0d2133','#a9d3da'),bench);
    for(let i=0;i<4;i++)box([.7,.015,.015],[-5,1.18,-3.35+i*.12],steel,bench);
    box([.7,.06,.45],[-3.85,1.16,-3.25],material('#315954'),bench);
    for(let i=0;i<3;i++)box([.13,.12,.18],[-4.1+i*.23,1.25,-3.25],steel,bench);
    cylinder(.14,.2,[-6.8,1.23,-3.35],yellow,bench);
    box([3.1,1.35,.08],[-5.5,2.65,-5.8],trim,bench);
    for(let x=-6.8;x<-4.1;x+=.23)for(let y=2.15;y<3.25;y+=.23) {
      const peg=mesh(new THREE.SphereGeometry(.014,5,4),steel,[x,y,-5.74],bench);peg.castShadow=false;
    }
    for(let i=0;i<5;i++) {
      const tool=box([.07,.45,.08],[-6.3+i*.4,2.65,-5.65],i%2?steel:yellow,bench);tool.rotation.z=(i-2)*.08;
    }
    const story=group('journey');
    box([.13,2.45,3.5],[-7.78,3.1,.5],trim,story);
    const boardTexture=print(1024,768,ctx=>{
      ctx.fillStyle='#e2ddd0';ctx.fillRect(0,0,1024,768);ctx.fillStyle='#233a4b';ctx.font='bold 64px Arial';ctx.fillText('THE ROAD SO FAR',65,100);
      ctx.strokeStyle='#b39662';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(100,170);ctx.lineTo(100,680);ctx.stroke();
      ['UNIVERSITY OF TORONTO','FORMULA + SOLAR','THE FUNDAMENTAL WHY','CHAMPION SWIM SCHOOL'].forEach((text,i)=>{
        const y=205+i*140;ctx.fillStyle=['#15385a','#537768','#b08755','#5a7392'][i];ctx.fillRect(71,y-24,58,58);
        ctx.fillStyle='#233a4b';ctx.font='bold 33px Arial';ctx.fillText(text,165,y);ctx.font='22px monospace';ctx.fillStyle='#68716e';ctx.fillText(['ENGINEERING SCIENCE','CODE THAT MOVES CARS','CURIOSITY, ON RECORD','TEACHING / LEARNING'][i],165,y+40);
      });
    });
    sign([3.3,2.25],[-7.7,3.1,.5],boardTexture,story,Math.PI/2);

    const chest=group('skills');
    box([3.1,1.3,1.45],[-5.35,.85,3.25],navy,chest);box([3.25,.13,1.55],[-5.35,1.57,3.25],dark,chest);
    for(let i=0;i<5;i++) {
      box([2.9,.22,.035],[-5.35,.4+i*.23,4],material('#24466b',.45,.35),chest);
      box([2.2,.035,.08],[-5.35,.46+i*.23,4.05],steel,chest);
    }
    for(const x of [-6.55,-4.15])for(const z of [2.7,3.8]) {
      const wheel=cylinder(.14,.12,[x,.14,z],rubber,chest);wheel.rotation.z=Math.PI/2;
    }
    const wrench=box([1,.05,.13],[-5.5,1.67,3.3],steel,chest);wrench.rotation.y=.4;
    mesh(new THREE.TorusGeometry(.16,.05,8,16),steel,[-5.04,1.68,3.1],chest).rotation.x=Math.PI/2;

    const rack=group('teams');
    for(const x of [3.9,6.8])for(const z of [-4.8,-3.5])box([.085,2.8,.085],[x,1.45,z],dark,rack);
    for(const y of [.25,1.55,2.8])box([3,.09,1.45],[5.35,y,-4.1],steel,rack);
    for(const y of [.85,2.1])for(const x of [4.4,5.35,6.3]) {
      mesh(new THREE.TorusGeometry(.34,.15,12,32),rubber,[x,y,-4],rack);
      const hub=cylinder(.24,.13,[x,y,-3.96],steel,rack);hub.rotation.x=Math.PI/2;
      for(let i=0;i<5;i++) {
        const spoke=box([.045,.46,.15],[x,y,-3.87],dark,rack);spoke.rotation.z=i*Math.PI/5;
      }
    }
    mesh(new THREE.SphereGeometry(.32,24,16),white,[5.45,3.16,-4.05],rack).scale.set(1,1.15,1.05);
    box([.48,.15,.06],[5.45,3.19,-3.75],navy,rack);
    sign([2.8,.72],[5.35,3.8,-5.82],lettering('RACE DEPT.','FORMULA / BLUE SKY SOLAR'),rack);

    const contact=group('contact');
    box([1.8,.12,1.25],[6.15,.1,2.65],dark,contact);box([.75,1.3,.65],[6.15,.75,2.65],navy,contact);
    box([1.8,.12,1.25],[6.15,1.45,2.65],wood,contact);
    box([1.4,.92,.09],[6.15,2.05,2.3],dark,contact);
    sign([1.27,.78],[6.15,2.05,2.36],lettering('SAY HELLO','CARY LI / LET’S BUILD','#193a42','#d1eadf'),contact);
    box([.5,.15,.45],[6.45,1.63,2.85],dark,contact);box([.6,.12,.15],[6.45,1.77,2.85],rubber,contact);
    for(let i=0;i<6;i++)box([.05,.02,.05],[6.3+i%3*.12,1.72,2.96+Math.floor(i/3)*.1],white,contact);
    // A small potted plant and stool add scale without becoming navigation targets.
    cylinder(.25,.45,[6,.3,4.6],material('#a58d70'));
    for(let i=0;i<7;i++) {
      const leaf=mesh(new THREE.SphereGeometry(.2,8,6),material(i%2?'#476f5c':'#315347'),[6+Math.sin(i*2)*.18,.6+i*.1,4.6+Math.cos(i*2)*.16]);leaf.scale.set(.4,2,.6);leaf.rotation.z=Math.sin(i)*.6;
    }
    cylinder(.4,.12,[-3.8,.8,-1.1],wood);
    for(const x of [-4,-3.6])box([.06,.75,.06],[x,.4,-1.1],steel);

    const carGroup=group('drive');
    const draco=new DRACOLoader();draco.setDecoderPath('/draco/');
    const loader=new GLTFLoader();loader.setDRACOLoader(draco);
    let disposed=false,frame,needsRender=true;
    loader.load('/models/audi-r8.glb?v=navy-clean-3',gltf=>{
      if(disposed){disposeSceneResources(gltf.scene);return;}
      const car=gltf.scene,bounds=new THREE.Box3().setFromObject(car),size=bounds.getSize(new THREE.Vector3());
      car.scale.setScalar(4.5/Math.max(size.x,size.z));
      const scaled=new THREE.Box3().setFromObject(car),centre=scaled.getCenter(new THREE.Vector3());
      car.position.set(-centre.x,-scaled.min.y+.055,-centre.z+.9);
      car.traverse(object=>{
        if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;
        (Array.isArray(object.material)?object.material:[object.material]).forEach(mat=>{
          Object.values(mat).forEach(value=>{if(value?.isTexture)oldTextures.add(value);});
          if(/BodyMaterial|RoofCanvas/i.test(mat.name)){mat.color.set('#102c52');mat.metalness=.78;mat.roughness=.24;mat.map=null;}
          if(/WindscreenGlass|GlassFront|GlassBack/i.test(mat.name)){mat.color.set('#172a31');mat.transparent=true;mat.opacity=.84;mat.roughness=.14;mat.metalness=.65;}
          if(/LightFrontHighlight|FarLight/i.test(mat.name)){mat.emissive.set('#e3f4ff');mat.emissiveIntensity=1.5;}
          if(/LightBackHighlight/i.test(mat.name)){mat.emissive.set('#ef2424');mat.emissiveIntensity=1.2;}
        });
      });
      addCarDetails(car);carGroup.add(car);needsRender=true;live.current.onReady?.();
    },undefined,()=>{if(!disposed)live.current.onError?.();});
    const selection=new THREE.BoxHelper(undefined,'#c2dcff');selection.visible=false;selection.material.transparent=true;selection.material.opacity=.55;selection.material.depthTest=false;scene.add(selection);
    const resize=()=>{
      const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
      renderer.setSize(width,height);const aspect=width/height;
      needsRender=true;
      const corners=[];for(const x of [-8.3,8.3])for(const y of [-.3,5.5])for(const z of [-6.3,6.3])corners.push(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
      const minX=Math.min(...corners.map(p=>p.x)),maxX=Math.max(...corners.map(p=>p.x)),minY=Math.min(...corners.map(p=>p.y)),maxY=Math.max(...corners.map(p=>p.y));
      const half=Math.max((maxY-minY)/2,(maxX-minX)/2/aspect)*1.08,cx=(minX+maxX)/2,cy=(minY+maxY)/2;
      camera.left=cx-half*aspect;camera.right=cx+half*aspect;camera.top=cy+half;camera.bottom=cy-half;camera.updateProjectionMatrix();
      live.current.onLayout?.({width,height,points:GARAGE_OBJECTS.map(object=>{
        const point=new THREE.Vector3(...object.point).project(camera);return {id:object.id,x:(point.x+1)*width/2,y:(1-point.y)*height/2};
      })});
    };
    const observer=new ResizeObserver(resize);observer.observe(container);resize();
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pressed=null,lastHover=null;
    const pick=event=>{
      const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      raycaster.setFromCamera(pointer,camera);
      for(const hit of raycaster.intersectObjects([...targets.values()],true)) {
        let object=hit.object;while(object){if(object.userData.destination)return object.userData.destination;object=object.parent;}
      }
      return null;
    };
    const down=event=>{pressed=[event.clientX,event.clientY];};
    const up=event=>{
      if(!pressed||live.current.disabled)return;
      const moved=Math.hypot(event.clientX-pressed[0],event.clientY-pressed[1]);pressed=null;
      if(moved<7){const id=pick(event);if(id)live.current.onSelect?.(id);}
    };
    const move=event=>{
      const id=live.current.disabled?null:pick(event);
      if(id!==lastHover){lastHover=id;renderer.domElement.style.cursor=id?'pointer':'default';live.current.onHover?.(id);}
    };
    const leave=()=>{pressed=null;lastHover=null;live.current.onHover?.(null);};
    const lost=event=>{event.preventDefault();live.current.onError?.();};
    const canvas=renderer.domElement;
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('webglcontextlost',lost);
    let selected=null;
    const visible=()=>{needsRender=true;};document.addEventListener('visibilitychange',visible);
    function render(){
      frame=requestAnimationFrame(render);if(document.hidden)return;
      const next=live.current.disabled?null:live.current.highlighted;
      if(next!==selected){selected=next;selection.visible=!!targets.get(next);needsRender=true;}
      if(!needsRender)return;
      if(selection.visible)selection.setFromObject(targets.get(next));
      renderer.render(scene,camera);needsRender=false;
    }
    render();
    return()=>{
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();draco.dispose();
      document.removeEventListener('visibilitychange',visible);
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('webglcontextlost',lost);
      disposeSceneResources(scene,oldTextures);environmentMap.dispose();pmrem.dispose();renderer.dispose();canvas.remove();
    };
  },[]);
  return <div className="garage-three-room" ref={host} role="img" aria-label="Cary’s garage: a navy Audi R8 parked between a project workbench, racing rack, story wall, tool chest, and contact station."/>;
}
