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

const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const logger = createContextualLogger("publishArtworks")

export default async (req: Request, _context: Context) => {
    if (!GITHUB_REPO || !GITHUB_TOKEN) {
        return toResponse(500, { message: "Missing environment variables" })
    }

    try {
        const reqParsed = parsePublishArtworksRequest(await req.json())

        if (reqParsed.type === "error") {
            return toResponse(400, { message: `Invalid request. ${reqParsed.message}` })
        }

        const tokenVerified = await verifyToken(reqParsed.payload.token)

        if (!tokenVerified) return toResponse(401, { message: "Unauthorized" })

        const baseSha = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/main`, {
            method: "GET",
            headers: getHeaders(),
        })

        const parsedBaseSha = parseGitBranchSha(await baseSha.json())

        if (parsedBaseSha.type === "error") {
            logger.error("Failed to get base sha.", parsedBaseSha.message)
            return toResponse(502, { message: "Failed to get base sha" })
        }

        const treeSha = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/git/commits/${parsedBaseSha.payload.sha}`,
            {
                method: "GET",
                headers: getHeaders(),
            },
        )
        const parsedTreeSha = parseShaResponse(await treeSha.json())

        if (parsedTreeSha.type === "error") {
            logger.error("Failed to get tree sha.", parsedTreeSha.message)
            return toResponse(502, { message: "Failed to get tree sha" })
        }

        const artworks = reqParsed.payload.artworks

        const artworksWithMappedImages = artworks.map((artwork) => ({
            ...artwork,
            images: artwork.images.map(
                (image) =>
                    ({
                        alt: image.alt,
                        mode: "100644",
                        path: `src/assets/${artwork.type}/${slugifyTitle(artwork.title)}.webp`,
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
            path: `src/content/${artwork.type}/${getArtworkId(artwork)}.md`,
            type: "blob",
        }))

        const treesResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/trees`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                base_tree: parsedTreeSha.payload.sha,
                tree: [...imageTrees, ...fileTrees],
            }),
        })

        const parsedTreesResponse = parseShaResponse(await treesResponse.json())

        if (parsedTreesResponse.type === "error") {
            logger.error("Failed to create git trees.", parsedTreesResponse.message)
            return toResponse(502, { message: "Failed to create git trees" })
        }

        const commitSha = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/commits`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                message: `New artworks published as of ${new Date().toLocaleDateString()}`,
                tree: parsedTreesResponse.payload.sha,
                parents: [parsedBaseSha.payload.sha],
            }),
        })

        const parsedCommitSha = parseShaResponse(await commitSha.json())

        if (parsedCommitSha.type === "error") {
            logger.error("Failed to create git commit.", parsedCommitSha.message)
            return toResponse(502, { message: "Failed to create git commit" })
        }

        const refUpdateResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/main`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({ sha: parsedCommitSha.payload.sha }),
        })

        const parsedRefUpdateResponse = parseGitBranchSha(await refUpdateResponse.json())

        if (parsedRefUpdateResponse.type === "error") {
            logger.error("Failed to update ref.", parsedRefUpdateResponse.message)
            return toResponse(502, { message: "Failed to update ref" })
        }

        return toResponse(200, { commitSha: parsedRefUpdateResponse.payload.sha })
    } catch (err) {
        logger.error("Failed to publish artworks.", err)
        return toResponse(502, { message: "Failed to create git commit" })
    }
}

export const config: Config = {
    path: "/publish-artworks",
}

const getHeaders = () => ({
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "Jo-flo-admin",
})
