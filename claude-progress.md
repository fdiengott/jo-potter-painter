# Progress Log

## Initialize Astro project (2026-06-08)

Scaffolded the minimal Astro template on top of the existing `package.json`/lockfile (no clobbering — astro dep and `start`/`build`/`preview` scripts were already present).

- Set `pnpm-workspace.yaml` `allowBuilds` to `sharp: true` and `esbuild: true` (sharp is required by `astro:assets`).
- Added `astro.config.mjs` with an empty `defineConfig({})` — output target, `site` URL, and the sitemap integration are deferred to the "Configure Astro" task to keep scope tight.
- Added `tsconfig.json` extending `astro/tsconfigs/strict`.
- Added a placeholder `src/pages/index.astro` (gets replaced by the real Home page later) and `public/favicon.svg`.

Verified: `pnpm exec astro check` → 0 errors / 0 warnings / 0 hints; `pnpm start` boots the dev server.

## Configure Astro (2026-06-08)

Filled in `astro.config.mjs`: `output: 'static'` (per ADR 0001), a production `site` URL, and the `@astrojs/sitemap` integration.

- Installed `@astrojs/sitemap` (3.7.3) via `pnpm add`.
- `site` is a placeholder (`https://josephineflorence.com`) with a TODO to confirm the real domain before launch — swapping it updates the sitemap and all canonicals.
- Added `public/robots.txt` pointing at `sitemap-index.xml` (the file `@astrojs/sitemap` actually emits, not the bare `sitemap.xml` the PRD step named).
- sharp is available (install honored the `allowBuilds` flag); the build ran clean with no image-optimization errors. Full `astro:assets` exercise comes once real images land.

Verified: `pnpm build` succeeds; `dist/sitemap-index.xml`, `dist/sitemap-0.xml`, and `dist/robots.txt` are all emitted.

## Set up content collections (Content Layer API) (2026-06-08)

Added `src/content.config.ts` defining the two collections (`paintings`, `ceramics`) over the Astro 6 Content Layer API.

- Each collection has its **own** schema (`paintingSchema`, `ceramicSchema`), spelled out in full rather than sharing one definition. They have the same shape today, but that's a coincidence — keeping them separate lets either drift (e.g. ceramics adding `dimensions`/`glaze`) without disturbing the other.
- Each collection uses a `glob({ pattern: '**/*.md', base: './src/content/<collection>' })` loader over markdown entries.
- Both schemas are _functions_ (`({ image }: SchemaContext) => ...`) so each entry's `src` flows through the `image()` helper and gets optimized by `astro:assets`.
- Schema: `title` (string), `year` (int), `medium` (string), `images` (`z.array({ src: image(), alt: string }).min(1).max(5)`), `video` (optional URL). `images[0]` is the Cover; `images.length > 1 || video` is what later earns an Artwork its detail page.
- Created the collection + asset dirs: `src/content/{paintings,ceramics}` and `src/assets/{paintings,ceramics}` (each with a `.gitkeep`). Real entries arrive in the "Seed placeholder content" task.
- Import nuances for Astro 6 / zod v4: `z` comes from `astro/zod` (the `astro:content` re-export is deprecated), and the video field uses top-level `z.url()` (`z.string().url()` is deprecated).

