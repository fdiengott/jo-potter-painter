import type { Parsed } from "../../src/types/parsed"
import type { StageImageRequest } from "../../src/types/stageImageRequest"
import { z } from "astro/zod"

const stageImageRequestSchema = z.object({
    token: z.string().min(1),
    imageBlob: z.string().min(1),
})

export const parseStageImageRequest = (stageImage: unknown): Parsed<StageImageRequest> => {
    const result = stageImageRequestSchema.safeParse(stageImage)

    if (!result.success) return { type: "error", message: z.prettifyError(result.error) }

    return { type: "success", payload: result.data }
}
