import { Accessor, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { compactPrimitive, dedup, prune, weld, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import { Color } from 'three';
import { createHash } from 'node:crypto';
import { mkdir, copyFile, stat, readFile } from 'node:fs/promises';

await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
const source = process.argv[2] || 'tmp/audi-original.glb';
const output = process.argv[3] || 'public/models/car-xy.glb';
const document = await io.read(source);
// Delete the actual emblems, wheel-cap logos, and raised model/engine badge.
// They are separate pieces in the source, sharing a dedicated chrome material.
const removedBadges = [];
for (const node of document.getRoot().listNodes()) {
  const branded = /AudiLogo|(?:^|[ _])v10(?:[ _]|$)/i.test(node.getName()) ||
    node.getMesh()?.listPrimitives().some(primitive => /AudiLogo/i.test(primitive.getMaterial()?.getName() || ''));
  if (branded) { removedBadges.push(node.getName()); node.dispose(); }
}
// Replace the source plate lettering/geometry with plain, unbranded rectangles.
// Runtime Car-XY plates are placed against these generic anchor meshes.
const buffer = document.getRoot().listBuffers()[0];
for (const node of document.getRoot().listNodes()) {
  if (!/NumbrePlate/i.test(node.getName())) continue;
  const sourcePrimitives = node.getMesh().listPrimitives();
  const positions = sourcePrimitives[0].getAttribute('POSITION');
  const min = positions.getMin([]), max = positions.getMax([]), front = (min[2] + max[2]) > 0;
  const z = front ? max[2] : min[2], direction = front ? 1 : -1;
  const name = `NumbrePlate_${front ? 'Front' : 'Back'}`;
  const position = document.createAccessor(`${name}_Position`).setBuffer(buffer).setType(Accessor.Type.VEC3)
    .setArray(new Float32Array([min[0],min[1],z, max[0],min[1],z, max[0],max[1],z, min[0],max[1],z]));
  const normal = document.createAccessor(`${name}_Normal`).setBuffer(buffer).setType(Accessor.Type.VEC3)
    .setArray(new Float32Array([0,0,direction, 0,0,direction, 0,0,direction, 0,0,direction]));
  const indices = document.createAccessor(`${name}_Indices`).setBuffer(buffer).setType(Accessor.Type.SCALAR)
    .setArray(new Uint16Array(front ? [0,1,2,0,2,3] : [0,2,1,0,3,2]));
  const primitive = document.createPrimitive().setAttribute('POSITION',position).setAttribute('NORMAL',normal)
    .setIndices(indices).setMaterial(sourcePrimitives[0].getMaterial());
  node.setName(name).setMesh(document.createMesh(name).addPrimitive(primitive));
}
console.log('Deleted emblem and badge meshes:', removedBadges.length);
// Some source meshes repeat the exact same surface for every material slot.
// Keep the first surface to avoid z-fighting and white material overlays.
let duplicates = 0;
for (const mesh of document.getRoot().listMeshes()) {
  const seen = new Set();
  for (const primitive of mesh.listPrimitives()) {
    const hash = createHash('sha256');
    for (const accessor of [primitive.getAttribute('POSITION'), primitive.getAttribute('NORMAL'), primitive.getIndices()]) {
      const array = accessor?.getArray();
      if (array) hash.update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
    }
    const key = hash.digest('hex');
    if (seen.has(key)) { mesh.removePrimitive(primitive); primitive.dispose(); duplicates++; }
    else seen.add(key);
  }
}
console.log('Removed duplicate overlapping surfaces:', duplicates);
// The source supplies named but uncoloured materials. Set each part before
// deduplication so physically different surfaces are never merged together.
for (const material of document.getRoot().listMaterials()) {
  const name = material.getName();
  let color = '#12171e', metalness = 0.35, roughness = 0.45;
  if (/BodyMaterials|RoofCanvas/.test(name)) { color = '#102f58'; metalness = 0.68; roughness = 0.34; }
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
async function simplifyCar(doc) {
  for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
    const indices = primitive.getIndices(), positions = primitive.getAttribute('POSITION'), normals = primitive.getAttribute('NORMAL');
    if (!indices || !positions || !normals || indices.getCount() < 120) continue;
    // The source has many duplicated shading vertices. Appearance-aware seam
    // collapse keeps normals in the error metric rather than locking every seam.
    const [simplified] = MeshoptSimplifier.simplifyWithAttributes(
      new Uint32Array(indices.getArray()), positions.getArray(), 3, normals.getArray(), 3,
      [.25,.25,.25], null, Math.floor(indices.getCount() * .22 / 3) * 3, .002,
      ['Permissive','PreserveFolds'],
    );
    primitive.setIndices(doc.createAccessor().setBuffer(buffer).setType(Accessor.Type.SCALAR).setArray(simplified));
    compactPrimitive(primitive);
  }
}
await document.transform(
  dedup(), weld(), simplifyCar,
  prune(),
  draco({ method: 'edgebreaker', encodeSpeed: 5, decodeSpeed: 5, quantizePosition: 13, quantizeNormal: 10 }),
);
for (const list of ['listNodes','listMeshes','listMaterials','listAccessors','listBuffers','listScenes']) {
  for (const property of document.getRoot()[list]()) property.setName(property.getName().replace(/Audi/ig,'CarXY').replace(/R8/ig,'Coupe'));
}
await io.write(output, document);
await mkdir('public/draco', { recursive: true });
for (const file of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
  await copyFile(`node_modules/three/examples/jsm/libs/draco/gltf/${file}`, `public/draco/${file}`);
}
const binary = await readFile(output);
const json = JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString());
if (/Audi|R8/i.test(JSON.stringify(json))) throw new Error('Unexpected manufacturer/model metadata in distributed car');
console.log('Optimized Car-XY:', ((await stat(output)).size / 1024 / 1024).toFixed(2), 'MB');
