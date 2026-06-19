import type { Parsed } from "../../src/types/parsed"
import { z } from "astro/zod"

const shawSchema = z.object({
    sha: z.string().min(1),
})

export const parseShaResponse = (res: unknown): Parsed<{ sha: string }> => {
    const result = shawSchema.safeParse(res)

    if (!result.success) return { type: "error", message: z.prettifyError(result.error) }

    return { type: "success", payload: result.data }
}
