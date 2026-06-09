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
- Both schemas are *functions* (`({ image }: SchemaContext) => ...`) so each entry's `src` flows through the `image()` helper and gets optimized by `astro:assets`.
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
