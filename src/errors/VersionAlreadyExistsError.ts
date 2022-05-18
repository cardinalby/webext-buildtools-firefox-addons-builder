export class VersionAlreadyExistsError extends Error {
    private readonly _version: string;

    constructor(version: string, message?: string) {
        super(message || `Extension version ${version} is already uploaded`);
        this._version = version;
    }

    get version(): string {
        return this._version;
    }
}