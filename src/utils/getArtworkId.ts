import type { Artwork } from "../types/artwork"

export const getArtworkId = <T extends Pick<Artwork, "type" | "title">>(artwork: T) =>
    `${artwork.type}-${artwork.title.trim().replace(/\s+/g, "-").toLowerCase()}`
