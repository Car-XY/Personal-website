// The daytime 401: road, markings, barriers, verge, trees, traffic and signs.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BEATS, SIGN_LAYOUT, INTRO_DISTANCE } from './drive-story.js';
import { SIGNS, renderSign, COLORS } from './signs.js';

export const SKY = { top: '#8fb0cc', horizon: '#e4e8e6', fog: '#dfe4e2' };
const ROAD_START = 320, ROAD_END = -1800, ROAD_LEN = ROAD_START - ROAD_END, ROAD_MID = (ROAD_START + ROAD_END) / 2;
const LANE = 3.75, EDGE = LANE * 1.5, SHOULDER = 8.8;

function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

function noiseTexture(size, base, spread, seed, { streaks = false } = {}) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(size, size), r = rng(seed);
  const c = new THREE.Color(base);
  for (let i = 0; i < size * size; i++) {
    const n = (r() - .5) * spread + (streaks ? Math.sin((i % size) / size * Math.PI * 6) * spread * .15 : 0);
    img.data[i * 4] = Math.max(0, Math.min(255, c.r * 255 + n));
    img.data[i * 4 + 1] = Math.max(0, Math.min(255, c.g * 255 + n));
    img.data[i * 4 + 2] = Math.max(0, Math.min(255, c.b * 255 + n * .9));
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

function strip(width, length, material, x, y = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, length), material);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, ROAD_MID); mesh.receiveShadow = true;
  return mesh;
}

function instanced(geometry, material, matrices, { cast = false } = {}) {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.castShadow = cast; mesh.receiveShadow = true;
  return mesh;
}
const at = (x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));

function createSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(SKY.top) }, horizon: { value: new THREE.Color(SKY.horizon) } },
    vertexShader: 'varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vPos; void main(){ float h = clamp(vPos.y * 2.2, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, .8)), 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), material);
  sky.renderOrder = -1;
  return sky;
}

function signMesh(id, anisotropy) {
  const spec = SIGNS[id], canvas = renderSign(id, 110);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = anisotropy; tex.generateMipmaps = true;
  // The face sits in front of a grey backing plate. Keep a real gap and bias it toward the camera so the
  // plate can never win the depth test on far-away signs (it used to bleed through as a grey wash).
  const face = new THREE.MeshBasicMaterial({ map: tex, transparent: !!spec.transparent, alphaTest: spec.transparent ? .5 : 0, toneMapped: false, color: '#ebebeb', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const back = new THREE.MeshStandardMaterial({ color: '#8d9296', metalness: .6, roughness: .5 });
  const group = new THREE.Group();
  const front = new THREE.Mesh(new THREE.PlaneGeometry(spec.w, spec.h), face);
  front.position.z = .1; group.add(front);
  if (!spec.transparent) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(spec.w, spec.h, .12), back);
    plate.castShadow = true; group.add(plate);
  } else {
    // Cut-out signs (exit tabs, stacked panels): a dark metal back in the same silhouette.
    const rear = new THREE.Mesh(new THREE.PlaneGeometry(spec.w, spec.h), new THREE.MeshStandardMaterial({ map: tex, color: '#3a3d40', alphaTest: .5, metalness: .5, roughness: .6 }));
    rear.rotation.y = Math.PI; rear.position.z = -.02; rear.castShadow = true; group.add(rear);
  }
  group.userData = { canvas, spec };
  return group;
}

function steel() { return new THREE.MeshStandardMaterial({ color: '#9aa1a6', metalness: .75, roughness: .38 }); }

function addSign(world, beat, anisotropy) {
  const layout = SIGN_LAYOUT[beat.sign], sign = signMesh(beat.sign, anisotropy), spec = SIGNS[beat.sign];
  const holder = new THREE.Group(); holder.position.set(0, 0, -beat.at); world.add(holder);
  const metal = steel();
  if (layout.kind === 'gantry') {
    const span = 26, beamY = layout.y + spec.h + .25;
    for (const x of [-span / 2 + 2.6, span / 2 - 2.6]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.28, .32, beamY + .6, 12), metal);
      post.position.set(x + layout.x, (beamY + .6) / 2, 0); post.castShadow = true; holder.add(post);
    }
    for (const y of [beamY, beamY - .9]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(span - 4.4, .22, .22), metal);
      beam.position.set(layout.x, y, -.35); beam.castShadow = true; holder.add(beam);
    }
    sign.position.set(layout.x + 1.4, layout.y + spec.h / 2, 0); holder.add(sign);
  } else if (layout.kind === 'billboard') {
    for (const x of [-spec.w * .28, spec.w * .28]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.3, .34, layout.y + .2, 10), metal);
      post.position.set(layout.x + x, (layout.y + .2) / 2, -.3); post.castShadow = true; holder.add(post);
    }
    const walk = new THREE.Mesh(new THREE.BoxGeometry(spec.w, .1, .9), metal);
    walk.position.set(layout.x, layout.y - .1, .35); holder.add(walk);
    sign.position.set(layout.x, layout.y + spec.h / 2, 0); sign.rotation.y = -.32; walk.rotation.y = -.32; holder.add(sign);
  } else {
    const tilt = -.16, top = layout.y + spec.h * .92;
    for (const x of [-spec.w * .3, spec.w * .3]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(.16, top, .16), metal);
      post.position.set(layout.x + x * Math.cos(tilt), top / 2, -.12 - x * Math.sin(tilt)); post.castShadow = true; holder.add(post);
    }
    sign.position.set(layout.x, layout.y + spec.h / 2, 0); sign.rotation.y = tilt; holder.add(sign);
  }
  return sign;
}

