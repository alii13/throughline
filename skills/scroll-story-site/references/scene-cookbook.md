# Scene cookbook

Every scene below was built and shipped. Each is "one subject, one action", under ~60 lines of build
code plus ~15 lines in the frame loop. Copy the shape, swap the subject. The shared helpers they rely
on (`textureFrom`, `label`, `roundRect`, `M`, `glassMat`, `dummy`, `smooth`, `bump`, `local`, `w`,
`ACT`) are all in `assets/world.template.js`.

Contents:
1. Look and materials (read first)
2. Canvas-texture labels and logos
3. The carrier (medallion)
4. A screenshot that inflates, then shatters
5. A stream through a relay, with items peeling off
6. A chip that gets stamped, with rings
7. A chain of plates lit by a travelling spark
8. A bar ledger scanned by a beam
9. A privacy glass: content shatters, counts pass
10. The real artefact, with the carrier landing on its printed mark
11. Logo tiles wired in, and "coming soon" tiles behind glass
12. Devices booting (one live, others waiting)
13. An endless loop with beads (and a count baked into it)
14. Scene-action timing patterns

## 1. Look and materials

The world is dark (`#06080b`), the metal is lit by a studio environment map, and everything glowing
is an unlit `MeshBasicMaterial` with values above 1.0 and `toneMapped: false`, so it blooms without a
post-processing pass.

```js
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
scene.fog = new THREE.FogExp2(BG, 0.04);                 // stations far along x fade into the dark
```

The studio: a dark room with bright cards at specific places, baked through `PMREMGenerator`. This
is MengTo's 3d-metal-material recipe and it is the single biggest reason the metal looks expensive.
Cards above and to the left (cool, bright), one warm card behind, a floor card nearly black. Don't
add lights to the scene; the env map is the lighting.

The material family (`M`): `steel` (roughnessMap from a procedural brushed texture, so highlights
streak), `chrome` (roughness 0.06), `enamel` (coloured, clearcoat 1), `gold`, `dark` (near-black
clearcoat, for panels and bodies), `glow` (unlit blue at 2.4 intensity), `slip` (flat light grey for
paper). Plus `glassMat` (transmission 1, ior 1.45, blue attenuation) for anything "not yet".

Colour rule: **live = dark body + chrome + glow; coming soon = glass + grey at 55% alpha + dashed
line.** Readers learn it in one chapter and read it everywhere after.

Design-signature rule: give every chapter one "hero accent" in the glow blue and keep everything
else in the steel/dark family. Gold appears exactly once, for the thing that costs money.

## 2. Canvas-texture labels and logos

Anything with text is a 2D canvas drawn once and mapped on a plane. Fonts match the page (system
sans and mono), so the world and the copy feel like one document.

```js
function textureFrom(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();   // text stays sharp at grazing angles
  textures.push(t);                                          // so it can be uploaded before the first frame
  return t;
}
/** lines[0] is the title (650 weight), the rest are subtitles (500, 72% size, grey) */
function label(lines, width, { size = 46, pad = 24, color = "#eef2f7", sub = "#8b95a3", mono = false } = {}) { … }
```

Logos: take the path from Simple Icons (CC0, 24×24 grid), draw it with `Path2D`:

```js
const fillMark = (d, style) => (x) => { x.fillStyle = typeof style === "function" ? style(x) : style; x.fill(new Path2D(d)); };
// inside a textureFrom draw: translate to the tile's padding, scale (tileSize * 0.56) / 24, then paint(x)
```

