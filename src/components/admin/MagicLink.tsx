import { useState, type SubmitEventHandler } from "react"
import { MagicLinkSubmitted } from "./MagicLinkSubmitted"
import styles from "./MagicLink.module.css"

export const MagicLink = () => {
    const [hasSubmitted, setHasSubmitted] = useState(false)
    const [wasSubmitSuccessful, setWasSubmitSuccessful] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const handleSubmit: SubmitEventHandler = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const res = await fetch("/request-magic-link", getFetchOptions(e.target.email.value))

            setWasSubmitSuccessful(res.ok)

            if (!res.ok) console.error("Magic link request unsuccussful", await res.json())
        } catch (e) {
            setWasSubmitSuccessful(false)
        } finally {
            setHasSubmitted(false)
            setIsSubmitting(false)
        }
    }

    if (hasSubmitted) {
        return <MagicLinkSubmitted success={wasSubmitSuccessful} />
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h2>Get the admin link</h2>
            <p>
                <label htmlFor="email">Email</label>
                <input type="email" placeholder="Email" name="email" required />
            </p>
            <button disabled={isSubmitting}>Submit</button>
        </form>
    )
}

const getFetchOptions = (email: string) => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
})
