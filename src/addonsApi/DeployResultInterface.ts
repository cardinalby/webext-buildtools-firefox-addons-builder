export interface File {
    download_url: string;
    hash: string;
    signed: boolean;
}

export interface DeployResultInterface {
    guid: string;
    active: boolean;
    automated_signing: boolean;
    files: File[];
    passed_review: boolean;
    pk: string;
    processed: boolean;
    reviewed: boolean;
    url: string;
    valid: boolean;
    validation_results: object;
    validation_url: string;
    version: string;
}