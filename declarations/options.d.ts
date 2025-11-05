export type UploadChannel = 'unlisted'|'listed';

/**
 * Signing for offline dist performs via Firefox Addons API
 */
export interface IFirefoxAddonsOptions {
    api: {
        /** JWT issuer also called 'apiKey' obtained from created credentials */
        jwtIssuer: string;
        /** JWT secret also called 'apiSecret' obtained from created credentials */
        jwtSecret: string;
    },

    deploy?: {
        /**
         * Id of extension which was already uploaded to Firefox Addons
         */
        extensionId: string;
        /**
         * The version channel, which determines its visibility on the site. Can be either unlisted or listed
         * @default 'listed'
         */
        channel?: UploadChannel;
        /**
         * Number of milliseconds to wait until uploaded item becomes processed
         * Throw PollTimedOutError in case of timeout
         * @default undefined
         */
        pollTimeoutMs?: number
    },

    signXpi?: {
        /**
         * Id of extension uploaded to Firefox Addons especially for offline distribution
         * If not specified, new extension will be added for every build (not recommended)
         */
        extensionId?: string;
        /** Target path for built and signed xpi file. Could be undefined for temporary build output */
        xpiOutPath?: string;
        /** Options for underlying 'signAddon' lib */
        channel?: UploadChannel;
        approvalCheckTimeoutMs?: number;
        validationCheckTimeoutMs?: number;
    }
}
