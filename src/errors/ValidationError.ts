import {AddonsApiError} from "./AddonsApiError";

export class ValidationError extends AddonsApiError {
    constructor(
        messsage: string,
        public readonly version: string,
        uploadId: string
    ) {
        super(messsage, version, uploadId);
    }
}