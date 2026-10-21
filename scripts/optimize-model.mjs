import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import { mkdir, copyFile, stat } from 'node:fs/promises';

await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
const document = await io.read('tmp/audi-original.glb');
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
