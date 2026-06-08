# Netlify as host, static output, Netlify-native forms

The site is deployed on **Netlify** with Astro `output: 'static'`. The contact form uses **Netlify Forms** (a `data-netlify` HTML form, no serverless code), and the deferred self-serve admin and e-commerce phases will use **Netlify Functions**.

We chose this over a host-agnostic setup (e.g. Formspree for forms, GitHub Pages for hosting) because it keeps Phase 1 entirely buildless on the server side while leaving a clean path to the deferred phases (a Function can validate a JWT and commit to Git, triggering a redeploy) without changing the static-by-default posture.

## Consequences

- Netlify Forms couples form handling to host-specific markup (`data-netlify`); moving hosts later means reworking the contact form.
- For the deferred admin's magic-link auth we will **not** rely on Netlify Identity (in maintenance mode / discouraged for new projects). The plan is to roll our own signed-JWT magic link plus a transactional email provider, since there is a single authorized user.
