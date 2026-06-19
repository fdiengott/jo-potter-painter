import { useEffect, useState } from "react"
import type { StagedArtwork } from "../../types/stagedArtwork"
import { ArtworkForm } from "./ArtworkForm"
import { ArtworksReview } from "./ArtworksReview"

type View = "ArtworkDetails" | "ArtworksReview"

interface Props {
    token: string
}

export const MultiImageForm = ({ token }: Props) => {
    const [artworks, setArtworks] = useState<StagedArtwork[]>([])
    const [view, setView] = useState<View>("ArtworksReview")
    const [tokenState] = useState(token)

    useEffect(() => {
        const url = new URL(document.URL)
        if (!url.searchParams.size) return

        history.replaceState(null, "", url.pathname)
    }, [tokenState])

    const handleRemove = (id: string) =>
        setArtworks((prev) => {
            const target = prev.find((artwork) => artwork.id === id)
            target?.images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
            return prev.filter((artwork) => artwork.id !== id)
        })

    if (view === "ArtworksReview") {
        return (
            <ArtworksReview
                artworks={artworks}
                token={tokenState}
                onRemove={handleRemove}
                onResetForm={() => {
                    setArtworks([])
                    setView("ArtworkDetails")
                }}
                onToAddArtwork={() => setView("ArtworkDetails")}
            />
        )
    }

    return (
        <ArtworkForm
            token={tokenState}
            onAddArtwork={(artwork) => {
                setArtworks((prev) => [...prev, artwork])
                setView("ArtworksReview")
            }}
            onCancel={() => setView("ArtworksReview")}
        />
    )
}
