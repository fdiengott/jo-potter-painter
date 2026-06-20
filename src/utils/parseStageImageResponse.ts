import type { Parsed } from "../types/parsed"
import type { StageImageResponse } from "../types/stageImageResponse"
import { z } from "astro/zod"

const stageImageResponseSchema = z.object({
    sha: z.string().min(1),
})

export const parseStageImageResponse = (response: unknown): Parsed<StageImageResponse> => {
    const result = stageImageResponseSchema.safeParse(response)

    if (!result.success) return { type: "error", message: z.prettifyError(result.error) }

    return { type: "success", payload: result.data }
}
