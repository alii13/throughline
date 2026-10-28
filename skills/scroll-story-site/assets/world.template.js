// One persistent 3D world, conducted by native scroll. The story is a list of stations along x; the camera
// glides between them as the reader scrolls, and one carrier object travels through every scene.
//
// This file runs as is: a hero, two placeholder scenes (a card that shatters, a stream through the carrier)
// and a close. Replace the placeholder stations with the story's own subjects; keep the conductor.
// Structure after MengTo's build-threejs-scroll-worlds; metal after his 3d-metal-material.
import * as THREE from "three";

const data = JSON.parse(document.getElementById("tp-data").textContent);
const canvas = document.getElementById("world");
const sections = [...document.querySelectorAll("[data-ch]")];
const copies = sections.map((s) => s.querySelector(".copy"));
const steps = [...document.querySelectorAll("[data-step]")];
const rail = document.querySelector(".rail");
const solid = document.getElementById("after");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = () => innerWidth < 900;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
const BG = 0x06080b;
renderer.setClearColor(BG, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(BG, 0.04);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);

// ---------------------------------------------------------------- helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const linear = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
const bump = (x) => Math.sin(clamp(x) * Math.PI);
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';
const textures = [];

function textureFrom(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  textures.push(t);
  return t;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/** A flat text label living in the world, `width` in world units. lines[0] is the title, the rest subtitles. */
function label(lines, width, { size = 46, pad = 24, color = "#eef2f7", sub = "#8b95a3", mono = false } = {}) {
  const w = 1024, lh = size * 1.32, h = Math.ceil(pad * 2 + lh * lines.length);
  const tex = textureFrom(w, h, (g) => {
    lines.forEach((line, i) => {
      g.font = `${i ? 500 : 650} ${i ? size * 0.72 : size}px ${mono ? MONO : FONT}`;
      g.fillStyle = i ? sub : color;
      g.fillText(line, pad, pad + lh * (i + 0.78));
    });
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, (width * h) / w),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
}

// ---------------------------------------------------------------- studio: the only light in the world
function studio() {
  const room = new THREE.Scene();
  room.background = new THREE.Color().setRGB(0.045, 0.05, 0.06);
  const card = (w, h, [r, g, b], pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(r, g, b), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...pos); m.lookAt(0, 0, 0); room.add(m);
  };
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) card(1.08, 1.2, [3.8, 3.55, 3.05], [-5 + (i - 1.5) * 0.78, 4.2 + (j - 1) * 0.88, 4.8]);
  card(3.0, 5.4, [0.52, 0.68, 0.9], [6, 1.6, 2]);
  card(2.0, 4.6, [0.8, 0.68, 0.52], [2.5, 2.2, -5.5]);
  card(7.5, 2.2, [0.52, 0.55, 0.6], [0, 6, 0]);
  card(9, 9, [0.07, 0.075, 0.09], [0, -4, 0]);
  card(0.7, 7, [2.4, 2.5, 2.7], [-2.4, 0.4, 6.5]);
  card(0.5, 7, [1.3, 1.4, 1.6], [2.8, -0.2, 6.5]);
  card(1.2, 6, [0.25, 0.55, 1.6], [-6, -0.5, 1.5]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.006).texture;
  pmrem.dispose();
  return env;
}
const env = studio();
scene.environment = env;

// ---------------------------------------------------------------- materials (one family for the whole world)
function brushed() {
  const size = 1024;
  const t = textureFrom(size, size, (g) => {
    g.fillStyle = "rgb(0,46,0)"; g.fillRect(0, 0, size, size);
    for (let r = 2; r < size * 0.72; r += 1.2) {
      g.strokeStyle = `rgb(0,${(30 + Math.random() * 40 + (Math.random() < 0.02 ? 60 : 0)) | 0},0)`;
      g.lineWidth = 0.6 + Math.random();
      g.beginPath(); g.arc(size / 2, size / 2, r, 0, Math.PI * 2); g.stroke();
    }
  });
  t.colorSpace = THREE.NoColorSpace;
  t.repeat.set(0.5, 0.5); t.offset.set(0.5, 0.5);
  return t;
}
const M = {
  steel: new THREE.MeshPhysicalMaterial({ color: linear(0.72, 0.73, 0.75), metalness: 1, roughness: 1, roughnessMap: brushed(), envMap: env }),
  chrome: new THREE.MeshPhysicalMaterial({ color: linear(0.8, 0.82, 0.85), metalness: 1, roughness: 0.06, envMap: env, envMapIntensity: 1.15 }),
  enamel: new THREE.MeshPhysicalMaterial({ color: linear(0.02, 0.15, 0.66), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, envMap: env, envMapIntensity: 0.9 }),
  gold: new THREE.MeshPhysicalMaterial({ color: linear(1.0, 0.71, 0.29), metalness: 1, roughness: 0.22, envMap: env }),
  dark: new THREE.MeshPhysicalMaterial({ color: linear(0.012, 0.014, 0.02), metalness: 0.3, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, envMap: env }),
  glow: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.35, 0.75, 2.4), toneMapped: false }),
};
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0, roughness: 0.06, transmission: 1, thickness: 0.4, ior: 1.45,
  clearcoat: 1, envMap: env, envMapIntensity: 1.2, attenuationColor: new THREE.Color(0x9fc4ff), attenuationDistance: 2.5,
});

