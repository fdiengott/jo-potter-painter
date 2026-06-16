import { HttpError } from "./HttpError"

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const GITHUB_API_URL = "https://api.github.com"

export const githubRequest = async (path: string, requestOptions: RequestInit): Promise<unknown> => {
    const res = await fetch(`${GITHUB_API_URL}${path}`, { ...requestOptions, headers: getHeaders() })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new HttpError(502, "GitHub request failed", { status: res.status, path, body: data })
    return data
}

const getHeaders = () => ({
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "Jo-flo-admin",
})
