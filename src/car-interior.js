import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createCarInterior() {
  const cabin=new THREE.Group();cabin.name='Cabin_Interior';
  const material=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const leather=material('#272e35'),padding=material('#59616a'),carpet=material('#171e25',1);
  const dashboard=material('#303943'),silver=material('#a6b1ba',.35,.65),black=material('#0a1017');
  const screen=new THREE.MeshStandardMaterial({color:'#5e9fc7',emissive:'#3e7aa8',emissiveIntensity:.3,roughness:.4,side:THREE.DoubleSide});
  const shapes=new Map();
  function rounded(name,size,position,mat=leather,parent=cabin,radius=.035) {
    const key=[...size,radius].join(',');
    if(!shapes.has(key))shapes.set(key,new RoundedBoxGeometry(...size,1,Math.min(radius,...size.map(v=>v/2))));
    const mesh=new THREE.Mesh(shapes.get(key),mat);mesh.name=name;mesh.position.set(...position);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function disk(name,radius,position,mat,parent=cabin) {
    const mesh=new THREE.Mesh(new THREE.CircleGeometry(radius,24),mat);
    mesh.name=name;mesh.position.set(...position);mesh.rotation.y=Math.PI;parent.add(mesh);return mesh;
  }

  rounded('Cabin_Floor',[1.42,.035,1.5],[0,.315,-.02],carpet);
  rounded('Rear_Cabin_Bulkhead',[1.1,.42,.1],[0,.67,-.72]);
  for(const side of [-1,1]){
    rounded('Footwell_Mat',[.47,.018,.62],[side*.34,.343,.43],carpet);
    rounded('Interior_Door_Card',[.045,.33,1.04],[side*.795,.58,.03],dashboard);
    rounded('Door_Armrest',[.085,.045,.39],[side*.751,.65,.03]);
    rounded('Door_Handle',[.022,.024,.12],[side*.728,.72,.21],silver);
  }

  for(const [index,x] of [.35,-.35].entries()){
    const seat=new THREE.Group();seat.name=index===0?'Driver_Seat':'Passenger_Seat';seat.position.x=x;cabin.add(seat);
    rounded('Seat_Cushion',[.43,.10,.49],[0,.46,-.21],leather,seat,.06);
    rounded('Seat_Cushion_Insert',[.30,.035,.36],[0,.519,-.21],padding,seat);
    for(const side of [-1,1]){
      const bolster=rounded('Seat_Base_Bolster',[.065,.13,.46],[side*.193,.505,-.20],leather,seat);
      bolster.rotation.z=-side*.14;
    }
    const back=new THREE.Group();back.name=`Seat_${index+1}_Back`;back.position.set(0,.53,-.47);back.rotation.x=-.17;seat.add(back);
    rounded('Seat_Back_Shell',[.44,.44,.09],[0,.22,0],leather,back,.06);
    rounded('Seat_Back_Insert',[.29,.34,.03],[0,.225,.057],padding,back);
    for(const side of [-1,1]){
      const bolster=rounded('Seat_Back_Bolster',[.075,.38,.10],[side*.175,.23,.047],leather,back);
      bolster.rotation.z=side*.1;
      rounded('Headrest_Post',[.018,.1,.018],[side*.07,.44,0],silver,back);
      rounded('Seat_Belt_Slot',[.075,.027,.012],[side*.075,.395,.064],black,back,.012);
    }
    rounded('Seat_Headrest',[.235,.145,.105],[0,.515,.005],leather,back,.05);
    rounded('Headrest_Insert',[.17,.09,.012],[0,.52,.064],padding,back);
    for(const y of [.12,.20,.28])rounded('Seat_Stitch',[.25,.004,.004],[0,y,.075],silver,back,.001);
  }

  rounded('Dashboard',[1.23,.16,.34],[0,.70,.89],dashboard,cabin,.065);
  rounded('Dashboard_Lower_Fascia',[1.12,.075,.12],[0,.645,.735]);
  rounded('Instrument_Cowl',[.39,.12,.20],[.35,.795,.70],leather,cabin,.05);
  rounded('Instrument_Panel',[.33,.095,.014],[.35,.785,.595],black);
  const dialMaterial=new THREE.MeshBasicMaterial({color:'#111c28',side:THREE.DoubleSide});
  for(const x of [.27,.43]){
    disk('Instrument_Dial',.035,[x,.785,.584],dialMaterial);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.035,.003,6,28),silver);
    rim.position.set(x,.785,.582);cabin.add(rim);
    const needle=rounded('Gauge_Needle',[.004,.026,.003],[x+.008,.79,.578],screen);needle.rotation.z=-.7;
  }
  rounded('Infotainment_Screen',[.20,.115,.015],[0,.749,.702],screen);
  for(const x of [-.47,-.19,.09]){
    disk('Air_Vent',.034,[x,.737,.707],black);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.035,.006,6,24),silver);
    ring.position.set(x,.737,.706);cabin.add(ring);
    for(const y of [-.012,.012])rounded('Vent_Slat',[.050,.004,.005],[x,.737+y,.700],silver);
  }

  rounded('Centre_Tunnel',[.21,.14,.90],[0,.405,-.04]);
  rounded('Console_Trim',[.19,.025,.66],[0,.49,-.02],silver);
  rounded('Console_Inset',[.155,.013,.59],[0,.509,-.02],black);
  rounded('Centre_Armrest',[.20,.075,.27],[0,.535,-.28],leather);
  const selector=rounded('Gear_Selector_Stem',[.027,.09,.03],[0,.56,.19],silver);selector.rotation.x=.15;
  rounded('Gear_Selector',[.06,.035,.075],[0,.613,.18]);
  rounded('Console_Controls',[.11,.014,.07],[0,.526,.04],dashboard);
  for(const x of [.29,.42]){
    const pedal=rounded('Driver_Pedal',[.075,.11,.018],[x,.40,.91],silver);pedal.rotation.x=-.45;
  }

  // Positive X is the driver's left when the model faces forward along +Z.
  const wheel=new THREE.Group();wheel.name='Interior_SteeringWheel';wheel.position.set(.35,.765,.425);wheel.rotation.x=-.22;cabin.add(wheel);
  const rimPoints=Array.from({length:48},(_,i)=>{
    const angle=i/48*Math.PI*2;
    return new THREE.Vector3(Math.cos(angle)*.13,Math.max(-.104,Math.sin(angle)*.13),0);
  });
  const rim=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints,true),64,.016,8,true),leather);
  rim.name='Steering_Rim';wheel.add(rim);
  for(const side of [-1,1]){
    const spoke=rounded('Steering_Spoke',[.095,.020,.025],[side*.067,-.012,0],silver,wheel);spoke.rotation.z=side*.17;
  }
  rounded('Steering_Lower_Spoke',[.028,.075,.023],[0,-.06,0],silver,wheel);
  rounded('Steering_Hub',[.09,.06,.04],[0,0,-.01],dashboard,wheel);
  const column=new THREE.Mesh(new THREE.CylinderGeometry(.023,.028,.19,12),black);
  column.position.set(0,-.01,.095);column.rotation.x=Math.PI/2;wheel.add(column);
  return cabin;
}
