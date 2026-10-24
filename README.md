# CAR—XY · Cary Li

A React and Three.js portfolio: a dedicated landing page, an interactive workshop with a navy Car-XY sports car, a top-down Ontario highway ride, and a complete readable portfolio.

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
- **Test drive:** a faded ignition recording, followed by acceleration to 180 km/h in a flat 2D map. Manual cruising revs briefly raise the speedometer and world speed to 206 km/h before settling to 180, following the audio playback position.
- **Green exit signs:** reveal a straight shared off-ramp with an open highway junction. The car takes the ramp before Projects, Design Teams, Journey, Skills, or Contact opens in an accessible native dialog.
- **Back on the road:** play the faded engine-start recording once, drive forward along a separate on-ramp, then settle into the steady cruise recording.
- **Highway scenery:** evergreen trees and lane markings use one shared world offset. At 180 km/h the map moves at 1,120 SVG units/second, calibrated against the car sprite with a 0.8 presentation scale. Wind trails follow the car.
- **Garage:** an enclosed industrial workshop with a fixed perspective camera, steel mezzanine, brick walls, fluorescent fixtures, neon tools, and a marked metal service bay. Open Projects at the workbench, Design Teams at the racing rack, Journey at the story wall, Skills at the tool chest, and Contact at the communications station. The R8 starts a test drive. Labels and an accessible directory support keyboard and touch navigation.
- **Read portfolio:** show all content without driving or requiring WebGL. Garage panels return to the room; highway panels return via the on-ramp.
- **R:** rev the engine. **H:** honk. **M:** toggle sound. **Escape:** close an exit.
- **Drag the landing-page car:** orbit the unbranded 3D model, including Car-XY plates, a sealed underside, and a basic cabin.

The site respects reduced-motion preferences, stops audio when hidden, and keeps all portfolio content accessible if WebGL is unavailable. Audio starts only after a user gesture. All engine clips, the model, and its decoder are served locally.

Content lives in `src/data.js` and `src/App.jsx`; road motion and ramp geometry in `src/drive.js`; recorded sound in `src/audio.js`; 2D driving in `src/TopDownDrive.jsx`; the garage interface and room in `src/GarageHub.jsx` and `src/GarageRoom.jsx`; the landing car viewer in `src/Scene.jsx`; model repairs in `src/car-details.js`.

Model optimization is reproducible with `node scripts/optimize-model.mjs` after placing the original model at `tmp/audi-original.glb` .

The hero and garage show static artwork immediately, then optionally load 3D. Reduced-motion, data-saving, and `?view=static` visits keep the static view; the scene controls switch views. Model failure or a ten-second load timeout retains the artwork and working navigation.

See [ASSETS.md](ASSETS.md) for source attribution and third-party media notes. The Sites deployment is private to the owner.
