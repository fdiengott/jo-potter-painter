import type { ImageData } from "../../types/imageData"

interface Props {
    onSubmit: (image: ImageData) => void
}

export const SubmitImageForm = ({ onSubmit }: Props) => {
    return (
        <form>
            <div>SubmitImageForm</div>
        </form>
    )
}
