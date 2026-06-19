import type { Artwork } from "./artwork"

export type PublishArtworksRequest = {
    token: string
    artworks: Artwork[]
}
