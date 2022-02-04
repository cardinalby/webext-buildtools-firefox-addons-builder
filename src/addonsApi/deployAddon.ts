import * as request from 'superagent';
import {FirefoxDeployOptionsInterface} from "./FirefoxDeployOptionsInterface";
import {prepareJwt} from "./prepareJwt";
import {UnauthorizedError} from "../errors/UnauthorizedError";
import {SameVersionAlreadyUploadedError} from "../errors/SameVersionAlreadyUploadedError";
import {DeployResultInterface} from "./DeployResultInterface";
import {ValidationError} from "../errors/ValidationError";
import {Duration} from "./Duration";
import {PollTimedOutError} from "../errors/PollTimedOutError";

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
                .set('Content-Type', 'multipart/form-data')
                .attach('upload', options.src, {filename: 'extension.zip', contentType: 'application/zip'})
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
    const duration = Duration.startMeasuring();
    while (true) {
        let response: DeployResultInterface;
        const timeLeft = options.pollTimeoutMs
            ? options.pollTimeoutMs - duration.measureMs()
            : undefined;
        if (timeLeft !== undefined && timeLeft <= 0) {
            throw new PollTimedOutError(uploadId, 'Polling timed out');
        }
        try {
            const req = request
                .get('https://addons.mozilla.org/api/v5/addons/' +
                    encodeURIComponent(options.id) +
                    '/versions/' +
                    encodeURIComponent(options.version) +
                    '/uploads/' +
                    encodeURIComponent(uploadId) +
                    '/'
                )
                .set('Authorization', `JWT ${token}`);
            if (timeLeft !== undefined) {
                req.timeout(timeLeft);
            }
            response = (await req).body;
        } catch (err) {
            if (err.response.status === 401) {
                throw new UnauthorizedError('Polling failed: 401 Unauthorized: ' + err.response.body.detail);
            }
            throw new Error('Polling failed: Status ' + err.response.status + ': ' + err.response.body.error);
        }
        if (response.processed) {
            if (!response.valid) {
                throw new ValidationError('Validation failed: ' + response.validation_url + ' ' +
                    JSON.stringify(response.validation_results));
            }
            return response;
        }

        await sleep(15000);
    }
}


