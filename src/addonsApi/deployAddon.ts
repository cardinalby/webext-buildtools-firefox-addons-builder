import {FirefoxDeployOptionsInterface} from "./interfaces/FirefoxDeployOptionsInterface";
import {DeployResultInterface} from "./interfaces/DeployResultInterface";
import {ValidationError} from "../errors/ValidationError";
import {Duration} from "./Duration";
import {PollTimedOutError} from "../errors/PollTimedOutError";
import {LoggerWrapper} from "webext-buildtools-utils";
import {addonsCreateJwt, addonsCreateVersion, addonsGetUploadDetails, addonsUploadArchive} from "./addonsApi";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function deployAddon(
    options: FirefoxDeployOptionsInterface,
    logger: LoggerWrapper
): Promise<DeployResultInterface> {
    const jwtToken = addonsCreateJwt(options.issuer, options.secret);

    logger.info(`Uploading zip file...`);
    let uploadDetails = await addonsUploadArchive(jwtToken, options.addonZip, options.channel)
    logger.info('upload response:', uploadDetails);
    const uploadId = uploadDetails.uuid;

    const duration = Duration.startMeasuring();
    while (true) {
        const timeLeft = options.pollTimeoutMs
            ? options.pollTimeoutMs - duration.measureMs()
            : undefined;
        if (timeLeft !== undefined && timeLeft <= 0) {
            throw new PollTimedOutError(uploadId, 'Polling timed out');
        }
        uploadDetails = await addonsGetUploadDetails(jwtToken, uploadId, timeLeft);
        if (uploadDetails.processed) {
            logger.info('Item was processed. ', uploadDetails);
            if (!uploadDetails.valid) {
                throw new ValidationError('Validation failed: ' + JSON.stringify(uploadDetails.validation));
            }
            break;
        }
        await sleep(15000);
    }

    logger.info('Creating a new version...');
    const versionResponse = await addonsCreateVersion(
        jwtToken, options.id, uploadDetails.uuid, uploadDetails.version, options.addonSourcesZip
    );
    logger.info('Version created: ', versionResponse);
    return versionResponse;
}


