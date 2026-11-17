import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { addCarDetails, disposeSceneResources } from './car-details.js';
import { createCarLights } from './car-lights.js';
import { createHighway, SKY } from './highway.js';
import { loadSignFonts } from './signs.js';
import { carPoseAt, cameraAt, signalAt } from './drive-story.js';

const WHEEL_PARTS = /Tyre|^o Wheel|WheelCentre|Bolt|BrakeDisc/i;

// Re-pivot each rotating wheel part around its own centre so it can spin in place.
export function prepareWheels(car) {
  const parts = [];
  car.updateMatrixWorld(true);
  car.traverse(mesh => {
    if (!mesh.isMesh || !WHEEL_PARTS.test(mesh.name)) return;
    mesh.geometry = mesh.geometry.clone();
    mesh.geometry.computeBoundingBox();
    const c = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
    mesh.updateMatrix();
    const pivot = c.clone().applyMatrix4(mesh.matrix);
    mesh.geometry.translate(-c.x, -c.y, -c.z);
    mesh.position.copy(pivot);
    parts.push({ mesh, base: mesh.quaternion.clone() });
  });
  return parts;
}

function styleCar(car, originalTextures) {
  car.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.castShadow = true; mesh.receiveShadow = true;
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(mat => {
      Object.values(mat).forEach(value => { if (value?.isTexture) originalTextures.add(value); });
      if (/BodyMaterial|RoofCanvas/i.test(mat.name)) { mat.color.set('#102c52'); mat.metalness = .7; mat.roughness = .3; mat.map = null; }
      if (/WindscreenGlass|GlassFront|GlassBack/i.test(mat.name)) { mat.color.set('#172a31'); mat.transparent = true; mat.opacity = .84; mat.roughness = .1; mat.metalness = .7; }
    });
  });
}

export default function DriveScene({ progress, intro, onReady, onError }) {
  const host = useRef(null);
  const callbacks = useRef({ onReady, onError });
  callbacks.current = { onReady, onError };

  useEffect(() => {
    const container = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { callbacks.current.onError?.(); return; }
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .88;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(SKY.horizon);
    container.appendChild(renderer.domElement);
    const contextLost = event => { event.preventDefault(); callbacks.current.onError?.(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(SKY.fog, 70, 560);
    // The camera never comes closer than ~9 m to anything, so a 0.5 m near plane costs nothing and gives
    // far signs and road paint five times the depth precision (no flicker or bleed-through at 300 m).
    const camera = new THREE.PerspectiveCamera(32, 1, .5, 1400);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTexture = pmrem.fromScene(room, .04);
    scene.environment = envTexture.texture; scene.environmentIntensity = .7;
    room.dispose();

    scene.add(new THREE.HemisphereLight('#e6eef5', '#7c8a5c', 1.25));
    const sun = new THREE.DirectionalLight('#fff3e0', 2.5);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 90 });
    sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
    scene.add(sun, sun.target);

    let highway, disposed = false, frame, car, rig, lights, wheels = [], announced = false, elapsed = 0, lastDistance = 0, spin = 0;
    let speed = 0, decel = 0, brakeHold = 0;
    const originalTextures = new Set();
    const clock = new THREE.Clock();
    const draco = new DRACOLoader(); draco.setDecoderPath('/draco/');

    loadSignFonts().then(() => {
      if (disposed) return;
      highway = createHighway(renderer);
      scene.add(highway.world);
    });

    const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
    loader.load('/models/car-xy.glb', gltf => {
      if (disposed) { disposeSceneResources(gltf.scene); return; }
      car = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(car), size = bounds.getSize(new THREE.Vector3());
      car.scale.setScalar(4.55 / Math.max(size.x, size.z));
      const next = new THREE.Box3().setFromObject(car), center = next.getCenter(new THREE.Vector3());
      car.position.set(-center.x, -next.min.y + .02, -center.z);
      styleCar(car, originalTextures);
      addCarDetails(car);
      lights = createCarLights(car);
      wheels = prepareWheels(car);
      // The model's nose points along +z; turn it to face down the road (−z).
      const facing = new THREE.Group(); facing.rotation.y = Math.PI; facing.add(car);
      rig = new THREE.Group(); rig.add(facing);
      scene.add(rig);
    }, undefined, () => { if (!disposed) callbacks.current.onError?.(); });

    const debug = /[?&]debug\b/.test(window.location.search) ? (window.__drive = { scene, camera, THREE }) : null;
    let portrait = false;
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      portrait = width / height < .85;
      camera.aspect = width / Math.max(height, 1);
      camera.fov = portrait ? 52 : 32;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const visibility = () => { if (document.hidden) clock.stop(); else clock.start(); };
    document.addEventListener('visibilitychange', visibility);

    const target = new THREE.Vector3(), axis = new THREE.Vector3(1, 0, 0), q = new THREE.Quaternion();
    function render() {
      frame = requestAnimationFrame(render);
      if (document.hidden) return;
      const dt = Math.min(clock.getDelta(), .05); elapsed += dt;
      const p = progress.current, t = intro?.current ?? 1;
      const pose = carPoseAt(p, t), view = cameraAt(p, { portrait, intro: t });
      if (rig) {
        rig.position.set(pose.x, 0, pose.z);
        rig.rotation.y = pose.yaw;
        const moved = pose.distance - lastDistance; lastDistance = pose.distance;
        spin -= moved / .34;
        wheels.forEach(({ mesh, base }) => { q.setFromAxisAngle(axis, spin); mesh.quaternion.copy(base).multiply(q); });
        rig.position.y = Math.sin(elapsed * 9) * .004 * Math.min(1, Math.abs(moved) * 4 + .3);
        // Brake lights: on while slowing down, and held while stopped mid-drive (like waiting in traffic).
        const prev = speed;
        speed += (Math.abs(moved) / Math.max(dt, 1e-3) - speed) * (1 - Math.exp(-dt * 8));
        decel += ((prev - speed) / Math.max(dt, 1e-3) - decel) * (1 - Math.exp(-dt * 10));
        const onHighway = p > .2 && p < .9;
        if ((decel > 6 && speed > .3) || (onHighway && speed < .4)) brakeHold = .35; else brakeHold -= dt;
      }
      if (!debug?.freeze) { camera.position.set(...view.position); camera.lookAt(target.set(...view.target)); }
      sun.position.set(pose.x + 16, 26, pose.z + 10); sun.target.position.set(pose.x, 0, pose.z);
      highway?.update({ camera, carZ: pose.z, time: elapsed });
      lights?.update({ time: elapsed, dt, camera, signal: signalAt(p, t), braking: brakeHold > 0 });
      renderer.render(scene, camera);
      if (car && highway && !announced) { announced = true; container.dataset.ready = 'true'; callbacks.current.onReady?.(); }
    }
    render();

    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      document.removeEventListener('visibilitychange', visibility);
      draco.dispose(); disposeSceneResources(scene, originalTextures);
      envTexture.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="drive-canvas" aria-hidden="true" />;
}