// ---------------------------------------------------------------- the carrier
// Replace with the product's own object (its seal, its logo made solid). Keep: centred geometry, its own
// cloned body material so one chapter can recolour it, added to the scene rather than a station.
function carrierObject() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  for (let i = 0; i < 24; i++) {
    const a = (Math.PI * 2 * i) / 24 - Math.PI / 2, r = i % 2 ? 0.86 : 1;
    i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const depth = 0.16, bevel = 0.045;
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: 0.035, bevelSegments: 5, curveSegments: 1 });
  geo.translate(0, 0, -depth / 2);
  g.add(new THREE.Mesh(geo, M.steel));
  const face = depth / 2 + bevel;
  const field = new THREE.Mesh(new THREE.CylinderGeometry(0.735, 0.735, 0.03, 128), M.enamel);
  field.rotation.x = Math.PI / 2; field.position.z = face + 0.004; g.add(field);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.022, 24, 160), M.chrome);
  lip.position.z = face + 0.01; g.add(lip);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 24), M.chrome);
  dot.scale.z = 0.55; dot.position.z = face + 0.03; g.add(dot);
  return g;
}
const carrier = carrierObject();
scene.add(carrier);
const carrierBody = M.steel.clone();
carrier.children[0].material = carrierBody;
const STEEL = carrierBody.color.clone(), GOLD = linear(1.0, 0.71, 0.29);

// ---------------------------------------------------------------- stations
const STATION = 12;
const stations = [];
const station = (c) => { const g = new THREE.Group(); g.position.x = c * STATION; scene.add(g); stations[c] = g; return g; };
const dummy = new THREE.Object3D();

// 1 · placeholder: a card whose number keeps inflating, then shatters toward the next station
const fake = station(1);
const FAKE_W = 3.6, FAKE_H = 1.9, COLS = 8, ROWS = 4;
const fakeCanvas = document.createElement("canvas");
fakeCanvas.width = 1024; fakeCanvas.height = 540;
const fakeTex = new THREE.CanvasTexture(fakeCanvas);
fakeTex.colorSpace = THREE.SRGBColorSpace;
textures.push(fakeTex);
let fakeValue = 9_483_120_551;
function drawFake(blink) {
  const g = fakeCanvas.getContext("2d"), w = 1024, h = 540;
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#0d1117"; roundRect(g, 4, 4, w - 8, h - 8, 34); g.fill();
  g.strokeStyle = "#30363d"; g.lineWidth = 3; roundRect(g, 4, 4, w - 8, h - 8, 34); g.stroke();
  g.font = `600 34px ${FONT}`; g.fillStyle = "#9198a1"; g.fillText(data.problemTitle ?? "A number anyone can type", 60, 92);
  g.font = `700 112px ${FONT}`; g.fillStyle = "#eef2f7";
  const text = fakeValue.toLocaleString("en-US");
  g.fillText(text, 56, 268);
  if (blink) { const x = 56 + g.measureText(text).width + 10; g.fillStyle = "#4493f8"; g.fillRect(x, 170, 7, 112); }
  g.font = `500 28px ${MONO}`; g.fillStyle = "#f85149"; g.fillText("● edited 2s ago", 60, 452);
  fakeTex.needsUpdate = true;
}
drawFake(true);
const shardMat = new THREE.MeshBasicMaterial({ map: fakeTex, transparent: true, side: THREE.DoubleSide });
const shards = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const geo = new THREE.PlaneGeometry(FAKE_W / COLS, FAKE_H / ROWS);
  const uv = geo.attributes.uv;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (c + uv.getX(k)) / COLS, 1 - (r + 1 - uv.getY(k)) / ROWS);
  const m = new THREE.Mesh(geo, shardMat);
  const home = new THREE.Vector3(-FAKE_W / 2 + (c + 0.5) * (FAKE_W / COLS), FAKE_H / 2 - (r + 0.5) * (FAKE_H / ROWS), 0);
  m.position.copy(home);
  m.userData = { home, v: new THREE.Vector3(1.5 + Math.random() * 3.5, (Math.random() - 0.5) * 2.2, (Math.random() - 0.3) * 2.5), spin: new THREE.Vector3(Math.random() * 4, Math.random() * 4, Math.random() * 3), delay: (c / COLS) * 0.25 + Math.random() * 0.1 };
  fake.add(m); shards.push(m);
}

