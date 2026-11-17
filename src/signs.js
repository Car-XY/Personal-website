// Highway sign faces, drawn to canvas. Sizes are in metres; drawing is in pixels.

export const SIGN_FONTS = ['800 64px Overpass', '700 64px Overpass', '600 64px Overpass', '600 64px "Overpass Mono"', '600 64px "Source Serif 4"', 'italic 400 64px "Source Serif 4"'];
const SANS = 'Overpass, "Arial Narrow", Arial, sans-serif';
const MONO = '"Overpass Mono", "Courier New", monospace';
const SERIF = '"Source Serif 4", Georgia, serif';

export const COLORS = {
  green: '#00653a', white: '#f4f3ee', blue: '#1d4e9e', orange: '#e8711a', black: '#121314',
  amber: '#ffb21a', paper: '#f1eee6', ink: '#16181b', yellow: '#f2b705',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// A sign board: background, inset reflective border, rounded corners.
function board(ctx, x, y, w, h, u, fill, border = COLORS.white) {
  ctx.fillStyle = fill; roundRect(ctx, x, y, w, h, u * .16); ctx.fill();
  ctx.strokeStyle = border; ctx.lineWidth = u * .07;
  roundRect(ctx, x + u * .1, y + u * .1, w - u * .2, h - u * .2, u * .1); ctx.stroke();
}

function text(ctx, str, x, y, { size, weight = 700, family = SANS, color = COLORS.white, align = 'left', max = Infinity, tracking = 0, style = '' }) {
  let s = size;
  const font = () => `${style} ${weight} ${s}px ${family}`.trim();
  ctx.font = font();
  while (ctx.measureText(str).width + tracking * str.length > max && s > 8) { s -= 2; ctx.font = font(); }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking}px`;
  ctx.fillText(str, x, y);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  return s;
}

function arrow(ctx, cx, cy, size, angle, color = COLORS.white) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.fillStyle = color;
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, -s * .5); ctx.lineTo(s * .38, -s * .08); ctx.lineTo(s * .12, -s * .08); ctx.lineTo(s * .12, s * .5);
  ctx.lineTo(-s * .12, s * .5); ctx.lineTo(-s * .12, -s * .08); ctx.lineTo(-s * .38, -s * .08); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// The King's Highway shield: white, crown on top, route number below.
function shield(ctx, x, y, w, route) {
  const h = w * 1.12;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = COLORS.white; ctx.strokeStyle = COLORS.black; ctx.lineWidth = w * .04;
  ctx.beginPath();
  ctx.moveTo(w * .06, h * .2); ctx.quadraticCurveTo(w * .5, h * .08, w * .94, h * .2);
  ctx.lineTo(w * .94, h * .62); ctx.quadraticCurveTo(w * .9, h * .9, w * .5, h);
  ctx.quadraticCurveTo(w * .1, h * .9, w * .06, h * .62); ctx.closePath(); ctx.fill(); ctx.stroke();
  // crown
  ctx.fillStyle = COLORS.black; ctx.beginPath();
  const cy = h * .02, cw = w * .4, cx = w * .3;
  ctx.moveTo(cx, cy + h * .17); ctx.lineTo(cx, cy + h * .06); ctx.lineTo(cx + cw * .25, cy + h * .12); ctx.lineTo(cx + cw * .5, cy);
  ctx.lineTo(cx + cw * .75, cy + h * .12); ctx.lineTo(cx + cw, cy + h * .06); ctx.lineTo(cx + cw, cy + h * .17); ctx.closePath(); ctx.fill();
  text(ctx, 'ONTARIO', w * .5, h * .34, { size: w * .13, weight: 800, color: COLORS.black, align: 'center', max: w * .74 });
  text(ctx, route, w * .5, h * .74, { size: w * .4, weight: 800, color: COLORS.black, align: 'center', max: w * .8 });
  ctx.restore();
}

function exitSign(ctx, W, H, u, { exit, title, line2, line3 }) {
  const tabH = u * 1.15, tabW = u * 3.6;
  board(ctx, W - tabW - u * .3, 0, tabW, tabH + u * .3, u, COLORS.green);
  text(ctx, `EXIT ${exit}`, W - tabW / 2 - u * .3, tabH * .74, { size: u * .62, weight: 800, align: 'center' });
  board(ctx, 0, tabH, W, H - tabH, u, COLORS.green);
  const left = u * .65, max = W - u * 2.6;
  text(ctx, title, left, tabH + u * 1.45, { size: u * .98, weight: 700, max });
  text(ctx, line2, left, tabH + u * 2.45, { size: u * .62, weight: 600, max });
  ctx.fillStyle = '#ffffff55'; ctx.fillRect(left, tabH + u * 2.82, max, u * .04);
  text(ctx, line3, left, tabH + u * 3.48, { size: u * .5, weight: 600, max, color: '#dfeee5' });
  arrow(ctx, W - u * 1.15, tabH + (H - tabH) * .55, u * 1.3, Math.PI / 4);
}

export const SIGNS = {
  onramp: {
    w: 7.4, h: 4.6, label: '401 West, Toronto',
    draw(ctx, W, H, u) {
      board(ctx, 0, 0, W, H, u, COLORS.green);
      text(ctx, 'TO', u * .7, u * 1.15, { size: u * .55, weight: 800 });
      shield(ctx, u * .55, u * 1.35, u * 2.1, '401');
      text(ctx, 'WEST', u * 3.1, u * 1.75, { size: u * .78, weight: 800, tracking: u * .04 });
      text(ctx, 'Toronto', u * 3.1, u * 3.0, { size: u * 1.05, weight: 700, max: W - u * 3.6 });
      arrow(ctx, u * 5.9, u * 3.85, u * .9, -Math.PI / 4);
    },
  },
  gantry: {
    w: 15, h: 5.2, label: 'Cary Li, Engineering Science, University of Toronto',
    draw(ctx, W, H, u) {
      board(ctx, 0, 0, W, H, u, COLORS.green);
      text(ctx, 'Cary Li', u * .8, u * 2.05, { size: u * 1.75, weight: 800, max: W - u * 4.2 });
      text(ctx, 'Engineering Science', u * .82, u * 3.25, { size: u * .82, weight: 600, max: W - u * 4.2 });
      text(ctx, 'University of Toronto', u * .82, u * 4.3, { size: u * .82, weight: 600, max: W - u * 4.2 });
      ctx.fillStyle = '#ffffff55'; ctx.fillRect(W - u * 3.3, u * .55, u * .04, H - u * 1.1);
      arrow(ctx, W - u * 1.65, H * .52, u * 2, Math.PI);
    },
  },
  distance: {
    w: 9.2, h: 4.6, label: 'Machine learning 1, Web apps 2, Machine perception 3',
    draw(ctx, W, H, u) {
      board(ctx, 0, 0, W, H, u, COLORS.green);
      text(ctx, 'km', W - u * .7, u * .95, { size: u * .45, weight: 600, align: 'right', color: '#dfeee5' });
      [['Machine learning', '1'], ['Web apps', '2'], ['Machine perception', '3']].forEach(([name, km], i) => {
        const y = u * (1.95 + i * 1.1);
        text(ctx, name, u * .7, y, { size: u * .8, weight: 700, max: W - u * 2.4 });
        text(ctx, km, W - u * .7, y, { size: u * .8, weight: 700, align: 'right' });
      });
    },
  },
  utfr: {
    w: 11.2, h: 5.8, transparent: true, label: 'Exit 01: U of T Formula Racing, Driverless. Project lead, LiDAR cone detection',
    draw(ctx, W, H, u) { exitSign(ctx, W, H, u, { exit: '01', title: 'U of T Formula Racing', line2: 'Driverless · Perception', line3: 'Project lead: LiDAR cone-detection model' }); },
  },
  bluesky: {
    w: 11.2, h: 5.8, transparent: true, label: 'Exit 02: Blue Sky Solar Racing. Energy simulation for the Gen 13 car',
    draw(ctx, W, H, u) { exitSign(ctx, W, H, u, { exit: '02', title: 'Blue Sky Solar Racing', line2: 'Strategy · Energy simulation', line3: 'Modelling energy use for the Gen 13 car' }); },
  },
  projects: {
    w: 8.4, h: 5.9, transparent: true, label: 'Projects: Kera, ClearPath, Anchor',
    draw(ctx, W, H, u) {
      const rows = [['Kera', 'Hemoglobin from a fingernail photo', 'LIVE'], ['ClearPath', '3D room planner in the browser', 'PROTOTYPE'], ['Anchor', 'Desktop habit tracker', 'CS50']];
      const bh = u * 1.8, gap = u * .25;
      rows.forEach(([name, sub, tag], i) => {
        const y = i * (bh + gap);
        board(ctx, 0, y, W, bh, u, COLORS.blue);
        text(ctx, name, u * .55, y + u * .95, { size: u * .78, weight: 800, max: W - u * 3 });
        text(ctx, sub, u * .57, y + u * 1.48, { size: u * .42, weight: 600, max: W - u * 1.2, color: '#dbe5f6' });
        ctx.font = `800 ${u * .34}px ${SANS}`;
        const tw = ctx.measureText(tag).width + u * .5;
        ctx.fillStyle = COLORS.white; roundRect(ctx, W - tw - u * .45, y + u * .4, tw, u * .58, u * .08); ctx.fill();
        text(ctx, tag, W - tw / 2 - u * .45, y + u * .82, { size: u * .34, weight: 800, align: 'center', color: COLORS.blue });
      });
    },
  },
  podcast: {
    w: 13, h: 5, label: 'The Fundamental Why, a physics and philosophy podcast: 14.1k+ views, 2.1k+ subscribers',
    draw(ctx, W, H, u) {
      ctx.fillStyle = COLORS.paper; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.ink; ctx.fillRect(0, H - u * .55, W, u * .55);
      text(ctx, 'The Fundamental Why', u * .6, u * 1.55, { size: u * 1.1, weight: 600, family: SERIF, color: COLORS.ink, max: W * .62 });
      text(ctx, 'a physics & philosophy podcast', u * .62, u * 2.35, { size: u * .55, weight: 400, family: SERIF, style: 'italic', color: '#3b3d40', max: W * .6 });
      text(ctx, 'Hosted by Cary · 7 episodes', u * .62, u * 3.55, { size: u * .42, weight: 600, family: MONO, color: '#3b3d40', max: W * .6 });
      ctx.fillStyle = COLORS.ink; ctx.fillRect(W * .66, u * .6, u * .05, H - u * 1.8);
      text(ctx, '14.1k+', W * .7, u * 1.75, { size: u * 1.2, weight: 800, color: COLORS.ink });
      text(ctx, 'views', W * .7, u * 2.3, { size: u * .42, weight: 600, family: MONO, color: '#3b3d40' });
      text(ctx, '2.1k+', W * .7, u * 3.45, { size: u * .95, weight: 800, color: COLORS.ink });
      text(ctx, 'subscribers', W * .7, u * 3.95, { size: u * .42, weight: 600, family: MONO, color: '#3b3d40' });
      text(ctx, 'youtube.com/@TheFundamentalWhy', u * .6, H - u * .17, { size: u * .32, weight: 600, family: MONO, color: COLORS.paper });
    },
  },
  construction: {
    w: 7, h: 4.2, label: 'Work in progress: a lightweight CNN that uses LiDAR intensity to find cone colour and position',
    draw(ctx, W, H, u) {
      board(ctx, 0, 0, W, H, u, COLORS.orange, COLORS.black);
      text(ctx, 'WORK IN PROGRESS', W / 2, u * 1.2, { size: u * .72, weight: 800, color: COLORS.black, align: 'center', max: W - u * 1, tracking: u * .03 });
      ctx.fillStyle = COLORS.black; ctx.fillRect(u * .55, u * 1.5, W - u * 1.1, u * .05);
      text(ctx, 'Lightweight CNN on', W / 2, u * 2.35, { size: u * .6, weight: 700, color: COLORS.black, align: 'center', max: W - u * 1 });
      text(ctx, 'LiDAR intensity values', W / 2, u * 3.0, { size: u * .6, weight: 700, color: COLORS.black, align: 'center', max: W - u * 1 });
      text(ctx, 'finds cone colour + position', W / 2, u * 3.62, { size: u * .45, weight: 600, color: COLORS.black, align: 'center', max: W - u * 1 });
    },
  },
  message: {
    w: 12.5, h: 3.9, label: 'Now merging: looking for Summer 2027 internships. Contact ahead',
    draw(ctx, W, H, u) {
      ctx.fillStyle = '#2c2f33'; roundRect(ctx, 0, 0, W, H, u * .12); ctx.fill();
      ctx.fillStyle = '#0b0c0d'; ctx.fillRect(u * .3, u * .3, W - u * .6, H - u * .6);
      const lines = ['NOW MERGING', 'SUMMER 2027 INTERNSHIPS', 'CONTACT 1 KM AHEAD'];
      lines.forEach((line, i) => text(ctx, line, W / 2, u * (1.3 + i * .95), { size: u * .66, weight: 600, family: MONO, color: COLORS.amber, align: 'center', max: W - u * 1.2, tracking: u * .05 }));
      // LED pixel grid over the text.
      ctx.fillStyle = '#0b0c0dcc';
      const step = Math.max(3, u * .085);
      for (let y = u * .3; y < H - u * .3; y += step) ctx.fillRect(u * .3, y, W - u * .6, step * .32);
      for (let x = u * .3; x < W - u * .3; x += step) ctx.fillRect(x, u * .3, step * .32, H - u * .6);
    },
  },
};

export async function loadSignFonts(timeout = 2500) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const load = Promise.all(SIGN_FONTS.map(font => document.fonts.load(font).catch(() => null)));
  await Promise.race([load, new Promise(resolve => setTimeout(resolve, timeout))]);
}

// Draw a sign at `ppm` pixels per metre (u = one metre in pixels).
export function renderSign(id, ppm = 110) {
  const spec = SIGNS[id];
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(spec.w * ppm); canvas.height = Math.round(spec.h * ppm);
  const ctx = canvas.getContext('2d');
  spec.draw(ctx, canvas.width, canvas.height, ppm);
  return canvas;
}

