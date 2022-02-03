import * as request from 'superagent';
import {FirefoxDeployOptionsInterface} from "./FirefoxDeployOptionsInterface";
import {prepareJwt} from "./prepareJwt";
import {UnauthorizedError} from "../errors/UnauthorizedError";
import {SameVersionAlreadyUploadedError} from "../errors/SameVersionAlreadyUploadedError";
import {DeployResultInterface} from "./DeployResultInterface";
import {ValidationError} from "../errors/ValidationError";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function deployAddon(options: FirefoxDeployOptionsInterface): Promise<DeployResultInterface> {
    let uploadId: string;

    const token = prepareJwt(options.issuer, options.secret);

    try {
        uploadId = (await request
            .put('https://addons.mozilla.org/api/v5/addons/' +
                encodeURIComponent(options.id) +
                '/versions/' +
                encodeURIComponent(options.version) + '/'
            )
            .set('Authorization', `JWT ${token}`)
            .field('upload', options.src)
        ).body.pk;
    } catch (err) {
        switch (err.response.status) {
            case 401:
                throw new UnauthorizedError('Submission failed: 401 Unauthorized: ' + err.response.body.detail);
            case 409:
                throw new SameVersionAlreadyUploadedError(options.version, err.response.body.detail);
            default:
                throw new Error('Submission failed: Status ' + err.response.status + ': ' + err.response.body.error);
        }
    }

    while (true) {
        let response: DeployResultInterface;
        try {
            response = (await request
                .get('https://addons.mozilla.org/api/v5/addons/' +
                    encodeURIComponent(options.id) +
                    '/versions/' +
                    encodeURIComponent(options.version) +
                    '/uploads/' +
                    encodeURIComponent(uploadId) +
                    '/'
                )
                .set('Authorization', `JWT ${token}`)).body;
        } catch (err) {
            if (err.response.status === 401) {
                throw new UnauthorizedError('Polling failed: 401 Unauthorized: ' + err.response.body.detail);
            }
            throw new Error('Polling failed: Status ' + err.response.status + ': ' + err.response.body.error);
        }
        if (!response.valid) {
            throw new ValidationError('Validation failed: ' + response.validation_url + ' ' +
                JSON.stringify(response.validation_results));
        }
        if (response.processed) {
            return response;
        }
        await sleep(15000);
    }
}


