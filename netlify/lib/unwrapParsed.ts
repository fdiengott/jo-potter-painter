import type { Parsed } from "../../src/types/parsed"
import { HttpError } from "./HttpError"

export const unwrapParsed = <T>(parsed: Parsed<T>, status: number, message: string): T => {
    if (parsed.type === "error") throw new HttpError(status, message, parsed.message)
    return parsed.payload
}

export const unwrapRequestAndParse = async <T>(
    parser: (response: unknown) => Parsed<T>,
    request: Promise<unknown>,
    status: number,
    message: string,
): Promise<T> => {
    return unwrapParsed(parser(await request), status, message)
}
