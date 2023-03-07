import * as request from "superagent";
import {UnauthorizedError} from "../errors/UnauthorizedError";
import {VersionAlreadyExistsError} from "../errors/VersionAlreadyExistsError";
import * as jwt from "jsonwebtoken";
import {UploadResponseInterface} from "./interfaces/UploadResponseInterface";
import {DeployResultInterface} from "./interfaces/DeployResultInterface";
import * as fs from "fs";
import {PollTimedOutError} from "../errors/PollTimedOutError";
import {UploadChannel} from "../../declarations/options";
import {AddonsApiError} from "../errors/AddonsApiError";

const baseUrl = 'https://addons.mozilla.org/api/v5/addons/';

export function addonsCreateJwt(issuer: string, secret: string): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const jwtPayload = {
        iss: issuer,
        jti: Math.random().toString(),
        iat: issuedAt,
        // 5 minute max http://addons-server.readthedocs.io/en/latest/topics/api/auth.html
        exp: issuedAt + 300
    };
    return jwt.sign(jwtPayload, secret, { algorithm: 'HS256' });
}

export async function addonsUploadArchive(
    jwt: string,
    archive: Buffer | fs.ReadStream,
    channel: UploadChannel
): Promise<UploadResponseInterface> {
    try {
        const requestObj = request
            .post(baseUrl + 'upload/')
            .set('Authorization', `JWT ${jwt}`)
            .set('Content-Type', 'multipart/form-data')
            .field('channel', channel)
            .attach('upload', archive, {filename: 'extension.zip', contentType: 'application/zip'});
        const response = await requestObj;
        return response.body as UploadResponseInterface;
    } catch (err) {
        if (err instanceof Error) {
            const requestErr = err as any;
            switch (requestErr?.response?.status) {
                case 401:
                    throw new UnauthorizedError(
                        'Upload failed: 401 Unauthorized: ' + requestErr.response.text,
                        undefined,
                        undefined
                    );
                case 429:
                    throw new UnauthorizedError(requestErr.response.text, undefined, undefined);
                default:
                    throw new Error(
                        'Upload failed: Status ' +
                        requestErr.response.status + ': ' + requestErr.response.text
                    );
            }
        }
    throw new Error(String(err));
    }
}

export async function addonsGetUploadDetails(
    jwt: string,
    uuid: string,
    timeout?: number
): Promise<UploadResponseInterface> {
    try {
        const requestObj = request.get(baseUrl + 'upload/' + encodeURIComponent(uuid) + '/')
            .set('Authorization', `JWT ${jwt}`);
        if (timeout !== undefined) {
            requestObj.timeout(timeout);
        }
        const response = await requestObj;
        return response.body as UploadResponseInterface;
    } catch (err) {
        if (err instanceof Error) {
            const requestErr = err as any;
            if (requestErr.timeout) {
                throw new PollTimedOutError('Polling timed out', uuid);
            }
            switch (requestErr?.response?.status) {
                case 401:
                    throw new UnauthorizedError(
                        'Polling failed: 401 Unauthorized: ' + requestErr.response.text,
                        undefined,
                        uuid
                    );
                case 429:
                    throw new UnauthorizedError(requestErr.response.text, undefined, uuid);
                default:
                    throw new AddonsApiError(
                        'Polling failed: Status ' + requestErr.response.status + ': ' + requestErr.response.text,
                        undefined,
                        uuid
                    );
            }
        }
        throw new AddonsApiError(String(err), undefined, uuid);
    }
}

export async function addonsCreateVersion(
    jwt: string,
    extensionId: string,
    uploadId: string,
    uploadVersion: string,
    sourcesZip?: Buffer|fs.ReadStream
): Promise<DeployResultInterface> {
    try {
        const requestObj = request
            .post(baseUrl +
                'addon/' +
                encodeURIComponent(extensionId) +
                '/versions/'
            )
            .set('Authorization', `JWT ${jwt}`)
            .set('Content-Type', 'multipart/form-data')
            .field('upload', uploadId);
        if (sourcesZip) {
            requestObj
                .attach('source', sourcesZip, {filename: 'sources.zip', contentType: 'application/zip'});
        }
        const response = await requestObj;
        return response.body as DeployResultInterface;
    } catch (err) {
        if (err instanceof Error) {
            const requestErr = err as any;
            switch (requestErr?.response?.status) {
                case 401:
                    throw new UnauthorizedError(
                        'Version creating failed: 401 Unauthorized: ' + requestErr.response.text,
                        uploadVersion,
                        uploadId
                    );
                case 409:
                    if (Array.isArray(requestErr?.response?.body?.version) &&
                        requestErr?.response?.body?.version.length > 0 &&
                        requestErr?.response?.body?.version[0].includes('already exists')
                    ) {
                        throw new VersionAlreadyExistsError(
                            requestErr.response.text,
                            uploadVersion,
                            uploadId
                        );
                    }
                    break;
                case 429:
                    throw new UnauthorizedError(requestErr.response.text, uploadVersion, uploadId);
            }
            throw new AddonsApiError(
                `Version creating failed: Status ${requestErr.response.status}: ${requestErr.response.text}`,
                uploadVersion,
                uploadId
            );
        }
        throw new AddonsApiError(String(err), uploadVersion, uploadId);
    }
}