# Josephine Florence Portfolio

Astro static portfolio site (painter & ceramicist). Start with these:

- [CONTEXT.md](./CONTEXT.md) — glossary; the canonical project vocabulary
- [plan.md](./plan.md) — architecture, stack, styling, and per-page specs
- [prd.json](./prd.json) — the task breakdown
- [docs/adr/](./docs/adr/) — recorded architectural decisions
- [claude-progress.md](./claude-progress.md) — running progress log

## Commands

pnpm only (`engine-strict`):

- `pnpm start` — dev server (`astro dev`)
- `pnpm build` — production build (`astro build`)
- `pnpm preview` — preview the build (`astro preview`)

## Structure

```
src/
├── content.config.ts   # content collections (Content Layer API)
├── assets/             # optimizable source images
│   ├── paintings/
│   └── ceramics/
├── content/            # Artwork entries (paintings/, ceramics/)
├── components/
├── layouts/            # BaseLayout.astro
├── pages/              # index, about, paintings, ceramics, contact,
│                       #   thank-you, 404, + [slug] detail pages
└── styles/             # global design tokens
```
