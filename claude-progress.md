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
