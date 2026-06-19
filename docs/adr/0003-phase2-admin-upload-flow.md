# Phase 2 self-serve admin: commit-driven uploads behind a Function

The deferred self-serve admin lets Josephine publish an Artwork from a web form
instead of by hand-editing the repo. Because the site is `output: 'static'` (ADR
0001), an Artwork _is_ files in Git — a content entry plus images in
`src/assets/`. "Uploading" therefore means **committing files**, which triggers a
Netlify auto-deploy; `astro:assets` then optimises the new images and
`getStaticPaths()` regenerates the galleries and any qualifying detail page. No
runtime server ever serves the work.

The admin page is a browser island that holds **zero trust** — anyone can load it.
The **security boundary is the serverless publish Function**, which validates a JWT
server-side before doing anything.

**Auth — magic link, deliberately un-hardened.** A `request-link` Function checks
the submitted email against a server-side allowlist _before any email is sent_, then
mints a short-lived signed JWT and emails the link via a transactional provider. We
do not use Netlify Identity (ADR 0001). There is a single authorised user on a stable
personal Gmail, so we deliberately skip single-use tokens and link/code exchange
hardening — the token simply rides in the link with a sensible TTL.

**Publish — one atomic commit via the Trees API.** Jo batch-stages images and
metadata in the browser, then publishes in a single request (metadata + Base64-encoded
images + JWT). The Function verifies the JWT, assigns **unique filenames so the asset
store stays append-only**, and writes the image blobs and the content entry as **one
commit using the GitHub Trees API**.

We chose the Trees API from the first build over a simpler Contents-API-per-file
approach: the latter produces N commits and N deploy triggers for a multi-image
Artwork and leaves a partial-publish window where the entry references blobs that
aren't committed yet. The "single publish → one commit" property is core to the UX,
and the extra Trees plumbing (create blobs → tree → commit → update ref) is small.

**Cover.** The Cover is the first image in an Artwork's image list — there is no
separate cover field. The admin lets Jo reorder images, and that order is committed,
so the Cover is set through ordering in the upload flow. CONTEXT.md was reworded to
match (its prior "set manually, not through the upload flow" predated this phase).

## Consequences

- A GitHub token (repo commit scope), the JWT signing secret, the email-provider API
  key, and the allowlist all live as Netlify env vars / secrets — never in the island.
- Video is excluded from this flow by design: Base64-ing a multi-MB video into a commit
  is unworkable, which is why video is referenced by external URL (ADR 0002).
- The Trees-API batch publish remains deferred _work_; this ADR fixes it as the target
  design rather than something to be re-litigated when Phase 2 starts.
