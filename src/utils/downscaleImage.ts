const MAX_EDGE = 2560
const QUALITY = 0.85

export const downscaleImage = (file: File, maxEdge = MAX_EDGE, quality = QUALITY): Promise<string> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()

        img.onload = () => {
            URL.revokeObjectURL(url)

            const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
            const width = Math.round(img.width * scale)
            const height = Math.round(img.height * scale)

            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext("2d")
            if (!ctx) return reject(new Error("Could not get a 2D canvas context"))

            ctx.drawImage(img, 0, 0, width, height)

            const base64 = canvas.toDataURL("image/jpeg", quality).split(",")[1]
            if (!base64) return reject(new Error("Failed to encode image"))

            resolve(base64)
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Failed to load image"))
        }

        img.src = url
    })
