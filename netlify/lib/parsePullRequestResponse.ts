import { z } from "astro/zod"
import type { Parsed } from "../../src/types/parsed"

const pullRequestSchema = z.object({
    number: z.number(),
    html_url: z.string(),
})

type PullRequestResponse = z.infer<typeof pullRequestSchema>

export const parsePullRequestResponse = (res: unknown): Parsed<PullRequestResponse> => {
    const result = pullRequestSchema.safeParse(res)

    if (!result.success) return { type: "error", message: z.prettifyError(result.error) }
    return { type: "success", payload: result.data }
}
