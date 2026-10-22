// Local recordings with one current voice per effect and a continuous cruise buffer.
export class DriveAudio {
  constructor() {
    this.muted=false;this.active=false;this.parked=false;this.starting=false;
    this.isRevving=false;this.isHonking=false;this.lastSpeed=0;
    this.generation=0;this.revToken=0;this.startToken=0;this.hornToken=0;this.listeners=new Set();
    this.sample=this.clip('/audio/engine-start.wav');
    this.revSample=this.clip('/audio/engine-rev.wav');
    this.cruise=this.clip('/audio/engine-cruise.wav');this.cruise.loop=true;
    this.hornSample=this.clip('/audio/car-horn.mp3');
  }
  clip(src){const clip=new Audio(src);clip.preload='none';return clip;}
  get clips(){return [this.sample,this.revSample,this.cruise,this.hornSample];}
  state(){return {revving:this.isRevving,honking:this.isHonking,starting:this.starting};}
  subscribe(listener){this.listeners.add(listener);listener(this.state());return ()=>this.listeners.delete(listener);}
  notify(){this.listeners.forEach(listener=>listener(this.state()));}
  getRevProgress(){
    const duration=this.revSample.duration;
    return this.isRevving&&Number.isFinite(duration)&&duration>0?Math.max(0,Math.min(1,(this.revSample.currentTime||0)/duration)):0;
  }
  async prepareCruise(){
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return null;
    this.ctx??=new Context();this.ctx.resume().catch(()=>{});
    if(!this.cruiseGain){this.cruiseGain=this.ctx.createGain();this.cruiseGain.gain.value=0;this.cruiseGain.connect(this.ctx.destination);}
    this.cruiseBufferPromise??=fetch('/audio/engine-cruise.wav')
      .then(response=>{if(!response.ok)throw new Error('Recording unavailable');return response.arrayBuffer();})
      .then(bytes=>this.ctx.decodeAudioData(bytes)).catch(()=>{this.cruiseBufferPromise=null;return null;});
    return this.cruiseBufferPromise;
  }
  async playCruise(){
    const generation=this.generation,buffer=await this.prepareCruise().catch(()=>null);
    if(!this.active||this.starting||generation!==this.generation||document.hidden)return;
    if(!buffer){
      this.syncVolume();if(this.cruise.paused!==false)this.play(this.cruise,this.cruise.volume,false);return;
    }
    if(!this.cruiseSource){
      const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;
      source.connect(this.cruiseGain);this.cruiseSource=source;this.gainTarget=null;source.start();
    }
    this.syncVolume();
  }
  play(clip,volume,restart=true,onError=()=>{}){
    clip.muted=this.muted;clip.volume=volume;
    try{if(restart)clip.currentTime=0;Promise.resolve(clip.play()).catch(onError);}catch{onError();}
  }
  watch(voice,finish,fallback){
    let timer;
    const safety=()=>{
      clearTimeout(timer);
      const seconds=Number.isFinite(voice.duration)&&voice.duration>0?voice.duration:fallback;
      timer=setTimeout(finish,Math.min(15000,seconds*1000+500));
    };
    voice.addEventListener('ended',finish);voice.addEventListener('error',finish);voice.addEventListener('loadedmetadata',safety);safety();
    return ()=>{clearTimeout(timer);voice.removeEventListener('ended',finish);voice.removeEventListener('error',finish);voice.removeEventListener('loadedmetadata',safety);};
  }
  start(){this.stop();this.active=true;this.playIgnition();}
  playIgnition(){
    this.clearStart();this.clearRev();this.starting=true;
    const voice=this.clip('/audio/engine-start.wav');this.sample=voice;const token=this.startToken;
    const finish=()=>{
      if(token!==this.startToken||!this.starting)return;
      this.clearStart();this.syncVolume();this.notify();
      if(this.active&&!this.parked&&!document.hidden)this.playCruise();
    };
    this.startCleanup=this.watch(voice,finish,6);this.syncVolume();this.notify();
    this.prepareCruise().catch(()=>{});this.play(voice,.5,true,finish);
  }
  clearStart(){this.startCleanup?.();this.startCleanup=null;this.sample.pause();this.startToken++;this.starting=false;}
  update(speed){this.lastSpeed=speed;this.syncVolume();}
  syncVolume(){
    const volume=this.active&&!this.starting&&!this.parked&&!this.isRevving ? .22 : 0;
    this.cruise.volume=volume;this.cruise.muted=this.muted;
    const target=this.muted||!this.cruiseSource?0:volume;
    if(this.cruiseGain&&target!==this.gainTarget){this.cruiseGain.gain.setTargetAtTime(target,this.ctx.currentTime,.09);this.gainTarget=target;}
  }
  clearRev(){this.revCleanup?.();this.revCleanup=null;this.revSample.pause();this.revToken++;this.isRevving=false;}
  finishRev(token){if(token!==this.revToken||!this.isRevving)return;this.clearRev();this.syncVolume();this.notify();}
  rev(){
    this.clearStart();this.clearRev();this.isRevving=true;
    const token=this.revToken,voice=this.clip('/audio/engine-rev.wav');this.revSample=voice;
    const finish=()=>this.finishRev(token);this.revCleanup=this.watch(voice,finish,6.15);
    this.syncVolume();this.notify();this.play(voice,.6,true,finish);if(this.active)this.playCruise();
  }
  beginMerge(){this.active=true;this.parked=false;this.playIgnition();}
  clearHorn(){this.hornCleanup?.();this.hornCleanup=null;this.hornSample.pause();this.hornToken++;this.isHonking=false;}
  horn(){
    this.clearHorn();this.isHonking=true;const token=this.hornToken,voice=this.clip('/audio/car-horn.mp3');this.hornSample=voice;
    const finish=()=>{if(token!==this.hornToken||!this.isHonking)return;this.clearHorn();this.notify();};
    this.hornCleanup=this.watch(voice,finish,2);this.notify();this.play(voice,.5,true,finish);
  }
  park(){this.parked=true;this.clearStart();this.clearRev();this.syncVolume();this.notify();}
  garage(){this.stop();}
  stop(){
    this.active=false;this.parked=false;this.generation++;this.clearStart();this.clearRev();this.clearHorn();this.clips.forEach(clip=>clip.pause());
    if(this.cruiseSource){this.cruiseSource.stop();this.cruiseSource.disconnect();this.cruiseSource=null;}
    this.syncVolume();this.notify();
  }
  resume(speed,{parked=false}={}){this.active=true;this.parked=parked;this.update(speed);this.playCruise();}
  toggleMute(){this.muted=!this.muted;this.clips.forEach(clip=>{clip.muted=this.muted;});this.syncVolume();return this.muted;}
}
export const audio=new DriveAudio();
