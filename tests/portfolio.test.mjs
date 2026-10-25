import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {projects,skills,availability,currently} from '../src/data.js';
import {prefersStaticVisuals} from '../src/visuals.js';

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
    else{assert.equal(github.length,1);assert.equal(new URL(github[0].href).pathname.split('/').filter(Boolean).length,2);}
  }
  assert.equal(projects.find(p=>p.visual==='kera').outcome,'15.96 g/L MAE on 50 held-out patients');
  assert.ok(projects.find(p=>p.visual==='anchor').links.some(link=>link.href==='https://anchor-productivity.up.railway.app/'));
});

test('Cary’s supplied wording is retained and non-link skills have no arrows',()=>{
  assert.equal(availability,"I'm looking for Summer 2027 internships! (or just a good conversation about building things😉)");
  assert.equal(currently,"Currently working on developing a lightweight CNN that can use sensor fusion to detect cone colour and position for UTFR's DV team.");
  assert.ok(skills.every(skill=>skill.items.every(item=>!item.includes('↗'))));
  const source=readFileSync('src/App.jsx','utf8');
  assert.ok(source.includes('IB Diploma · 41/45')&&source.includes('DECA ICDC qualifier'));
});

test('the first HTML response has readable content and a small preloaded static car',()=>{
  const html=readFileSync('index.html','utf8');
  assert.match(html,/Hey, I’m Cary\./);assert.match(html,/First-year Engineering Science/);
  assert.match(html,/rel="preload" as="image" href="\/images\/car-poster.svg"/);
  for(const file of ['car-poster.svg','garage-poster.svg','garage-poster-mobile.svg']){
    const image=readFileSync('public/images/'+file,'utf8');assert.match(image,/<svg/);
    assert.doesNotMatch(image,/Audi|\bR8\b/i);assert.ok(image.length<25000);
  }
  for(const name of ['anchor','kera','clearpath'])assert.ok(statSync(`public/images/projects/${name}.webp`).size<70000);
});