function trafficCar(color) {
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: .5, roughness: .45 });
  const glass = new THREE.MeshStandardMaterial({ color: '#3b4650', metalness: .4, roughness: .15 });
  const tyre = new THREE.MeshStandardMaterial({ color: '#16181a', roughness: .9 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.82, .66, 4.5, 3, .22), paint); body.position.y = .64; car.add(body);
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.56, .56, 2.2, 3, .2), glass); cabin.position.set(0, 1.12, .2); car.add(cabin);
  const roof = new THREE.Mesh(new RoundedBoxGeometry(1.5, .08, 1.7, 2, .04), paint); roof.position.set(0, 1.42, .2); car.add(roof);
  const wheel = new THREE.CylinderGeometry(.34, .34, .25, 14); wheel.rotateZ(Math.PI / 2);
  for (const x of [-.86, .86]) for (const z of [-1.35, 1.35]) { const w = new THREE.Mesh(wheel, tyre); w.position.set(x, .34, z); car.add(w); }
  car.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return car;
}

export function createHighway(renderer) {
  const world = new THREE.Group();
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const sky = createSky(); world.add(sky);

  // Ground and road surfaces.
  const grassTex = noiseTexture(256, '#8a9763', 46, 7); grassTex.repeat.set(60, 400);
  world.add(strip(900, ROAD_LEN, new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }), 0, -.02));
  const asphaltTex = noiseTexture(256, '#55585b', 34, 11, { streaks: true }); asphaltTex.repeat.set(3, ROAD_LEN / 6);
  const asphalt = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: .92 });
  world.add(strip(SHOULDER * 2, ROAD_LEN, asphalt, 0));
  const oppTex = asphaltTex.clone(); oppTex.needsUpdate = true;
  world.add(strip(17, ROAD_LEN, new THREE.MeshStandardMaterial({ map: oppTex, roughness: .92 }), -19.4));
  const gravelTex = noiseTexture(128, '#7f796d', 40, 5); gravelTex.repeat.set(1, ROAD_LEN / 3);
  const gravel = new THREE.MeshStandardMaterial({ map: gravelTex, roughness: 1 });
  world.add(strip(2.2, ROAD_LEN, gravel, SHOULDER + 1.1, -.005));

  // Markings: yellow left edge, white right edge, dashed lane lines (3 m dash, 9 m gap).
  const paint = new THREE.MeshStandardMaterial({ color: '#f1f0ea', roughness: .6 });
  const yellow = new THREE.MeshStandardMaterial({ color: COLORS.yellow, roughness: .6 });
  world.add(strip(.15, ROAD_LEN, yellow, -EDGE, .01));
  world.add(strip(.15, ROAD_LEN, paint, EDGE, .01));
  world.add(strip(.15, ROAD_LEN, yellow, -11.3, .01));
  const dash = new THREE.PlaneGeometry(.15, 3); dash.rotateX(-Math.PI / 2);
  const dashes = [];
  for (let z = ROAD_START; z > ROAD_END; z -= 12) for (const x of [-LANE / 2, LANE / 2, -15.05, -18.8]) dashes.push(at(x, .012, z));
  world.add(instanced(dash, paint, dashes));

  // Ontario tall-wall concrete median, with lamp standards on top.
  const concrete = new THREE.MeshStandardMaterial({ color: '#a29e94', roughness: .95 });
  const wallShape = new THREE.Shape();
  wallShape.moveTo(-.42, 0); wallShape.lineTo(.42, 0); wallShape.lineTo(.2, .35); wallShape.lineTo(.12, 1.15); wallShape.lineTo(-.12, 1.15); wallShape.lineTo(-.2, .35); wallShape.closePath();
  const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: ROAD_LEN, bevelEnabled: false });
  const wall = new THREE.Mesh(wallGeo, concrete); wall.position.set(-10.15, 0, ROAD_START - ROAD_LEN); wall.castShadow = true; wall.receiveShadow = true; world.add(wall);
  const metal = steel();
  const pole = new THREE.CylinderGeometry(.09, .13, 12, 8); pole.translate(0, 7.15, 0);
  const arm = new THREE.BoxGeometry(3.2, .12, .12); arm.translate(0, 13, 0);
  const lamp = new THREE.BoxGeometry(.7, .18, .35); lamp.translate(0, 12.9, 0);
  const poles = [], arms = [], lamps = [];
  for (let z = ROAD_START - 20; z > ROAD_END; z -= 55) {
    poles.push(at(-10.15, 0, z)); arms.push(at(-10.15, 0, z)); lamps.push(at(-8.7, 0, z)); lamps.push(at(-11.6, 0, z));
  }
  world.add(instanced(pole, metal, poles)); world.add(instanced(arm, metal, arms)); world.add(instanced(lamp, metal, lamps));

  // Right-side steel guardrail.
  const rail = new THREE.Mesh(new THREE.BoxGeometry(.06, .32, ROAD_LEN), metal);
  rail.position.set(SHOULDER + 1.9, .62, ROAD_MID); rail.castShadow = true; world.add(rail);
  const post = new THREE.BoxGeometry(.12, .7, .12); post.translate(0, .35, 0);
  const posts = []; for (let z = ROAD_START; z > ROAD_END; z -= 4) posts.push(at(SHOULDER + 2, 0, z));
  world.add(instanced(post, metal, posts));

  // Tree lines: tiered spruce and clustered maples, set back from the road, each tinted slightly differently.
  const r = rng(42);
  const tier = (radius, height, y) => { const g = new THREE.ConeGeometry(radius, height, 9); g.translate(0, y, 0); return g; };
  const spruceGeo = mergeGeometries([tier(1.9, 3.4, 3.1), tier(1.5, 3, 4.7), tier(1.05, 2.6, 6.2), tier(.55, 1.8, 7.5)]);
  const blob = (radius, x, y, z) => { const g = new THREE.IcosahedronGeometry(radius, 2); g.translate(x, y, z); return g; };
  const mapleGeo = mergeGeometries([blob(2.1, 0, 4.4, 0), blob(1.7, 1.3, 3.8, .5), blob(1.6, -1.2, 3.9, -.4), blob(1.5, .2, 5.6, -.6), blob(1.3, -.4, 3.4, 1.2)]);
  const trunk = new THREE.CylinderGeometry(.16, .26, 2.6, 6); trunk.translate(0, 1.3, 0);
  const spruce = [], maples = [], trunks = [];
  for (let z = ROAD_START; z > ROAD_END - 100; z -= 2.6) {
    for (const side of [1, -1]) {
      if (r() < .3) continue;
      // Leave clearings where the car is parked at the start and the end, so the sky shows behind the text.
      const clearing = side > 0 && ((z > -70 && z < INTRO_DISTANCE + 70) || Math.abs(z + 1480) < 70);
      const nearSign = side > 0 && BEATS.some(beat => beat.sign && SIGN_LAYOUT[beat.sign].x > 0 && Math.abs(z + beat.at) < 28);
      const near = clearing ? 60 : nearSign ? 30 : side > 0 ? 16.5 : 33, x = side * (near + r() * r() * 80), s = .7 + r() * .85, m = at(x, 0, z + r() * 3, s, s * (.85 + r() * .45), s, r() * 6);
      (r() < .5 ? spruce : maples).push(m); trunks.push(m);
    }
  }
  const tint = (mesh, base, spread) => { const c = new THREE.Color(); for (let i = 0; i < mesh.count; i++) { c.set(base).offsetHSL((r() - .5) * .04, (r() - .5) * .12, (r() - .5) * spread); mesh.setColorAt(i, c); } return mesh; };
  world.add(tint(instanced(spruceGeo, new THREE.MeshStandardMaterial({ roughness: 1 }), spruce, { cast: true }), '#3f5a40', .08));
  world.add(tint(instanced(mapleGeo, new THREE.MeshStandardMaterial({ roughness: 1 }), maples, { cast: true }), '#647a43', .1));
  world.add(instanced(trunk, new THREE.MeshStandardMaterial({ color: '#4f4236', roughness: 1 }), trunks));

  // Signs.
  const signs = BEATS.filter(beat => beat.sign).map(beat => ({ beat, mesh: addSign(world, beat, anisotropy) }));

  // Traffic cones in the closed right lane at the construction sign (a nod to cone detection).
  const construction = BEATS.find(beat => beat.id === 'construction');
  const coneGeo = new THREE.ConeGeometry(.2, .72, 14); coneGeo.translate(0, .36, 0);
  const coneMat = new THREE.MeshStandardMaterial({ color: COLORS.orange, roughness: .55 });
  const cones = []; for (let i = 0; i < 16; i++) cones.push(at(EDGE - .4 - Math.min(i, 5) * .55, 0, -construction.at + 70 - i * 8));
  world.add(instanced(coneGeo, coneMat, cones, { cast: true }));

  // Oncoming traffic on the far carriageway, moving on its own clock.
  const palette = ['#c9ccce', '#2f3437', '#7d1f22', '#e8e6e1', '#3d5873', '#5c6066', '#a3a8ad'];
  const traffic = Array.from({ length: 14 }, (_, i) => {
    const car = trafficCar(palette[i % palette.length]);
    car.rotation.y = Math.PI; world.add(car);
    return { car, lane: [-13.2, -16.9, -20.7][i % 3], offset: i * 37 + (i % 3) * 11, speed: 26 + (i % 4) * 3 };
  });

  return {
    world, signs,
    update({ camera, carZ, time }) {
      sky.position.copy(camera.position);
      for (const t of traffic) {
        const span = 520, z = carZ - 320 + ((t.offset + time * t.speed) % span);
        t.car.position.set(t.lane, 0, z);
      }
    },
  };
}
