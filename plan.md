# Partner Portfolio Site

Potter/painter portfolio — content-heavy, image-forward, lightly interactive.

## Stack

- **Astro** — static by default, hydrates islands on demand

## Features

### Image Uploads (deferred)

- Content modeled as a collection from day one (images + metadata entries)
- Phase 1: manual uploads
- Phase 2: self-serve admin page → serverless function → Git commit → deploy
  - Auth: magic link; allowlist checked server-side before any email is sent
  - Security boundary: serverless function validates JWT (not the browser island)
  - Binaries: Base64-encoded; unique filenames to stay append-only
  - UX: batch-stage in browser → single publish → one commit (Trees API, deferred)

### E-commerce (deferred)

- Embeddable buy button (Stripe/Shopify-style) as an island
- Real challenge is operational: one-of-a-kind inventory, fragile shipping, tax

## Pages

Home Page
Upper right: Hamburger bottom with drop down (About, Painting Gallery, Ceramics Gallery, Shop, Contact)
Upper Left: (with super interesting font we choose)
Josephine Florence
Abstract Painter / Ceramicist
Two images side by side of my two practices (likely one of them my hands). Maybe all the way out to the edges of the page?

About Page
Pic of me on the right (maybe all the way up to the side of the page like you liked)
Bio on Left

Paintings Gallery
Rows of two paintings at a time side by side, scroll down over them
I.e. Example

Ceramics Gallery
Photos in artsy grid style (I forget the word)
i.e. Example

Shop
I’m still stewing on this, so leave for last

Contact
Contact form on the right (Name, email, Subject, message)
Photo of me on the right
