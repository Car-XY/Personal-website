import { useEffect, useRef, useState } from 'react';

export function prefersStaticVisuals({ reducedMotion=false, saveData=false, search='' }={}) {
  return reducedMotion || saveData || new URLSearchParams(search).get('view') === 'static';
}

// Start 3D immediately; show the poster only by preference or after a failure.
export function useSceneEnhancement() {
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  const [staticOnly,setStaticOnly]=useState(()=>prefersStaticVisuals({
    reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData:!!navigator.connection?.saveData,search:window.location.search,
  }));
  const timeout=useRef(null);
  useEffect(()=>{
    if(ready||failed||staticOnly)return;
    timeout.current=setTimeout(()=>setFailed(true),10000);
    return()=>clearTimeout(timeout.current);
  },[ready,failed,staticOnly]);
  const onReady=()=>{clearTimeout(timeout.current);setReady(true);};
  const onError=()=>{clearTimeout(timeout.current);setReady(false);setFailed(true);};
  const toggle=()=>{
    setReady(false);setFailed(false);
    setStaticOnly(!(staticOnly||failed));
  };
  const showStatic=staticOnly||failed;
  return {mount:!showStatic,ready:ready&&!showStatic,loading:!showStatic&&!ready,showStatic,staticOnly,failed,onReady,onError,toggle};
}
