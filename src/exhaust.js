const smooth = value => {
  const t=Math.max(0,Math.min(1,value));
  return t*t*(3-2*t);
};

// Progress comes from the recording, so an interrupted or completed rev cannot
// leave a flame running on an unrelated animation timer.
export function exhaustIntensityAt(progress) {
  if(!Number.isFinite(progress)||progress<=0||progress>=1)return 0;
  const envelope=smooth(progress/.065)*(1-smooth((progress-.86)/.14));
  const pulse=Math.max(0,Math.sin(progress*Math.PI*22+Math.sin(progress*31)*.45));
  return envelope*(.36+.64*pulse*pulse*pulse);
}

export function exhaustParticleAt(index,time,intensity) {
  const seed=Math.sin((index+1)*127.1)*43758.5453;
  const noise=seed-Math.floor(seed);
  const life=(Math.max(0,time)*(1.7+noise*.8)+index*.61803398875)%1;
  const strength=Math.max(0,Math.min(1,intensity));
  const spread=life*life;
  return {
    x:Math.sin(index*9.31)*(.012+.13*spread)*strength,
    y:Math.cos(index*5.71)*.045*spread+.085*spread,
    z:-(.035+life*(.55+1.3*strength)),
    size:(.018+.035*noise)*(1-life),
    opacity:(1-life)*(1-life)*strength,
  };
}
