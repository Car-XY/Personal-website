import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import { Color } from 'three';
import { mkdir, copyFile, stat } from 'node:fs/promises';

await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
const document = await io.read('tmp/audi-original.glb');
// The source supplies named but uncoloured materials. Set each part before
// deduplication so physically different surfaces are never merged together.
for (const material of document.getRoot().listMaterials()) {
  const name = material.getName();
  let color = '#12171e', metalness = 0.35, roughness = 0.45;
  if (/BodyMaterials|RoofCanvas/.test(name)) { color = '#102f58'; metalness = 0.8; roughness = 0.23; }
  else if (/Tyre|undercarriage/.test(name)) { color = '#101216'; metalness = 0; roughness = 0.88; }
  else if (/WheelsChrome/.test(name)) { color = '#4b5664'; metalness = 0.92; roughness = 0.24; }
  else if (/BrakeDisc|Axe/.test(name)) { color = '#727b86'; metalness = 0.88; roughness = 0.4; }
  else if (name === 'Brake') { color = '#aa2028'; metalness = 0.5; roughness = 0.35; }
  else if (/Chrome|Ring\(Light\)/.test(name)) { color = '#b8c4cf'; metalness = 1; roughness = 0.15; }
  else if (/Mirrors$/.test(name)) { color = '#9ca7b0'; metalness = 0.95; roughness = 0.2; }
  else if (/CarbonFibre/.test(name)) { color = '#232b32'; metalness = 0.65; roughness = 0.35; }
  else if (/Glass|Windscreen/.test(name)) { color = '#142735'; metalness = 0.65; roughness = 0.12; }
  else if (/NumbrePlate|NumberPlateLight/.test(name)) { color = '#e0e5ea'; metalness = 0.15; roughness = 0.5; }
  else if (/LightFrontHighlight|FarLight/.test(name)) { color = '#d9eeff'; metalness = 0.2; roughness = 0.15; material.setEmissiveFactor(new Color('#a7d3ff').toArray()); }
  else if (/LightBackHighlight/.test(name)) { color = '#b81822'; metalness = 0.2; roughness = 0.2; material.setEmissiveFactor(new Color('#7d060b').toArray()); }
  material.setBaseColorFactor([...new Color(color).toArray(), 1]);
  material.setMetallicFactor(metalness).setRoughnessFactor(roughness);
}
await document.transform(
  dedup(), weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.45, error: 0.0003, lockBorder: true }),
  prune(),
  draco({ method: 'edgebreaker', encodeSpeed: 5, decodeSpeed: 5, quantizePosition: 14, quantizeNormal: 10 }),
);
await io.write('public/models/audi-r8.glb', document);
await mkdir('public/draco', { recursive: true });
for (const file of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
  await copyFile(`node_modules/three/examples/jsm/libs/draco/gltf/${file}`, `public/draco/${file}`);
}
await mkdir('public/images', { recursive: true });
await copyFile('tmp/r8-reference.png', 'public/images/r8-reference.png');
console.log('Optimized R8:', ((await stat('public/models/audi-r8.glb')).size / 1024 / 1024).toFixed(2), 'MB');
