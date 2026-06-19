import { downscaleImage } from "./downscaleImage"
import { parseStageImageResponse } from "./parseStageImageResponse"
import type { StageImageRequest } from "../types/stageImageRequest"

export const stageImage = async (file: File, token: string): Promise<string> => {
    const imageBlob = await downscaleImage(file)
    const body: StageImageRequest = { token, imageBlob }

    const res = await fetch("/stage-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`stage-image failed: ${res.status}`)

    const parsed = parseStageImageResponse(await res.json())
    if (parsed.type === "error") throw new Error(parsed.message)

    return parsed.payload.sha
}
