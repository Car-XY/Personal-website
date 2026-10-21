# Asset sources

- Audi R8 geometry: [Mayawaaan/AudiR8](https://github.com/Mayawaaan/AudiR8), `public/Audi.glb`. Adapted for this portfolio with navy paint, material adjustments, mesh simplification, and Draco compression. The upstream repository does not include a license declaration or identify the original model creator. Confirm the model's redistribution license before making the site public or reusing the asset elsewhere.
- Car reference: the navy Audi R8 image provided by Cary. Included as a WebGL fallback.
- Engine recordings: [Automann — Audi R8 Performance, 0–335 km/h](https://www.youtube.com/watch?v=mZNnWKdzqss). Ignition and rev use the 00:15–00:28 excerpt. Cruise uses the full-video interval **03:30.25–03:38.25**, with a 180 ms overlapping boundary, producing a 7.82-second PCM loop at its original pitch. Decode the full source to stereo PCM16 at 44.1 kHz as `tmp/r8-full.wav`, then run `python scripts/prepare-cruise-loop.py` to reproduce it. Confirm the recording's reuse permission before public redistribution.
- Horn recording: [Car horn sound effect](https://www.youtube.com/watch?v=iFPBhBRMyfw), supplied by Cary. Silence removed; the local MP3 is played without a synthetic horn layer.
- Garage motor: a separate, short procedural Web Audio effect. Engine sounds, revs, and the horn contain no oscillator layers.
- Road signs: original HTML/CSS illustrations based on the supplied Ontario 401 reference; the watermarked reference image is not embedded.
- Anchor, Kera, and ClearPath thumbnails: the exact screenshots/Devpost artwork supplied by Cary on October 21, 2026.
- Racing illustration, top-down highway and R8 sprite, evergreen scenery, and garage environment: original SVG/CSS/Three.js artwork. All destinations share a straight off-ramp and a separate forward-moving on-ramp.
- The garage model includes a procedural closed underbody, basic seats and cabin, and front/rear CanvasTexture Ontario plates reading Car-XY.
- Garage room: original Three.js geometry and canvas textures for the concrete floor, sectional door, workbench, racing rack, story wall, tool chest, and contact station. The illustration fallback uses original SVG geometry and Cary's supplied R8 reference.
- Draco decoder: bundled with Three.js, Apache 2.0; see `public/draco/LICENSE.txt`.
- Icons: Lucide, ISC license. Fonts: DM Sans, Barlow Condensed, IBM Plex Mono (Google Fonts; SIL Open Font License).
- Portfolio facts and résumé PDF: Cary's supplied revised résumé, supplemented by the supplied prototype. The revised résumé takes precedence where descriptions differ.
