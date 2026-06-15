export type Parsed<T> = { type: "error"; message: string } | { type: "success"; payload: T }
