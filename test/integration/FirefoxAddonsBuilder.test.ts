import * as path from "path";
import * as fs from "fs-extra";
import {PathLike} from "fs";
import { zip } from 'zip-a-folder';
import * as dotenv from 'dotenv';
import FirefoxAddonsBuilder, {VersionAlreadyExistsError} from "../../src";

dotenv.config({path: 'tests.env'});

describe('FirefoxAddonsBuilder', () => {
    jest.setTimeout(2400000);

    const extensionDir = path.join(__dirname, 'extension');
    const outDirPath = path.join(__dirname, 'out');
    const zipFilePath = path.join(outDirPath, 'extension.zip');

    const rm = (path: PathLike) => fs.existsSync(path) && fs.rmSync(path);

    beforeAll(async () => {
        await zip(extensionDir, zipFilePath);
    });

    afterAll(() => {
        rm(zipFilePath);
    });

    it('should try to deploy', async () => {
        const builder = new FirefoxAddonsBuilder({
            api: {
                jwtIssuer: process.env.JWT_ISSUER || '',
                jwtSecret: process.env.JWT_SECRET || '',
            },
            deploy: {
                extensionId: process.env.EXTENSION_ID || '',
                channel: "unlisted"
            }
        }, console.log);
        builder.setInputZipFilePath(zipFilePath);
        builder.setInputSourcesZipFilePath(zipFilePath);
        builder.requireDeployedExt();
        await expect(async () => {
            try {
                const res = await builder.build();
                console.log(res);
                return res;
            } catch (err) {
                console.log(err)
                throw err
            }
        }).rejects.toBeInstanceOf(VersionAlreadyExistsError);
    });

    it('should try to sign', async () => {
        const builder = new FirefoxAddonsBuilder({
            api: {
                jwtIssuer: process.env.JWT_ISSUER || '',
                jwtSecret: process.env.JWT_SECRET || '',
            },
            signXpi: {
                extensionId: process.env.EXTENSION_ID || '',
                xpiOutPath: path.join(outDirPath, 'extension.xpi')
            }
        }, console.log);
        builder.setInputZipFilePath(zipFilePath);
        builder.setInputSourcesZipFilePath(zipFilePath);
        builder.requireSignedXpiFile();
        await expect(async () => {
            const res = await builder.build();
            console.log(res);
            return res;
        }).rejects.toBeInstanceOf(VersionAlreadyExistsError);
    });
});