// @ts-check
import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"

export default defineConfig({
    output: "static",

    // Production site URL — required for sitemap.xml and canonical URLs.
    // TODO: confirm the final domain (custom domain vs. Netlify subdomain)
    // before launch; swapping it here updates the sitemap and all canonicals.
    site: "https://josephineflorence.com",
    integrations: [sitemap()],
})
