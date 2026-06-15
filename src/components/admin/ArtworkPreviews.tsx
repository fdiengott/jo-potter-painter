import type { StagedArtwork } from "../../types/stagedArtwork"
import styles from "./ArtworkPreviews.module.css"
import coverStyles from "./coverImage.module.css"

interface Props {
    artworks: StagedArtwork[]
    onRemove: (id: string) => void
}

export const ArtworkPreviews = ({ artworks, onRemove }: Props) => {
    if (artworks.length === 0) return <p className={styles.empty}>No artworks staged yet.</p>

    return (
        <ul className={styles.list}>
            {artworks.map((artwork) => (
                <li key={artwork.id} className={styles.item}>
                    <div className={styles.header}>
                        <span className={styles.title}>{artwork.title}</span>
                        <span className={styles.meta}>
                            {artwork.type} · {artwork.year} · {artwork.images.length} image
                            {artwork.images.length === 1 ? "" : "s"}
                        </span>
                        <button type="button" onClick={() => onRemove(artwork.id)} aria-label={`Remove ${artwork.title}`}>
                            ✕
                        </button>
                    </div>

                    <div className={styles.thumbs}>
                        {artwork.images.map((image, index) => (
                            <div key={image.id} className={index === 0 ? coverStyles.cover : undefined}>
                                <img className={styles.thumb} src={image.previewUrl} alt={image.alt} />
                            </div>
                        ))}
                    </div>
                </li>
            ))}
        </ul>
    )
}
