# Asset sources

- Audi R8 geometry: [Mayawaaan/AudiR8](https://github.com/Mayawaaan/AudiR8), `public/Audi.glb`. Adapted for this portfolio with navy paint, material adjustments, mesh simplification, and Draco compression. The upstream repository does not include a license declaration or identify the original model creator. Confirm the model's redistribution license before making the site public or reusing the asset elsewhere.
- Car reference: the navy Audi R8 image provided by Cary. Included as a WebGL fallback.
- Engine recordings: [user-supplied Audi R8 recording](https://www.youtube.com/watch?v=Ah05hcKbTiQ). Cruise uses **00:22–00:34**, with a 120 ms overlapping boundary producing an 11.88-second stereo PCM loop at original pitch; rev uses **00:56–01:03**; ignition uses **01:23–01:29**. Decode the full source to PCM16 at 44.1 kHz as `tmp/new-r8-source.wav`, then run `python scripts/prepare-cruise-loop.py` to reproduce the cruise loop. These are the site's only three sound assets. Confirm the recording's reuse permission before public redistribution.
- Road signs: original HTML/CSS illustrations based on the supplied Ontario 401 reference; the watermarked reference image is not embedded.
- Anchor, Kera, and ClearPath thumbnails: the exact screenshots/Devpost artwork supplied by Cary on October 21, 2026.
- Racing illustration, top-down highway and R8 sprite, evergreen scenery, and garage environment: original SVG/CSS/Three.js artwork. All destinations share a straight off-ramp and a separate forward-moving on-ramp.
- The garage model includes a procedural closed underbody, basic seats and cabin, and front/rear CanvasTexture Ontario plates reading Car-XY.
- Garage room: original Three.js geometry and canvas textures for the concrete and brick surfaces, diamond-plate service bay, mezzanine, stairs, ceiling beams, fluorescent fixtures, neon wrench outlines, workbench, racing rack, story wall, tool chest, and contact station. The garage is built entirely as native geometry, with no photographic background. The illustration fallback uses original SVG geometry and Cary's supplied R8 reference.
- Draco decoder: bundled with Three.js, Apache 2.0; see `public/draco/LICENSE.txt`.
- Icons: Lucide, ISC license. Fonts: DM Sans, Barlow Condensed, IBM Plex Mono (Google Fonts; SIL Open Font License).
- Portfolio facts and résumé PDF: Cary's supplied revised résumé, supplemented by the supplied prototype. The revised résumé takes precedence where descriptions differ.
