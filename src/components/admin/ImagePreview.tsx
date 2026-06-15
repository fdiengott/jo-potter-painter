import type { ImageData } from "../../types/imageData"

interface Props {
    images: ImageData[]
}

export const ImagePreview = ({ images }: Props) => {
    return (
        <ul>
            {images.map((image, index) => (
                <li key={index}>
                    <div>
                        <p>{image.title}</p>
                    </div>
                </li>
            ))}
        </ul>
    )
}
