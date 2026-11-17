# Cary Li · caryli.work

Hey, I’m Cary. This is my portfolio, told as a drive down the 401. Scroll, and my car pulls off the shoulder, merges onto the highway and passes signs that say what I do. Built with React and Three.js.

## Two pages

- **The drive** (`/`): scroll-driven. The car starts facing you, the camera swings behind it, and each scroll stop holds on one sign: my name on a gantry, a distance sign of what I build, exits for U of T Formula Racing and Blue Sky Solar, blue attraction signs for my projects, a billboard for my podcast, a construction sign for what I’m building now, and a message board for internships. The car parks at the end with links to everything else.
- **The full portfolio** (`/portfolio/`): a plain, fast page with no 3D. It has my intro and photo, project write-ups, design teams, the road so far, skills and contact. The **Full portfolio** button is in the top right of every screen.

The first screen asks **Start the drive** (with engine sound) or **Drive without sound**. The sound toggle stays in the header. Reduced motion, data saver, `?view=static`, or a WebGL failure all show a still version of the drive, with the same signs as images.

## Run it locally

Use Node.js 20.19+ on the 20.x line, or 22.12 or later.

```sh
npm ci
npm run dev
```

Run `npm test` for the tests. `npm run build` builds both pages into `dist/` (`dist/index.html` and `dist/portfolio/index.html`), and `npm run preview` serves that build.

## Where to make changes

| What | Where |
| --- | --- |
| Projects, teams, journey, skills, links | `src/data.js` |
| My photo (portfolio page only) | `public/images/cary.jpg` (3:2 landscape); `portrait` in `src/data.js` |
| Scroll timing, narration lines, camera path | `src/drive-story.js` |
| Sign artwork and wording | `src/signs.js` |
| The highway: road, trees, barriers, traffic | `src/highway.js` |
| Car, lighting and the render loop | `src/DriveScene.jsx`, `src/car-details.js` |
| Landing page UI (gate, header, narration, ending) | `src/DriveStory.jsx`, `src/drive.css` |
| Portfolio page | `src/Portfolio.jsx`, `src/logbook.css` |
| Colours and fonts | `src/tokens.css` (Overpass, Overpass Mono, Source Serif 4 from Google Fonts in both HTML files) |
| Engine sound | `src/audio.js` |

Add `?debug` to the URL to expose the Three.js scene on `window.__drive`, and set `window.__drive.freeze = true` to move the camera by hand.

The model, decoder, and audio files are served locally. See [ASSETS.md](ASSETS.md) for credits and how to rebuild the model and audio.
