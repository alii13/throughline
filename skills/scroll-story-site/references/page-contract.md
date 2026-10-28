# Page contract

What the HTML and CSS promise the world, and what the world promises back. The template honours all of
it; this explains each piece so you can change it on purpose.

## Layering

```
#world    position: fixed; inset: 0; z-index: 0; opacity: 0 → .webgl #world opacity 1 (.6s fade)
.poster   display: none → html:not(.js) .poster, .nowebgl .poster: fixed, right side
main      position: relative; z-index: 1     (the chapters)
.after    position: relative; z-index: 1     (solid background, covers the canvas when reached)
.rail     fixed, bottom, z-index: 2, pointer-events none
nav       fixed, top, z-index: 10
```

The canvas starts transparent and fades in on the first rendered frame. This is what removed the
"flat logo for a millisecond, then the medallion pops in" flash: the poster is never shown while the
world loads, only when the world can't run.

## Fallback

```html
<script>document.documentElement.classList.add("js")</script>
…
<script>setTimeout(() => document.documentElement.classList.contains("webgl") || document.documentElement.classList.add("nowebgl"), 5000)</script>
```

- No JS: `.poster` shows, copy is sticky, the page reads as an article.
- JS but no WebGL (or Three.js failed to load, or a very slow device): after 5 s with no frame,
  `.nowebgl` shows the poster. The chapters stay sticky-copy.
- WebGL: `.webgl` is added by the world's first frame. Copy becomes fixed and crossfades.

## Chapters

```css
.ch { position: relative; height: 210vh; }
.ch[data-ch="0"] { height: 170vh; }        /* hero: less to read */
.ch[data-ch="LAST"] { height: 130vh; }     /* close: a short landing */
.copy { position: sticky; top: 0; height: 100vh; display: flex; align-items: center; }
.webgl .copy { position: fixed; inset: 0; padding: 60px 0 76px; opacity: var(--op, 0); }
.webgl .copy .panel { transform: translateY(calc((1 - var(--op, 0)) * 28px)); }
.copy .panel { width: min(1160px, 100% - 40px); margin: 0 auto; }
.copy .panel > * { max-width: 520px; }     /* the copy column; the world owns the rest */
.ch.hero .panel > * { max-width: 640px; }
.ch.center .copy { align-items: flex-end; padding-bottom: 14vh; }   /* the close: centred, low */
.ch.center .panel { text-align: center; }
```

- Sections are spacers. Their height sets how long each chapter scrolls (height minus one viewport).
- `.copy` is sticky without the world (so copy stays on screen while its spacer scrolls) and fixed
  with it (so all chapters share one column and crossfade). The world writes `--op`.
- The panel's `translateY` on `--op` gives the copy a 28 px rise as it fades in.
- `padding: 60px 0 76px` leaves room for the nav and the rail. The fit script measures this.

## The fit script

```js
const fit = () => document.querySelectorAll(".copy .panel").forEach((p) => {
  const cs = getComputedStyle(p.parentElement), room = innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let f = 1;
  p.style.setProperty("--fit", 1);
  for (let k = 0; k < 4 && p.offsetHeight > room && f > 0.55; k++) {
    f = Math.max(0.55, f * Math.max(0.85, room / p.offsetHeight));
    p.style.setProperty("--fit", f.toFixed(3));
  }
});
fit(); addEventListener("resize", fit); document.fonts?.ready.then(fit);
```

Every type size in a panel is `calc(<size> * var(--fit, 1))`, so one variable scales the whole panel.
The loop shrinks in steps of at most 15%, at most four times, never below 55%. If a panel still
doesn't fit at 55%, the panel has too much in it; cut copy, don't lower the floor. The world
dispatches `resize` after its first frame because `.webgl` changes the padding.

Type scale that worked (desktop, before `--fit`):

```css
h1   { font-size: calc(clamp(38px, min(5.4vw, 8.4vh), 74px) * var(--fit, 1)); line-height: 1.0; letter-spacing: -.042em; font-weight: 720; }
h2   { font-size: calc(clamp(30px, min(4vw, 6.6vh), 54px) * var(--fit, 1)); line-height: 1.04; letter-spacing: -.035em; font-weight: 700; }
.lede, .sub { font-size: calc(clamp(16px, min(1.45vw, 3.3vh), 21px) * var(--fit, 1)); max-width: 34em; }
h1 em, h2 em { font-style: normal; display: block; background: linear-gradient(180deg, #fff 0%, #9fc4ff 55%, var(--blue) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
```

`min(vw, vh)` in the clamp is what keeps short wide windows (1440×700 laptops with the dock) from
overflowing before the fit script even runs.

## Mobile (max-width: 900px)

```css
.copy { align-items: flex-end; }
.copy .panel { background: linear-gradient(to top, rgba(6,8,11,.96) 72%, rgba(6,8,11,0)); padding: 48px 20px 5vh; width: 100%; }
.copy .panel > * { max-width: none; }
.scrollhint, .webgl .rail { display: none; }
```

Copy moves to the bottom on a dark gradient; the world uses `md` (pull back) and `yo` (shift the
frame down) so the subject sits in the top half above it.

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) { .scrollhint i { animation: none; } .btn, .rail li { transition: none; } }
```

The world checks `matchMedia("(prefers-reduced-motion: reduce)")` once: `t` stops advancing, scroll
smoothing is bypassed (`sNow = sTarget`), and per-frame scene motion is skipped. Page effects (number
ticker, beams, confetti) check the same query and skip.

## Data handoff

```html
<script id="tp-data" type="application/json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
```

The server renders whatever the world needs into this block: a card as `data:image/svg+xml` (so the
world can texture a plane with the real artefact), recent numbers for a chart, counts for a scene.
The world does `JSON.parse(document.getElementById("tp-data").textContent)` and never fetches.
Escape `<` so a value can't close the script tag.

## Nav, progress, rail, scroll hint

- Nav is fixed and blurred; its bottom border carries a 1 px progress bar scaled by `--p`, which a
  scroll listener sets to `scrollY / (after.offsetTop - innerHeight)`.
- The rail (optional) is a row of pills for the stages the carrier passes. The world toggles `.on`
  per `data-step` when `at >= step - 0.35`, and fades the whole rail in after the hero and out before
  the close.
- The scroll hint fades with `1 - scrollY / 300`.

## Head

Title under 60 characters with the promise first; description under 160; canonical; `og:title`,
`og:description`, `og:image` (1200×630 PNG, absolute URL), `og:url`, `twitter:card=summary_large_image`;
`theme-color` matching `--bg`; SVG favicon plus `apple-touch-icon` PNG; JSON-LD `SoftwareApplication`
(or `Product`) with an `offers` block if there's a price, and `FAQPage` if there's a FAQ. The import
map pins Three.js:

```html
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js"}}</script>
<script type="module" src="/world.js"></script>
```
