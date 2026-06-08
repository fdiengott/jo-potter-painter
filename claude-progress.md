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
