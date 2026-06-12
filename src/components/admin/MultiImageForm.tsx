import { useEffect, useState } from "react"
import { ImageFormSubmitted } from "./ImageFormSubmitted"

interface Props {
    token: string
}

export const MultiImageForm = ({ token }: Props) => {
    const [tokenState] = useState(token ?? "")
    const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState(false)

    useEffect(() => {
        const url = new URL(document.URL)
        if (!url.searchParams.size) return

        history.replaceState(null, "", url.pathname)
    }, [token])

    if (hasSubmittedSuccessfully) return <ImageFormSubmitted success={hasSubmittedSuccessfully} />

    return <div>multi image form token: {tokenState}</div>
}
