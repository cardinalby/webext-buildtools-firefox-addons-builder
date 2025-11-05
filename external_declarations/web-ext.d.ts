declare module 'web-ext/util/submit-addon' {
    export interface SignAddonOptions {
        apiKey: string,
        apiSecret: string,
        apiProxy?: string,
        amoBaseUrl?: string,
        validationCheckTimeout?: number,
        approvalCheckTimeout?: number,
        id?: string,
        xpiPath: string,
        downloadDir?: string,
        channel?: 'listed' | 'unlisted',
        savedIdPath: string,
        savedUploadUuidPath: string,
        submissionSource?: string,
    }

    export interface AddonSignResult {
        id: string;
        downloadedFiles: string[];
    }

    export function signAddon(options: SignAddonOptions): Promise<AddonSignResult>;
}