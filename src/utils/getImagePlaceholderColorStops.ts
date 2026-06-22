import sharp from "sharp"
import type { ImageMetadata } from "astro"

// Astro carries the absolute source path on the imported image object at
// runtime, but omits it from the public type. We read it to sample at build.
type WithFsPath = ImageMetadata & { fsPath?: string }

const cache = new Map<string, string[]>()

const toHex = (n: number) => n.toString(16).padStart(2, "0")

export async function getImagePlaceholderColorStops(image: ImageMetadata): Promise<string[] | null> {
    const fsPath = (image as WithFsPath).fsPath
    if (!fsPath) return null

    const cached = cache.get(fsPath)
    if (cached) return cached

    const { data } = await sharp(fsPath)
        .flatten({ background: "#ffffff" })
        .resize(3, 3, { fit: "fill" })
        .raw()
        .toBuffer({ resolveWithObject: true })

    const stops = Array.from({ length: 9 }, (_, i) => `#${[0, 1, 2].map((n) => toHex(data[i * 3 + n])).join("")}a0`)

    cache.set(fsPath, stops)
    return stops
}
