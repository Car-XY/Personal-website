import * as THREE from 'three';

// Car-XY's lamps. The model has one light bar across the nose and one across the tail, plus a
// repeater strip on each mirror. Each bar is split like a real car's: the inner part is the
// headlamp (front) or tail/brake lamp (rear), and the outer ends are the amber indicators.
// Model space: the nose points along +z and the car's LEFT side is +x (the driver sits at +x).

const WHITE = new THREE.Color('#fff4dc'), RED = new THREE.Color('#ff1608'), AMBER = new THREE.Color('#ff7a00');
const INDICATOR_SPLIT = .66; // |x| beyond which a bar is indicator
const BLINK_PERIOD = .74, BLINK_ON = .4; // ≈ 81 flashes a minute

const glowTexture = (() => {
  let texture;
  return () => {
    if (texture) return texture;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d'), g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,255,255,.75)');
    g.addColorStop(.45, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
})();

// A lamp lens whose emission depends on which side and section of the bar a fragment is in.
function lampMaterial(name, lens, split) {
  const uniforms = {
    uInner: { value: new THREE.Color(0, 0, 0) }, uOuterIdle: { value: new THREE.Color(0, 0, 0) },
    uAmber: { value: AMBER.clone() }, uLeft: { value: 0 }, uRight: { value: 0 }, uSplit: { value: split },
  };
  const material = new THREE.MeshStandardMaterial({ name, color: lens, roughness: .2, metalness: .1, emissive: '#000000' });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'varying vec3 vLampPos;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLampPos = position;');
    shader.fragmentShader = 'varying vec3 vLampPos;\nuniform vec3 uInner, uOuterIdle, uAmber;\nuniform float uLeft, uRight, uSplit;\n' +
      shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float lampOuter = smoothstep(uSplit - .025, uSplit + .025, abs(vLampPos.x));
        float lampBlink = vLampPos.x > 0.0 ? uLeft : uRight;
        totalEmissiveRadiance = mix(uInner, mix(uOuterIdle, uAmber, lampBlink), lampOuter);`);
  };
  material.customProgramCacheKey = () => 'car-xy-lamp';
  return { material, uniforms };
}

function setMaterial(mesh, material) {
  const old = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  mesh.material = Array.isArray(mesh.material) ? old.map(() => material) : material;
  return old;
}

export function createCarLights(car) {
  const front = lampMaterial('CarXY_FrontLamps', '#d9dde0', INDICATOR_SPLIT);
  const rear = lampMaterial('CarXY_RearLamps', '#3a0806', INDICATOR_SPLIT);
  const mirror = lampMaterial('CarXY_MirrorRepeaters', '#3b2a12', 0);
  const replaced = new Set(), covers = [];
  car.traverse(mesh => {
    if (!mesh.isMesh) return;
    let old = [];
    if (/LightFrontHighlight|FarLightBall/i.test(mesh.name)) old = setMaterial(mesh, front.material);
    else if (/LightBackHighlight/i.test(mesh.name)) old = setMaterial(mesh, rear.material);
    else if (/MirrorsLightGlass/i.test(mesh.name)) old = setMaterial(mesh, mirror.material);
    else if (/GlassFrontHighlight|GlassBackHighlight/i.test(mesh.name)) {
      // Clear lens covers so the lamps behind them read, instead of the dark windscreen tint.
      const lens = new THREE.MeshStandardMaterial({ name: 'CarXY_LampCover', color: '#e8eef2', transparent: true, opacity: .14, roughness: .05, metalness: .2, depthWrite: false });
      old = setMaterial(mesh, lens); covers.push(lens);
    }
    old.forEach(material => replaced.add(material));
    if (old.length) mesh.castShadow = false;
  });
  // Dispose only the originals no other part of the car still uses.
  car.traverse(mesh => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => replaced.delete(material)));
  replaced.forEach(material => material.dispose());

  // Additive glows so the lamps read in daylight. [position, outward normal, colour, size, role, side]
  const L = 1, R = -1;
  const spots = [
    ...[L, R].map(s => [[s * .55, .575, 2.08], [0, 0, 1], WHITE, .62, 'head', s]),
    ...[L, R].map(s => [[s * .79, .585, 1.78], [s * .6, 0, .8], AMBER, .46, 'blink', s]),
    ...[L, R].map(s => [[s * .52, .71, -2.14], [0, 0, -1], RED, .5, 'tail', s]),
    ...[L, R].map(s => [[s * .83, .72, -1.86], [s * .6, 0, -.8], AMBER, .46, 'blink', s]),
    ...[L, R].map(s => [[s * 1.07, .862, .55], [s * .8, 0, -.4], AMBER, .26, 'blink', s]),
  ];
  const glowGroup = new THREE.Group(); glowGroup.name = 'CarXY_LampGlows'; car.add(glowGroup);
  const glows = spots.map(([position, normal, color, size, role, side]) => {
    const material = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const sprite = new THREE.Sprite(material); sprite.scale.setScalar(size); sprite.renderOrder = 10;
    glowGroup.add(sprite);
    const out = new THREE.Vector3(...normal).normalize();
    return { sprite, material, base: new THREE.Vector3(...position).addScaledVector(out, .03), normal: out, size, role, side };
  });

  let blinkSince = 0, lastSignal = 0, brake = 0, left = 0, right = 0;
  const worldNormal = new THREE.Vector3(), worldPos = new THREE.Vector3(), toCamera = new THREE.Vector3();
  const toLocal = new THREE.Matrix4();
  const lerpTo = (value, target, rate, dt) => value + (target - value) * (1 - Math.exp(-rate * dt));

  return {
    lamps: { front, rear, mirror }, glows,
    /**
     * @param {object} s
     * @param {number} s.time      seconds of scene time
     * @param {number} s.dt        frame time in seconds
     * @param {THREE.Camera} s.camera
     * @param {number} s.signal    −1 left, 0 off, 1 right
     * @param {boolean} s.braking
     */
    update({ time, dt, camera, signal, braking }) {
      if (signal !== lastSignal) { lastSignal = signal; blinkSince = time; }
      const blinkOn = signal !== 0 && (time - blinkSince) % BLINK_PERIOD < BLINK_ON;
      // Bulbs aren't instant: a short rise and fall keeps the blinking from looking digital.
      left = lerpTo(left, blinkOn && signal < 0 ? 1 : 0, 38, dt);
      right = lerpTo(right, blinkOn && signal > 0 ? 1 : 0, 38, dt);
      brake = lerpTo(brake, braking ? 1 : 0, 22, dt);

      const tail = .6 + brake * 1.5;
      front.uniforms.uInner.value.copy(WHITE).multiplyScalar(2.4);
      front.uniforms.uOuterIdle.value.copy(WHITE).multiplyScalar(.8);
      rear.uniforms.uInner.value.copy(RED).multiplyScalar(tail);
      rear.uniforms.uOuterIdle.value.copy(RED).multiplyScalar(tail * .7);
      for (const lamp of [front, rear, mirror]) {
        lamp.uniforms.uAmber.value.copy(AMBER).multiplyScalar(2.6);
        lamp.uniforms.uLeft.value = left; lamp.uniforms.uRight.value = right;
      }

      if (!camera) return;
      car.updateMatrixWorld(); toLocal.copy(car.matrixWorld).invert();
      for (const glow of glows) {
        const level = glow.role === 'head' ? .14 : glow.role === 'tail' ? .2 + brake * .6 : (glow.side > 0 ? left : right) * .9;
        // Lamps only glow toward the side they face, which also hides them behind the body.
        worldNormal.copy(glow.normal).transformDirection(car.matrixWorld);
        worldPos.copy(glow.base).applyMatrix4(car.matrixWorld);
        const facing = THREE.MathUtils.smoothstep(worldNormal.dot(toCamera.subVectors(camera.position, worldPos).normalize()), .05, .45);
        // Pull the glow 15 cm toward the camera: the lamp's own housing can't clip it, but the rest of
        // the car still hides it when the lamp is on the far side.
        glow.sprite.position.copy(worldPos.addScaledVector(toCamera, .15).applyMatrix4(toLocal));
        glow.material.opacity = level * facing;
        glow.sprite.visible = glow.material.opacity > .01;
      }
    },
  };
}
