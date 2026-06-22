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
- `pnpm build`
- `pnpm format` - prettier
- `pnpm format:check` - prettier --check .
- `pnpm typecheck` - tsc
- `pnpm test` - vitest run

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

## General Notes

Reframe from leaving comments unless the code cannot explain some very important context.
Comments are a cost that are better not incurred.

When reporting information to me, be extremely concise. Sacrifice grammar for the sake of concision.

## Tool Notes

The following git commands are available in this project:

```
status diff log show branch tag ls-files grep blame shortlog
```

The rest are prohibited. If a specific command is needed, it must be requested and approved explicitly.
