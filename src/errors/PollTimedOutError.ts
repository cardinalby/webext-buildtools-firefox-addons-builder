import {AddonsApiError} from "./AddonsApiError";

export class PollTimedOutError extends AddonsApiError {
    constructor(
        messsage: string,
        version: string|undefined,
        public readonly uploadId: string
    ) {
        super(messsage, version, uploadId);
    }
}