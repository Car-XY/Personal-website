import React, {useState} from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './topdown.css';
import './garage.css';
import './portfolio.css';
import Scene from './Scene.jsx';
import GarageRoom from './GarageRoom.jsx';

function PosterCapture({kind}) {
  const [frame,setFrame]=useState(null);
  return <div className="poster-capture scene-ready" style={{position:'fixed',inset:0,background:'#152237'}}><style>{`.poster-capture>.car-scene,.poster-capture>.garage-three-room{position:absolute;inset:0;width:100%;height:100%;opacity:1}`}</style>{kind==='hero'?<Scene onSnapshot={setFrame}/>:<GarageRoom onSnapshot={setFrame}/>} {frame&&<a id="save-poster" href={frame} download="scene.png" style={{position:'absolute',top:10,right:10,zIndex:20,padding:12,background:'#182a40'}}>Save PNG</a>}</div>;
}
const capture=new URLSearchParams(location.search).get('poster-capture');
createRoot(document.getElementById('root')).render(capture?<PosterCapture kind={capture}/>:<App />);
