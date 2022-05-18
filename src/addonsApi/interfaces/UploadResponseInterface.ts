import {UploadChannel} from "../../../declarations/options";

export interface UploadResponseInterface {
    /**
     * The upload id
     */
    uuid: string,

    /**
     * The version channel, which determines its visibility on the site. Can be either unlisted or listed
     */
    channel: UploadChannel,

    /**
     * If the version has been processed by the validator
     */
    processed: boolean,

    /**
     * If this upload has been submitted as a new add-on or version already. An upload can only be submitted once
     */
    submitted: boolean,

    /**
     * If this upload has been submitted as a new add-on or version already. An upload can only be submitted once
     */
    url: string,

    /**
     * If the version passed validation
     */
    valid: boolean,

    /**
     * the validation results JSON blob
     */
    validation: object,

    /**
     * The version number parsed from the manifest
     */
    version: string
}