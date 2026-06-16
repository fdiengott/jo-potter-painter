import { useState } from "react"
import { toArtwork, type StagedArtwork } from "../../types/stagedArtwork"
import { ArtworkPreviews } from "./ArtworkPreviews"
import styles from "./MultiImageForm.module.css"
import { MultiImageFormFailure } from "./MultiImageFormFailure"
import { MultiImageFormSuccess } from "./MultiImageFormSuccess"
import { createContextualLogger } from "../../utils/createContextualLogger"

type FormState = "success" | "failure" | null

const logger = createContextualLogger("ArtworksReview")

interface Props {
    artworks: StagedArtwork[]
    token: string
    onRemove: (id: string) => void
    onResetForm: () => void
    onToAddArtwork: () => void
}

export const ArtworksReview = ({ artworks, token, onRemove, onResetForm, onToAddArtwork }: Props) => {
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishedState, setPublishedState] = useState<FormState>(null)

    const handlePublish = async () => {
        try {
            setIsPublishing(true)
            // TODO: the /submit-images publish Function (Trees → commit → ref-update) is not built yet.
            const res = await fetch("/publish-artworks", getFetchOptions(artworks, token))

            if (!res.ok) throw new Error("Failed to publish artworks")

            artworks.forEach((artwork) => artwork.images.forEach((image) => URL.revokeObjectURL(image.previewUrl)))
            setPublishedState("success")
        } catch (e) {
            logger.error(e)
            setPublishedState("failure")
        } finally {
            setIsPublishing(false)
        }
    }

    if (publishedState === "success") {
        return (
            <MultiImageFormSuccess
                onReset={() => {
                    onResetForm()
                }}
            />
        )
    }
    if (publishedState === "failure") return <MultiImageFormFailure onRetry={() => setPublishedState(null)} />

    return (
        <div>
            <ArtworkPreviews artworks={artworks} onRemove={onRemove} />
            <div className={styles.btnGroup}>
                <button onClick={onToAddArtwork} type="button">
                    Add Artwork
                </button>
                <button onClick={handlePublish} type="button" disabled={isPublishing || artworks.length === 0}>
                    Publish to website
                </button>
            </div>
        </div>
    )
}

const getFetchOptions = (artworks: StagedArtwork[], token: string) => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ artworks: artworks.map(toArtwork), token }),
})
