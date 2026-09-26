/*
 * HoloXR: WebXR for a Unity WebGPU player.
 *
 * Unity's WebGPU backend renders into its canvas. During an immersive session this script:
 *   1. runs Unity's main loop inside XRSession.requestAnimationFrame (HoloXR.jslib swaps
 *      Emscripten's Browser.requestAnimationFrame, so the page's own rAF is left alone);
 *   2. writes the viewer's views (projection + pose) into a float buffer Unity reads (HoloXRCamera.cs);
 *   3. after Unity's frame, blits the side-by-side views from Unity's canvas texture into the
 *      XRGPUBinding projection layer, with alpha = max(r, g, b) so the black background
 *      disappears over the camera feed.
 *
 * Load before the Unity loader: it patches navigator.gpu.requestAdapter (xrCompatible) and
 * GPUCanvasContext.configure (to capture Unity's device and make the canvas texture sampleable).
 *
 * Query parameters: ?scale=<world units per metre> (default 3), ?dist=<metres> (default 1.2),
 * ?res=<render scale of the XR views> (default 0.75), ?black=<AR black level cut> (default 0.04),
 * ?bloom=<threshold>,<scatter> for the XR bloom (default 0.5,0.5).
 */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const num = (key, fallback) => {
    const v = parseFloat(params.get(key));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  };

  // Buffer layout shared with HoloXRCamera.cs (floats).
  const B = {
    ACTIVE: 0,
    VIEW_COUNT: 1,
    WORLD_SCALE: 2,
    DISTANCE: 3,
    RECENTER: 4,
    BLEND: 5,
    BLOOM_THRESHOLD: 6,
    BLOOM_SCATTER: 7,
    VIEW0: 8, // 16 projection + 3 position + 4 orientation
    VIEW_STRIDE: 23,
    LENGTH: 64,
  };

  const BLIT_WGSL = /* wgsl */ `
struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
struct Params { uvOffset: vec2f, uvScale: vec2f, lumaAlpha: f32, blackLevel: f32, pad0: f32, pad1: f32 };
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var<uniform> P: Params;
@vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  var o: VSOut;
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  o.uv = P.uvOffset + vec2f(p.x, 1.0 - p.y) * P.uvScale;
  return o;
}
@fragment fn fs(in: VSOut) -> @location(0) vec4f {
  var c = textureSample(src, samp, in.uv);
  if (P.lumaAlpha > 0.5) {
    // Cut the faint bloom veil so it does not tint the camera feed / HoloKit view.
    c = vec4f(max(c.rgb - vec3f(P.blackLevel), vec3f(0.0)) / (1.0 - P.blackLevel), c.a);
    let a = clamp(max(max(c.r, c.g), c.b), 0.0, 1.0);
    return vec4f(min(c.rgb, vec3f(a)), a);
  }
  return vec4f(c.rgb, 1.0);
}`;

  const state = {
    canvas: null, // Unity's canvas
    context: null, // Unity's GPUCanvasContext
    device: null, // Unity's GPUDevice
    canvasFormat: null,
    unity: null, // { write, browser } from HoloXR.jslib
    windowRAF: null, // Emscripten's original Browser.requestAnimationFrame
    unityFunc: null, // Unity's main loop runner (last scheduled)
    generation: 0,
    session: null,
    mode: null,
    refSpace: null,
    binding: null,
    layer: null,
    layerFormat: null,
    blit: null,
    recenter: 0,
    views: 0, // views Unity rendered in the last XR frame
    worldScale: num('scale', 3),
    distance: num('dist', 1.2),
    renderScale: Math.min(num('res', 0.75), 2),
    bloom: (params.get('bloom') ?? '0.5,0.5').split(',').map((v) => Math.max(0, parseFloat(v) || 0)),
    blackLevel: Math.min(params.has('black') ? Math.max(0, parseFloat(params.get('black')) || 0) : 0.04, 0.5),
    buffer: new Float32Array(B.LENGTH),
    listeners: new Set(),
    savedCanvasStyle: null,
  };

  // --- WebGPU hooks (must run before Unity creates its device) ---------------------------

  function installGPUHooks() {
    if (typeof navigator === 'undefined' || !navigator.gpu) return;
    const gpu = navigator.gpu;
    const requestAdapter = gpu.requestAdapter.bind(gpu);
    gpu.requestAdapter = (options) => requestAdapter(Object.assign({}, options, { xrCompatible: true }));

    if (typeof GPUCanvasContext === 'undefined') return;
    const configure = GPUCanvasContext.prototype.configure;
    GPUCanvasContext.prototype.configure = function (config) {
      if (state.canvas && this.canvas === state.canvas) {
        const usage = (config.usage ?? GPUTextureUsage.RENDER_ATTACHMENT) | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC;
        config = Object.assign({}, config, { usage });
        if (state.device !== config.device) state.blit = null;
        state.context = this;
        state.device = config.device;
        state.canvasFormat = config.format;
      }
      return configure.call(this, config);
    };
  }

  // --- Unity main loop routing ------------------------------------------------------------

  function scheduleUnity(func) {
    state.unityFunc = func;
    const generation = state.generation;
    if (state.session) {
      state.session.requestAnimationFrame((time, frame) => onXRFrame(time, frame, func, generation));
    } else {
      state.windowRAF(() => {
        if (generation !== state.generation) return;
        fitCanvasToPage();
        func(performance.now());
      });
    }
  }

  /** Move Unity's pending main-loop callback to the other loop (window <-> XR session). */
  function rescheduleUnity() {
    state.generation++;
    if (state.unityFunc && state.windowRAF) scheduleUnity(state.unityFunc);
  }

  function attachUnity(unity) {
    state.unity = unity;
    const browser = unity.browser;
    const original = browser.requestAnimationFrame;
    state.windowRAF = (func) => original.call(browser, func);
    browser.requestAnimationFrame = scheduleUnity;
    unity.write(state.buffer);
    emit();
  }

  // --- Canvas sizing ----------------------------------------------------------------------

  function fitCanvasToPage() {
    const canvas = state.canvas;
    if (!canvas || state.session) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  }

  function setCanvasSize(w, h) {
    const canvas = state.canvas;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  }

  // --- XR session -------------------------------------------------------------------------

  async function supported(mode) {
    if (!navigator.xr || !navigator.gpu || typeof XRGPUBinding === 'undefined') return false;
    try {
      return await navigator.xr.isSessionSupported(mode);
    } catch {
      return false;
    }
  }

  async function start(mode) {
    if (state.session) return;
    if (!state.device || !state.unity) throw new Error('Unity is still loading');
    const session = await navigator.xr.requestSession(mode, {
      requiredFeatures: ['webgpu'], // 'local' is implied for immersive sessions
    });
    try {
      const binding = new XRGPUBinding(session, state.device);
      const layerFormat = binding.getPreferredColorFormat();
      const layer = binding.createProjectionLayer({
        colorFormat: layerFormat,
        textureType: 'texture-array',
      });
      session.updateRenderState({ layers: [layer], depthNear: 0.05, depthFar: 100 });
      state.refSpace = await session.requestReferenceSpace('local');
      state.binding = binding;
      state.layer = layer;
      state.layerFormat = layerFormat;
    } catch (err) {
      await session.end().catch(() => undefined);
      throw err;
    }
    state.session = session;
    state.mode = mode;
    state.recenter = 0;
    session.addEventListener('select', () => state.recenter++);
    session.addEventListener('end', onSessionEnd, { once: true });
    const canvas = state.canvas;
    state.savedCanvasStyle = canvas.style.opacity;
    canvas.style.opacity = '0'; // keeps rendering; the XR layer is what is shown
    document.documentElement.classList.add('holoxr-active');
    rescheduleUnity();
    emit();
  }

  function onSessionEnd() {
    state.session = null;
    state.mode = null;
    state.binding = null;
    state.layer = null;
    state.refSpace = null;
    state.buffer[B.ACTIVE] = 0;
    state.buffer[B.VIEW_COUNT] = 0;
    if (state.unity) state.unity.write(state.buffer);
    if (state.canvas) state.canvas.style.opacity = state.savedCanvasStyle ?? '';
    document.documentElement.classList.remove('holoxr-active');
    rescheduleUnity();
    emit();
  }

  function end() {
    if (state.session) return state.session.end();
    return Promise.resolve();
  }

  function blendCode(mode) {
    return mode === 'additive' ? 2 : mode === 'alpha-blend' ? 1 : 0;
  }

  function onXRFrame(time, frame, func, generation) {
    if (generation !== state.generation || frame.session !== state.session) return;
    const session = state.session;
    const pose = frame.getViewerPose(state.refSpace);
    const views = pose ? pose.views : [];
    const subImages = [];
    for (const view of views) {
      const sub = state.binding.getViewSubImage(state.layer, view);
      if (sub.viewport.width > 0 && sub.viewport.height > 0) subImages.push({ view, sub });
    }

    const buf = state.buffer;
    const n = Math.min(subImages.length, 2);
    buf[B.ACTIVE] = n > 0 ? 1 : 0;
    buf[B.VIEW_COUNT] = n;
    state.views = n;
    buf[B.WORLD_SCALE] = state.worldScale;
    buf[B.DISTANCE] = state.distance;
    buf[B.RECENTER] = state.recenter;
    buf[B.BLEND] = blendCode(session.environmentBlendMode);
    buf[B.BLOOM_THRESHOLD] = state.bloom[0] ?? 0.5;
    buf[B.BLOOM_SCATTER] = state.bloom[1] ?? 0.5;
    for (let i = 0; i < n; i++) {
      const { view } = subImages[i];
      const o = B.VIEW0 + i * B.VIEW_STRIDE;
      buf.set(view.projectionMatrix, o);
      const p = view.transform.position;
      const q = view.transform.orientation;
      buf[o + 16] = p.x;
      buf[o + 17] = p.y;
      buf[o + 18] = p.z;
      buf[o + 19] = q.x;
      buf[o + 20] = q.y;
      buf[o + 21] = q.z;
      buf[o + 22] = q.w;
    }
    state.unity.write(buf);

    if (n > 0) {
      // Per-view render size. A HoloKit eye covers about half the screen width, so in stereo each
      // view gets half the layer width: the same pixel count as mono. The blit rescales to the layer.
      const vp = subImages[0].sub.viewport;
      const w = Math.max(1, Math.round((vp.width / n) * state.renderScale));
      const h = Math.max(1, Math.round(vp.height * state.renderScale));
      setCanvasSize(w * n, h);
    }

    func(time); // Unity frame: reads the buffer, renders the views side by side, schedules the next frame

    if (n > 0) blitToLayer(subImages.slice(0, n), session.environmentBlendMode !== 'opaque');
  }

  // --- Blit Unity canvas -> XR layer ------------------------------------------------------

  function blitResources(format) {
    if (state.blit && state.blit.format === format) return state.blit;
    const device = state.device;
    const module = device.createShaderModule({ label: 'holoxr-blit', code: BLIT_WGSL });
    const pipeline = device.createRenderPipeline({
      label: 'holoxr-blit',
      layout: 'auto',
      vertex: { module, entryPoint: 'vs' },
      fragment: { module, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
    const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
    const uniforms = [0, 1].map(() =>
      device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
    );
    state.blit = { format, pipeline, sampler, uniforms };
    return state.blit;
  }

  function blitToLayer(items, lumaAlpha) {
    const device = state.device;
    const source = state.context.getCurrentTexture(); // the texture Unity just rendered
    const res = blitResources(state.layerFormat);
    const sourceView = source.createView();
    const encoder = device.createCommandEncoder({ label: 'holoxr-present' });
    const n = items.length;
    items.forEach(({ sub }, i) => {
      device.queue.writeBuffer(res.uniforms[i], 0, new Float32Array([i / n, 0, 1 / n, 1, lumaAlpha ? 1 : 0, state.blackLevel, 0, 0]));
      const bindGroup = device.createBindGroup({
        layout: res.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: sourceView },
          { binding: 1, resource: res.sampler },
          { binding: 2, resource: { buffer: res.uniforms[i] } },
        ],
      });
      const target = sub.colorTexture.createView(sub.getViewDescriptor());
      const pass = encoder.beginRenderPass({
        colorAttachments: [{ view: target, loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 0] }],
      });
      const vp = sub.viewport;
      pass.setViewport(vp.x, vp.y, vp.width, vp.height, 0, 1);
      pass.setScissorRect(vp.x, vp.y, vp.width, vp.height);
      pass.setPipeline(res.pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
    });
    device.queue.submit([encoder.finish()]);
  }

  // --- Page API ---------------------------------------------------------------------------

  function emit() {
    const status = api.status();
    state.listeners.forEach((l) => l(status));
  }

  const api = {
    B,
    /** Call before createUnityInstance with the canvas Unity will render into. */
    setCanvas(canvas) {
      state.canvas = canvas;
      window.addEventListener('resize', fitCanvasToPage);
      fitCanvasToPage();
    },
    attachUnity,
    supported,
    start,
    end,
    status() {
      return { ready: !!(state.device && state.unity), mode: state.mode, session: !!state.session, views: state.session ? state.views : 0, placements: state.recenter };
    },
    onChange(listener) {
      state.listeners.add(listener);
      return () => state.listeners.delete(listener);
    },
    recenter() {
      state.recenter++;
    },
  };

  installGPUHooks();
  window.HoloXR = api;
})();
