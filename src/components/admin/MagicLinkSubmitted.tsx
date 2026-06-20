import styles from "./MagicLinkSubmitted.module.css"

interface Props {
    success: boolean
}

export const MagicLinkSubmitted = ({ success }: Props) => {
    if (success) {
        return (
            <div className={styles.status}>
                <h1 className={`${styles.heading} ${styles.success}`}>
                    If that address is authorized, a magic link is on its way!
                </h1>
                <p className={styles.message}>Check your email to sign in.</p>
            </div>
        )
    }

    return (
        <div className={styles.status}>
            <h1 className={`${styles.heading} ${styles.error}`}>Something went wrong!</h1>
            <p className={styles.message}>Please try again.</p>
            <button onClick={() => window.location.reload()} className={styles.button}>
                Try again
            </button>
        </div>
    )
}
