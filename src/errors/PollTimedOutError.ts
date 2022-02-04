export class PollTimedOutError extends Error {
    constructor(public readonly pk: string, message: string) {
        super(message);
    }
}