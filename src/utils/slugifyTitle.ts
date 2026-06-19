export const slugifyTitle = (title: string) => `${toSnakeCase(title)}-${crypto.randomUUID().slice(0, 8)}`

const toSnakeCase = (str: string) =>
    str
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "-")
