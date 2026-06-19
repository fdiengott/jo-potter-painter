export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
        public cause?: unknown,
    ) {
        super(message)
    }
}
