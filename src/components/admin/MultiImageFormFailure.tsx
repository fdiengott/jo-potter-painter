import styles from "./MultiImageFormSubmitted.module.css"

interface Props {
    onRetry: () => void
}

export const MultiImageFormFailure = ({ onRetry }: Props) => (
    <div className={styles.status}>
        <h1 className={`${styles.heading} ${styles.error}`}>Something went wrong!</h1>
        <p className={styles.message}>Your artwork wasn't published. Your images are still here — please try again.</p>
        <button onClick={onRetry} type="button" className={styles.button}>
            Try again
        </button>
    </div>
)
