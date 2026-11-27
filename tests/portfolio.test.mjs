import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {projects,skills,availability,currently,journey,portrait} from '../src/data.js';
import {prefersStaticVisuals,useSceneEnhancement} from '../src/visuals.js';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('the initial scene mounts 3D immediately and reserves posters for explicit static preferences',()=>{
  const originals=Object.fromEntries(['window','navigator'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  function Probe(){
    const scene=useSceneEnhancement();
    return createElement('output',null,JSON.stringify({mount:scene.mount,loading:scene.loading,showStatic:scene.showStatic,ready:scene.ready}));
  }
  try{
    for(const preference of [{},{search:'?view=static'},{reducedMotion:true},{saveData:true}]){
      Object.defineProperty(globalThis,'window',{configurable:true,value:{matchMedia:()=>({matches:!!preference.reducedMotion}),location:{search:preference.search||''}}});
      Object.defineProperty(globalThis,'navigator',{configurable:true,value:{connection:{saveData:!!preference.saveData}}});
      const staticOnly=prefersStaticVisuals(preference);
      const expected={mount:!staticOnly,loading:!staticOnly,showStatic:staticOnly,ready:false};
      assert.equal(renderToStaticMarkup(createElement(Probe)),renderToStaticMarkup(createElement('output',null,JSON.stringify(expected))));
    }
  }finally{
    for(const [key,descriptor] of Object.entries(originals))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
  }
});

test('motion/data preferences and the shareable static view skip automatic 3D',()=>{
  assert.equal(prefersStaticVisuals(),false);
  for(const options of [{reducedMotion:true},{saveData:true},{search:'?view=static'},{search:'?x=1&view=static'}])assert.equal(prefersStaticVisuals(options),true);
  assert.equal(prefersStaticVisuals({search:'?view=interactive'}),false);
});

test('each project exposes contributions, an outcome, a status and useful public links',()=>{
  for(const project of projects){
    assert.ok(project.contributions.length>=2&&project.contributions.length<=3);
    assert.ok(project.outcome&&project.status&&project.note);
    assert.ok(project.links.length>=1);
    assert.ok(project.links.every(link=>new URL(link.href).protocol==='https:'));
    const github=project.links.filter(link=>link.href.startsWith('https://github.com/'));
    if(project.privateSource)assert.equal(github.length,0);
    else{assert.equal(github.length,1);assert.match(new URL(github[0].href).pathname,/^\/[^/]+\/[^/]+(\/tree\/main)?\/?$/);}
  }
  assert.equal(projects.find(p=>p.visual==='kera').outcome,'About 16 g/L mean absolute error on study data');
  // Only the Anchor 2 deployment; the original CS50 demo link expired.
  const anchorLinks=projects.find(p=>p.visual==='anchor').links.filter(link=>link.href.includes('railway.app'));
  assert.deepEqual(anchorLinks.map(link=>link.href),['https://anchor-v2-production.up.railway.app/']);
});

test('Cary’s supplied wording is retained and non-link skills have no arrows',()=>{
  assert.equal(availability,"I'm looking for Summer 2027 internships! (or just a good conversation about building things😉)");
  assert.equal(currently,"Currently developing a lightweight CNN that uses LiDAR intensity values to identify cone colour and position.");
  assert.ok(skills.every(skill=>skill.items.every(item=>!item.includes('↗'))));
  assert.ok(journey.some(stop=>stop.subtitle.includes('IB Diploma · 41/45')&&stop.text.includes('DECA ICDC qualifier')));
});

test('the first HTML response stays readable without downloading a poster before 3D',()=>{
  const html=readFileSync('index.html','utf8');
  assert.match(html,/Hey, I’m Cary\./);assert.match(html,/First-year Engineering Science/);
  assert.doesNotMatch(html,/rel="preload" as="image"/);
  assert.doesNotMatch(html.replace(/<noscript>[\s\S]*?<\/noscript>/g,''),/<img/);
  assert.match(html,/href="\/portfolio\/"/);
  for(const [file,width,height,budget] of [['car-poster.png',1200,720,250000]]){
    const image=readFileSync('public/images/'+file);
    assert.deepEqual([...image.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    assert.equal(image.readUInt32BE(16),width);assert.equal(image.readUInt32BE(20),height);
    assert.ok(image.length<budget);
  }
  for(const name of ['anchor','kera','clearpath'])assert.ok(statSync(`public/images/projects/${name}.webp`).size<70000);
});

test('the portrait only appears on the portfolio page, behind a placeholder until it is uploaded',()=>{
  assert.equal(portrait.src,'/images/cary.jpg');
  for(const file of ['index.html','src/main.jsx','src/DriveStory.jsx','src/DriveScene.jsx','src/drive.css'])assert.doesNotMatch(readFileSync(file,'utf8'),/cary\.(jpg|webp)|portrait\.(src|ready)|<Portrait/);
  const page=readFileSync('src/Portfolio.jsx','utf8');
  assert.match(page,/portrait\.ready/);assert.match(page,/Photo coming soon/);
  assert.match(readFileSync('portfolio/index.html','utf8'),/src="\/src\/portfolio-main\.jsx"/);
});
