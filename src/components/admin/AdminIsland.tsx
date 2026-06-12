import { MagicLink } from "./MagicLink"
import { MultiImageForm } from "./MultiImageForm"

export const AdminIsland = () => {
    const url = new URL(document.URL)
    const token = url.searchParams.get("token")

    if (token) return <MultiImageForm token={token} />

    return <MagicLink />
}
