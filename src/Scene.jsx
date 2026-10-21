import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Scene({ driving = false, speed = 0, onReady, onError }) {
  const host = useRef(null);
  const speedRef = useRef(speed);
  const callbacks = useRef({ onReady, onError });
  speedRef.current = speed;
  callbacks.current = { onReady, onError };

  useEffect(() => {
    const container = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !driving, powerPreference: 'high-performance' }); }
    catch { callbacks.current.onError?.(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = driving ? 1.2 : 1.5;
    renderer.shadowMap.enabled = !driving;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(driving ? 66 : 35, 1, 0.1, 600);
    let controls, car, disposed = false, frame;
    const clock = new THREE.Clock();
    const moving = [];
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    const envTexture = pmrem.fromScene(environment, 0.04);
    scene.environment = envTexture.texture;
    environment.dispose();

    function box(w, h, d, material, x, y, z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z); scene.add(mesh); return mesh;
    }
    if (!driving) {
      camera.position.set(8.2, 2.3, 7);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.9, 0);
      controls.enablePan = false; controls.enableZoom = false;
      controls.minPolarAngle = Math.PI / 2.55; controls.maxPolarAngle = Math.PI / 2.05;
      controls.minAzimuthAngle = -Math.PI; controls.maxAzimuthAngle = Math.PI;
      controls.enableDamping = true; controls.dampingFactor = 0.06;
      controls.update();
      scene.add(new THREE.HemisphereLight('#c6d8ef', '#1a253b', 2));
      const key = new THREE.DirectionalLight('#ecf8ff', 6);
      key.position.set(2, 7, 5); key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
      key.shadow.bias = -0.0003; key.shadow.normalBias = 0.03;
      scene.add(key);
      const rim = new THREE.DirectionalLight('#adc9ff', 5); rim.position.set(-4, 2, -3); scene.add(rim);
      const warm = new THREE.DirectionalLight('#dbe9ff', 2); warm.position.set(-4, 3, 3); scene.add(warm);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: '#000000', opacity: 0.48 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.y = -0.015; scene.add(floor);
      const loader = new GLTFLoader();
      const draco = new DRACOLoader(); draco.setDecoderPath('/draco/'); loader.setDRACOLoader(draco);
      loader.load('/models/audi-r8.glb?v=navy-materials-2', gltf => {
        if (disposed) { gltf.scene.traverse(n => { n.geometry?.dispose(); }); return; }
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
            if (/BodyMaterial|RoofCanvas/i.test(mat.name)) {
              mat.color.set('#102c52'); mat.metalness = 0.78; mat.roughness = 0.24;
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
        scene.add(car); callbacks.current.onReady?.();
      }, undefined, () => callbacks.current.onError?.());
    } else {
      scene.background = new THREE.Color('#c5cec9');
      scene.fog = new THREE.Fog('#bdc7bc', 60, 240);
      camera.position.set(0.2, 1.55, 6);
      camera.lookAt(0, 1.6, -100);
      scene.add(new THREE.HemisphereLight('#dfe9ec', '#54533c', 2.5));
      const sunLight = new THREE.DirectionalLight('#ffe4b6', 3); sunLight.position.set(-30, 40, -80); scene.add(sunLight);
      const asphalt = new THREE.MeshStandardMaterial({ color: '#363b37', roughness: 1 });
      const grass = new THREE.MeshStandardMaterial({ color: '#667452', roughness: 1 });
      const paint = new THREE.MeshBasicMaterial({ color: '#eeeee0' });
      const yellow = new THREE.MeshBasicMaterial({ color: '#cfb666' });
      const steel = new THREE.MeshStandardMaterial({ color: '#8f9892', metalness: 0.7, roughness: 0.5 });
      box(500, 0.1, 500, grass, 0, -0.13, -140);
      box(16, 0.05, 400, asphalt, 0, -0.04, -170);
      [-7.5, 7.5].forEach(x => box(0.13, 0.015, 400, paint, x, 0, -170));
      box(0.12, 0.015, 400, yellow, -7.1, 0, -170);
      [-2.6, 2.6].forEach(x => {
        for (let i = 0; i < 45; i++) {
          const dash = box(0.13, 0.02, 4.6, paint, x, 0.015, 16 - i * 11);
          moving.push({ object: dash, span: 495, end: 20 });
        }
      });
      [-9, 9].forEach(x => {
        box(0.18, 0.27, 400, steel, x, 0.75, -170);
        for (let i = 0; i < 40; i++) {
          const post = box(0.14, 0.8, 0.14, steel, x, 0.35, 16 - i * 12);
          moving.push({ object: post, span: 480, end: 20 });
        }
      });
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#544c39' });
      const leafMat = new THREE.MeshStandardMaterial({ color: '#344b39', roughness: 1 });
      let seed = 127;
      const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      for (let i = 0; i < 100; i++) {
        const group = new THREE.Group();
        const height = 3 + rand() * 6;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.25, height * 0.5, 5), trunkMat);
        trunk.position.y = height * 0.25; group.add(trunk);
        [0, 1, 2].forEach(tier => {
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(height * (0.28 - tier * 0.035), height * 0.6, 7), leafMat);
          leaf.position.y = height * (0.45 + tier * 0.18); group.add(leaf);
        });
        group.position.set((i % 2 ? -1 : 1) * (14 + rand() * 55), 0, 20 - rand() * 430);
        scene.add(group); moving.push({ object: group, span: 440, end: 22 });
      }
      for (let i = 0; i < 20; i++) {
        const height = 3 + rand() * 10;
        box(3 + rand() * 4, height, 4, new THREE.MeshStandardMaterial({ color: '#88948b' }), -70 + i * 7, height / 2, -210 - rand() * 35);
      }
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.7, 32, 8), steel);
      tower.position.set(19, 16, -210); scene.add(tower);
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(2, 1.5, 2, 12), steel);
      pod.position.set(19, 26, -210); scene.add(pod);
      const sun = new THREE.Mesh(new THREE.SphereGeometry(12, 24, 16), new THREE.MeshBasicMaterial({ color: '#f4dfb0' }));
      sun.position.set(-90, 45, -260); scene.add(sun);
      callbacks.current.onReady?.();
    }
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
      if (!driving) {
        camera.fov = width / height < 1 ? 46 : 35;
        camera.updateProjectionMatrix();
      }
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const visibility = () => { if (document.hidden) clock.stop(); else clock.start(); };
    document.addEventListener('visibilitychange', visibility);
    function render() {
      frame = requestAnimationFrame(render);
      if (document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      if (driving && !reducedMotion()) {
        const movement = speedRef.current / 3.6 * dt;
        moving.forEach(({ object, span, end }) => { object.position.z += movement; if (object.position.z > end) object.position.z -= span; });
        camera.position.y = 1.55 + Math.sin(clock.elapsedTime * 15) * 0.003 * speedRef.current / 180;
      }
      controls?.update();
      renderer.render(scene, camera);
    }
    render();
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls?.dispose();
      document.removeEventListener('visibilitychange', visibility);
      scene.traverse(object => {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(mat => { if (!mat) return; Object.values(mat).forEach(v => { if (v?.isTexture) v.dispose(); }); mat.dispose(); });
      });
      envTexture.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [driving]);

  return <div ref={host} className={`three-scene ${driving ? 'road-scene' : 'car-scene'}`} role="img" aria-label={driving ? 'First-person view of a tree-lined Ontario highway toward Toronto' : 'Interactive navy Audi R8 in a garage. Drag to rotate the car.'} />;
}
