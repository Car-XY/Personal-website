import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const binary=readFileSync('public/models/car-xy.glb');
const model=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString());

test('the shipped coupe physically omits logo and badge pieces and manufacturer metadata',()=>{
  assert.doesNotMatch(JSON.stringify(model),/Audi|R8/i);
  assert.ok(model.nodes.length>40,'retain the detailed vehicle parts');
  assert.ok(model.nodes.every(node=>!/Logo|v10_Text/i.test(node.name||'')));
  assert.ok(model.materials.every(material=>!/Logo/i.test(material.name||'')));
  assert.equal(model.images?.length||0,0,'there are no embedded logo-bearing textures');
  const plateNodes=model.nodes.filter(node=>/^NumbrePlate_(Front|Back)$/.test(node.name||''));
  assert.equal(plateNodes.length,2);
  for(const node of plateNodes){
    const primitive=model.meshes[node.mesh].primitives[0];
    assert.equal(model.accessors[primitive.attributes.POSITION].count,4,'original plate text is replaced with a plain rectangle');
    assert.equal(model.accessors[primitive.indices].count,6);
  }
});

test('the detailed vehicle stays within its transfer and geometry budgets',()=>{
  const primitives=model.meshes.flatMap(mesh=>mesh.primitives);
  const triangles=primitives.reduce((sum,primitive)=>sum+model.accessors[primitive.indices].count/3,0);
  const vertices=primitives.reduce((sum,primitive)=>sum+model.accessors[primitive.attributes.POSITION].count,0);
  assert.ok(binary.length<1_200_000);
  assert.ok(triangles<300_000);
  assert.ok(vertices<450_000);
  assert.ok(primitives.every(primitive=>primitive.attributes.NORMAL!==undefined));
  assert.ok(model.extensionsUsed.includes('KHR_draco_mesh_compression'));
});
