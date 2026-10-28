# Gotchas

Every one of these cost at least one round trip with the person the site was for. Read before building, re-read when
something looks wrong.

## Layout and copy

- **Text cut off under the nav or past the bottom.** The fit script must run after fonts load
  (`document.fonts.ready`) and again when the world adds `.webgl` (the padding changes). Type sizes
  must use `min(vw, vh)` in their clamp so short-wide windows (a 1440×700 laptop with the dock
  showing) don't overflow before the script runs. If a panel still overflows at the 0.55 floor, the
  panel has too much content; the deal card and the CTA pair are about the maximum.
- **Copy overlapping the subject.** The scene is tuned for the right 53% of a 1440 window. At 1180
  and 1024 the copy column takes more; `frameShift`/`frameScale` re-centre and pull back, but only
  for chapters with `off` set. Check 1024 wide specifically; it's where overlaps appear first.
- **The hero mapped with `offsetTop`.** `offsetTop` is relative to the nearest positioned ancestor
  and the panels are transformed; it measured the wrong thing. Use `getBoundingClientRect` and
  subtract any lift you apply.
- **Overlap at the very bottom.** The close chapter (`.center`) aligns to `flex-end` with
  `padding-bottom: 14vh`; the carrier pose puts it above (`p: [0, 1.05, 0]`). If the after section's
  border shows through, the close's height (130vh) is too short for the viewport; don't go below.
- **Centred text in the close at phone widths.** `.ch.center .panel > *` needs `margin-left/right:
  auto` on every child, not just `text-align`.

## World

- **Scenes bleeding into each other.** STATION 8 showed the neighbour at wide camera angles. 12
  fixed it; culling at `|at - c| < 0.985` hides the rest. If a new scene is wide (the 6-unit
  ledger), check its neighbours at both ends of the glide.
- **The landing misses the printed mark.** Three separate causes, all hit: the plane's height
  wasn't the artefact's real aspect (195 vs 178); the carrier sat at z 0.09 and slid off with
  parallax (0.012 fixed it); the pose was rotated (`r: [0, 0, 0]` and the coin-roll ends exactly
  on a full turn, so arrival is face-on). Compute the landing point from the artefact's own pixel
  coordinates, never by eye.
- **First-appearance stall.** Each station's shaders compile the first time it renders. Make all
  stations visible, `renderer.compile`, `renderer.initTexture` every texture, then cull. Textures
  loaded later (the card image) get `initTexture` in their `onload`.
- **"Stuck then rushes."** The hold with no visible motion is a dead zone. PUSH 0.07 during HOLD
  gives the scroll something to do; ACT 0.6 makes the scene's action finish before the glide. Don't
  fix this by lowering the smoothing constant; that makes the glide jerky instead.
- **Actions that can't rewind.** Everything must be a function of `sNow` and `t`. A "played once"
  flag looks fine scrolling down and breaks scrolling up.
- **Drag-to-spin stopped working** when the copy went fixed over the canvas: canvas events never
  fire. Listen on `window`, raycast, skip when the target is a link/button/code/details.
- **Momentum and sway fight.** Sway only in chapters where the carrier rests (`w(0) + w(10) +
  w(LAST)`); elsewhere the pose is exact so landings work.
- **Phones.** `md` per chapter pulls the camera back; `yo` shifts the frame down under the
  bottom-anchored copy; instance counts drop (`small()` at build time). Test 390×844 in the sweep.
- **Reduced motion.** `t` stops, `sNow = sTarget`, no flight arc. The page's own effects (ticker,
  beam, confetti, scramble) each check the media query too.

## Page effects (the Magic UI ports)

- **Number ticker starts before the layout is final** (the hero copy moves when `.webgl` lands).
  Start it from a `MutationObserver` on `<html>`'s class, when `webgl` or `nowebgl` appears.
- **Counter regex inside a template literal.** `\.0$` in a JS template string needs `\\.0$` in the
  server-side source or the dot is lost; test the rendered page, not the source.
- **Border beam is subtle on dark.** `conic-gradient(from var(--beam), transparent 0 78%, …)` with
  `@property --beam` animated; mask with `linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)`
  and `mask-composite: exclude`. If it barely shows, widen the bright stop before touching opacity.
- **Confetti** is a one-off canvas: two bursts from the bottom corners, 80 pieces each, gravity,
  drag, a `cos(age * flip)` scale for tumble, `globalAlpha` fades over the last second, and the
  canvas removes itself at 4 s.
- **Key scramble** keeps the real value in `aria-label` and only scrambles the visible text, so
  screen readers never hear the gibberish.

## Fallback and loading

- **The flat logo flash.** `.poster` showed by default and was hidden when `.webgl` arrived, so it
  flashed for a frame. Now it shows only on `html:not(.js)` or `.nowebgl` (set by a 5 s timeout if
  no frame has rendered), and the canvas fades in from 0.
- **Cache.** The page is served with `max-age=300`; the dev server caches `landing.js` until
  restarted. When a change doesn't show, restart the dev server and add `?v=$RANDOM` to the URL
  before suspecting the code.

## Verifying

- Use `agent-browser --session <name>` for every headless check. A plain `agent-browser open`
  while the daemon is attached to a real Chrome over CDP navigates the user's own tab (it took a
  half-filled form with it once). Refs (`@e12`) shift after every snapshot; re-snapshot.
- Screenshot to absolute paths. Relative paths land in the daemon's cwd.
- Never `find /`; it hangs. Scope to the directory.
- Delete verification screenshots once read.
- A headless sweep proves layout; it can't prove feel. Scroll it yourself at the end, and ask the
  user to.

## Process

- The user tunes by feel and says so in short phrases ("way too quick", "a bit stuck", "earlier
  layout was much better"). Change one constant, show it, ask. Don't batch five feel changes.
- Ship the hero layout the user approved; experiment on chapters, not the hero.
- Everything deployed is also committed.
