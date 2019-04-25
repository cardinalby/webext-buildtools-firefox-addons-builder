/// <reference types="node" />

declare module 'firefox-extension-deploy' {
    import { Readable } from 'stream';

    interface IFirefoxDeployOptions {
        // Your API key (JWT issuer).
        issuer: string;
        // Your API secret (JWT secret).
        secret: string;
        // The add-on ID. Example: my-addon@jetpack
        id: string;
        // Semver version
        version: string;
        // Zip-packed extension dir
        // src: ReadStream
        src: string | Blob | File | Buffer | Readable;
    }

    function firefoxExtensionDeploy(options: IFirefoxDeployOptions): Promise<any>;

    export = firefoxExtensionDeploy;
}

