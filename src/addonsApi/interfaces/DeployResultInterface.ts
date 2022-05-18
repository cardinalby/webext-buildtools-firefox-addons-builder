export interface File {
    download_url: string;
    hash: string;
    signed: boolean;
}

export interface DeployResultInterface {
    guid: string,
    active: boolean,
    automated_signing: boolean,
    url: string,
    files: File[],
    passed_review: boolean,
    pk: string,
    processed: boolean,
    reviewed: boolean,
    valid: boolean,
    validation_results: any|null,
    validation_url: string,
    version: string
}