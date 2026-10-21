# CAR—XY · Cary Li

A custom React and Three.js portfolio: an interactive navy Audi R8 garage, a first-person Ontario highway ride, and a complete static portfolio.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Explore

- **Start the engine:** ignition transition and a recorded R8 sample, followed by acceleration to 180 km/h.
- **Green exit signs:** open Projects, Design Teams, Journey, Skills, or Contact in an accessible native dialog.
- **Back on the road:** resume the drive and choose another exit.
- **Return to garage:** show the full scrollable portfolio, including résumé and contact links.
- **R:** rev the engine. **H:** honk. **M:** toggle sound. **Escape:** close an exit.
- **Drag the car:** orbit the detailed 3D model.

The site respects reduced-motion preferences, stops audio when hidden, and keeps all portfolio content accessible if WebGL is unavailable. Audio starts only after a user gesture. All engine clips, the model, and its decoder are served locally.

Content lives in `src/data.js` and `src/App.jsx`; route labels and instrument functions in `src/drive.js`; sound in `src/audio.js`; 3D rendering in `src/Scene.jsx`.

Model optimization is reproducible with `node scripts/optimize-model.mjs` after placing the original model at `tmp/audi-original.glb` and reference image at `tmp/r8-reference.png`.

See [ASSETS.md](ASSETS.md) for source attribution and third-party media notes. The Sites deployment is private to the owner.
