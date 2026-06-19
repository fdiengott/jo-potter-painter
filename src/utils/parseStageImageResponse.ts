import type { Parsed } from "../types/parsed"
import type { StageImageResponse } from "../types/stageImageResponse"

export const parseStageImageResponse = (response: unknown): Parsed<StageImageResponse> => {
    if (!response || typeof response !== "object") {
        return { type: "error", message: "A stage image response must be an object" }
    }
    if (!("sha" in response) || typeof response.sha !== "string" || response.sha.length === 0) {
        return { type: "error", message: "A stage image response must have a sha of type string" }
    }

    return { type: "success", payload: response as StageImageResponse }
}
