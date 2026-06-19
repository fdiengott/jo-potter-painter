import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PublishArtworksRequest } from "../../src/types/publishArtworksRequest"

// silence the logger to avoid logs in test output
vi.mock("../../src/utils/createContextualLogger", () => ({
    createContextualLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
}))

vi.mock("../lib/verifyToken", () => ({ verifyToken: vi.fn().mockResolvedValue(true) }))
import { verifyToken } from "../lib/verifyToken"

const MOCKS = {
    repo: "owner/repo",
    token: "test-token",
    branch: "staging",
}
const ENV = { GITHUB_REPO: MOCKS.repo, GITHUB_TOKEN: MOCKS.token, GITHUB_BRANCH: MOCKS.branch }
const CALLS = {
    baseRef: 0,
    baseCommit: 1,
    createTree: 2,
    createCommit: 3,
    createBranch: 4,
    createPullRequest: 5,
} as const

const getPublishFn = async () => (await import("./publishArtworks")).default

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.mocked(verifyToken).mockResolvedValue(true)
    for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value)
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
})

describe("publishArtworks", () => {
    describe("guards", () => {
        it("returns 500 when a required GITHUB_* env var is missing", async () => {
            vi.stubEnv("GITHUB_BRANCH", "")
            const publishFn = await getPublishFn()

            const res = await publishFn(makeRequest(validRequest()))

            expect(res.status).toBe(500)
            await expect(res.json()).resolves.toEqual({ message: "Missing environment variables" })
            expect(fetchMock).not.toHaveBeenCalled()
        })

        it("returns 400 when the request body is not valid JSON", async () => {
            const publishFn = await getPublishFn()

            const res = await publishFn(makeRequest("not json", false))

            expect(res.status).toBe(400)
            await expect(res.json()).resolves.toEqual({ message: "Invalid JSON body" })
            expect(fetchMock).not.toHaveBeenCalled()
        })

        it("returns 400 when the body fails schema validation", async () => {
            const publishFn = await getPublishFn()

            const res = await publishFn(makeRequest({ token: "valid-token" }))

            expect(res.status).toBe(400)
            await expect(res.json()).resolves.toEqual({ message: "Invalid request." })
            expect(fetchMock).not.toHaveBeenCalled()
        })

        it("returns 401 when the token cannot be verified", async () => {
            vi.mocked(verifyToken).mockResolvedValue(false)
            const publishFn = await getPublishFn()

            const res = await publishFn(makeRequest(validRequest()))

            expect(res.status).toBe(401)
            await expect(res.json()).resolves.toEqual({ message: "Unauthorized" })
            expect(fetchMock).not.toHaveBeenCalled()
        })
    })

    describe("happy path", () => {
        it("creates a branch and opens a PR, returning pullRequestNumber and pullRequestUrl", async () => {
            queueHappyPath(fetchMock)
            const publishFn = await getPublishFn()

            const res = await publishFn(makeRequest(validRequest()))

            expect(res.status).toBe(200)
            await expect(res.json()).resolves.toEqual({
                pullRequestNumber: 42,
                pullRequestUrl: `https://github.com/${MOCKS.repo}/pull/42`,
            })
            expect(fetchMock).toHaveBeenCalledTimes(6)
        })

        it("bases the commit and tree on the current GITHUB_BRANCH tip", async () => {
            queueHappyPath(fetchMock)
            const publishFn = await getPublishFn()

            await publishFn(makeRequest(validRequest()))

            expect(urlOf(CALLS.baseRef)).toBe(
                `https://api.github.com/repos/${MOCKS.repo}/git/refs/heads/${MOCKS.branch}`,
            )
            expect(urlOf(CALLS.baseCommit)).toBe(`https://api.github.com/repos/${MOCKS.repo}/git/commits/base-sha`)
            expect(bodyOf(CALLS.createTree).base_tree).toBe("base-commit-sha")
            expect(bodyOf(CALLS.createCommit).parents).toEqual(["base-sha"])
            expect(bodyOf(CALLS.createCommit).tree).toBe("new-tree-sha")
        })

        it("includes an image blob and a markdown file in the created tree per artwork", async () => {
            // slugifyTitle appends a random crypto.randomUUID().slice(0, 8); pin it for a stable path.
            vi.spyOn(crypto, "randomUUID").mockReturnValue("abcdef12-0000-4000-8000-000000000000")
            queueHappyPath(fetchMock)
            const publishFn = await getPublishFn()

            await publishFn(makeRequest(validRequest()))

            const tree = bodyOf(CALLS.createTree).tree as Array<Record<string, unknown>>
            expect(tree).toContainEqual({
                mode: "100644",
                path: "src/assets/paintings/blue-morning-abcdef12.webp",
                sha: "blob-sha-1",
                type: "blob",
            })
            const markdown = tree.find((entry) => entry.path === "src/content/paintings/painting-blue-morning.md")
            expect(markdown).toMatchObject({ mode: "100644", type: "blob" })
            expect(markdown?.content).toEqual(expect.stringContaining("Blue Morning"))
        })

        it("creates the branch ref under refs/heads/publish-artworks/", async () => {
            queueHappyPath(fetchMock)
            const publishFn = await getPublishFn()

            await publishFn(makeRequest(validRequest()))

            expect(urlOf(CALLS.createBranch)).toBe("https://api.github.com/repos/owner/repo/git/refs")
            expect(bodyOf(CALLS.createBranch).ref).toMatch(/^refs\/heads\/publish-artworks\//)
            expect(bodyOf(CALLS.createBranch).sha).toBe("new-commit-sha")
        })

        it("opens the PR with head=new branch and base=GITHUB_BRANCH", async () => {
            queueHappyPath(fetchMock)
            const publishFn = await getPublishFn()

            await publishFn(makeRequest(validRequest()))

            const branchName = bodyOf(CALLS.createBranch).ref.replace("refs/heads/", "")
            expect(urlOf(CALLS.createPullRequest)).toBe("https://api.github.com/repos/owner/repo/pulls")
            expect(bodyOf(CALLS.createPullRequest).base).toBe("staging")
            expect(bodyOf(CALLS.createPullRequest).head).toBe(branchName)
            expect(bodyOf(CALLS.createPullRequest).title).toEqual(expect.stringContaining("Publish 1 new artwork(s)"))
        })
    })

    describe("GitHub API failures", () => {
        // githubRequest throws HttpError(502, "GitHub request failed") on any non-OK response,
        it.each([
            ["fetching the base sha", CALLS.baseRef],
            ["fetching the base commit/tree sha", CALLS.baseCommit],
            ["creating the git tree", CALLS.createTree],
            ["creating the commit", CALLS.createCommit],
            ["creating the branch ref", CALLS.createBranch],
            ["creating the pull request", CALLS.createPullRequest],
        ])("returns 502 when %s fails", async (_label, failIndex) => {
            queueFailureAt(fetchMock, failIndex)
            const publishFn = await getPublishFn()

            const res = await publishFn(makeRequest(validRequest()))

            expect(res.status).toBe(502)
            await expect(res.json()).resolves.toEqual({ message: "GitHub request failed" })
            expect(fetchMock).toHaveBeenCalledTimes(failIndex + 1)
        })

        it("returns 502 when the PR response is missing number/html_url", async () => {
            queueFailureAt(fetchMock, CALLS.createPullRequest, githubOk({ id: 1 }))
            const publishFn = await getPublishFn()

            const res = await publishFn(makeRequest(validRequest()))

            expect(res.status).toBe(502)
            await expect(res.json()).resolves.toEqual({ message: "Failed to create pull request" })
            expect(fetchMock).toHaveBeenCalledTimes(6)
        })
    })

    describe("unexpected errors", () => {
        it("returns 500 on an unhandled (non-HttpError) failure", async () => {
            fetchMock.mockRejectedValueOnce(new Error("network down"))
            const publishFn = await getPublishFn()

            const res = await publishFn(makeRequest(validRequest()))

            expect(res.status).toBe(500)
            await expect(res.json()).resolves.toEqual({ message: "Internal server error" })
        })
    })
})

const validRequest = (): PublishArtworksRequest => ({
    token: "valid-token",
    artworks: [
        {
            type: "painting",
            title: "Blue Morning",
            year: 2026,
            images: [{ alt: "a blue morning", blobSha: "blob-sha-1" }],
        },
    ],
})

const makeRequest = (body: unknown, isJson = true) =>
    new Request("http://localhost/publish-artworks", {
        method: "POST",
        body: isJson ? JSON.stringify(body) : (body as string),
        headers: { "Content-Type": "application/json" },
    })

const githubOk = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
const githubErr = (status: number, body: unknown = { message: "github error" }) => ({
    ok: false,
    status,
    json: async () => body,
})

// Successful GitHub responses in call order: base ref, base commit, trees, commit, ref, pull.
const HAPPY_RESPONSES = [
    { object: { sha: "base-sha" } },
    { sha: "base-commit-sha" },
    { sha: "new-tree-sha" },
    { sha: "new-commit-sha" },
    { object: { sha: "new-commit-sha" } },
    { number: 42, html_url: "https://github.com/owner/repo/pull/42" },
]

const queueHappyPath = (fetchMock: ReturnType<typeof vi.fn>) => {
    for (const response of HAPPY_RESPONSES) fetchMock.mockResolvedValueOnce(githubOk(response))
}

const queueFailureAt = (fetchMock: ReturnType<typeof vi.fn>, failIndex: number, failResponse = githubErr(500)) => {
    for (const response of HAPPY_RESPONSES.slice(0, failIndex)) fetchMock.mockResolvedValueOnce(githubOk(response))
    fetchMock.mockResolvedValueOnce(failResponse)
}

const urlOf = (i: number) => fetchMock.mock.calls[i][0] as string
const bodyOf = (i: number) => JSON.parse((fetchMock.mock.calls[i][1] as RequestInit).body as string)
