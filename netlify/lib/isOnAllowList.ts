const allowListRaw = process.env.ADMIN_ALLOW_LIST

export const isOnAllowList = (email: string) => {
    if (!allowListRaw) {
        console.error("Missing ADMIN_ALLOW_LIST env var")
        return false
    }
    return parseAllowList(allowListRaw).includes(email.toLowerCase())
}

const parseAllowList = (allowListRaw: string): string[] =>
    allowListRaw
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
