export class AddonsApiError extends Error {
    constructor(
        message: string,
        public readonly version: string|undefined,
        public readonly uploadId: string|undefined,
    ) {
        super(message)
    }
}