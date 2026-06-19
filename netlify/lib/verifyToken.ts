import { jwtVerify } from "jose"
import { createContextualLogger } from "../../src/utils/createContextualLogger"
import { isOnAllowList } from "./isOnAllowList"

const logger = createContextualLogger("verifyToken")

export const verifyToken = async (token: string): Promise<boolean> => {
    if (!process.env.JO_CERAMIC_PAINTER_JWT_SECRET || !token) {
        process.env.JO_CERAMIC_PAINTER_JWT_SECRET ?? logger.error("JO_CERAMIC_PAINTER_JWT_SECRET is not set")
        token || logger.error("token is not set")
        return false
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JO_CERAMIC_PAINTER_JWT_SECRET))

        if (!payload.exp || payload.exp < Date.now() / 1000) {
            logger.error("Token expired")
            return false
        }

        if (!payload.sub) {
            logger.error("Invalid token")
            return false
        }

        if (!isOnAllowList(payload.sub)) return false

        return true
    } catch (e) {
        logger.error("Failed to verify token", e)
        return false
    }
}
