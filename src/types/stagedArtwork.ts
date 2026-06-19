import type { Artwork } from "./artwork"

export type ImageStatus = "uploading" | "uploaded" | "error"

export type DraftImage = {
    id: string
    previewUrl: string
    alt: string
    status: ImageStatus
    blobSha?: string
}

export type StagedArtwork = {
    id: string
    type: "ceramic" | "painting"
    title: string
    year: number
    medium?: string
    images: DraftImage[]
    videoSrc?: string
    description?: string
}

export const toArtwork = ({ type, title, year, medium, images, videoSrc, description }: StagedArtwork): Artwork => ({
    type,
    title,
    year,
    ...(medium ? { medium } : {}),
    images: images.map(({ alt, blobSha }) => ({ alt, blobSha: blobSha ?? "" })),
    ...(videoSrc ? { videoSrc } : {}),
    ...(description ? { description } : {}),
})