Verified (Node 24 via nvm; `CI=true` so Astro's deps-status check stays non-interactive): `pnpm exec astro check` → 0 errors / 0 warnings / 0 hints; `pnpm build` succeeds — content syncs with the empty collections and the static build completes.

(Follow-up) Split the single shared `artwork` schema into a separate schema per collection. Same shape today, but that's coincidental — keeping them independent lets paintings/ceramics drift (e.g. ceramics gaining `dimensions`/`glaze`) without coupling. The user then inlined each schema directly into its `defineCollection` call.

## Build global styles and design tokens (2026-06-08)

Added `src/styles/tokens.css` — the single global stylesheet (tokens + a minimal base layer). Components will use scoped `<style>` that reference these custom properties; almost nothing is hardcoded, so the whole look retunes from this one file.

- Tokens on `:root`: fonts (`--font-display`, `--font-body`), a 1.25 modular type scale, line-heights/weights/letter-spacing, a quiet paper/ink colour palette (muted clay accent nodding to the ceramics), a rem-step spacing scale, layout caps (`--content-max-width`, `--content-measure`), radii, and the four breakpoints.
- Breakpoints are documented in `:root` as the single source of truth, with a note that CSS custom properties can't be used inside `@media` conditions — component media queries mirror these literal values.
- Minimal base layer wired to the tokens: box-sizing reset, `body` bg/colour/font, display-font headings, responsive `img`/`video`, a `:focus-visible` ring, and a `prefers-reduced-motion` guard.
- **Fonts (self-hosting) deferred, not skipped:** actual typefaces are still TBD (plan.md), so the font tokens fall back to system stacks now and a commented `@font-face` template + a `<head>` preload TODO are in place. Swapping in real `.woff2` is a two-value change — exactly the swappable design the plan calls for.
- Temporarily imported the stylesheet in the placeholder `index.astro` to exercise the build; ownership of that import moves to `BaseLayout` when that task lands.

Verified: `pnpm exec astro check` → 0 errors / 0 warnings / 0 hints; `pnpm build` succeeds and the tokens (`--color-bg`, `--font-display`, `--breakpoint-lg`, …) appear inlined in `dist/index.html`.

(Follow-up) Refactored the magnitude-scale tokens to a numeric convention where `400` is the normal/base step (higher = larger, lower = smaller), the same idea CSS font-weight uses: `--spacing-*` (300=1rem, 400=1.5rem, 500=2rem; range 50–800), `--font-size-*` (400=1rem; 200–900), `--line-height-*` (400=normal), `--font-weight-*` (name = value), `--letter-spacing-*` (300 tighten / 500 widen). Colour, layout, and breakpoints stayed semantic. The user then also split the base layer into `src/styles/base.css`, retuned the accent colour, and renamed radii to `--radius-300/400`.

## Build base layout (2026-06-08)

Added `src/layouts/BaseLayout.astro` — the shared HTML shell every page renders through.

- Imports the global stylesheets (`tokens.css`, `base.css`), so pages no longer wire CSS themselves; the temporary imports in `index.astro` were removed and the placeholder now renders through `BaseLayout`.
- Props: `title` (required; composed into `<title>` as `{title} · Josephine Florence`, with the site name not doubled on the home page), `description` (optional, falls back to a site description), `ogImage` (optional).
- `<head>`: charset, viewport, SVG favicon, a canonical URL (built from `Astro.url` + `Astro.site`), generator, `<title>`, meta description.
- Open Graph + Twitter: `og:type/site_name/title/description/url` and `twitter:card=summary_large_image` always; `og:image` / `twitter:image` are emitted only when `ogImage` is supplied (resolved to an absolute URL). Detail pages will pass their Cover. **TODO (acknowledged in the PRD step):** add a default site OG image under src/assets and wire it as the fallback for non-detail pages — deliberately not emitting a broken/missing default for now.
- `<body>` carries a TODO mount point for `<Header />` (its own task) above the `<slot />`, so this stayed a single feature.

Verified: `pnpm exec astro check` → 0 errors / 0 warnings / 0 hints; `pnpm build` succeeds; `dist/index.html` shows the composed `<title>`, canonical, description, OG tags, and the `summary_large_image` card, with `og:image` correctly absent.

(Tooling, not a PRD task) Added Prettier so `astro-ls` formatting works in editors: `prettier` + `prettier-plugin-astro` in devDependencies, `.prettierrc.json` (registers the plugin, maps `*.astro` to the `astro` parser), `.prettierignore`, and `format`/`format:check` scripts. Couldn't `pnpm add` in the sandbox (node_modules linked from the user's own pnpm store → store-location mismatch); the user runs `pnpm install` in their checkout. Also: CLAUDE.md gained a directive to minimise comments.

## Build site header and nav (2026-06-09)

Added `src/components/Header.astro` and mounted it in `BaseLayout` above the `<slot />` (replacing the placeholder mount point).

