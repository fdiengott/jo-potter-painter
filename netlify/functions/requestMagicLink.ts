import type { Config, Context } from "@netlify/functions"
import { SignJWT } from "jose"
import { parseEmail } from "../../src/utils/emailParser"
import { sendMagicLinkEmail } from "../lib/sendMagicLinkEmail"
import { toResponse } from "../lib/toRequest"
import { isOnAllowList } from "../lib/isOnAllowList"
import { createContextualLogger } from "../../src/utils/createContextualLogger"

const FALLBACK_SITE_URL = "http://localhost:8888"
const TOKEN_TTL = "15m"
const secret = process.env.JO_CERAMIC_PAINTER_JWT_SECRET
const allowListRaw = process.env.ADMIN_ALLOW_LIST

const logger = createContextualLogger("requestMagicLink")

export default async (req: Request, _context: Context) => {
    if (req.method !== "POST") {
        return toResponse(405, { message: "Method not allowed" })
    }

    if (!secret || !allowListRaw) {
        secret || logger.error("Missing JWT_SECRET env var")
        allowListRaw || logger.error("Missing ADMIN_ALLOW_LIST env var")
        return toResponse(500, { message: "Server misconfigured" })
    }

    let reqJson: Record<string, unknown>
    try {
        reqJson = await req.json().catch((e) => {
            logger.error("Failed to parse request", e)
        })
    } catch {
        return toResponse(400, { message: "Invalid JSON body" })
    }

    const parsed = parseEmail(reqJson)
    if (parsed.type === "error") return toResponse(400, { message: parsed.message })

    const email = parsed.payload

    const genericOk = toResponse(200, {
        message: "If that address is authorized, a magic link is on its way.",
    })

    if (!isOnAllowList(email)) return genericOk

    const magicLink = await generateMagicLink(email)

    try {
        await sendMagicLinkEmail(email, magicLink)
    } catch (err) {
        return toResponse(500, { message: `Failed to send magic link. ${err}` })
    }

    return genericOk
}

const generateMagicLink = async (email: string) => {
    const token = await generateToken(email)
    const siteUrl = process.env.URL ?? FALLBACK_SITE_URL

    return `${siteUrl}/admin?token=${token}`
}

const generateToken = (email: string) =>
    new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(email)
        .setIssuedAt()
        .setExpirationTime(TOKEN_TTL)
        .sign(new TextEncoder().encode(secret))

export const config: Config = {
    path: "/request-magic-link",
}
