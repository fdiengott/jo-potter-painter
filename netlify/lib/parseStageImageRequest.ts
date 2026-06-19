import type { Parsed } from "../../src/types/parsed"
import type { StageImageRequest } from "../../src/types/stageImageRequest"

export const parseStageImageRequest = (stageImage: unknown): Parsed<StageImageRequest> => {
    if (!stageImage) return { type: "error", message: "No stage image" }

    if (typeof stageImage !== "object") return { type: "error", message: "A stage image request must be an object" }
    if (!("token" in stageImage) || typeof stageImage.token !== "string" || stageImage.token.length === 0) {
        return { type: "error", message: "A stage image request must have a token of type string" }
    }
    if (!("imageBlob" in stageImage) || typeof stageImage.imageBlob !== "string" || stageImage.imageBlob.length === 0) {
        return { type: "error", message: "A stage image request must have an imageBlob of type string" }
    }

    return { type: "success", payload: stageImage as StageImageRequest }
}
