import { useState, type SubmitEventHandler } from "react"
import type { DraftImage, StagedArtwork } from "../../types/stagedArtwork"
import { ImageDraftList } from "./ImageDraftList"
import { ConfirmModal } from "./ConfirmModal"
import { stageImage } from "../../utils/stageImage"
import { createContextualLogger } from "../../utils/createContextualLogger"
import styles from "./ArtworkForm.module.css"
import { MAX_IMAGES } from "../../constants/constants"
import { isValidArtwork } from "../../utils/isValidArtwork"

type ArtworkType = "painting" | "ceramic"

const logger = createContextualLogger("ArtworkForm")

interface Props {
    token: string
    onAddArtwork: (artwork: StagedArtwork) => void
    onCancel: () => void
}

export const ArtworkForm = ({ token, onAddArtwork, onCancel }: Props) => {
    const currentYear = new Date().getFullYear()

    const [type, setType] = useState<ArtworkType>("painting")
    const [title, setTitle] = useState("")
    const [year, setYear] = useState(currentYear)
    const [medium, setMedium] = useState("")
    const [videoSrc, setVideoSrc] = useState("")
    const [description, setDescription] = useState("")
    const [images, setImages] = useState<DraftImage[]>([])
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)

    const updateImage = (id: string, patch: Partial<DraftImage>) =>
        setImages((prev) => prev.map((image) => (image.id !== id ? image : { ...image, ...patch })))

    const handleSelectImages = (fileList: FileList) => {
        const remaining = MAX_IMAGES - images.length
        const files = Array.from(fileList).slice(0, remaining)

        if (!files.length) return

        const uploadImageCommands = files.map(createImageCommand)

        setImages((prev) => [...prev, ...uploadImageCommands])

        uploadImageCommands.forEach((command, index) => {
            updateImage(command.id, { status: "pending" })

            stageImage(files[index], token)
                .then((blobSha) => updateImage(command.id, { status: "success", blobSha }))
                .catch((e) => {
                    logger.error("Failed to stage image", e)
                    updateImage(command.id, { status: "failure" })
                })
        })
    }

    const handleAltChange = (id: string, alt: string) => updateImage(id, { alt })

    const handleMoveImage = (currentIndex: number, delta: number) =>
        setImages((prev) => {
            const next = [...prev]
            const newIndex = currentIndex + delta
            if (newIndex < 0 || newIndex >= next.length) return prev
            ;[next[currentIndex], next[newIndex]] = [next[newIndex], next[currentIndex]]
            return next
        })

    const handleRemove = (id: string) =>
        setImages((prev) => {
            const targetIdx = prev.findIndex((image) => image.id === id)
            if (targetIdx) URL.revokeObjectURL(prev[targetIdx].previewUrl)
            return prev.toSpliced(targetIdx, 1)
        })

    const isValid = isValidArtwork({ title, year, images, videoSrc })

    const handleSubmit: SubmitEventHandler = (e) => {
        e.preventDefault()
        if (!isValid) return

        onAddArtwork({
            id: crypto.randomUUID(),
            type,
            title: title.trim(),
            year,
            medium: type === "painting" && medium.trim() ? medium.trim() : undefined,
            images,
            videoSrc: videoSrc.trim() || undefined,
            description: description.trim() || undefined,
        })

        setType("painting")
        setTitle("")
        setYear(currentYear)
        setMedium("")
        setVideoSrc("")
        setDescription("")
        setImages([])
    }

    return (
        <>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div>
                    <fieldset className={styles.toggle}>
                        <legend className={styles.legend}>Type</legend>
                        <label className={styles.option}>
                            <input
                                type="radio"
                                name="type"
                                checked={type === "painting"}
                                onChange={() => setType("painting")}
                            />
                            Painting
                        </label>
                        <label className={styles.option}>
                            <input
                                type="radio"
                                name="type"
                                checked={type === "ceramic"}
                                onChange={() => setType("ceramic")}
                            />
                            Ceramic
                        </label>
                    </fieldset>

                    <div className={styles.field}>
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="year">Year</label>
                        <input
                            id="year"
                            type="number"
                            value={Number.isNaN(year) ? "" : year}
                            onChange={(e) => setYear(e.target.valueAsNumber)}
                            required
                        />
                    </div>

                    {type === "painting" && (
                        <div className={styles.field}>
                            <label htmlFor="medium">Medium (optional)</label>
                            <input id="medium" type="text" value={medium} onChange={(e) => setMedium(e.target.value)} />
                        </div>
                    )}

                    <div className={styles.field}>
                        <label htmlFor="videoSrc">Video URL (optional)</label>
                        <input
                            id="videoSrc"
                            type="url"
                            value={videoSrc}
                            onChange={(e) => setVideoSrc(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="description">Description (optional)</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <ImageDraftList
                    images={images}
                    onSelectImages={handleSelectImages}
                    onAltChange={handleAltChange}
                    onMoveUp={(index) => handleMoveImage(index, -1)}
                    onMoveDown={(index) => handleMoveImage(index, 1)}
                    onRemove={handleRemove}
                />

                <div className={styles.actions}>
                    <button type="submit" disabled={!isValid}>
                        Add to batch
                    </button>
                    <button type="button" onClick={() => setShowCancelConfirm(true)}>
                        Cancel
                    </button>
                </div>
            </form>

            {showCancelConfirm && (
                <ConfirmModal
                    title="Discard this artwork?"
                    message="Are you sure you want to cancel? The details and images you've added won't be saved."
                    confirmLabel="Yes, cancel"
                    cancelLabel="Keep editing"
                    onConfirm={() => {
                        setShowCancelConfirm(false)
                        onCancel()
                    }}
                    onClose={() => setShowCancelConfirm(false)}
                />
            )}
        </>
    )
}

const createImageCommand = (file: File): DraftImage => ({
    id: crypto.randomUUID(),
    previewUrl: URL.createObjectURL(file),
    alt: "",
    status: "pending",
})