If Simple Icons lacks a mark (Windows isn't in it), draw it: four panes is one path. If a mark was
removed in a newer Simple Icons major (OpenAI left in 16.x), take it from the last version that had
it (13.0.0). Gradients work: `style` can be a function returning a `createLinearGradient`.

## 3. The carrier (medallion)

A 24-point star extruded with a bevel, an enamel disc in the middle, a chrome lip, and the logo
drawn as a chrome tube along a polyline of points. Build the shape in the 2D coordinates of the
logo's own SVG and divide by a constant so you can read the SVG numbers straight into `pts`.

```js
const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.035, bevelSegments: 5, curveSegments: 1 });
geo.translate(0, 0, -depth / 2);            // centre it, so rotation is about its own face
```

Give the body its own cloned material (`medalSteel = M.steel.clone()`) so one chapter can lerp its
colour to gold without gilding every steel object. The carrier is added to `scene`; it is the only
object that is not inside a station.

## 4. A screenshot that inflates, then shatters

The subject is a fake dashboard drawn on a canvas: a big number that keeps growing (redrawn every
70 ms with a blinking caret and a red "edited 2s ago"). Cut the plane into an 8×4 grid of shards,
each a `PlaneGeometry` with its UVs remapped to its cell so the shards show the right piece:

```js
for (let k = 0; k < uv.count; k++) uv.setXY(k, (c + uv.getX(k)) / COLS, 1 - (r + 1 - uv.getY(k)) / ROWS);
m.userData = { home, v: random outward velocity (mostly +x, toward the next station), spin, delay: (c / COLS) * 0.25 + rand * 0.1 };
```

Action: `crack = smooth(0.34, ACT + 0.08, local(1))`; each shard moves `home + v * k * 2.2` with a
gravity term `- k² * 0.8`, rotates `spin * k`, shrinks to 15%. The `delay` by column makes it crack
from the left, in the direction of travel.

## 5. A stream through a relay, with items peeling off

Two "windows" (dark box + canvas face with traffic-light dots, a title, mono lines; the last line in
an accent colour) flank the carrier. An `InstancedMesh` of 260 small chrome cubes flows left to right
along x with a squeeze toward the centre (`1 - 0.7 * exp(-x² * 1.4)`) so they funnel through the
carrier. Every 7th cube is "the count": past the centre it leaves the stream on a curve toward the
next station and is drawn from a second `InstancedMesh` with the glow material (same index trick:
scale the chrome one to 0 and the glow one to 1).

Phones get 150 instances instead of 260 (`small()` at build time).

## 6. A chip that gets stamped, with rings

A flat dark box, a canvas die (grid lines, random lit cells, a mono label), 64 gold pins as one
`InstancedMesh` placed around four sides. The carrier's pose for this chapter is flat
(`r: [-π/2, 0, 0]`) above the chip. Action: the carrier dips `0.55 * bump(((local(3) * 3) % 1) / 0.35)`
three times during `ACT`, and three torus rings expand and fade out of each stamp:

```js
const phase = (local(3) * 3) % 1;
rings.forEach((r, k) => { const age = clamp((phase - 0.17 - k * 0.07) / 0.6); r.scale.setScalar(0.4 + age * 1.6); r.material.opacity = local(3) < ACT && age > 0 ? (1 - age) * 0.9 : 0; });
```

## 7. A chain of plates lit by a travelling spark

Three rounded-rectangle plates (one `ExtrudeGeometry` shared), each with a `label` and a glow edge
whose material is cloned so it can light independently; chrome torus links between them; one glow
sphere. Action: `p = smooth(0.05, ACT, local(4))`, the spark descends from the top plate to the
carrier at the bottom, each plate's edge lights as the spark passes (`smooth(0, 0.08, p - k * 0.4)`).
The reader sees a chain of trust being walked, not told.

## 8. A bar ledger scanned by a beam

Real data (last 56 days) as one `InstancedMesh` of boxes, heights on a log scale
(`0.08 + 1.7 * log10(1 + v) / log10(1 + max)`), all grey. A thin additive-blended plane is the beam.
Action: `scan = smooth(0.04, ACT, local(5))`; the beam sweeps across and every bar it has passed
recolours to what it really is (blue ×2.2 for signed, light grey for self-reported). The carrier's
x follows the beam, so the carrier is the scanner.

## 9. A privacy glass: content shatters, counts pass

A thin tall box of `glassMat` plus a wireframe outline. Two instanced sets flow toward it: paper
slips (`PlaneGeometry 0.42×0.05`, flat grey) that hit the glass and tumble down (`k2 = clamp((x + 0.05) / 1.8)`,
position falls by `k2² * 2.2`, rotation spins up, scale shrinks), and glow cubes that pass straight
through to the carrier on the other side. Two labels above name the two streams. The carrier sits on
the far side, flat, catching what passes.

## 10. The real artefact, with the carrier landing on its printed mark

The product's actual card (an SVG rendered by the server, handed over as a `data:` URL in the data
block) is loaded into an `Image`, drawn to a 3× canvas, and mapped on a plane sized to the card's
aspect. A "username / README.md" label sits above it. The carrier's pose for this chapter is the
exact position of the printed seal on the card, computed from the card's own pixel coordinates:

