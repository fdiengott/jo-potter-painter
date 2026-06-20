import type { Parsed } from "../types/parsed"
import { z } from "astro/zod"

const emailSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
})

export const parseEmail = (request: unknown): Parsed<string> => {
    const result = emailSchema.safeParse(request)

    if (!result.success) return { type: "error", message: z.prettifyError(result.error) }

    return { type: "success", payload: result.data.email }
}
