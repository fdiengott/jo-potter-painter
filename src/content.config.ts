import { defineCollection, type SchemaContext } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// images: 1–5 per Artwork. images[0] is the Cover (the image shown on the
// Gallery). An Artwork earns a detail page only when it has more to show —
// images.length > 1 || video

const paintings = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/paintings" }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      title: z.string(),
      year: z.number().int(),
      medium: z.string(),
      images: z
        .array(z.object({ src: image(), alt: z.string() }))
        .min(1)
        .max(5),
      video: z.url().optional(),
    }),
});

const ceramics = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/ceramics" }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      title: z.string(),
      year: z.number().int(),
      medium: z.string().optional(),
      images: z
        .array(z.object({ src: image(), alt: z.string() }))
        .min(1)
        .max(5),
      video: z.url().optional(),
    }),
});

export const collections = { paintings, ceramics };
