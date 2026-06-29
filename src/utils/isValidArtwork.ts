import { MAX_IMAGES } from "../constants/constants"
import type { Artwork } from "../types/artwork"
import type { DraftImage } from "../types/stagedArtwork"

interface DraftArtwork extends Required<Pick<Artwork, "title" | "year" | "videoSrc">> {
    images: DraftImage[]
}

export const isValidArtwork = ({ title, year, images, videoSrc }: DraftArtwork): boolean =>
    title.trim().length > 0 &&
    Number.isInteger(year) &&
    year > 0 &&
    images.length >= 1 &&
    images.length <= MAX_IMAGES &&
    images.every((image) => image.status === "success" && image.alt.trim().length > 0) &&
    (videoSrc.trim() === "" || isValidUrl(videoSrc.trim()))

const isValidUrl = (value: string) => {
    try {
        new URL(value)
        return true
    } catch {
        return false
    }
}
