# Gallery candidates (verified 2026-09-22)

How each candidate was checked:
1. `curl -sL` gave HTTP 200 over https with no login.
2. The source or bundle was grepped for `immersive-ar`, `ARButton` or `XRButton`, or the framework's AR mode.
3. The page was loaded in headless Chromium (Playwright, 1200x750) with `HoloWeb/Web/holoweb-polyfill.js` injected through `addInitScript`, using the polyfill's desktop mock transport. I recorded `isSessionSupported('immersive-ar')`, whether an AR button is visible, and any `pageerror` events.

HoloWeb's supported features, from `polyfill/src/device.ts`: viewer, local, local-floor, unbounded, hit-test, dom-overlay, light-estimation, anchors, webgpu. Pages that *require* plane-detection, depth-sensing, camera-access, mesh-detection or hand-tracking were dropped.

## Kept (15)

| id | URL | Why |
|---|---|---|
| supersplat-micro-pc | https://superspl.at/s?id=5c0f892e&webgl | The only Gaussian-splat entry: a photoreal capture with an AR icon. `&webgl` is required for AR. |
| needle-physics-playground | https://physics-playground-zubcksgtkqf.needle.run/ | Polished physics toy box; Enter AR shown |
| needle-snow-globe | https://snowglobe-zubckszvui3a.needle.run/ | Glass and particle art piece; Enter AR shown |
| needle-musical-instrument | https://musicalinstrument-zubcksz1usd7h.needle.run/ | Interactive audio; Enter AR shown |
| needle-collaborative-sandbox | https://collaborativesandbox-zubcks1qdkhy.needle.run/ | The only multiplayer entry; Enter AR shown |
| needle-diamond-ring | https://jewelry-ring-zubckszopxdy.needle.run/ | High-end product configurator with refraction |
| playcanvas-ar-starter | https://playcanv.as/p/AOYF3YyG/ | PlayCanvas official AR kit: hit-test, light estimation, physics |
| model-viewer-ar | https://modelviewer.dev/examples/augmentedreality/ | Standard web product-AR component (WebXR mode) |
| aframe-model-viewer | https://aframe.io/aframe/examples/showcase/model-viewer/ | A-Frame showcase: animated dino, AR shadows, load any glTF |
| three-xr-ballshooter | https://threejs.org/examples/webxr_xr_ballshooter.html | three.js physics demo; XRButton prefers AR |
| three-ar-lighting | https://threejs.org/examples/webxr_ar_lighting.html | Best visual test of light-estimation |
| babylon-measure-tape | https://playground.babylonjs.com/full.html#GG06BQ#97 | Useful AR utility (hit-test + anchors). Thumbnail null because the canvas is blank before AR. |
| toji-webxr-particles | https://toji.github.io/webxr-particles/ | Classic WebXR particle art by the spec editor |
| iw-hit-test | https://immersive-web.github.io/webxr-samples/hit-test.html | Reference hit-test sample (plain API 1 of 2). Thumbnail null. |
| iw-webgpu-ar | https://immersive-web.github.io/webxr-samples/webgpu/immersive-ar-session.html | Reference XRGPUBinding AR sample (plain API 2 of 2). Thumbnail null. |

Plain API samples: the two immersive-web samples, plus three.js `webxr_ar_lighting` if you count three.js feature examples. That is 3, within the cap of 4.

## Dropped

