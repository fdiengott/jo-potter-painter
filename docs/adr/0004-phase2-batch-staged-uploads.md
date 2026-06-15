# Phase 2 admin: batch-staged uploads via incremental blobs

Refines [ADR 0003](./0003-phase2-admin-upload-flow.md). That ADR described publishing
**one Artwork in a single request** (metadata + Base64 images + JWT together). This
records the actual upload experience: Jo stages **multiple Artworks, each with multiple
images**, and publishes the whole batch as **one atomic commit → one Netlify build** —
which the single-request shape can't do under Netlify's ~6MB Function body limit.

## The reconciliation: decouple byte-transport from the commit

The ~6MB limit is **per HTTP request**, not a budget on the session, and what costs a
build is **creating a commit**, not uploading bytes. The GitHub git-data API separates
these:

- **Per image → one small request.** A JWT-verified Function (holding the GitHub token)
  creates a single GitHub **blob** (`POST /git/blobs`) and returns its SHA to the
  browser. A blob is a loose object referenced by nothing — **no commit, no branch
  change, no build.** Each request carries one downscaled image, comfortably under 6MB.
- **The browser accumulates a manifest** of staged Artworks: per Artwork its collection
  + metadata, and an ordered list of `{ blobSha, alt }`. Image bytes are not re-held.
- **"Publish all" → one tiny request.** A publish Function verifies the JWT and assembles
  **one tree** (every blob SHA at its `src/assets/<collection>/…` path + every
  `src/content/<collection>/<slug>.md` entry) → **one commit** → **one ref update**
  (`PATCH /git/refs/heads/main`). The ref update is the *only* moment a build triggers.

Result: multiple images per Artwork, multiple Artworks, **one commit, one build**,
regardless of batch size. The per-request ceiling only ever has to hold one image.

## Image preparation

Before Base64-encoding, each image is downscaled client-side (canvas, long edge capped
at ~2560px to match plan.md's hero-source spec) and re-encoded at high quality (~0.85).
This keeps every blob request well under the limit while leaving `astro:assets` a crisp
**master** to derive its responsive AVIF/WebP widths from — not an already-degraded file.

## Orphan blobs are safe (and better than the alternative)

Removing a staged image — or abandoning a session — just **drops its SHA from the
client manifest**. The blob is never woven into a tree, so it stays unreachable. A
Netlify build checks out `main`, which only transfers **reachable** objects, so orphan
blobs never enter the working tree, history, site, or clone size; GitHub's periodic GC
prunes them. This is *strictly better* than committing images first and deleting later
(which bloats history forever): an image discarded before "Publish all" was never in
history to begin with.

## Experience shape: master/detail, create-only

- **Master** — a **batch list** that starts empty, each staged Artwork shown by its
  **Cover** thumbnail + title, with the **Publish** button. Selecting an Artwork loads
  it back into the form for **in-place editing** (each staged Artwork carries a stable
  client-side id). Editing alt text, image order, or metadata is free (manifest-side);
  only swapping in a different image file triggers a new blob upload.
- **Detail** — a single **Artwork form**: a required **Painting | Ceramic** toggle,
  title, year (pre-filled with the current year, editable), an optional medium
  (paintings only — hidden for ceramics), an optional external video URL, an optional
  **description** (free text, written as the entry's Markdown **body** — not a frontmatter
  field — and rendered only on detail pages), and 1–5 images
  with a required non-empty `alt` each. Images are multi-picked and ordered with up/down
  controls; **slot 1 is the Cover**, given a distinct visual treatment so its importance
  is obvious. Publish is **blocked until valid** (collection chosen, title set, valid
  year, 1–5 images, alt on every image, video a valid URL if present).
- **No Publish button on the form.** The form exits only via **Add to batch** (new),
  **Save changes** (editing), or **Discard**. This makes "publish an unsaved in-progress
  Artwork" *structurally impossible* rather than something to warn against.
- **Publish speedbump.** Publishing opens an **image-free confirmation modal**
  summarising each Artwork (title, photo count, the Cover's alt text, has-video) before
  the commit — the one guard that matters because the flow is **create-only**: there is
  no edit or delete of published Artworks (fixes mean hand-editing the repo, by design).

## Content-model change: the schemas drift

Designing the form forced the per-collection schemas (kept separate since they were first
defined, precisely so they could diverge) to actually diverge:

- **Ceramics drop `medium` entirely** — ceramics never carry one.
- **Paintings keep `medium` but make it optional.**
- **`year`** stays a required field; the form just pre-fills the current year (editable,
  so backdating older work remains possible without hand-editing).

## Consequences

- **Revises ADR 0003's** "single request" detail: the publish path is now *many* small
  JWT-verified blob requests + *one* small commit request, and the unit widens from one
  Artwork to a batch. ADR 0003's trust boundary, allowlist-before-send magic-link auth,
  unique append-only filenames, external-URL-only video, and Trees-API-over-Contents-API
  reasoning all still hold.
- Two server endpoints, both JWT-verified on every call: a per-image **blob-staging**
  Function and a **publish** (tree → commit → ref) Function. As built, the blob-staging
  Function landed first as `netlify/functions/stageImage.ts` (`/stage-image` → GitHub
  `git/blobs`); the publish Function `netlify/functions/submitImages.ts` (`/submit-images`)
  is still a stub. `MultiImageForm` was reworked to accumulate the batch and post to it.
- `src/types/imageData.ts` (`ImageData`, which previously put title/year/medium/video on
  every *image*) is restructured to the Artwork shape: collection + Artwork metadata +
  an ordered `images: { blobSha, alt }[]`.
- `src/content.config.ts` changes (ceramics `medium` removed; paintings `medium`
  optional). Existing ceramic seed entries' `medium` frontmatter becomes ignored, and the
  galleries / detail pages must render `medium` **only when present**.
- Orphan blobs accumulate transiently in GitHub's object store until GC — acceptable for
  a single low-volume user; nothing to manage.
