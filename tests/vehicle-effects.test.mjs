import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {transformWithEsbuild} from 'vite';

const transformed=await transformWithEsbuild(readFileSync('src/TopDownDrive.jsx','utf8'),'TopDownDrive.jsx',{loader:'jsx',jsx:'automatic'});
const code=transformed.code
  .replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replaceAll('"react"',JSON.stringify(import.meta.resolve('react')))
  .replaceAll('"./drive.js"',JSON.stringify(new URL('../src/drive.js',import.meta.url).href))
  .replaceAll('"./exhaust.js"',JSON.stringify(new URL('../src/exhaust.js',import.meta.url).href));
const {CarSprite,ExhaustJet2D}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const render=props=>renderToStaticMarkup(createElement('svg',null,createElement(CarSprite,props)));
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key,value]));

test('slipstream streaks are straight, parallel and entirely behind the car at every speed',()=>{
  assert.doesNotMatch(render({speed:0}),/data-effect="slipstream"/);
  for(const speed of [46,100,180,206]){
    const svg=render({speed});
    const wake=svg.match(/<g class="car-wake"[^>]*>([\s\S]*?)<\/g>/)?.[1];
    assert.ok(wake);assert.doesNotMatch(wake,/<(?:path|ellipse|circle)\b/);
    const gradient=attributes(svg.match(/<linearGradient\b[^>]*id="car-slipstream"[^>]*>/)[0]);
    assert.equal(gradient.gradientUnits,'userSpaceOnUse','zero-width vertical lines must not use an object-bounding-box gradient');
    const lines=[...wake.matchAll(/<line\b[^>]*>/g)].map(match=>attributes(match[0]));
    assert.equal(lines.length,4);
    for(const line of lines){assert.equal(line.x1,line.x2);assert.ok(Number(line.y1)>63);assert.ok(Number(line.y2)>Number(line.y1));}
  }
});

test('manual-rev flames attach to both rear nozzles and vanish at recording boundaries or while inactive',()=>{
  for(const props of [{revving:false,revProgress:.4},{revving:true,revProgress:0},{revving:true,revProgress:1},{revving:true,revProgress:NaN}])assert.doesNotMatch(render(props),/data-effect="rev-exhaust"/);
  const svg=render({revving:true,revProgress:.4,speed:180});
  const nozzles=[...svg.matchAll(/data-exhaust-nozzle="([^"]*)"/g)].map(match=>match[1]);
  const origins=[...svg.matchAll(/data-exhaust-origin="([^"]*)"/g)].map(match=>match[1]);
  assert.equal(nozzles.length,2);assert.deepEqual(origins,nozzles);
  assert.ok(origins.every(origin=>Number(origin.split(',')[1])>60));
  for(const match of svg.matchAll(/<circle\b[^>]*class="jet-spark"[^>]*>/g))assert.ok(Number(attributes(match[0]).cy)>0,'sparks travel away from the rear nozzle');
  assert.notEqual(svg,render({revving:true,revProgress:.6,speed:180}),'particle shapes follow audio position');
});

test('reusable flame instances have isolated gradients and the sprite keeps neutral identity and visible coupe details',()=>{
  const svg=renderToStaticMarkup(createElement('svg',null,createElement(CarSprite,{revving:true,revProgress:.4}),createElement(ExhaustJet2D,{intensity:.6,progress:.4})));
  const ids=[...svg.matchAll(/\bid="([^"]*)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const reference of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(ids.includes(reference[1]));
  assert.match(svg,/Car-XY/);assert.doesNotMatch(svg,/\bAudi\b|\bR8\b/i);
  for(const feature of ['headlights','cockpit','side-blades','engine-bay','exhaust-outlets'])assert.ok(svg.includes(`data-feature="${feature}"`));
  const css=readFileSync('src/topdown.css','utf8');
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)[^\n]*\.map-exhaust-motion\{display:none\}/);
});
