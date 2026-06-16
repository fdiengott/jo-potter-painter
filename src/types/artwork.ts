import type { EnrichedTree, Tree } from "./tree"

export type ArtworkImage = { alt: string; blobSha: string }

export type Artwork = {
    type: "ceramic" | "painting"
    title: string
    year: number
    medium?: string
    images: ArtworkImage[]
    videoSrc?: string
    description?: string
}

export type ArtworkTree = Omit<Artwork, "images"> & { images: EnrichedTree[] }
