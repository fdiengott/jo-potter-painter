export type ImageData = {
    type: "ceramic" | "painting"
    title: string
    year: number
    medium?: string
    images: { alt: string; blobSha: string }[]
    videoSrc?: string
    description?: string
}