// 2 · placeholder: a stream of items funnels through the carrier; every 7th peels off toward the next station
const relay = station(2);
const RELAY_L = 1.9;
const relayTag = label([data.relayTitle ?? "the mechanism", "replace this scene with yours"], 1.5, { size: 40, mono: true, color: "#a5c8ff" });
relayTag.position.set(-0.75, -1.25, 0); relay.add(relayTag);
const FLOW = small() ? 150 : 260;
const tokens = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), M.chrome, FLOW);
const counts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.085, 0.085, 0.085), M.glow, Math.ceil(FLOW / 7));
relay.add(tokens, counts);
const seed = Array.from({ length: FLOW }, () => [Math.random(), (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, Math.random() * 6.28]);

// ---------------------------------------------------------------- dust along the whole path
const LAST_STATION = 3;
const dust = (() => {
  const n = 1400, geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { p[i * 3] = -8 + Math.random() * (STATION * LAST_STATION + 16); p[i * 3 + 1] = (Math.random() - 0.5) * 14; p[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2; }
  geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x6fa8ff, size: 0.025, transparent: true, opacity: 0.45, depthWrite: false }));
  scene.add(pts);
  return pts;
})();

// ---------------------------------------------------------------- chapters, as data
// Station c sits at x = c * STATION. cam/target/carrier.p are relative to the station. off shifts the frame
// so the subject sits right of the copy; md is how much further the camera sits on a phone, yo how far down
// the frame shifts there. Tune at 1440 x 900.
const CHAPTERS = [
  { md: 1.35, off: 0.21, cam: [0, 0, 8.2], target: [0, 0, 0], carrier: { p: [0, 0, 0], r: [-0.26, -0.32, 0], s: 1 } },
  { md: 2.1, off: 0.24, cam: [0.6, 0.5, 9.2], target: [0.3, -0.1, 0], carrier: { p: [1.9, -1.25, 0.9], r: [-0.1, -0.7, 0], s: 0.42 } },
  { md: 1.9, off: 0.2, cam: [-1.5, 1.4, 10.6], target: [-0.6, -0.25, 0], carrier: { p: [0, 0, 0], r: [0, -1.27, 0], s: 0.55 } },
  { md: 1.9, off: 0, cam: [0, 0, 7.4], target: [0, 0.25, 0], carrier: { p: [0, 1.05, 0], r: [-0.12, 0, 0], s: 0.6 } },
];
const LAST = CHAPTERS.length - 1;
const at3 = (c, v) => [v[0] + c * STATION, v[1], v[2]];

// ---------------------------------------------------------------- scroll conductor
let sTarget = 0, sNow = 0;
function readScroll() {
  const vh = innerHeight;
  sTarget = sections.reduce((s, el) => {
    const r = el.getBoundingClientRect();
    return s + clamp(-r.top / Math.max(1, r.height - vh));
  }, 0);
}
addEventListener("scroll", readScroll, { passive: true });

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

// drag the carrier to spin it; the copy overlays the canvas, so hits are found by raycast, not canvas events
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const onCarrier = (e) => {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.intersectObject(carrier, true).length > 0;
};
let drag = null, spin = 0, spinV = 0;
addEventListener("pointerdown", (e) => {
  if (e.button || e.target.closest("a, button, code, details") || !onCarrier(e)) return;
  e.preventDefault();
  drag = { x: e.clientX, spin };
  document.documentElement.style.cursor = "grabbing";
});
addEventListener("pointermove", (e) => {
  if (!drag) { if (e.pointerType === "mouse") document.documentElement.style.cursor = onCarrier(e) ? "grab" : ""; return; }
  const next = drag.spin + (e.clientX - drag.x) * 0.012;
  spinV = next - spin;
  spin = next;
}, { passive: true });
const drop = () => { drag = null; document.documentElement.style.cursor = ""; };
addEventListener("pointerup", drop);
addEventListener("pointercancel", drop);

