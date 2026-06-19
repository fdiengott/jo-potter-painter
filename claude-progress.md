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
- The user refactored the inline expand SVG into its own `src/components/LinkIcon.astro` and tweaked the icon badge styling.

Sharp note: the image rendering finally exercised `astro:assets`, and the build errored with "Could not find Sharp" — the sandbox relinks had dropped it. Added `sharp` (0.34.5) as an explicit dependency (Astro 6 makes you install it yourself; `allowBuilds: sharp: true` was already set so its native build was approved).

Verified: `astro check` → 0/0/0; `pnpm build` succeeds and optimizes images. In `dist/paintings/index.html`: AVIF + WebP `<source>`s per cover (the two covers dedupe to shared optimized files since they share the placeholder image); `href="/paintings/marsh-light"` present (multi-image → clickable + overlay) while `untitled-estuary` (single image) has no link; titles/years/media render in the captions.

## Build Ceramics Gallery page (2026-06-10)

Built `src/pages/ceramics/index.astro` (again at the user's `ceramics/index.astro` stub), reusing `ArtworkCard` — so the only real difference from paintings is the layout.

- **Masonry via CSS multi-column** (`column-count` + `break-inside: avoid` on each `<li>`), no JS: 1 column on mobile, 2 at 40em, 3 at 64em. Variable-height by nature; the shared placeholder image makes every tile the same height for now, but real varied photos will stagger.
- Queries `getCollection("ceramics")`, sorts by year desc, same detail-page rule (`images.length > 1 || video`) → `/ceramics/{id}`.
- Added an optional `sizes` prop to `ArtworkCard` (defaulting to the paintings value, so that page is unchanged); the ceramics page passes a masonry-aware `sizes` ("(min-width: 64em) 33vw, (min-width: 40em) 50vw, 100vw") so the browser picks an appropriately small srcset width in the 3-column layout. Captions stay below each card (the spec allows "on hover or below").

Verified: `astro check` → 0/0/0; `pnpm build` succeeds. In `dist/ceramics/index.html`: `tidal-vessel-no-3` (3 images + video) and `ash-bowl-triptych` (2 images) are clickable, `salt-cellar` (single image) is not; responsive `column-count: 1/2/3`; AVIF + WebP sources per cover; media render in captions. Files Prettier-clean.

## Build Artwork detail pages (2026-06-11)

Built the dynamic detail routes the galleries already link to — until now every "clickable" cover (the expand badge) pointed at a 404. Both collections share one presentation component so the pages are uniform.

- `src/components/ArtworkDetail.astro` — the shared, data-driven view: title + `year · medium` header, the full image set via `<Picture>` (AVIF+WebP, `widths=[400,800,1200,1600]`, first image `eager` as the LCP, the rest lazy), an optional responsive 16:9 YouTube embed, then the Markdown body (`<slot />`). A `youtubeEmbed()` helper normalises `watch?v=` / `youtu.be/` / `/embed/` URLs to a `youtube-nocookie.com/embed/{id}` src. Left a single JSX comment marking the reserved spot for the deferred per-Artwork buy button.
- `src/pages/paintings/[slug].astro` and `src/pages/ceramics/[slug].astro` — thin route shells. `getStaticPaths()` emits a route **only** where `images.length > 1 || video` (so single-image covers stay non-clickable, matching the gallery's `href` rule). Each looks up its entry with `getEntry`, `render()`s the body, and passes the Cover through `getImage()` (1200px jpg) as BaseLayout's `ogImage` so sharing a piece previews the piece.

Sandbox note: `pnpm exec astro …` can't run here — pnpm's `verify-deps-before-run` guard tries to rewrite the read-only `node_modules/.pnpm` and dies with EACCES. The user ran `astro build` in their checkout instead.

Verified (user-run `astro build`): build completes; exactly three detail pages emitted — `/paintings/marsh-light/`, `/ceramics/tidal-vessel-no-3/`, `/ceramics/ash-bowl-triptych/` — while single-image `untitled-estuary` and `salt-cellar` get no route. Cover OG images optimised into `/_astro/*.jpg`.

(Note: git is unavailable in this sandbox — the progress log is the source of truth for what's done, not commit history. The previous loop's detail-pages work was never committed via git; treat the log + `prd.json` flags as authoritative.)

## Build Home page (2026-06-11)

Replaced the placeholder `src/pages/index.astro` with the real landing page: a full-bleed two-image hero diptych. The artist name/subtitle top-left is already supplied by the `Header` (on every page, in the display font), so the page adds a visually-hidden `<h1>` ("Josephine Florence — Abstract Painter / Ceramicist") for document structure without doubling the visible name.

- **Data-driven hero:** pulls the most recent painting Cover and the most recent ceramic Cover (each collection sorted by year desc, `[0]`) — one panel per practice, as plan.md describes. Swaps automatically when real art lands; today both resolve to the shared `rubber-duck.jpg` placeholder. Each panel is a link to its gallery (`/paintings`, `/ceramics`) with an `aria-label`, keeping the visual as two clean edge-to-edge images.
- **Layout:** CSS grid `1fr 1fr` at `80svh` (tall band that lets the next content peek), `object-fit: cover` on a shared height so the two halves always align; full-bleed because BaseLayout's `<slot>` is a direct child of `<body>` (no max-width wrapper). Stacks to one column, each `50svh`, under the `48em` breakpoint.
- **LCP handling:** hero images render via `<Image format="webp">` with `widths=[768,1280,1920,2560]` (source is 5269×3513, so all widths are real downscales), `loading="eager"`, `fetchpriority="high"`. To honour the plan's "preloaded" requirement, added a named `<slot name="head" />` to `BaseLayout` and the page emits `<link rel="preload" as="image" type="image/webp" imagesrcset … imagesizes>` per panel (computed with `getImage()`, same format/widths so they dedupe against the rendered `<Image>`).
- Home `<title>` passes the exact `SITE_NAME` so BaseLayout's no-double special case yields a clean title.

Verified (user-run `pnpm build`): build completes; `/index.html` built; the hero webp set generated at all four widths (33kB @768 → 912kB @2560). Sandbox still can't run `pnpm exec`/the astro binary directly, so the user runs the build.

(Follow-up) Added a hover/focus label to each diptych panel: a semi-transparent black backdrop (`--color-ink` @ 55%, matching the existing card overlays) with centred white display-font text — "Abstract Painting" on the painting panel, "Ceramics" on the ceramic panel. Hover-only per the user's choice (no persistent label on touch); also revealed on keyboard `:focus-visible`. The visible label is `aria-hidden` since the panel link already carries the name via `aria-label`. The user then factored `.visually-hidden` out into a global `src/styles/utilities.css` (imported in BaseLayout) and reworked the `.hero` grid to `repeat(auto-fit, minmax(calc(var(--breakpoint-md) / 2), 1fr))`; the scoped duplicate was removed from the page.

## Build About page (2026-06-11)

Built `src/pages/about/index.astro` (the user's stub) — a bio with a size-capped photo floated left and the text wrapping around it. Deliberately not full-bleed (unlike the Home hero), per plan.md, because the eventual portrait's quality is uncertain.

- **Bio copy lives in its own Markdown file**, not hardcoded in the page: `src/pages/about/_bio.md` (the `_` prefix keeps it out of Astro routing) holds lorem-ipsum placeholder paragraphs, imported as `{ Content as Bio }` and rendered `<Bio />`. Kept it co-located with the page rather than under `src/content/` so it doesn't intrude on the Artwork collections that `CONTEXT.md` reserves for paintings/ceramics. Swap the lorem for real bio copy before launch.
- **Photo:** `<Image>` floated left at `width: min(40%, 360px)`, lazy-loaded, `widths=[360,720]` (360px display + 2× retina; the source is far larger so it's never upscaled). Honest placeholder alt naming the rubber-duck stand-in.
- **Mobile (`≤40em`):** float drops, photo goes on top, centred, keeping its `min(100%, 360px)` cap so a low-res image is never blown up — exactly the plan's instruction.

Pending user-run `pnpm build` to confirm it compiles.

(Follow-up) The user reworked the About styles to mobile-first: base rules are the stacked/centred photo, and a `@media (min-width: 40em)` block adds the float — same result, inverted breakpoint direction — and simplified the alt to "portrait of Josephine Florence".

## Build Contact page + thank-you page (2026-06-11)

Built the contact flow as one increment — a form that redirects to a non-existent success route isn't a complete feature, so the thank-you page is its required target.

- `src/pages/contact/index.astro` — photo left, form right (a CSS grid: `2fr 3fr` at `≥48em`, stacked below). Also fixed the stub's copy-paste `title="About"` → `"Contact"`.
- **Netlify Forms, server-rendered (not in a client island)** so Netlify's build-time HTML scan detects it: `name="contact"`, `method="POST"`, `data-netlify="true"`, a hidden `form-name=contact` input, and honeypot-only spam protection (`netlify-honeypot="bot-field"` + a `<p hidden>` bot-field). Fields Name / Email (`type="email"`) / Subject / Message (`<textarea>`), all `required`. `action="/thank-you"` redirects on success. Submission email address is set in the Netlify dashboard (deferred to the deploy task).
- Photo is the shared `rubber-duck.jpg` placeholder, lazy-loaded, `widths=[480,960]`.
- `src/pages/thank-you.astro` — on-brand centred confirmation ("Your message is on its way to Josephine…") with a link back home.

Note: the form only actually collects submissions once the site is on Netlify (the "Configure Netlify deployment" task) — the page/markup is complete and correct now; the wiring is environmental.

Pending user-run `pnpm build` to confirm both compile.

(Follow-up) Per the user, the Contact photo moved to the **right** (form left) at `≥48em` to complement the About page's left-hand photo — done via explicit `grid-column`/`grid-row` placement (columns `3fr 2fr`) while keeping the photo first in the DOM so mobile still stacks photo-on-top. The user also introduced `src/constants/constants.ts` (a `LINKS` route map) and switched the thank-you page's home link to `LINKS.home`.

## Build custom 404 page (2026-06-11)

Fleshed out `src/pages/404.astro` (Astro serves it for unmatched static routes) — an on-brand, centred not-found message with links back to Home and both galleries, using the new `LINKS` constants. Styled to match the thank-you page (same centred, `--content-measure` column).

Pending user-run `pnpm build`.

---

Page inventory is now complete (Home, About, Paintings, Ceramics, Artwork detail, Contact, thank-you, 404). The only open PRD items are **Configure Netlify deployment** (mostly external: add `netlify.toml`, connect the GitHub repo in the Netlify dashboard, set the form-notification email, confirm a deploy) and the **Set up project folder structure** flag, which is de facto already satisfied by the existing layout.

## Record Phase 2 upload-flow design (2026-06-12)

Walked through the deferred image-upload flow and resolved three open design points, then recorded them so they don't get re-litigated when Phase 2 begins. No application code — documentation only.

- Added **`docs/adr/0003-phase2-admin-upload-flow.md`**: the commit-driven static model (an Artwork is files in Git; "upload" = commit → Netlify deploy), the publish Function as the sole trust boundary, magic-link auth (allowlist-before-send, signed JWT, deliberately un-hardened for a single Gmail user, not Netlify Identity), and a one-atomic-commit publish via the GitHub **Trees API** (chosen over Contents-API-per-file to avoid N deploys and partial-publish states).
- **Cover** decision: it's the first image in the list with **no separate cover field**, set by reordering in the admin. Reworded the Cover entry in **`CONTEXT.md`** accordingly (its prior "set manually, not through the upload flow" predated Phase 2) and cross-referenced ADR 0003 in **`plan.md`**.

## Build admin page + magic-link auth (2026-06-12)

Started Phase 2 — the auth/request half of the self-serve admin. The publish/commit half (Trees API) is still to come.

- **`src/pages/admin.astro`** mounts **`AdminIsland`** with `client:only="react"` (no SSR, no SEO needed). The island reads a `?token=` query param and branches: token present → `MultiImageForm`, otherwise → `MagicLink`. Presence only drives *display*; validity is enforced server-side later by the publish Function (the trust boundary, per ADR 0003).
- **`MagicLink.tsx`** — email form that POSTs to `/request-magic-link`; **`MagicLinkSubmitted.tsx`** renders success/error states (own CSS module, design tokens, centred to match the form). Error state has a "Try again" reload.
- **`netlify/functions/requestMagicLink.ts`** (v2, `config.path = /request-magic-link`): POST-only (405), env + JSON guards (500/400), checks the email against `ADMIN_ALLOW_LIST` (comma-separated, normalised), signs an **HS256 JWT** (sub=email, 15m TTL) with `jose`, and returns a **generic 200 regardless of allowlist match** so the endpoint can't enumerate the allowlist. Magic link points at `${URL}/admin?token=…`.
- **`netlify/lib/emailClient.ts`** — mock email client (console.logs the link). Lives under `netlify/` so client code can't import it / a real provider key never leaks into the bundle. **TODO: swap for a real transactional provider.**
- Infra: added **`"type": "module"`** to `package.json` so the function bundles as ESM (`.mjs`) and can import the ESM-only `jose` (added as a dep) — fixes the `require()` of an ES module error. Excluded `/admin` from **`robots.txt`** (`Disallow`) and the **sitemap** (`filter` in `astro.config.mjs`).

Caveat: email delivery is mocked — paste the link printed in the `netlify dev` console into the browser to test the token branch.

## Real magic-link email + start of the batch-upload Function (2026-06-15)

Closed out the magic-link auth task (real email now sends) and began the ADR 0004 batch-upload feature — the per-image transport half is built; the publish/commit half is still a stub.

- **Real email:** the mock `netlify/lib/emailClient.ts` was replaced by **`netlify/lib/sendMagicLinkEmail.ts`** (Resend). Needs `EMAIL_API_KEY` and `EMAIL_DOMAIN_ORIGIN` set in Netlify plus a verified Resend sending domain. This completes "Admin page + magic-link auth" (now `complete` in `prd.json`).
- **Blob-staging Function** — **`netlify/functions/stageImage.ts`** (`config.path = /stage-image`): verifies the JWT, then `POST`s one Base64 image to the GitHub `git/blobs` API (with `GITHUB_REPO` / `GITHUB_TOKEN`) and returns the blob `sha`. This is ADR 0004's decoupled per-image transport — a blob is referenced by nothing, so it creates **no commit and no build**.
- **Shared `netlify/lib/` helpers** extracted/added: `toRequest.ts` (`toResponse`), `isOnAllowList.ts` (parses `ADMIN_ALLOW_LIST`), `verifyToken.ts` (jose `jwtVerify` + exp/sub checks + allowlist), `parseStageImageRequest.ts`. `requestMagicLink.ts` was refactored onto the shared `toResponse` + `isOnAllowList` (its private copies removed).
- **`src/utils/createContextualLogger.ts`** — a tiny prefixed `console` logger (`[context] …`), adopted across the Functions and the `MagicLink` / `MultiImageForm` islands.
- **Type restructure** to the Artwork shape (ADR 0004): `src/types/imageData.ts` — `ImageData` is now per-Artwork (`type: "ceramic" | "painting"`, title, year, optional medium, `images: { alt, blobSha }[]`, optional `videoSrc`/`description`), no longer per-image — plus `src/types/parsed.ts` (`Parsed<T>` discriminated union) and `src/types/stageImageRequest.ts`.
- **Schema drift landed** (ADR 0004): `src/content.config.ts` drops `medium` from ceramics and makes it optional on paintings. The three ceramic seed entries drop their `medium` frontmatter, `ArtworkCard.astro` renders `· {medium}` only when present, and `ceramics/index.astro` stops passing it.
- **Admin scaffold:** deleted `ImageFormSubmitted.tsx`; added `ImagePreview.tsx`, `MultiImageFormSuccess.tsx`, `MultiImageFormFailure.tsx`, the shared `MultiImageFormSubmitted.module.css`, and a stub `SubmitImageForm.tsx`. `MultiImageForm.tsx` now accumulates an `ImageData[]` batch, posts it to `/submit-images`, and renders success/failure screens.
- **`scripts/mintJwt.js`** — dev helper that mints a 15-minute HS256 token (subject = an allowlisted email) for local Function testing.

Still to build (the publish path doesn't work end-to-end yet): **`netlify/functions/submitImages.ts`** is an empty stub — the Trees → commit → ref-update that turns staged blobs into one atomic commit/build isn't written. `SubmitImageForm` has no fields, and there's no client-side ~2560px downscaling, batch list-edit/reorder, or image-free publish confirm modal.
