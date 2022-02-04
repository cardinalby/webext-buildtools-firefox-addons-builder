export interface ISignAddonLibOptions {
    /**
     * @default "https://addons.mozilla.org/api/v3"
     */
    apiUrlPrefix?: string;

    /**
     * Optional override to the number of seconds until the JWT token for
     * the API request expires. This must match the expiration time that
     * the API server accepts.
     */
    apiJwtExpiresIn?: number;

    /** @default false */
    verbose?: boolean;

    /**
     * The release channel (listed or unlisted).
     * Ignored for new add-ons, which are always unlisted.
     * Default: most recently used channel.
     */
    channel?: string;

    /**
     * Number of milliseconds to wait before aborting the request.
     * Default: 2 minutes.
     */
    timeout?: number;

    /**
     * Optional proxy to use for all API requests,
     * such as "http://yourproxy:6000"
     * Read this for details on how proxy requests work:
     * https://github.com/request/request#proxies
     */
    apiProxy?: string;

    /**
     * Optional object to pass to request() for additional configuration.
     * Some properties such as 'url' cannot be defined here.
     * Available options:
     * https://github.com/request/request#requestoptions-callback
     */
    apiRequestConfig?: object;

    /**
     * Not typed yet
     */
    AMOClient?: any;
}

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
        signAddonLib?: ISignAddonLibOptions;
    }
}
