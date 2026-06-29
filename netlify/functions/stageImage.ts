import type { Config, Context } from "@netlify/functions"
import { parseStageImageRequest } from "../lib/parseStageImageRequest"
import { toResponse } from "../lib/toRequest"
import { verifyToken } from "../lib/verifyToken"
import { createContextualLogger } from "../../src/utils/createContextualLogger"
import { HttpError } from "../lib/HttpError"

const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const logger = createContextualLogger("stageImage")

export default async (req: Request, _context: Context) => {
    if (!GITHUB_REPO || !GITHUB_TOKEN) {
        return toResponse(500, { message: "Missing environment variables" })
    }

    try {
        const stageImageRequest = parseStageImageRequest(
            await req.json().catch((e) => {
                logger.error("Failed to parse request", e)
                throw new HttpError(400, "Invalid JSON body")
            }),
        )
        if (stageImageRequest.type === "error") {
            return toResponse(400, { message: `Invalid JSON body. ${stageImageRequest.message}` })
        }

        const { token, imageBlob } = stageImageRequest.payload

        const tokenVerified = await verifyToken(token)

        if (!tokenVerified) return toResponse(401, { message: "Unauthorized" })

        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/blobs`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "Jo-flo-admin",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: imageBlob, encoding: "base64" }),
        })

        if (!res.ok) {
            logger.error(`Failed to create blob on GitHub: ${res.status} ${await res.text()}`)
            return toResponse(502, { message: "Failed to create blob" })
        }

        const { sha } = await res.json()
        return toResponse(200, { sha })
    } catch (err) {
        if (err instanceof HttpError) {
            logger.error(err.message, err.cause)
            return toResponse(err.status, { message: err.message })
        }

        logger.error(`Failed to create blob on GitHub: ${err}`)
        return toResponse(502, { message: "Failed to create blob" })
    }
}

export const config: Config = {
    path: "/stage-image",
}
