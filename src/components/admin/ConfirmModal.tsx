import { useEffect } from "react"
import styles from "./ConfirmModal.module.css"

interface Props {
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    onClose: () => void
}

export const ConfirmModal = ({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onClose,
}: Props) => {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [onClose])

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "confirm-modal-title" : undefined}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <h2 id="confirm-modal-title" className={styles.title}>
                        {title}
                    </h2>
                )}
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button type="button" onClick={onClose}>
                        {cancelLabel}
                    </button>
                    <button type="button" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
