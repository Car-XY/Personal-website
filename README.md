# CAR-XY | Cary Li

Hey, I’m Cary. This is my portfolio, by way of a garage and a stretch of the 401. I built it with React and Three.js to show what I’m working on, from web apps to helping a driverless race car tell its cones apart.

## Take a look around

- **Test Drive Car-XY:** hop in and pick a green exit sign once you’re up to speed. Each exit opens a section of my portfolio. **Back on the road** takes you up the on-ramp.
- **Enter the Garage:** the workbench has my projects, the racing rack has my design teams, and the other stops are marked around the room. Hit **Read portfolio** if you want everything on one page.
- **Try the car:** drag it on the home page to look around. Press **R** to rev, **H** to honk, and **M** to toggle sound. **Esc** closes a portfolio stop.

The home page and garage try 3D first. If the scene fails or takes more than 10 seconds, they switch to a still image. Reduced motion, data saver, and `?view=static` start there too. You can also switch views on the page. The portfolio works without WebGL, and the car stays quiet until you interact with the page. Sound stops when the tab is hidden.

## Run it locally

Use Node.js 20.19+ on the 20.x line, or 22.12 or later.

```sh
npm ci
npm run dev
```

Run `npm test` for the tests. Use `npm run build` to build the site and `npm run preview` to serve that build locally.

## Where to make changes

| What | Where |
| --- | --- |
| Projects, links, and skills | `src/data.js` |
| About, design teams, contact, and navigation | `src/App.jsx` |
| Highway drawing and ramp geometry | `src/TopDownDrive.jsx`, `src/drive.js` |
| Engine and horn playback | `src/audio.js` |
| Garage and its 3D scene | `src/GarageHub.jsx`, `src/GarageRoom.jsx` |
| Landing page car and model details | `src/Scene.jsx`, `src/car-details.js` |

The speed bump (180 to 206 km/h) and exhaust both follow the rev clip’s playback position. That way they stop together if the clip is cut short. At 180 km/h, the road scrolls at 1,120 SVG units per second, using 80% of the car sprite’s scale. The markings and scenery share that offset so they wrap without drifting apart.

The Sites deployment is private. The model, decoder, and audio files are served locally. See [ASSETS.md](ASSETS.md) for credits and how to rebuild the model and audio.
