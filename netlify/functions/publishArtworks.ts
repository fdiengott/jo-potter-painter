import type { Config, Context } from "@netlify/functions"
import { createContextualLogger } from "../../src/utils/createContextualLogger"
import { toResponse } from "../lib/toRequest"
import { parsePublishArtworksRequest } from "../lib/parsePublishArtworksRequest"
import { verifyToken } from "../lib/verifyToken"
import { parseGitBranchSha } from "../lib/parseGitBranchSha"
import { getArtworkId } from "../../src/utils/getArtworkId"
import { createArtworkFrontmatter } from "../../src/utils/createArtworkFrontmatter"
import type { EnrichedTree, Tree } from "../../src/types/tree"
import { slugifyTitle } from "../../src/utils/slugifyTitle"
import { parseShaResponse } from "../lib/parseShaResponse"
import { githubRequest } from "../lib/githubRequest"
import { unwrapRequestAndParse } from "../lib/unwrapParsed"
import { HttpError } from "../lib/HttpError"
import { toIsoDate } from "../lib/dateFormatters"

const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const logger = createContextualLogger("publishArtworks")

export default async (req: Request, _context: Context) => {
    if (!GITHUB_REPO || !GITHUB_TOKEN) {
        return toResponse(500, { message: "Missing environment variables" })
    }

    try {
        const body = req.json().catch(() => {
            throw new HttpError(400, "Invalid JSON body")
        })
        const reqParsed = await unwrapRequestAndParse(parsePublishArtworksRequest, body, 400, "Invalid request.")

        const tokenVerified = await verifyToken(reqParsed.token)

        if (!tokenVerified) return toResponse(401, { message: "Unauthorized" })

        const baseSha = await unwrapRequestAndParse(
            parseGitBranchSha,
            githubRequest(`/repos/${GITHUB_REPO}/git/refs/heads/main`, { method: "GET" }),
            502,
            "Failed to get base sha",
        )

        const treeSha = await unwrapRequestAndParse(
            parseShaResponse,
            githubRequest(`/repos/${GITHUB_REPO}/git/commits/${baseSha.sha}`, { method: "GET" }),
            502,
            "Failed to get tree sha",
        )

        const { artworks } = reqParsed

        const artworksWithMappedImages = artworks.map((artwork) => ({
            ...artwork,
            images: artwork.images.map(
                (image) =>
                    ({
                        alt: image.alt,
                        mode: "100644",
                        path: `src/assets/${artwork.type}s/${slugifyTitle(artwork.title)}.webp`,
                        sha: image.blobSha,
                        type: "blob",
                    }) satisfies EnrichedTree,
            ),
        }))

        const imageTrees: Tree[] = artworksWithMappedImages.flatMap((artwork) =>
            artwork.images.map(({ alt: _alt, ...image }) => image),
        )

        const fileTrees = artworksWithMappedImages.map((artwork) => ({
            content: createArtworkFrontmatter(artwork),
            mode: "100644",
            path: `src/content/${artwork.type}s/${getArtworkId(artwork)}.md`,
            type: "blob",
        }))

        const treesResponse = await unwrapRequestAndParse(
            parseShaResponse,
            githubRequest(`/repos/${GITHUB_REPO}/git/trees`, {
                method: "POST",
                body: JSON.stringify({
                    base_tree: treeSha.sha,
                    tree: [...imageTrees, ...fileTrees],
                }),
            }),
            502,
            "Failed to create git trees",
        )

        const commitSha = await unwrapRequestAndParse(
            parseShaResponse,
            githubRequest(`/repos/${GITHUB_REPO}/git/commits`, {
                method: "POST",
                body: JSON.stringify({
                    message: `${toIsoDate(new Date())}: Publish new artworks`,
                    tree: treesResponse.sha,
                    parents: [baseSha.sha],
                }),
            }),
            502,
            "Failed to create git commit",
        )

        const refUpdateResponse = await unwrapRequestAndParse(
            parseGitBranchSha,
            githubRequest(`/repos/${GITHUB_REPO}/git/refs/heads/main`, {
                method: "PATCH",
                body: JSON.stringify({ sha: commitSha.sha }),
            }),
            502,
            "Failed to update ref",
        )

        return toResponse(200, { commitSha: refUpdateResponse.sha })
    } catch (err) {
        if (err instanceof HttpError) {
            logger.error(err.message, err.cause)
            return toResponse(err.status, { message: err.message })
        }

        logger.error("Unhandled error in publishArtworks", err)
        return toResponse(500, { message: "Internal server error" })
    }
}

export const config: Config = {
    path: "/publish-artworks",
}