| Candidate | Reason |
|---|---|
| immersive-web `anchors.html` | Under the polyfill it offered **START VR**, not AR. Anchors are covered by the Babylon tape and the hit-test-anchors variant. |
| immersive-web `hit-test-anchors.html` | Works (START AR) but is almost the same as hit-test.html; dropped to keep the plain-API count low. |
| immersive-web `immersive-ar-session.html` | Works, but it's a barebones cube scene; the WebGPU variant is more relevant for HoloWeb |
| immersive-web `proposals/lighting-estimation.html` | 404 |
| three.js `webxr_ar_cones`, `webxr_ar_hittest` | Work, but they're near-identical "tap to place" basics with a black pre-AR screen |
| three.js `webxr_ar_plane_detection` | Requires `plane-detection` (not supported) |
| three.js `webxr_ar_camera_access` | Requires `camera-access` (not supported) |
| three.js `webxr_xr_paint`, `webxr_xr_sculpt`, `webxr_xr_marchingcubes`, `webxr_xr_cubes`, `webxr_xr_dragging` | XRButton offers AR, but they're built for tracked controllers; on a phone the only input is a screen tap |
| three.js `webxr_ar_paint` | 404 (removed upstream) |
| Babylon AR Portal `#M3G924` | Throws `ReferenceError: isInRealWorld is not defined` at load in the current playground (implicit global in strict mode). Revisions 0-12 all have the bug, so the key "walk through the portal" step breaks. |
| Babylon Light estimation `#NAZYHG#5` | Works, but duplicates three.js lighting and the pre-AR canvas is blank |
| Babylon Placing a mesh `#KDWCZY` | Enables WebXRPlaneDetector, and Babylon makes enabled features required, so `plane-detection` would fail |
| Babylon Goalkeeper `#PPM311#148` | VR (no immersive-ar) |
| A-Frame `mixed-reality/anchor` | Built for Quest: paintings are moved with controller grab and use `anchored="persistent: true"`, but HoloWeb rejects persistent anchors |
| A-Frame `boilerplate/ar-hello-world` | Basic primitives; also hits the offerSession page error described below |
| A-Frame `mixed-reality/real-world-meshing` | Needs mesh detection |
| PlayCanvas engine example `xr_ar-hit-test-anchors` (iframe URL) | Rendered black with no AR button outside the examples-browser shell |
| PlayCanvas `playcanv.as/p/ZV4PW6wr` (Interior Visualization) | No AR code |
| PlayCanvas `playcanv.as/p/jhbiKOiq` (AR Starter kit copy) | Same kit as AOYF3YyG |
| Needle car physics, shooting range | Menu shows only QR Code / Open on Quest; no Enter AR, since the scenes don't enable AR |
| Needle voxel editor | Works, but the scene is sparse; five Needle entries are already enough |
| Needle checkers (Blender) | The bundle has almost no AR code (2 hits); not pursued |
| Spark `examples/webxr` | `SparkXr({ mode: "vr" })`, so VR only |
| Google codelab `ar-with-webxr/final`, `step-05` | 404 |
| webxr-experiments.glitch.me | 410 (Glitch hosting ended) |
| marlon360 webxr-reticle | 404 |
| Wonderland Engine wastepaperbin-ar | Only hosted on itch.io inside a sandboxed iframe with no stable direct URL; not verified |
| realitydeslab / holokit GitHub orgs | No public WebXR AR pages (Unity SDKs, a polyfill repo and websites only; realitydeslab.github.io and holokit.github.io return 404) |
| 8th Wall, Zappar | Excluded by brief (proprietary, not navigator.xr) |

## Findings that affect HoloWeb itself

- **A-Frame + polyfill: unhandled rejection at load.** A-Frame 1.8 scenes with `xr-mode-ui="XRMode: xr"` call `enterVR(false, true)`, which calls `navigator.xr.offerSession('immersive-vr')`. The polyfill exposes `offerSession`, the call rejects because VR is unsupported, and the page logs `Failed to enter VR mode (requestSession)`. This doesn't happen without the polyfill. Fix: don't expose `offerSession`, or resolve or ignore it for unsupported modes.
- **Sub-frames.** PlayCanvas `playcanv.as/p/...` pages run the app in a same-origin iframe. The WKUserScript must be injected with `forMainFrameOnly: false` for that entry to work.
- **Needle on iOS.** Needle has a QuickLook/USDZ path for iPhone. With navigator.xr reporting immersive-ar it should take the WebXR path, but this was only verified with a desktop user agent; confirm on device.
