export interface FirefoxDeployOptionsInterface {
    // Your API key (JWT issuer).
    issuer: string;
    // Your API secret (JWT secret).
    secret: string;
    // The add-on ID. Example: my-addon@jetpack
    id: string;
    // Semver version
    version: string;
    // Zip-packed extension dir
    src: Buffer;

    pollTimeoutMs?: number
}