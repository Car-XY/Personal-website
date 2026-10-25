import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithEsbuild } from 'vite';
import { OFF_RAMP, ON_RAMP, rampPath } from '../src/drive.js';

const transformed=await transformWithEsbuild(readFileSync('src/TopDownDrive.jsx','utf8'),'TopDownDrive.jsx',{loader:'jsx',jsx:'automatic'});
const code=transformed.code
  .replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replaceAll('"react"',JSON.stringify(import.meta.resolve('react')))
  .replaceAll('"./drive.js"',JSON.stringify(new URL('../src/drive.js',import.meta.url).href));
const {default:TopDownDrive}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key,value]));
const solid=paint=>/^#[\da-f]{6}$/i.test(paint||'');
const brightness=hex=>[1,3,5].reduce((sum,at)=>sum+parseInt(hex.slice(at,at+2),16),0)/(3*255);

test('both ramp interiors remain dark asphalt when SVG pattern paints are unavailable',()=>{
  for(const [maneuver,name,ramp] of [['cruising','off-ramp',OFF_RAMP],['returning','on-ramp',ON_RAMP]]){
    const svg=renderToStaticMarkup(createElement(TopDownDrive,{speed:180,branchVisible:true,maneuver,maneuverProgress:.5}));
    const group=svg.match(new RegExp(`<g[^>]*data-ramp="${name}"[^>]*>([\\s\\S]*?)<\\/g>`))?.[1];
    assert.ok(group,`${name} is rendered`);
    const strokes=[...group.matchAll(/<path\b[^>]*>/g)].map(match=>attributes(match[0]));
    assert.ok(strokes.every(path=>path.d===rampPath(ramp)),'all road layers follow the same straight centerline');
    // Simulate a browser dropping every URL paint. Composite the remaining solid
    // strokes at distances across the lane; the white edge must stay at its edge.
    for(const distance of [0,15,30,39]){
      const painted=strokes.filter(path=>solid(path.stroke)&&Number(path['stroke-width'])/2>=distance).at(-1);
      assert.ok(painted&&brightness(painted.stroke)<.45,`${name} stays dark ${distance}px from its center`);
    }
    const edge=strokes.filter(path=>solid(path.stroke)&&Number(path['stroke-width'])/2>=41).at(-1);
    assert.ok(edge&&brightness(edge.stroke)>.8,'a narrow light border is retained');
    const roadRects=[...svg.matchAll(/<rect\b[^>]*>/g)].map(match=>attributes(match[0])).filter(rect=>rect.x==='350'&&rect.width==='300');
    assert.ok(roadRects.some(rect=>solid(rect.fill)&&brightness(rect.fill)<.45),'main highway also has a dark surface without its texture');
  }
});
