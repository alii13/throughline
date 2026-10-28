# World architecture

The world is one Three.js scene conducted by native scroll. Nothing here uses a scroll library, a
timeline library or GSAP: the whole conductor is ~60 lines, and every number in it is explained below.

## Coordinates

- `STATION = 12` world units between stations. Station `c` is a `THREE.Group` at `x = c * STATION`.
  Everything in a scene is positioned relative to its group. 12 was reached after 8 bled neighbouring
  scenes into the frame at wide camera angles; raise it before you shrink a scene.
- The carrier is added to `scene`, not to a station, because it travels. Its chapter positions are
  stored station-relative and converted with `at3(c, v) = [v[0] + c * STATION, v[1], v[2]]`.
- Dust (`THREE.Points`) spans the whole path: `x` from -8 to `STATION * LAST + 16`. Extend it when
  you add chapters or the last scenes sit in a void.

## Reading scroll

```js
const sections = [...document.querySelectorAll("[data-ch]")];
function readScroll() {
  const vh = innerHeight;
  sTarget = sections.reduce((s, el) => {
    const r = el.getBoundingClientRect();
    return s + clamp(-r.top / Math.max(1, r.height - vh));
  }, 0);
}
```

`sTarget` is a float: chapter index plus progress through it. Each section contributes 0 before it
reaches the top of the viewport, 1 once it has fully scrolled past, and the fraction in between. So the
scroll length of a chapter is its section height minus one viewport, which is why chapters are 210vh:
110vh of travel each. The hero is 170vh (less to read) and the close 130vh.

Always measure with `getBoundingClientRect`, never `offsetTop`: the copy panels are transformed, and
offsetTop is relative to the nearest positioned ancestor, which bit once.

## Smoothing

```js
const real = Math.min((now - last) / 1000, 0.25);   // wall time, capped so a tab switch can't jump
const dt = Math.min(real, 1 / 30);                   // animation time, capped so slow frames don't skip
sNow = reduced ? sTarget : lerp(sNow, sTarget, 1 - Math.exp(-real / 0.2));
```

The exponential form makes the smoothing frame-rate independent: 0.2 s is the time constant. Use
`real` for the scroll smoothing (the page must never lag the scrollbar by more than the constant) and
`dt` for scene animation (a dropped frame should not teleport tokens).

## Chapter, progress, weights

```js
const i = Math.min(Math.floor(sNow), LAST), f = sNow - i;   // chapter and progress within it
const e = i >= LAST ? 0 : smooth(HOLD, 1, f);                // travel toward the next chapter
const at = i + e;                                            // where the camera "is", as a float
const local = (c) => clamp(sNow - c);                        // raw progress past chapter c
const w = (c) => clamp(1 - Math.abs(at - c));                // 1 at chapter c, 0 one chapter away
```

- `smooth(a, b, x)` is a clamped smoothstep. `e` is 0 for the first `HOLD` of a chapter, then eases to
  1 by its end. `HOLD = 0.3`.
- `at` is what every visual keys off: copy opacity, station culling, carrier sway. `sNow` (raw) is
  only used for `local`, the per-scene action clock.
- `w(c)` is the handy "how much is chapter c on screen" weight for blends (gold lerp, sway).

## Copy crossfade

```js
copies.forEach((el, c) => {
  const op = 1 - smooth(0.1, 0.45, Math.abs(at - c));
  el.style.setProperty("--op", op.toFixed(3));
  el.style.visibility = op > 0.001 ? "visible" : "hidden";
  el.style.pointerEvents = op > 0.6 ? "auto" : "none";
});
```

Fully on within 0.1 of a chapter, fully off by 0.45, which matches the camera's glide so the words and
the scene leave together. `visibility` keeps hidden panels out of the tab order; `pointerEvents` keeps
a fading panel's links from stealing a click meant for the carrier.

## Camera

