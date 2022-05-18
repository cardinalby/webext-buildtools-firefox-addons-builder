import * as fs from "fs";
import {UploadChannel} from "../../../declarations/options";

export interface FirefoxDeployOptionsInterface {
    // Your API key (JWT issuer).
    issuer: string;
    // Your API secret (JWT secret).
    secret: string;
    // The add-on ID. Example: my-addon@jetpack
    id: string;
    // Default: 'listed'
    channel: UploadChannel,
    // Zip-packed extension dir
    addonZip: Buffer|fs.ReadStream;
    // Addon sources needed for Addons Store reviewers
    addonSourcesZip?: Buffer|fs.ReadStream

    pollTimeoutMs?: number
}