import type { ArtworkTree } from "../types/artwork"
import { createFrontmatter } from "./createFrontmatter"

export const createArtworkFrontmatter = <T extends ArtworkTree>(artwork: T) => {
    const { images, type: _type, description, ...rest } = artwork
    const cleanArtwork = {
        ...rest,
        images: images.map((image) => ({ src: image.path.replace("src/", "../../"), alt: image.alt })),
    }

    return createFrontmatter(cleanArtwork) + `\n${description}`
}
