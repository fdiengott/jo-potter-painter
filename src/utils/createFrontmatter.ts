export const createFrontmatter = (obj: Record<string, unknown>) => {
    const dataRows = Object.entries(obj)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => {
            if (isArray(value)) {
                if (value.some((obj) => typeof obj !== "object")) return `${key}: ${value}`

                const subAttributeList = value
                    .map((obj) =>
                        Object.entries(obj as Object)
                            .map(
                                ([listKey, listValue], i) =>
                                    `\t${i === 0 ? "- " : ""}${listKey}: ${formatValue(listValue)}\n`,
                            )
                            .join(""),
                    )
                    .join("")

                return `${key}:\n` + subAttributeList
            }

            return `${key}: ${formatValue(value)}`
        })
        .join("\n")

    return "---\n" + dataRows + "---\n"
}

const isArray = (maybeArr: any): maybeArr is unknown[] => Array.isArray(maybeArr)
const formatValue = (value: unknown) =>
    typeof value === "string" && hasSpaces(value) ? surroundWithQuotes(value) : value
const hasSpaces = (str: string) => /\s/.test(str)
const surroundWithQuotes = (str: string) => `"${str.trim()}"`
