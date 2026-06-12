# Jo Portfolio

A static portfolio site for Josephine Florence, an abstract painter and ceramicist. Content-heavy, image-forward, lightly interactive.

## Language

**Ceramics**:
Josephine's three-dimensional clay work. The external, public-facing term for this body of work.
_Avoid_: Pottery (informal internal nickname only — acceptable in the repo name/dev folder, never in site copy or UI)

**Ceramicist**:
Josephine in her capacity as a maker of ceramics. The only external term for this role.
_Avoid_: Potter (internal nickname only)

**Painting**:
Josephine's abstract two-dimensional work.

**Painter**:
Josephine in her capacity as a maker of paintings.

**Artwork**:
A single piece of Josephine's work — one painting or one ceramic. The unit of content: each Artwork is one collection entry with its own title, year, and medium.
_Avoid_: Piece, work, item

**Gallery**:
A page that presents all Artworks of one kind (the Painting Gallery, the Ceramics Gallery). A view over a collection, not a thing that is made.

**Cover**:
The single image that represents an Artwork on its Gallery — the first image in the Artwork's image list. Clicking it opens the full set of images plus any video. There is no separate cover field — the Cover is whichever image is first, controlled by the image order (which the Phase 2 admin lets you set; see ADR 0003).

**Admin**:
The private `/admin` page where Josephine self-publishes Artworks (Phase 2). A `client:only` React island that holds no trust — the real boundary is the serverless function behind it. Excluded from `robots.txt` and the sitemap. See ADR 0003.

**Magic link**:
The passwordless sign-in mechanism for the Admin. Josephine enters her email; if it's on the server-side allowlist, a short-lived signed JWT is emailed to her as a link to `/admin?token=…`. Deliberately un-hardened (not single-use) for a single user — see ADR 0003.
