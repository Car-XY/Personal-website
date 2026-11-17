// The scroll drive, described as data plus pure functions of scroll progress (0 → 1).
// Distances are metres along the 401 (the car drives toward −z).

export const SCROLL_LENGTH_VH = 1000;

export const BEATS = [
  { id:'hero',         start:0,    end:.085, narration:{ lead:'Hey, I’m', word:'Cary.' } },
  { id:'onramp',       start:.16,  end:.24,  sign:'onramp',       at:150,  narration:{ lead:'Let’s take the', word:'401.' } },
  { id:'gantry',       start:.24,  end:.33,  sign:'gantry',       at:300,  narration:{ lead:'Right now I’m', word:'studying.' } },
  { id:'distance',     start:.33,  end:.41,  sign:'distance',     at:450,  narration:{ lead:'Mostly, I', word:'build.' } },
  { id:'utfr',         start:.41,  end:.50,  sign:'utfr',         at:610,  narration:{ lead:'I teach race cars to', word:'see.' }, lane:3.75 },
  { id:'bluesky',      start:.50,  end:.58,  sign:'bluesky',      at:760,  narration:{ lead:'and solar cars to', word:'save energy.' }, lane:3.75 },
  { id:'projects',     start:.58,  end:.67,  sign:'projects',     at:910,  narration:{ lead:'Some things I’ve', word:'shipped.' } },
  { id:'podcast',      start:.67,  end:.74,  sign:'podcast',      at:1060, narration:{ lead:'I also like to', word:'ask why.' } },
  { id:'construction', start:.74,  end:.82,  sign:'construction', at:1210, narration:{ lead:'Still', word:'building.' } },
  { id:'message',      start:.82,  end:.905, sign:'message',      at:1360, narration:{ lead:'Next stop:', word:'Summer 2027.' } },
  { id:'arrive',       start:.93,  end:1.01, narration:{ lead:'I build', word:'things that move.' } },
];

export const PARK_DISTANCE = 1480;
export const PARK_LANE = 7.1;

// The intro: after "Start the drive", the car pulls off the shoulder and merges onto the 401 on a
// timer (not scroll), then waits in the lane, behind the chase camera, for the reader to scroll.
// intro runs 0 → 1; the scroll drive below always starts from where the intro ends.
export const INTRO_DISTANCE = 55, INTRO_SECONDS = 3.4;
export function introOffset(t) {
  return { d: -INTRO_DISTANCE * (1 - smooth(0, 1, t)), x: PARK_LANE * (1 - smooth(.15, .8, t)) };
}

