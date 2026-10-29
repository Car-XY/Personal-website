import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { addCarDetails, disposeSceneResources } from './car-details.js';
import { createExhaustFlames } from './exhaust-3d.js';

export default function Scene({ onReady, onError, onSnapshot, onExhaustLayout, revving=false, revProgress=0 }) {
  const host = useRef(null);
  const callbacks = useRef({ onReady, onError, onSnapshot, onExhaustLayout, revving, revProgress });
  callbacks.current = { onReady, onError, onSnapshot, onExhaustLayout, revving, revProgress };

  useEffect(() => {
    const container = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { callbacks.current.onError?.(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    const contextLost = event => { event.preventDefault(); callbacks.current.onError?.(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 600);
    let controls, car, exhaust, disposed = false, frame, announced=false, snapshotSent=false, layoutSignature='',intensitySignature='',elapsed=0,viewportWidth=1,viewportHeight=1;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    const originalTextures = new Set();
    const clock = new THREE.Clock();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    const envTexture = pmrem.fromScene(environment, 0.04);
    scene.environment = envTexture.texture;scene.environmentIntensity=.55;
    environment.dispose();

      camera.position.set(8.2, 2.3, 7);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.9, 0);
      controls.enablePan = false; controls.enableZoom = false;
      controls.minPolarAngle = Math.PI / 2.55; controls.maxPolarAngle = Math.PI / 2.05;
      controls.minAzimuthAngle = -Math.PI; controls.maxAzimuthAngle = Math.PI;
      controls.enableDamping = true; controls.dampingFactor = 0.06;
      controls.update();
      scene.add(new THREE.HemisphereLight('#c6d8ef', '#1a253b', 2));
      const key = new THREE.DirectionalLight('#ecf8ff', 2.8);
      key.position.set(2, 7, 5); key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
      key.shadow.bias = -0.0003; key.shadow.normalBias = 0.03;
      scene.add(key);
      const rim = new THREE.DirectionalLight('#adc9ff', 1.6); rim.position.set(-4, 2, -3); scene.add(rim);
      const warm = new THREE.DirectionalLight('#dbe9ff', 1); warm.position.set(-4, 3, 3); scene.add(warm);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: '#000000', opacity: 0.48 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.y = -0.015; scene.add(floor);
      const loader = new GLTFLoader();
      const draco = new DRACOLoader(); draco.setDecoderPath('/draco/'); loader.setDRACOLoader(draco);
      loader.load('/models/car-xy.glb', gltf => {
        if (disposed) { disposeSceneResources(gltf.scene); return; }
        car = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(car);
        const size = bounds.getSize(new THREE.Vector3());
        const scale = 6.2 / Math.max(size.x, size.z);
        car.scale.setScalar(scale);
        const nextBounds = new THREE.Box3().setFromObject(car);
        const center = nextBounds.getCenter(new THREE.Vector3());
        car.position.set(-center.x, -nextBounds.min.y + 0.02, -center.z);
        car.traverse(mesh => {
          if (!mesh.isMesh) return;
          mesh.castShadow = true; mesh.receiveShadow = true;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach(mat => {
            Object.values(mat).forEach(value=>{if(value?.isTexture)originalTextures.add(value);});
            if (/BodyMaterial|RoofCanvas/i.test(mat.name)) {
              mat.color.set('#102c52'); mat.metalness = 0.68; mat.roughness = 0.34;
              mat.map = null;
            }
            if (/WindscreenGlass|GlassFront|GlassBack/i.test(mat.name)) {
              mat.color.set('#172a31'); mat.transparent = true; mat.opacity = 0.84; mat.roughness = 0.14; mat.metalness = 0.65;
            }
            if (/LightFrontHighlight|FarLight/i.test(mat.name)) {
              mat.emissive.set('#e3f4ff'); mat.emissiveIntensity = 2;
            }
            if (/LightBackHighlight/i.test(mat.name)) { mat.emissive.set('#ef2424'); mat.emissiveIntensity = 1.5; }
          });
        });
        addCarDetails(car);
        scene.add(car);
        exhaust=createExhaustFlames(car);
      }, undefined, () => { if(!disposed)callbacks.current.onError?.(); });
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      viewportWidth=width;viewportHeight=height;
      renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
        camera.fov = width / height < 1 ? 46 : 35;
        camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const visibility = () => { if (document.hidden) clock.stop(); else clock.start(); };
    document.addEventListener('visibilitychange', visibility);
    function render() {
      frame = requestAnimationFrame(render);
      if (document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed+=dt;
      controls?.update();
      const intensity=exhaust?.update({active:callbacks.current.revving,progress:callbacks.current.revProgress,time:elapsed,camera,viewportHeight:viewportHeight*renderer.getPixelRatio(),reducedMotion:reduce.matches})||0;
      const nextIntensity=intensity.toFixed(3);
      if(nextIntensity!==intensitySignature){intensitySignature=nextIntensity;container.dataset.exhaustIntensity=nextIntensity;}
      renderer.render(scene, camera);
      if(exhaust){
        const layout=exhaust.project(camera,viewportWidth,viewportHeight);
        const signature=JSON.stringify(layout,(_,value)=>typeof value==='number'?Math.round(value*1e6)/1e6:value);
        if(signature!==layoutSignature){layoutSignature=signature;container.dataset.exhaustAnchors=signature;callbacks.current.onExhaustLayout?.(layout);}
      }
      if(car&&!announced){announced=true;callbacks.current.onReady?.();}
      if(car&&!snapshotSent&&callbacks.current.onSnapshot){snapshotSent=true;callbacks.current.onSnapshot(renderer.domElement.toDataURL('image/png'));}
    }
    render();
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls?.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      document.removeEventListener('visibilitychange', visibility);
      exhaust?.dispose();draco.dispose(); disposeSceneResources(scene,originalTextures);
      envTexture.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="three-scene car-scene" role="img" aria-label="Interactive navy Car-XY sports car with Ontario licence plates. Drag to rotate the car." />;
}