- Top-left brand: name "Josephine Florence" + subtitle "Abstract Painter / Ceramicist" (display font), linking home. (Confirmed with the user: plan's subtitle wording; the home placeholder `<h1>` was updated to match.)
- Hamburger top-right on **all** viewports (one nav implementation, no desktop/mobile split) that drops down a right-aligned panel with About, Painting Gallery, Ceramics Gallery, Contact (no Shop). Routes: `/about`, `/paintings`, `/ceramics`, `/contact`.
- Accessible toggle (small bundled `<script>`): `aria-expanded` / `aria-controls` / dynamic `aria-label`, `hidden` toggled on the panel, animates the bars to an X, closes on Escape (returns focus to the button) and on outside-click. Active link gets `aria-current="page"` (computed from `Astro.url.pathname`, trailing slash normalised).
- Scoped `<style>` references design tokens throughout (no hardcoded scale values); written comment-free per the new CLAUDE.md directive.

Verified: `pnpm exec astro check` → 0 errors / 0 warnings / 0 hints; `pnpm build` succeeds; `dist/index.html` contains the four nav links/labels, `aria-controls="site-nav"`, and the bundled toggle logic (minified inline module).

## Seed placeholder content (2026-06-09)

Added five Markdown Artwork entries that exercise every gallery and detail-page code path. The user supplied a single royalty-free photo, `src/assets/rubber-duck.jpg`, to stand in for every image (so varied portrait/landscape orientations are deferred to real content); all entries reference it via `../../assets/rubber-duck.jpg` (resolved relative to each entry through the schema's `image()` helper).

- `paintings/untitled-estuary.md` — 1 image, no video → **non-clickable Cover** (the common painting case).
- `paintings/marsh-light.md` — 2 images → **detail page** (proves a painting can earn one).
- `ceramics/tidal-vessel-no-3.md` — 3 images + a real public YouTube URL → **full detail page** (images + embed). _The video URL is a placeholder (a well-known stable public video); swap before launch._
- `ceramics/ash-bowl-triptych.md` — 2 images, no video → **detail page, images only**.
- `ceramics/salt-cellar.md` — 1 image, no video → **non-clickable Cover**.
- Placeholder-but-plausible title/year/medium on each; alt text on every image (honest placeholder alt naming the piece + view); a short body description per entry.
- Detail-page eligibility (`images.length > 1 || video`) is satisfied as intended: 3 entries qualify (Marsh Light, Tidal Vessel, Ash Bowl), 2 don't (Untitled (Estuary), Salt Cellar).

Note: the user has since added page stubs for about/paintings/ceramics/contact and a 404 (`src/pages/.../index.astro`). The galleries don't query the collections yet (their own tasks), so the placeholder image isn't optimised into `dist` until a page renders it.

Verified: `pnpm exec astro sync` + `astro check` → 0 errors / 0 warnings / 0 hints (content syncs, all five entries validate against the schema and `image()` resolves); `pnpm build` succeeds; the five files are Prettier-clean.

## Build Painting Gallery page (2026-06-09)

Built `src/pages/paintings/index.astro` (the user had stubbed it at `paintings/index.astro`, so the route lives there rather than `paintings.astro`) plus a reusable `src/components/ArtworkCard.astro` that both galleries will share.

- `ArtworkCard` renders one Cover via `<Picture>` (`formats={["avif","webp"]}`, responsive `widths`/`sizes`, `loading="lazy"`). Chose `<Picture>` over `<Image>` because that's what actually emits the AVIF+WebP `<source>`s the step asks for. The detail link is a **stretched overlay** anchor (`position:absolute; inset:0`) over the media, carrying the expand-icon badge and an `aria-label` — this keeps the `<Picture>` rendered once (an earlier attempt stored the JSX in a frontmatter `const`, which the production esbuild build rejected since the `---` fence is TypeScript, not JSX). The overlay + icon render only when an `href` is passed.
- The page queries `getCollection("paintings")`, sorts by year desc, and for each entry passes the Cover (`images[0]`) plus `href = images.length > 1 || video ? /paintings/{id} : undefined`. Two-column CSS grid, collapsing to one column under the `sm` (40em) breakpoint; title/year/medium beneath each card.
- The user refactored the inline expand SVG into its own `src/components/ExpandIcon.astro` and tweaked the icon badge styling.

Sharp note: the image rendering finally exercised `astro:assets`, and the build errored with "Could not find Sharp" — the sandbox relinks had dropped it. Added `sharp` (0.34.5) as an explicit dependency (Astro 6 makes you install it yourself; `allowBuilds: sharp: true` was already set so its native build was approved).

Verified: `astro check` → 0/0/0; `pnpm build` succeeds and optimizes images. In `dist/paintings/index.html`: AVIF + WebP `<source>`s per cover (the two covers dedupe to shared optimized files since they share the placeholder image); `href="/paintings/marsh-light"` present (multi-image → clickable + overlay) while `untitled-estuary` (single image) has no link; titles/years/media render in the captions.

## Build Ceramics Gallery page (2026-06-10)

Built `src/pages/ceramics/index.astro` (again at the user's `ceramics/index.astro` stub), reusing `ArtworkCard` — so the only real difference from paintings is the layout.

- **Masonry via CSS multi-column** (`column-count` + `break-inside: avoid` on each `<li>`), no JS: 1 column on mobile, 2 at 40em, 3 at 64em. Variable-height by nature; the shared placeholder image makes every tile the same height for now, but real varied photos will stagger.
- Queries `getCollection("ceramics")`, sorts by year desc, same detail-page rule (`images.length > 1 || video`) → `/ceramics/{id}`.
- Added an optional `sizes` prop to `ArtworkCard` (defaulting to the paintings value, so that page is unchanged); the ceramics page passes a masonry-aware `sizes` ("(min-width: 64em) 33vw, (min-width: 40em) 50vw, 100vw") so the browser picks an appropriately small srcset width in the 3-column layout. Captions stay below each card (the spec allows "on hover or below").

Verified: `astro check` → 0/0/0; `pnpm build` succeeds. In `dist/ceramics/index.html`: `tidal-vessel-no-3` (3 images + video) and `ash-bowl-triptych` (2 images) are clickable, `salt-cellar` (single image) is not; responsive `column-count: 1/2/3`; AVIF + WebP sources per cover; media render in captions. Files Prettier-clean.
