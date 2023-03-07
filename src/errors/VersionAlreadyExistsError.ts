import {AddonsApiError} from "./AddonsApiError";

export class VersionAlreadyExistsError extends AddonsApiError {
    constructor(
        message: string|undefined,
        public readonly version: string|undefined,
        public readonly uploadId: string|undefined
    ) {
        super(
            message || `Extension version ${version} is already uploaded`,
            version,
            uploadId
        );
    }
}