// Poses are tuned for a 1440px window, where the scene has the right 53% beside the copy column. Narrower
// windows give the copy a bigger share, so side-framed scenes re-centre in what's left and pull back to fit.
let frameShift = 0, frameScale = 1;
function resize() {
  const left = (innerWidth - Math.min(1160, innerWidth - 40)) / 2, free = clamp((innerWidth - left - 540) / innerWidth, 0.3, 1);
  frameShift = 0.264 - free / 2;
  frameScale = clamp(0.528 / free, 1, 1.4);
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const target = new THREE.Vector3();
let t = 0, last = performance.now(), shown = false, fakeTick = 0;
// The camera settles on a chapter for the first HOLD of its scroll, easing in by PUSH so scrolling never feels stuck,
// then glides to the next one over the rest. Each scene's own action plays out over ACT.
const HOLD = 0.3, PUSH = 0.07, ACT = 0.6;

function frame(now) {
  const real = Math.min((now - last) / 1000, 0.25);
  const dt = Math.min(real, 1 / 30);
  last = now;
  if (!reduced) t += dt;
  // smoothing runs on wall time, so slow frames never leave the world behind the page
  sNow = reduced ? sTarget : lerp(sNow, sTarget, 1 - Math.exp(-real / 0.2));
  pointer.x = lerp(pointer.x, pointer.tx, 0.05); pointer.y = lerp(pointer.y, pointer.ty, 0.05);

  const i = Math.min(Math.floor(sNow), LAST), f = sNow - i;
  const e = i >= LAST ? 0 : smooth(HOLD, 1, f);
  const A = CHAPTERS[i], B = CHAPTERS[Math.min(i + 1, LAST)];
  const at = i + e;
  const local = (c) => clamp(sNow - c);
  const w = (c) => clamp(1 - Math.abs(at - c));
  const mobile = small();

  // copy: one chapter at a time, crossfading exactly while the camera travels
  copies.forEach((el, c) => {
    const op = 1 - smooth(0.1, 0.45, Math.abs(at - c));
    el.style.setProperty("--op", op.toFixed(3));
    el.style.visibility = op > 0.001 ? "visible" : "hidden";
    el.style.pointerEvents = op > 0.6 ? "auto" : "none";
  });
  // the journey rail lights each stage the story has passed
  steps.forEach((el) => el.classList.toggle("on", at >= Number(el.dataset.step) - 0.35));
  if (rail) rail.style.setProperty("--op", (clamp((at - 0.4) * 2) * clamp((LAST - 0.4 - at) * 2)).toFixed(3));

  // camera: glide between stations
  const cam = lerp3(at3(i, A.cam), at3(i + 1, B.cam), e), tg = lerp3(at3(i, A.target), at3(i + 1, B.target), e);
  // the push-in reached during the hold eases back out over the glide, so the next chapter starts where it should
  const push = lerp(1 - PUSH * smooth(0, HOLD, f), 1, e);
  const dist = push * (mobile ? lerp(A.md, B.md, e) : lerp(A.off ? frameScale : 1, B.off ? frameScale : 1, e));
  camera.position.set(tg[0] + (cam[0] - tg[0]) * dist + pointer.x * 0.35, tg[1] + (cam[1] - tg[1]) * dist - pointer.y * 0.2, tg[2] + (cam[2] - tg[2]) * dist);
  target.set(...tg);
  camera.lookAt(target);
  const off = mobile ? 0 : lerp(A.off && A.off + frameShift, B.off && B.off + frameShift, e);
  const yo = mobile ? lerp(A.yo ?? 0.24, B.yo ?? 0.24, e) : 0;
  camera.setViewOffset(innerWidth, innerHeight, -off * innerWidth, yo * innerHeight, innerWidth, innerHeight);

  // carrier: flies between stations with an arc and one full turn
  const mp = lerp3(at3(i, A.carrier.p), at3(i + 1, B.carrier.p), e), mr = lerp3(A.carrier.r, B.carrier.r, e);
  const ms = lerp(A.carrier.s, B.carrier.s, e) * (1 + 0.15 * bump(e));
  mp[1] += 0.35 * bump(e);
  // a coin-roll about its own face while it flies, so the front always faces you on arrival
  mr[2] -= e * Math.PI * 2;
  if (!drag) { spin += spinV; spinV *= 0.94; spin *= 0.985; }
  mr[1] += spin;
  // sway only where the carrier rests (hero and close); elsewhere its pose is exact so it can land on things
  const sway = w(0) + w(LAST);
  mr[1] += (Math.sin(t * 0.33) * 0.3 + pointer.x * 0.5) * sway + Math.sin(t * 0.4) * 0.4 * w(LAST);
  mr[0] += (Math.sin(t * 0.21) * 0.07 + pointer.y * 0.3) * sway;
  mp[1] += Math.sin(t * 0.6) * 0.035 * (sway + w(1));
  carrier.position.set(...mp);
  carrier.rotation.set(mr[0], mr[1], mr[2]);
  carrier.scale.setScalar(ms);

  // a scene exists only while its chapter is on screen or being travelled to or from
  stations.forEach((g, c) => { if (g) g.visible = Math.abs(at - c) < 0.985; });

  // 1 · the number inflates, then the card shatters toward the next station
  if (fake.visible) {
    if (!reduced && now - fakeTick > 70) {
      fakeTick = now;
      fakeValue += 7_654_321 + Math.floor(Math.random() * 900_000);
      drawFake(Math.floor(now / 450) % 2 === 0);
    }
    const crack = smooth(0.34, ACT + 0.08, local(1));
    shards.forEach((m) => {
      const { home, v, spin, delay } = m.userData;
      const k = clamp((crack - delay) / (1 - delay));
      m.position.set(home.x + v.x * k * 2.2, home.y + v.y * k - k * k * 0.8, home.z + v.z * k);
      m.rotation.set(spin.x * k, spin.y * k, spin.z * k);
      m.scale.setScalar(1 - k * 0.85);
    });
  }

  // 2 · the stream through the carrier
  if (relay.visible) {
    const speed = reduced ? 0 : 0.09;
    let ci = 0;
    seed.forEach(([u0, y0, z0, ph], k) => {
      const u = (u0 + t * speed) % 1;
      const x = -RELAY_L + u * RELAY_L * 2;
      const isCount = k % 7 === 0;
      if (isCount && x > 0) {
        // the item leaves the stream and heads for the next station
        const d = clamp(x / RELAY_L);
        dummy.position.set(d * 0.6, -d * 1.8, z0 * (1 - d));
        dummy.scale.setScalar(1 - d * 0.3);
        dummy.updateMatrix(); counts.setMatrixAt(ci++, dummy.matrix);
        dummy.scale.setScalar(0); dummy.updateMatrix(); tokens.setMatrixAt(k, dummy.matrix);
        return;
      }
      const squeeze = 1 - 0.7 * Math.exp(-x * x * 1.4);
      dummy.position.set(x, 0.1 + y0 * squeeze + Math.sin(u * 12 + ph) * 0.05, z0 * squeeze);
      dummy.rotation.set(ph + t, ph, 0);
      dummy.scale.setScalar(isCount && x > -0.3 ? 1.2 : 1);
      dummy.updateMatrix(); tokens.setMatrixAt(k, dummy.matrix);
      if (isCount) { dummy.scale.setScalar(0); dummy.updateMatrix(); counts.setMatrixAt(ci++, dummy.matrix); }
    });
    tokens.instanceMatrix.needsUpdate = true; counts.instanceMatrix.needsUpdate = true;
  }

  // the close: the carrier turns gold as it arrives (an example of a chapter recolouring the carrier)
  const gilt = smooth(0.3, 0.9, w(LAST));
  carrierBody.color.copy(STEEL).lerp(GOLD, gilt);
  carrierBody.roughness = 1 - 0.6 * gilt;

  dust.rotation.x = Math.sin(t * 0.05) * 0.02;

  renderer.render(scene, camera);
  // the copy's padding changes with .webgl, so the page refits its type
  if (!shown) { shown = true; document.documentElement.classList.add("webgl"); dispatchEvent(new Event("resize")); }
}

// Compile every shader and upload every texture now, so no scene stalls the first time it scrolls into view.
stations.forEach((g) => g && (g.visible = true));
renderer.compile(scene, camera);
textures.forEach((tex) => renderer.initTexture(tex));

// run while the world is on screen and the tab is visible
let running = false;
const loop = (now) => { if (!running) return; frame(now); requestAnimationFrame(loop); };
const update = () => {
  const covered = solid && solid.getBoundingClientRect().top <= 0;
  const next = !document.hidden && !covered;
  if (next && !running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  running = next;
};
document.addEventListener("visibilitychange", update);
addEventListener("scroll", update, { passive: true });
readScroll();
sNow = sTarget;
update();
