import { describe, expect, it } from "vitest"
import { getArtworkId } from "./getArtworkId"

describe("getArtworkId", () => {
    it("builds an id from type and slugified title", () => {
        expect(getArtworkId({ type: "painting", title: "Blue Morning" })).toBe("painting-blue-morning")
    })

    it("collapses whitespace and trims the title", () => {
        expect(getArtworkId({ type: "ceramic", title: "  Tall   Vessel  " })).toBe("ceramic-tall-vessel")
    })
})
