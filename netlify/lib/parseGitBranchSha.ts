import type { Parsed } from "../../src/types/parsed"
import { z } from "astro/zod"

const gitBranchSchema = z.object({
    object: z.object({
        sha: z.string(),
    }),
})

export const parseGitBranchSha = (req: unknown): Parsed<{ sha: string }> => {
    const result = gitBranchSchema.safeParse(req)

    if (!result.success) return { type: "error", message: z.prettifyError(result.error) }

    return { type: "success", payload: result.data.object }
}
