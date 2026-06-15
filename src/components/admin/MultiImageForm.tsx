import { useEffect, useState } from "react"
import type { ImageData } from "../../types/imageData"
import { ImagePreview } from "./ImagePreview"
import { SubmitImageForm } from "./SubmitImageForm"
import { MultiImageFormSuccess } from "./MultiImageFormSuccess"
import { MultiImageFormFailure } from "./MultiImageFormFailure"
import { createContextualLogger } from "../../utils/createContextualLogger"
import type { StageImageRequest } from "../../types/stageImageRequest"

type FormState = "success" | "failure" | null

const logger = createContextualLogger("MultiImageForm")

interface Props {
    token: string
}

export const MultiImageForm = ({ token }: Props) => {
    const [formState, setFormState] = useState<ImageData[]>([])
    const [submittedState, setSubmittedState] = useState<FormState>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [tokenState] = useState(token)

    useEffect(() => {
        const url = new URL(document.URL)
        if (!url.searchParams.size) return

        history.replaceState(null, "", url.pathname)
    }, [tokenState])

    const handleSubmitImages = async () => {
        console.log(formState)

        try {
            setIsSubmitting(true)
            const res = await fetch("/submit-images", getFetchOptions(formState, tokenState))

            if (!res.ok) throw new Error("Failed to submit images")

            setSubmittedState("success")
        } catch (e) {
            logger.error(e)
            setSubmittedState("failure")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submittedState === "success") {
        return (
            <MultiImageFormSuccess
                onReset={() => {
                    setFormState([])
                    setSubmittedState(null)
                }}
            />
        )
    }
    if (submittedState === "failure") return <MultiImageFormFailure onRetry={() => setSubmittedState(null)} />

    //  HACK:
    const handleVerifyToken = async () => {
        const stageImageBody: StageImageRequest = { token: tokenState, imageBlob: "test" }

        const res = await fetch("/stage-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stageImageBody),
        })
        if (!res.ok) throw new Error("Failed to verify token")
    }

    return (
        <div>
            <button onClick={handleVerifyToken}>veryify token test</button>
            <ImagePreview images={formState} />
            <SubmitImageForm onSubmit={(imageData: ImageData) => setFormState((prev) => [...prev, imageData])} />
            <button onClick={handleSubmitImages} type="button" disabled={isSubmitting}>
                Publish to website
            </button>
        </div>
    )
}

const getFetchOptions = (images: ImageData[], token: string) => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images, token }),
})
