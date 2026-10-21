# CAR—XY · Cary Li

A custom React and Three.js portfolio: a dedicated landing page, an interactive navy Audi R8 garage, a top-down 2D Ontario highway ride, and a complete static portfolio.

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

- **Landing page:** choose Enter the Garage or Test Drive Car-XY. Portfolio sections mount only after a mode is chosen.
- **Test drive:** a recorded R8 sample, followed by acceleration to 180 km/h in a flat 2D map.
- **Green exit signs:** reveal a shared off-ramp. The car takes the ramp and parks before Projects, Design Teams, Journey, Skills, or Contact opens in an accessible native dialog.
- **Back on the road:** animate the return along the ramp, merge onto the highway, and choose another exit.
- **Return to garage:** show the full scrollable portfolio, including résumé and contact links.
- **R:** rev the engine. **H:** honk. **M:** toggle sound. **Escape:** close an exit.
- **Drag the car:** orbit the detailed 3D model, including Car-XY plates, a sealed underside, and a basic cabin.

The site respects reduced-motion preferences, stops audio when hidden, and keeps all portfolio content accessible if WebGL is unavailable. Audio starts only after a user gesture. All engine clips, the model, and its decoder are served locally.

Content lives in `src/data.js` and `src/App.jsx`; route labels, instrument functions, and ramp geometry in `src/drive.js`; recorded sound in `src/audio.js`; 2D driving in `src/TopDownDrive.jsx`; garage rendering in `src/Scene.jsx`; model repairs in `src/car-details.js`.

Model optimization is reproducible with `node scripts/optimize-model.mjs` after placing the original model at `tmp/audi-original.glb` and reference image at `tmp/r8-reference.png`.

See [ASSETS.md](ASSETS.md) for source attribution and third-party media notes. The Sites deployment is private to the owner.
