import { describe, expect, it } from "vitest"
import { createArtworkFrontmatter } from "./createArtworkFrontmatter"
import type { ArtworkTree } from "../types/artwork"
import type { EnrichedTree } from "../types/tree"

const toMockImage = (path: string, alt: string): EnrichedTree => ({
    path,
    alt,
    mode: "100644",
    type: "blob",
    sha: "0".repeat(40),
})

const ceramic: ArtworkTree = {
    type: "ceramic",
    title: "Ash Bowl Triptych",
    year: 2022,
    description: "Placeholder description.",
    images: [
        toMockImage("../../assets/rubber-duck.jpg", "Placeholder image — Ash Bowl Triptych, the three bowls together"),
        toMockImage("../../assets/rubber-duck.jpg", "Placeholder image — Ash Bowl Triptych, single bowl interior"),
    ],
}

const painting: ArtworkTree = {
    type: "painting",
    title: "Marsh Light I & II",
    year: 2021,
    medium: "Acrylic and ink on linen",
    description: "Placeholder description.",
    images: [
        toMockImage("../../assets/rubber-duck.jpg", "Placeholder image — Marsh Light I"),
        toMockImage("../../assets/rubber-duck.jpg", "Placeholder image — Marsh Light II"),
    ],
}

const simplestMock: ArtworkTree = {
    type: "painting",
    title: "title",
    year: 2021,
    description: "description",
    images: [toMockImage("./path", "image alt")],
}

describe("createArtworkFrontmatter", () => {
    it("renders scalar fields and appends the description body", () => {
        const result = createArtworkFrontmatter(ceramic)

        expect(result).toContain('title: "Ash Bowl Triptych"')
        expect(result).toContain("year: 2022")
        expect(result.startsWith("---\n")).toBe(true)
        expect(result.endsWith("\n\nPlaceholder description.")).toBe(true)
    })

    it("includes optional fields like medium when present", () => {
        expect(createArtworkFrontmatter(painting)).toContain('medium: "Acrylic and ink on linen"')
    })

    it("omits the artwork type from the frontmatter", () => {
        expect(createArtworkFrontmatter(ceramic)).not.toContain("type:")
        expect(createArtworkFrontmatter(painting)).not.toContain("type:")
    })

    it("correctly serializes the simplest mock", () => {
        expect(createArtworkFrontmatter(simplestMock)).toBe(
            `---
title: title
year: 2021
images:
\t- src: ./path
\talt: "image alt"
---

description`,
        )
    })
})
