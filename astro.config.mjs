// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Static-by-default per ADR 0001 (Netlify static hosting).
  output: 'static',

  // Production site URL — required for sitemap.xml and canonical URLs.
  // TODO: confirm the final domain (custom domain vs. Netlify subdomain)
  // before launch; swapping it here updates the sitemap and all canonicals.
  site: 'https://josephineflorence.com',

  integrations: [sitemap()],
});
