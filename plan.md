# Josephine Florence Portfolio Site

Painter & ceramicist portfolio — content-heavy, image-forward, lightly interactive.

## Stack

- **Astro** — static by default (`output: 'static'`), hydrates islands on demand
- **Netlify** — hosting + auto-deploy on push to `main`; **Netlify Forms** for the contact form; **Netlify Functions** reserved for the deferred admin/e-commerce phases (see ADR 0001)
- **Tooling** — Node 24 (`.nvmrc`), pnpm only (`engine-strict`); `pnpm-workspace.yaml` must allow `sharp: true` (needed by `astro:assets`) and `esbuild: true`

## Styling

- **Vanilla Astro scoped `<style>`** per component, plus one global stylesheet of design tokens imported in `BaseLayout`. No Tailwind.
- **Design tokens as CSS custom properties** for colours, type scale, spacing, and breakpoints. Two font tokens: `--font-display` (header) and `--font-body`. **Almost no hardcoded values** — anything reusable lives as a custom property.
- **Self-hosted fonts** (`.woff2` in the project; `@font-face` with `font-display: swap`; preload the display face). No Google Fonts CDN — avoids the third-party request and the GDPR/IP-logging issue. Actual typefaces are TBD; tokens make them swappable.

## SEO & Sharing

Easy wins only — Jo isn't active on social, so no heavy investment.

- Per-page `<title>` and `<meta description>` via `BaseLayout` props.
- `@astrojs/sitemap` (auto `sitemap.xml`, needs the `site` URL) + a `robots.txt` pointing to it.
- Canonical URLs and a favicon.
- **Open Graph / `summary_large_image`**: each Artwork detail page sets `og:image` to that Artwork's **Cover** (sharing a piece previews the piece). All other pages use one default OG image (TODO: point to an image in `src/assets`).
- Skip JSON-LD structured data for now (easy to add later if wanted).

## Features

### Galleries & Artwork Detail Pages

- Each gallery shows one **Cover** per Artwork (the first image in the Artwork's image list).
- An Artwork gets a **detail page** (`/paintings/[slug]`, `/ceramics/[slug]`) only when it has more to show — i.e. more than one image **or** a video. Driven by content, not by which gallery it's in. Generated statically via `getStaticPaths()` (only qualifying entries emit a route).
- A clickable Cover (one whose Artwork has a detail page) shows an **icon overlay** signalling it's a link; non-clickable Covers (single image, no video — most paintings) have no icon and aren't clickable. The icon makes the affordance explicit.
- Detail pages are where the deferred per-Artwork buy button will live. There is no separate Shop page.

### Image Uploads (Phase 2 in progress)

- Content modeled as a collection from day one (images + metadata entries)
- Phase 1: manual uploads
- Phase 2: self-serve admin page → serverless function → Git commit → deploy (see ADR 0003 for the trust/auth design and ADR 0004 for the batch upload flow)
    - Auth: magic link; allowlist checked server-side before any email is sent
    - Security boundary: serverless function validates JWT (not the browser island)
    - Binaries: Base64-encoded; unique filenames to stay append-only
    - UX: a **batch** of Artworks (each with multiple images) staged in the browser → single publish → **one atomic commit → one build**. Decoupled transport: each image uploads to a GitHub **blob** via a JWT-verified Function (no build); "Publish all" assembles one tree → one commit → one ref update (the only build trigger), so batch size never hits Netlify's ~6MB per-request limit. Create-only — no edit/delete of published Artworks.
    - Form is master/detail: a batch list (Cover thumbnails + Publish) and a single Artwork form (collection toggle, title, year pre-filled current, optional medium for paintings only, optional video URL, optional description written as the Markdown body, 1–5 images with required alt, up/down ordering, slot 1 = Cover). The form has no Publish button (exits via Add-to-batch / Save / Discard); Publish sits behind an image-free confirm modal.
    - Images downscaled client-side to a ~2560px master before Base64; Cover is set by image order in the admin (no separate cover field)
    - **Status:** auth/request half built — `/admin` island (`AdminIsland` → `MagicLink`/`MultiImageForm`) + the `request-magic-link` Function signing the JWT (email delivery still mocked). The blob-staging and publish/commit Functions (JWT verify + Trees API) are not yet built.

### E-commerce (deferred)

- Embeddable buy button (Stripe/Shopify-style) as an island, placed on each **Artwork detail page** — never a standalone Shop page
- Real challenge is operational: one-of-a-kind inventory, fragile shipping, tax

## Navigation

Hamburger top-right on **all viewports** (desktop included — keeps chrome out of the way of the work). One nav implementation, not two. Links: **About, Painting Gallery, Ceramics Gallery, Contact**. No Shop link.

## Pages

### Home

- Top-left: name **Josephine Florence** / subtitle **Abstract Painter / Ceramicist** in the display font.
- Hero: two images side by side of the two practices (likely one of them her hands), edge-to-edge (full-bleed).
- Layout: 50/50 diptych on desktop → **stacks vertically (each full-width) on mobile**; `object-fit: cover` on a shared aspect ratio so the two halves always align.
- Height: **tall band (~`80svh`)** — near-full-screen but lets the next content peek up to signal scroll. On ultrawide, let it **bleed fully** (no max-width); never crop the art to fit a container.
- Asset requirement: hero source images must be large (~2560px wide) to stay crisp full-bleed on big/ultrawide displays.
- Hero images are the LCP → `loading="eager"`, `fetchpriority="high"`, preloaded.

### About

- Photo **floated left** (`float: left`), capped at `max-width: min(40%, 360px)` and never upscaled beyond its source resolution — image quality is uncertain, so small-but-sharp beats big-and-soft. Bio text wraps around it.
- Not a full-bleed element (deliberately, unlike the Home hero).
- Mobile: drop the float, photo on top, centered, **keep the max-width** so a low-res image is never blown up. Photo lazy-loaded.

### Painting Gallery

- Two paintings per row, side by side, scroll vertically.
- One **Cover** per Artwork; clickable (with icon overlay) only when the Artwork has a detail page (>1 image or a video) — most paintings won't.
- Title, year, medium below each.

### Ceramics Gallery

- **Masonry** (variable-height) grid.
- One **Cover** per Artwork; clickable (with icon overlay) for those with detail pages (most ceramics will have them).
- Title, year, medium on hover or below.

### Artwork Detail Pages

- Routes `/paintings/[slug]` and `/ceramics/[slug]`, generated only for Artworks with >1 image or a video.
- Shows the full image set + the YouTube embed (if any), with title/year/medium. Reserved spot for the deferred per-Artwork buy button. No separate Shop page.

### Contact

- Photo on the **left**, form on the **right** (Name, Email, Subject, Message).
- Static HTML form with `data-netlify`, honeypot spam filter only, all fields `required`; redirects to a custom thank-you page. Submissions emailed to Jo (TODO: address set in Netlify dashboard).

### Thank-you

- Custom success route the contact form redirects to after submission.
