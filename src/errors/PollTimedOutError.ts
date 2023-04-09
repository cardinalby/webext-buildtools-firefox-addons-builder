import {AddonsApiError} from "./AddonsApiError";

export class PollTimedOutError extends AddonsApiError {
    constructor(
        messsage: string,
        public readonly version: string,
        public readonly uploadId: string
    ) {
        super(messsage, version, uploadId);
    }
}