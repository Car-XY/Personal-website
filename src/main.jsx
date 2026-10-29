import React, {lazy, Suspense, useState} from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './topdown.css';
import './garage.css';
import './portfolio.css';

const PosterCar=lazy(()=>import('./Scene.jsx'));
const PosterGarage=lazy(()=>import('./GarageRoom.jsx'));
function SceneCapture({kind}) {
  const [image,setImage]=useState(''),[layout,setLayout]=useState(null),[exhaust,setExhaust]=useState(null);
  const capture={onSnapshot:setImage,onReady:()=>{},onError:()=>{},onLayout:setLayout,onExhaustLayout:setExhaust};
  return <div className="scene-capture" data-poster-ready={!!image} data-layout={JSON.stringify(layout)} data-exhaust={JSON.stringify(exhaust)}>
    <style>{`.scene-capture{position:fixed;inset:0;overflow:hidden;background:linear-gradient(#14263b,#101e31)}.scene-capture>.car-scene,.scene-capture>.garage-three-room{position:absolute;inset:0;width:100%;height:100%;opacity:1!important}.scene-capture a{position:absolute;z-index:10;left:12px;top:12px;padding:12px;background:#102031;color:white;font:14px monospace}body{overflow:hidden}`}</style>
    <Suspense fallback={null}>{kind==='garage'?<PosterGarage {...capture}/>:<PosterCar {...capture}/>}</Suspense>
    {image&&<a href={image} download={`${kind}-poster.png`}>Save PNG</a>}
  </div>;
}
const captureKind=new URLSearchParams(window.location.search).get('scene-poster');
createRoot(document.getElementById('root')).render(captureKind?<SceneCapture kind={captureKind}/>:<App />);
