import type { Config, Context } from "@netlify/functions"

export default async (req: Request, _context: Context) => {}

export const config: Config = {
    path: "/publish-artworks",
}
