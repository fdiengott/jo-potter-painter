import { describe, expect, it } from "vitest"
import { groupArtworksByYear } from "./groupArtworksByYear"

type TestArtwork = Parameters<typeof groupArtworksByYear>[0][number]

const createMockArtwork = (id: string, year: number, order?: number): TestArtwork =>
    ({ id, data: { year, order } }) as TestArtwork

const extractIds = (section: { artworks: TestArtwork[] }) => section.artworks.map((a) => a.id)

describe("groupArtworksByYear", () => {
    it("groups into per-year sections, newest year first", () => {
        const sections = groupArtworksByYear([
            createMockArtwork("a", 2021),
            createMockArtwork("b", 2024),
            createMockArtwork("c", 2022),
        ])
        expect(sections.map((s) => s.year)).toEqual([2024, 2022, 2021])
    })

    it("sorts by order ascending within a year", () => {
        const sections = groupArtworksByYear([
            createMockArtwork("a", 2024, 3),
            createMockArtwork("b", 2024, 1),
            createMockArtwork("c", 2024, 2),
        ])
        expect(extractIds(sections[0])).toEqual(["b", "c", "a"])
    })

    it("places unordered entries after ordered ones, in slug order", () => {
        const sections = groupArtworksByYear([
            createMockArtwork("a", 2024),
            createMockArtwork("b", 2024),
            createMockArtwork("c", 2024, 5),
        ])
        expect(extractIds(sections[0])).toEqual(["c", "a", "b"])
    })

    it("breaks duplicate order values by slug order", () => {
        const sections = groupArtworksByYear([createMockArtwork("b", 2024, 1), createMockArtwork("a", 2024, 1)])
        expect(extractIds(sections[0])).toEqual(["a", "b"])
    })

    it("scopes order per year (no cross-year comparison)", () => {
        const sections = groupArtworksByYear([
            createMockArtwork("old", 2021, 1),
            createMockArtwork("newA", 2024, 9),
            createMockArtwork("newB", 2024, 4),
        ])
        expect(sections.map((s) => s.year)).toEqual([2024, 2021])
        expect(extractIds(sections[0])).toEqual(["newB", "newA"])
        expect(extractIds(sections[1])).toEqual(["old"])
    })
})
