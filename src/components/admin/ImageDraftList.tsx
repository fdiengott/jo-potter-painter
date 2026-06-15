import { MAX_IMAGES } from "../../constants/constants"
import type { DraftImage } from "../../types/stagedArtwork"
import styles from "./ImageDraftList.module.css"
import coverStyles from "./coverImage.module.css"

interface Props {
    images: DraftImage[]
    onPick: (files: FileList) => void
    onAltChange: (id: string, alt: string) => void
    onMoveUp: (index: number) => void
    onMoveDown: (index: number) => void
    onRemove: (id: string) => void
}

export const ImageDraftList = ({ images, onPick, onAltChange, onMoveUp, onMoveDown, onRemove }: Props) => (
    <div className={styles.wrapper}>
        <ul className={styles.list}>
            {images.map((image, index) => (
                <li key={image.id} className={styles.item}>
                    <div className={index === 0 ? coverStyles.cover : undefined}>
                        <img className={styles.thumb} src={image.previewUrl} alt="" />
                        {index === 0 && <span className={coverStyles.coverLabel}>Cover photo</span>}
                    </div>

                    <div className={styles.altField}>
                        <label htmlFor={`alt-${image.id}`}>Alt text</label>
                        <input
                            id={`alt-${image.id}`}
                            type="text"
                            value={image.alt}
                            onChange={(e) => onAltChange(image.id, e.target.value)}
                            required
                        />
                        {image.status === "uploading" && <span className={styles.status}>Uploading…</span>}
                        {image.status === "error" && (
                            <span className={`${styles.status} ${styles.error}`}>Upload failed — remove and retry</span>
                        )}
                    </div>

                    <div className={styles.controls}>
                        <button
                            type="button"
                            onClick={() => onMoveUp(index)}
                            disabled={index === 0}
                            aria-label="Move image up"
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            onClick={() => onMoveDown(index)}
                            disabled={index === images.length - 1}
                            aria-label="Move image down"
                        >
                            ↓
                        </button>
                        <button type="button" onClick={() => onRemove(image.id)} aria-label="Remove image">
                            ✕
                        </button>
                    </div>
                </li>
            ))}
        </ul>

        {images.length < MAX_IMAGES && (
            <label className={styles.picker}>
                <span>Add images</span>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                        if (e.target.files?.length) onPick(e.target.files)
                        e.target.value = ""
                    }}
                />
            </label>
        )}
    </div>
)
