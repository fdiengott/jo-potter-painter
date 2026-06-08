# Progress Log

## Initialize Astro project (2026-06-08)

Scaffolded the minimal Astro template on top of the existing `package.json`/lockfile (no clobbering — astro dep and `start`/`build`/`preview` scripts were already present).

- Set `pnpm-workspace.yaml` `allowBuilds` to `sharp: true` and `esbuild: true` (sharp is required by `astro:assets`).
- Added `astro.config.mjs` with an empty `defineConfig({})` — output target, `site` URL, and the sitemap integration are deferred to the "Configure Astro" task to keep scope tight.
- Added `tsconfig.json` extending `astro/tsconfigs/strict`.
- Added a placeholder `src/pages/index.astro` (gets replaced by the real Home page later) and `public/favicon.svg`.

Verified: `pnpm exec astro check` → 0 errors / 0 warnings / 0 hints; `pnpm start` boots the dev server.