```js
const CARD_W = 4.2, CARD_H = (CARD_W * 178) / 495;                       // the card's real aspect
const SEAL_AT = [-CARD_W / 2 + (29 / 495) * CARD_W, CARD_H / 2 - (26 / 178) * CARD_H, 0.012];
{ cam: [0, 0.2, 9.6], target: [0, 0.15, 0], carrier: { p: SEAL_AT, r: [0, 0, 0], s: 0.076 } }
```

`z: 0.012`, nearly flush: at 0.09 the seal visibly slid off its print as the camera moved
(parallax). The card height has to be the card's real height; a 195 where the card is 178 put the
carrier a whole seal-width off. This landing is the payoff of the whole story; get it exact.

## 11. Logo tiles wired in, and "coming soon" tiles behind glass

A rounded square `ExtrudeGeometry` shared by all tiles. Live tiles: dark body, logo at full alpha, a
chrome `TubeGeometry` cable on a `CatmullRomCurve3` from the tile to the carrier, 18 glow pulses per
cable travelling along it (`curve.getPointAt((k / N + t * 0.22) % 1)`). Coming-soon tiles: glass
body, logo at 55% alpha, a `LineDashedMaterial` cable with `dashOffset = -t * 0.05` so the dashes
crawl, and every so often a tile turns over once:

```js
g.rotation.y = -0.3 + Math.PI * 2 * smooth(0.82, 1, ((t * 0.09 + k * 0.31) % 1));   // a card about to be dealt in
```

No text in the scene: the logos carry it, the copy names them.

## 12. Devices booting (one live, others waiting)

A laptop is a base box, a lid group rotated -0.22, a shell box, a screen plane with the platform's
logo on a canvas, and a boot bar (track + fill, the fill's geometry translated so it scales from the
left). The live one: chrome base, dark shell, black screen, glow fill at 100%. The waiting ones:
glass base and shell, 55% logo, grey fill creeping `0.25 + 0.35 * (0.5 + 0.5 * sin(t * 0.6 + k * 1.7))`.
Place the live one front and centre, the others behind at ±1.55, scaled 0.85, turned toward it.

## 13. An endless loop with beads (and a count baked into it)

A lemniscate as a custom `THREE.Curve`:

```js
forever.getPoint = (u, out = new THREE.Vector3()) => {
  const a = u * Math.PI * 2, d = 1 + Math.sin(a) ** 2;
  return out.set((1.55 * Math.cos(a)) / d, (1.55 * Math.sin(a) * Math.cos(a)) / d, -0.3 + 0.2 * Math.sin(a));
};
```

A chrome tube along it, and N beads as one `InstancedMesh` with per-instance colour (`setColorAt`):
one bead per unit of something real (licenses on offer), the first `sold` of them gold and 20%
larger, the rest blue. The beads circulate (`(k / N + t * 0.05) % 1`) and breathe
(`0.6 + 0.4 * sin(k * 0.7 + t * 2)²`). The carrier sits at the crossing and its steel lerps to gold
as the chapter arrives: `gilt = smooth(0.3, 0.9, w(10))`. Gold the bead with
`setRGB(1.7, 0.95, 0.26)`, not a brighter yellow; the first try read as lemon.

## 14. Scene-action timing patterns

All actions key off `local(c) = clamp(sNow - c)` and finish by `ACT = 0.6`:

| Pattern | Formula | Used by |
|---|---|---|
| One sweep | `smooth(0.04, ACT, local(c))` | scan, spark |
| N beats | `bump(((local(c) * N) % 1) / 0.35)` gated by `local(c) < ACT` | stamp ×3 |
| Break apart | `smooth(0.34, ACT + 0.08, local(c))` with per-piece `delay` | shatter |
| Arrive | `smooth(0.3, 0.9, w(c))` (symmetric: undoes itself when you scroll back) | gold |
| Idle life | `sin(t * k)` terms, only while `station.visible` | breathing, pulses, flow |

Everything is a pure function of `sNow` and `t`, so scrolling back up reverses every action
exactly. Never keep state that only moves forward (a "played" flag); it breaks on the way back.

Per-frame work only runs inside `if (station.visible)`, and instanced updates end with
`instanceMatrix.needsUpdate = true` (and `instanceColor.needsUpdate` when colours change).
