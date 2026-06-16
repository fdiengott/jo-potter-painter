import type { Parsed } from "../../src/types/parsed"
import type { PublishArtworksRequest } from "../../src/types/publishArtworksRequest"
import { z } from "astro/zod"
import { MAX_IMAGES } from "../../src/constants/constants"

const artworkImageSchema = z.object({
    alt: z.string().min(1),
    blobSha: z.string().min(1),
})

const artworkSchema = z.object({
    type: z.enum(["ceramic", "painting"]),
    title: z.string().min(1),
    year: z.number().int().nonnegative(),
    medium: z.string().optional(),
    images: z.array(artworkImageSchema).min(1).max(MAX_IMAGES),
    videoSrc: z.url().optional(),
    description: z.string().optional(),
})

const publishArtworksRequestSchema = z.object({
    token: z.string().min(1),
    artworks: z.array(artworkSchema).min(1),
})

export const parsePublishArtworksRequest = (req: unknown): Parsed<PublishArtworksRequest> => {
    const result = publishArtworksRequestSchema.safeParse(req)

    if (!result.success) {
        return { type: "error", message: z.prettifyError(result.error) }
    }

    return { type: "success", payload: result.data }
}
