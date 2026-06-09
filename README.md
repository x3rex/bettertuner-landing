# BetterTuner — Landing Page

A fast, dependency-free marketing site for the BetterTuner app. Built as a
static site (semantic HTML5 + modern CSS + a small amount of vanilla JS) so it
loads instantly, scores top marks on Lighthouse, and deploys anywhere with no
build step.

## Why no framework?

A landing page is mostly content and motion. Shipping a JS framework would add
hydration cost and bundle weight for zero benefit here. Instead this site uses:

- **Semantic HTML** for accessibility and SEO.
- **Modern CSS** — custom properties, `clamp()` fluid type, grid, `color-mix()`,
  `backdrop-filter`, and pure-CSS keyframe animations (gauge needle, strobe
  rings, pendulum, tanpura, marquee).
- **~3 KB of vanilla JS** — scroll-reveal via `IntersectionObserver`, animated
  stat counters, sticky-nav state, and a subtle pointer tilt on the phone mock.
- **Inline SVG** for the logo, icons and graphics — crisp at any size, themeable
  with `currentColor`, no extra requests.

Everything honours `prefers-reduced-motion`.

## Brand

Colors and typography are taken directly from the app
(`app/src/main/kotlin/com/bettertune/ui/theme/Color.kt`) so the site and product
feel like one thing. The logo is the app's adaptive-icon mark.

## Structure

```
website/
├── index.html        # the page (+ <meta> CSP fallback)
├── styles.css        # all styling + animations
├── main.js           # progressive-enhancement interactions
├── _headers          # security headers (Netlify / Cloudflare Pages)
├── README.md
└── assets/
    ├── logo.svg          # brand mark
    ├── favicon.svg
    ├── og-image.svg      # social share card
    ├── fonts.css         # @font-face for the self-hosted fonts
    ├── fonts/            # subsetted woff2 (Space Grotesk, Inter, Noto Sans Bengali)
    └── *.webp            # instrument photography (from the app repo)
```

## Run locally

It's just static files — open `index.html` directly, or serve the folder:

```bash
# Python
python -m http.server 8000 --directory website

# Node (if you have it)
npx serve website
```

Then visit http://localhost:8000.

## Deploy

Drop the `website/` folder onto any static host:

- **GitHub Pages** — push and point Pages at the `website/` folder (or move
  contents to a `docs/` folder / `gh-pages` branch).
- **Netlify / Vercel / Cloudflare Pages** — set the publish/output directory to
  `website` and leave the build command empty.

## Notes / before launch

- **Store badges** in the download section currently link to `#` — swap in the
  real App Store / Google Play URLs once the listings are live.
- **Fonts are self-hosted** (`assets/fonts/`, subsetted woff2) — no third-party
  requests, so the site is fully offline/self-contained and the CSP can stay
  strict. To regenerate after changing weights/subsets, re-fetch from Google
  Fonts and re-subset with `fonttools` (latin + latin-ext for the Latin faces,
  the swara glyphs only for Noto Sans Bengali).
- **Security headers** live in `_headers` (CSP, `frame-ancestors`, `nosniff`,
  `Referrer-Policy`, HSTS), read by Netlify / Cloudflare Pages. For **Vercel**
  add the equivalent `headers` block in `vercel.json`; **GitHub Pages** can't set
  headers, so the `<meta>` CSP in `index.html` is the fallback there.
- `og-image.svg` is provided for social cards. Some platforms prefer raster;
  export it to a 1200×630 PNG (`og-image.png`) and update the meta tag if needed.
- Replace the placeholder copyright/links in the footer as the brand evolves.
