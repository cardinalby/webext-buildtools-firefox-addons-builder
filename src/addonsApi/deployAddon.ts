import {FirefoxDeployOptionsInterface} from "./interfaces/FirefoxDeployOptionsInterface";
import {DeployResultInterface} from "./interfaces/DeployResultInterface";
import {ValidationError} from "../errors/ValidationError";
import {Duration} from "./Duration";
import {PollTimedOutError} from "../errors/PollTimedOutError";
import {LoggerWrapper} from "webext-buildtools-utils";
import {addonsCreateJwt, addonsCreateVersion, addonsGetUploadDetails, addonsUploadArchive} from "./addonsApi";

const POLLING_PERIOD_MS = 15000;

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function deployAddon(
    options: FirefoxDeployOptionsInterface,
    logger: LoggerWrapper
): Promise<DeployResultInterface> {
    const jwtToken = () => addonsCreateJwt(options.issuer, options.secret);

    logger.info(`Uploading zip file...`);
    let uploadDetails = await addonsUploadArchive(jwtToken(), options.addonZip, options.channel)
    logger.info('Upload response:', uploadDetails);
    const uploadId = uploadDetails.uuid;

    const duration = Duration.startMeasuring();
    while (true) {
        const timeLeft = options.pollTimeoutMs
            ? options.pollTimeoutMs - duration.measureMs()
            : undefined;
        if (timeLeft !== undefined && timeLeft <= 0) {
            throw new PollTimedOutError('Polling timed out', uploadDetails.version, uploadId);
        }
        logger.info('Polling upload details...');
        uploadDetails = await addonsGetUploadDetails(jwtToken(), uploadId, uploadDetails.version, timeLeft);
        if (uploadDetails.processed) {
            logger.info('Item was processed. ', uploadDetails);
            if (!uploadDetails.valid) {
                throw new ValidationError(
                    'Validation failed: ' + JSON.stringify(uploadDetails.validation),
                    uploadDetails.version,
                    uploadDetails.uuid
                    );
            }
            break;
        }
        logger.info(`Item hasn't been processed, waiting ${POLLING_PERIOD_MS} ms...`)
        await sleep(POLLING_PERIOD_MS);
    }

    logger.info('Creating a new version...');
    const versionResponse = await addonsCreateVersion(
        jwtToken(), options.id, uploadDetails.uuid, uploadDetails.version, options.addonSourcesZip
    );
    logger.info('Version created: ', versionResponse);
    return versionResponse;
}


