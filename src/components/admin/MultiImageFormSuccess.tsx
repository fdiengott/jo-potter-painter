import styles from "./MultiImageFormSubmitted.module.css"

interface Props {
    onReset: () => void
}

export const MultiImageFormSuccess = ({ onReset }: Props) => (
    <div className={styles.status}>
        <h1 className={`${styles.heading} ${styles.success}`}>Published!</h1>
        <p className={styles.message}>
            Your artwork is on its way — Netlify is rebuilding the site and it will appear shortly.
        </p>
        <button onClick={onReset} type="button" className={styles.button}>
            Publish another
        </button>
    </div>
)
