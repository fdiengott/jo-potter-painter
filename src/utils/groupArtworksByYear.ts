import type { CollectionEntry } from "astro:content"

type Artwork = CollectionEntry<"paintings"> | CollectionEntry<"ceramics">

export interface YearSection<T extends Artwork> {
    year: number
    artworks: T[]
}

// Sort by year descending, then `order` ascending; See ADR 0005.
function compareWithinYear(a: Artwork, b: Artwork): number {
    const [aOrder, bOrder] = [a, b].map((x) => x.data.order)
    if (aOrder === bOrder) return a.id.localeCompare(b.id)
    if (aOrder === undefined || bOrder === undefined) return aOrder === undefined ? 1 : -1
    return aOrder - bOrder
}

export const groupArtworksByYear = <T extends Artwork>(artworks: T[]): YearSection<T>[] =>
    Map.groupBy(artworks, (artwork) => artwork.data.year)
        .entries()
        .map(([year, artworks]) => ({ year, artworks: artworks.sort(compareWithinYear) }))
        .toArray()
        .sort((a, b) => b.year - a.year)