// Monotone cubic (Fritsch–Carlson) through [x, y] keys: smooth speed, never reverses.
export function monotoneCubic(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return x => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// Slow approach to each sign (so it can be read), quicker stretches between them.
function distanceKeys() {
  const keys = [[0, 0], [.085, 0], [.15, 45]];
  for (const beat of BEATS) {
    if (!beat.sign) continue;
    const len = beat.end - beat.start;
    keys.push([beat.start + len * .22, beat.at - 66], [beat.start + len * .72, beat.at - 36]);
  }
  keys.push([.93, PARK_DISTANCE - 40], [.985, PARK_DISTANCE], [1, PARK_DISTANCE]);
  return keys;
}
export const distanceAt = monotoneCubic(distanceKeys());

export const clamp01 = v => Math.max(0, Math.min(1, v));
export const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

export function beatAt(p) {
  return BEATS.find(beat => p >= beat.start && p < beat.end) || null;
}
export function localProgress(beat, p) { return clamp01((p - beat.start) / (beat.end - beat.start)); }

// Back-to-back beats in the same lane are one stay in that lane, so the car doesn't weave out and back between them.
const LANE_SPANS = BEATS.reduce((spans, beat) => {
  if (!beat.lane) return spans;
  const last = spans.at(-1), len = beat.end - beat.start;
  if (last && last.lane === beat.lane && Math.abs(last.end - beat.start) < 1e-9) Object.assign(last, { end: beat.end, outLen: len });
  else spans.push({ lane: beat.lane, start: beat.start, end: beat.end, inLen: len, outLen: len });
  return spans;
}, []);

// Lateral position: start in the middle lane (the intro has already merged), change lanes for the two
// exits, then park on the shoulder.
export function laneAt(p) {
  let x = 0;
  for (const s of LANE_SPANS) x += s.lane * (smooth(s.start, s.start + s.inLen * .35, p) - smooth(s.end - s.outLen * .2, s.end + s.outLen * .15, p));
  return x + PARK_LANE * smooth(.915, .975, p);
}

// Turn signal: −1 left, 1 right, 0 off. Like a real driver, it comes on just before the car starts to
// move across and stays on until the lane change is done.
export function signalAt(p, intro = 1) {
  // Left signal while pulling off the shoulder (not while parked behind the start screen).
  if (intro < 1) return intro > 0 && intro < .75 ? -Math.sign(PARK_LANE) : 0;
  const shift = laneAt(Math.min(1, p + .025)) - laneAt(Math.max(0, p - .005));
  return Math.abs(shift) < .12 ? 0 : Math.sign(shift);
}

const steer = (dx, dd, min) => dd > min ? Math.max(-.35, Math.min(.35, -Math.atan2(dx, dd))) : 0;
export function carPoseAt(p, intro = 1) {
  const e = .0015, d = distanceAt(p), d2 = distanceAt(Math.min(1, p + e)) - distanceAt(Math.max(0, p - e));
  const x = laneAt(p), x2 = laneAt(Math.min(1, p + e)) - laneAt(Math.max(0, p - e));
  if (intro >= 1) return { x, z: -d, yaw: steer(x2, d2, .05), distance: d };
  const te = .01, o = introOffset(intro), ahead = introOffset(Math.min(1, intro + te)), behind = introOffset(Math.max(0, intro - te));
  return { x: x + o.x, z: -(d + o.d), yaw: steer(ahead.x - behind.x, ahead.d - behind.d, .02), distance: d + o.d };
}

// Camera orbit angle around the car. 0 = directly behind, π = directly in front.
// Negative angles orbit on the road side (left of the car), never behind the guardrail.
const FRONT = -(Math.PI - .82), CHASE = -.12;
export function cameraAt(p, { portrait = false, intro = 1 } = {}) {
  const car = carPoseAt(p, intro);
  // The camera swings from the front of the parked car to the chase position during the intro merge.
  const toChase = smooth(.05, .95, intro), toFront = smooth(.925, .995, p);
  const chase = toChase * (1 - toFront);
  // Keep the car centred while the camera swings round in the intro; only look down the road at the end.
  const look = smooth(.55, 1, intro) * (1 - toFront);
  const theta = lerp(FRONT, CHASE, toChase) + (FRONT - CHASE) * toFront;
  const r = lerp(9.6, 11.2, chase) * (portrait ? 1.5 : 1), h = lerp(1.25, 3.1, chase) + (portrait ? .5 : 0);
  const position = [car.x + Math.sin(theta) * r, h, car.z + Math.cos(theta) * r];
  // Look at the car when parked; down the road (and toward the current sign) while driving.
  let signPull = 0;
  for (const beat of BEATS) {
    if (!beat.sign) continue;
    const w = smooth(beat.start, beat.start + (beat.end - beat.start) * .3, p) * (1 - smooth(beat.end - (beat.end - beat.start) * .15, beat.end + .01, p));
    signPull += w * (SIGN_LAYOUT[beat.sign]?.x ?? 0) * (portrait ? .26 : .3);
  }
  const target = [lerp(car.x, car.x + signPull, look), lerp(portrait ? 2.2 : 1.5, 1.9, look), car.z - 18 * look];
  return { position, target };
}

// Where each sign stands. x is lateral (+ is the right shoulder), y the bottom edge of the board.
export const SIGN_LAYOUT = {
  onramp:       { x: 10.5, y: 2.4, kind: 'post' },
  gantry:       { x: 0,    y: 6.2, kind: 'gantry' },
  distance:     { x: 11.5, y: 2.2, kind: 'post' },
  utfr:         { x: 11.5, y: 2.4, kind: 'post' },
  bluesky:      { x: 11.5, y: 2.4, kind: 'post' },
  projects:     { x: 11,   y: 1.6, kind: 'post' },
  podcast:      { x: 17,   y: 4.2, kind: 'billboard' },
  construction: { x: 10.5, y: 1.4, kind: 'post' },
  message:      { x: 0,    y: 6.2, kind: 'gantry' },
};

// Narration typing: letters appear with scroll, then the line fades as the next beat nears.
export function narrationState(p) {
  const beat = beatAt(p);
  if (!beat?.narration) return null;
  const t = localProgress(beat, p);
  const full = beat.narration.lead.length + 1 + beat.narration.word.length;
  const typeStart = beat.id === 'hero' ? 0 : .06, typeEnd = beat.id === 'hero' ? 0 : .38;
  const shown = typeEnd === 0 ? full : Math.round(full * smooth(typeStart, typeEnd, t));
  const fadeOut = beat.id === 'arrive' ? 0 : smooth(.8, .97, t);
  return { beat, shown, opacity: 1 - fadeOut, leadShown: Math.min(shown, beat.narration.lead.length), wordShown: Math.max(0, shown - beat.narration.lead.length - 1) };
}

// Car speed in km/h for the dashboard readout, from distance per unit of progress.
export function speedReadout(p) {
  const e = .004, v = (distanceAt(Math.min(1, p + e)) - distanceAt(Math.max(0, p - e))) / (2 * e);
  return Math.round(Math.min(118, v / 17));
}