```js
const cam = lerp3(at3(i, A.cam), at3(i + 1, B.cam), e), tg = lerp3(at3(i, A.target), at3(i + 1, B.target), e);
const push = lerp(1 - PUSH * smooth(0, HOLD, f), 1, e);
const dist = push * (mobile ? lerp(A.md, B.md, e) : lerp(A.off ? frameScale : 1, B.off ? frameScale : 1, e));
camera.position.set(tg[0] + (cam[0] - tg[0]) * dist + pointer.x * 0.35,
                    tg[1] + (cam[1] - tg[1]) * dist - pointer.y * 0.2,
                    tg[2] + (cam[2] - tg[2]) * dist);
camera.lookAt(tg);
const off = mobile ? 0 : lerp(A.off && A.off + frameShift, B.off && B.off + frameShift, e);
const yo = mobile ? lerp(A.yo ?? 0.24, B.yo ?? 0.24, e) : 0;
camera.setViewOffset(innerWidth, innerHeight, -off * innerWidth, yo * innerHeight, innerWidth, innerHeight);
```

- The camera sits on the line from `target` to `cam`, scaled by `dist`. `dist` carries three things:
  the push-in during the hold (`PUSH = 0.07`, eased back out over the glide so the next chapter starts
  at its tuned distance), the phone pull-back `md`, and the desktop `frameScale`.
- `pointer` adds a small parallax; it's smoothed at 0.05 per frame so a mouse flick doesn't jerk.
- `setViewOffset` shifts the whole frame instead of moving the camera: `off` pushes the subject into
  the right of the frame beside the copy column, `yo` pushes it down on phones under the copy that
  sits at the bottom.

### Adaptive framing

Poses are tuned for a 1440 px window where the scene owns the right 53% beside a 540 px copy column.

```js
function resize() {
  const left = (innerWidth - Math.min(1160, innerWidth - 40)) / 2;          // the content column's left edge
  const free = clamp((innerWidth - left - 540) / innerWidth, 0.3, 1);       // share of the window right of the copy
  frameShift = 0.264 - free / 2;                                           // 0 at 1440, grows as the window narrows
  frameScale = clamp(0.528 / free, 1, 1.4);                                // pull back so the subject still fits
  …
}
```

A chapter with `off` set gets `off + frameShift` and `frameScale`; a centred chapter (`off: 0`, the
close) gets neither. Below 900 px (`small()`) the copy moves to the bottom and `md`/`yo` take over.

## The carrier's flight

```js
const mp = lerp3(at3(i, A.carrier.p), at3(i + 1, B.carrier.p), e), mr = lerp3(A.carrier.r, B.carrier.r, e);
const ms = lerp(A.carrier.s, B.carrier.s, e) * (1 + 0.15 * bump(e));
mp[1] += 0.35 * bump(e);          // an arc between stations
mr[2] -= e * Math.PI * 2;         // one coin-roll about its own face, so the front always faces you on arrival
if (!drag) { spin += spinV; spinV *= 0.94; spin *= 0.985; }   // drag-to-spin momentum, then settle
mr[1] += spin;
```

`bump(x) = sin(clamp(x) * π)` is 0 at both ends and 1 mid-flight. The carrier grows 15% and rises 0.35
mid-flight, so it reads as thrown, not slid. Sway (`sin(t)` terms weighted by `w(c)`) only runs in
chapters where the carrier rests (hero, pricing, close); elsewhere its pose is exact so it can land on
things.

Per-scene actions use `local(c)` against `ACT = 0.6`: `smooth(0.04, ACT, local(5))` is a scan that
starts just after the chapter begins and finishes at 60%, before the camera leaves at 100%.

## Drag to spin

The copy overlays the canvas, so canvas pointer events never fire. Listen on `window`, raycast
against the carrier, and ignore the event if `e.target.closest("a, button, code, details")`. Set the
cursor on `<html>` (`grab` / `grabbing`) only for `pointerType === "mouse"`.

## Culling and precompile

```js
stations.forEach((g, c) => { if (g) g.visible = Math.abs(at - c) < 0.985; });
```

Only the current station and the one being travelled to or from render. Before the first frame:

```js
stations.forEach((g) => g && (g.visible = true));
renderer.compile(scene, camera);
textures.forEach((tex) => renderer.initTexture(tex));
```

Without this, each scene's shaders compile the first time it appears, which is a visible stall exactly
when the reader scrolls into it.

## The render loop gate

```js
const update = () => {
  const covered = solid && solid.getBoundingClientRect().top <= 0;   // the "after" section covers the world
  const next = !document.hidden && !covered;
  if (next && !running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  running = next;
};
```

The first rendered frame adds `.webgl` to `<html>` and dispatches `resize` so the page refits its
type for the fixed copy layout. That class is also what fades the canvas in and keeps the poster
fallback hidden.
