import { useEffect, useRef, useState } from 'react';

export function prefersStaticVisuals({ reducedMotion=false, saveData=false, search='' }={}) {
  return reducedMotion || saveData || new URLSearchParams(search).get('view') === 'static';
}

// Static artwork is the initial render. Enhancement is optional and bounded.
export function useSceneEnhancement() {
  const [requested,setRequested]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  const [staticOnly,setStaticOnly]=useState(()=>prefersStaticVisuals({
    reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData:!!navigator.connection?.saveData,search:window.location.search,
  }));
  const timeout=useRef(null);
  useEffect(()=>{
    if(staticOnly||failed)return;
    const enhance=()=>setRequested(true);
    const idle=window.requestIdleCallback?.(enhance,{timeout:1500});
    const timer=idle===undefined?setTimeout(enhance,350):null;
    return()=>{if(idle!==undefined)window.cancelIdleCallback?.(idle);clearTimeout(timer);};
  },[staticOnly,failed]);
  useEffect(()=>{
    if(!requested||ready||failed||staticOnly)return;
    timeout.current=setTimeout(()=>{setFailed(true);setRequested(false);},10000);
    return()=>clearTimeout(timeout.current);
  },[requested,ready,failed,staticOnly]);
  const onReady=()=>{clearTimeout(timeout.current);setReady(true);};
  const onError=()=>{clearTimeout(timeout.current);setReady(false);setFailed(true);setRequested(false);};
  const toggle=()=>{
    setReady(false);setFailed(false);
    if(staticOnly||failed){setStaticOnly(false);setRequested(true);}
    else{setStaticOnly(true);setRequested(false);}
  };
  return {mount:requested&&!staticOnly&&!failed,ready:ready&&!staticOnly&&!failed,staticOnly,failed,onReady,onError,toggle};
}
