///<reference path="../external_declarations/web-ext.d.ts"/>

import * as fs from 'fs-extra';
import * as path from 'path';
import {SignAddonOptions, AddonSignResult} from 'web-ext/util/submit-addon'
import { ISimpleBuilder } from 'webext-buildtools-builder-types';
import {
    AbstractSimpleBuilder,
    BufferBuildAsset,
    createTempDir,
    FileBuildAsset,
    extractManifestFromZipBuffer,
    IManifestObject, extractManifestFromZipFile
} from 'webext-buildtools-utils';
import { IFirefoxAddonsOptions } from '../declarations/options';
import { FirefoxAddonsBuildResult, FirefoxAddonsExtIdAsset } from './buildResult';
import {deployAddon} from "./addonsApi/deployAddon";
import {VersionAlreadyExistsError} from "./errors/VersionAlreadyExistsError";
import {AddonsApiError} from "./errors/AddonsApiError";
import {amoBaseUrl} from "./addonsApi/addonsApi";

// noinspection JSUnusedGlobalSymbols
/**
 * ISimpleBuilder wrapper around sign-addon package
 */
export class FirefoxAddonsBuilder
    extends AbstractSimpleBuilder<IFirefoxAddonsOptions, FirefoxAddonsBuildResult>
    implements ISimpleBuilder<FirefoxAddonsBuildResult>
{
    public static readonly TARGET_NAME = 'firefox-addons-deploy';

    protected _inputZipBuffer?: Buffer;
    protected _inputZipFilePath?: string;
    // Id of already existing upload to be polled and published
    protected _uploadId?: string;
    protected _inputSourcesZipBuffer?: Buffer;
    protected _inputSourcesZipFilePath?: string;
    protected _inputManifest?: IManifestObject;
    protected _outDeployedExtRequired: boolean = false;
    protected _outSignedXpiFileRequirement?: boolean;
    protected _outSignedXpiBufferRequired: boolean = false;

    public getTargetName(): string {
        return FirefoxAddonsBuilder.TARGET_NAME;
    }

    // noinspection JSUnusedGlobalSymbols
    public setInputZipBuffer(buffer: Buffer): this {
        this._inputZipBuffer = buffer;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    public setInputZipFilePath(filePath: string): this {
        this._inputZipFilePath = filePath;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Id of already existing upload to be polled and published
     */
    public setInputUploadId(uploadId: string): this {
        this._uploadId = uploadId;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    public setInputSourcesZipBuffer(buffer: Buffer): this {
        this._inputSourcesZipBuffer = buffer;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    public setInputSourcesZipFilePath(filePath: string): this {
        this._inputSourcesZipFilePath = filePath;
        return this;
    }

    public setInputManifest(manifest: IManifestObject): this {
        if (!manifest.name || !manifest.version) {
            throw Error('Invalid manifest object, id and name fields are required');
        }
        this._inputManifest = manifest;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * setInputZipBuffer() or setInputZipFilePath() or setInputUploadId() should be called before build()
     */
    public requireDeployedExt(): this {
        this._outDeployedExtRequired = true;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * setInputZipBuffer() or setInputZipFilePath(), setInputManifest() should be called before build()
     */
    public requireSignedXpiFile(temporary: boolean = false): this {
        this._outSignedXpiFileRequirement = temporary;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * setInputZipBuffer() or setInputZipFilePath(), setInputManifest() should be called before build()
     */
    public requireSignedXpiBuffer(): this {
        this._outSignedXpiBufferRequired = true;
        return this;
    }

    public async build(): Promise<FirefoxAddonsBuildResult> {
        this.validateOptions();
        this.validateInputs();

        const result = new FirefoxAddonsBuildResult();
        if (!this._outDeployedExtRequired && !this.isSignedXpiRequired()) {
            this._logWrapper.warn('Output asset is not required, do nothing');
            return result;
        }

        if (!this._inputManifest && this.isSignedXpiRequired()) {
            this._logWrapper.info('Manifest input is not set, reading from zip...');
            if (this._inputZipBuffer) {
                this._inputManifest = await extractManifestFromZipBuffer(this._inputZipBuffer);
            } else if (this._inputZipFilePath) {
                this._inputManifest = await extractManifestFromZipFile(this._inputZipFilePath);
            } else {
                throw new Error('_inputZipBuffer or _inputZipFilePath must be set');
            }
            this._logWrapper.info(
                `Manifest extracted. Extension name: '${this._inputManifest.name}', ` +
                `version: ${this._inputManifest.version}`);
        }

        if (this._outDeployedExtRequired && this._options.deploy) {
            const addonZip = (this._inputZipFilePath && fs.createReadStream(this._inputZipFilePath)) ||
                this._inputZipBuffer;
            const deployResult = await deployAddon({
                id: this._options.deploy.extensionId,
                channel: this._options.deploy.channel || 'listed',
                issuer: this._options.api.jwtIssuer,
                secret: this._options.api.jwtSecret,
                addonZip: addonZip,
                uploadId: this._uploadId,
                addonSourcesZip:
                    (this._inputSourcesZipFilePath && fs.createReadStream(this._inputSourcesZipFilePath)) ||
                    this._inputSourcesZipBuffer
            }, this._logWrapper);
            result.getAssets().deployedExtStoreId = new FirefoxAddonsExtIdAsset(deployResult.guid);
        }

        if (this.isSignedXpiRequired()) {
            await this.buildSignedXpi(result);
        }

        return Promise.resolve(result);
    }

    protected async buildSignedXpi(result: FirefoxAddonsBuildResult) {
        if (!this._options.signXpi || !this._inputManifest) {
            return;
        }

        const tmpDownloadDir = await createTempDir('ff_xpi_signing');
        try {
            let inputZipFile: string = '';
            let removeInputZipFileAfterSigning = false;
            if (this._inputZipFilePath) {
                inputZipFile = this._inputZipFilePath;
            } else if (this._inputZipBuffer) {
                inputZipFile = path.join(tmpDownloadDir, 'unsigned_ext.zip');
                await fs.writeFile(inputZipFile, this._inputZipBuffer);
                removeInputZipFileAfterSigning = true;
            }

            try {
                const signAddonOptions: SignAddonOptions = {
                    amoBaseUrl: amoBaseUrl,
                    channel: 'unlisted',
                    id: this._options.signXpi.extensionId,
                    xpiPath: inputZipFile,
                    apiKey: this._options.api.jwtIssuer,
                    apiSecret: this._options.api.jwtSecret,
                    downloadDir: tmpDownloadDir,
                    savedIdPath: path.join(tmpDownloadDir, 'saved_id.txt'),
                    savedUploadUuidPath: path.join(tmpDownloadDir, 'saved_upload_uuid.txt'),
                }
                if (this._inputSourcesZipFilePath) {
                    signAddonOptions.submissionSource = this._inputSourcesZipFilePath
                }

                if (this._options.signXpi.signAddonLib) {
                    Object.assign(signAddonOptions, this._options.signXpi.signAddonLib);
                }

                this._logWrapper.info(`Signing '${inputZipFile}'...`);

                try {
                    const signAddon = (await import('web-ext/util/submit-addon')).signAddon
                    let signResult: AddonSignResult
                    try {
                        signResult = await signAddon(signAddonOptions)
                    } catch (err) {
                        // noinspection ExceptionCaughtLocallyJS
                        throw this.getSignError(err)
                    }
                    if (signResult.downloadedFiles.length === 0) {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new AddonsApiError('Unexpected error, no files downloaded',
                            this._inputManifest.version, undefined);
                    }
                    this._logWrapper.info(`Signed, your extension ID is: ${signResult.id}`);
                    this._logWrapper.info('Signed, downloaded files: ' + signResult.downloadedFiles.join(', '));

                    result.getAssets().signedExtStoreId = new FirefoxAddonsExtIdAsset(signResult.id);

                    const srcXpiFile = path.join(tmpDownloadDir, signResult.downloadedFiles[0]);
                    if (this._outSignedXpiBufferRequired) {
                        result.getAssets().signedXpiBuffer = new BufferBuildAsset(await fs.readFile(srcXpiFile));
                    }

                    if (this._outSignedXpiFileRequirement !== undefined) {
                        result.getAssets().signedXpiFile = await this.getXpiFileBuildAsset(
                            srcXpiFile,
                            this._outSignedXpiFileRequirement,
                            this._options.signXpi.xpiOutPath
                        );
                    }
                } catch (err) {
                    this._logWrapper.error(String(err))
                    throw err
                }

            } finally {
                if (removeInputZipFileAfterSigning) {
                    await fs.unlink(inputZipFile);
                }
            }
        } finally {
            await fs.rmdir(tmpDownloadDir, { recursive: true });
        }
    }

    protected validateOptions() {
        if (!this._options.api || !this._options.api.jwtIssuer || !this._options.api.jwtSecret) {
            throw new Error('Options have to contain api.jwtIssuer and api.jwtSecret');
        }

        if (this._outDeployedExtRequired && !(this._options.deploy && this._options.deploy.extensionId)) {
            throw new Error('Deployed ext required, but deploy.extensionId options is not set');
        }

        if (this.isSignedXpiRequired()) {
            if (!this._options.signXpi) {
                throw new Error('Signed xpi required but signXpi option is not set');
            }
            if (this._outSignedXpiFileRequirement === false && !this._options.signXpi.xpiOutPath) {
                throw new Error('Not temporary signed xpi file required, but signXpi.xpiOutPath option is not set');
            }
        }
    }

    protected validateInputs() {
        const errors = [];
        let zipInputs = (this._inputZipBuffer !== undefined ? 1 : 0) +
            (this._inputZipFilePath !== undefined ? 1 : 0) +
            (this._uploadId !== undefined ? 1 : 0);
        if (zipInputs == 0) {
            errors.push("zipBuffer, zipFile ot uploadId must be specified");
        } else if (zipInputs > 1) {
            errors.push("Ambiguity source: only one of zipBuffer, zipFile or uploadId should be specified");
        }

        if (this._inputSourcesZipFilePath && this._inputSourcesZipBuffer) {
            errors.push("Ambiguity sources zip input: both sources zip buffer and sources zip file path inputs are set");
        }
        if (errors.length > 0) {
            throw Error('Inputs validation error: ' + errors.join(', '));
        }
    }

    protected getSignError(caught: any): Error {
        // not reliable/tested
        if (String(caught).includes('already exists')) {
            return new VersionAlreadyExistsError(String(caught), this._inputManifest?.version || '', undefined);
        }
        return new AddonsApiError(String(caught), this._inputManifest?.version || '', undefined);
    }

    protected async getXpiFileBuildAsset(
        srcXpiFile: string,
        temporary: boolean,
        xpiOutPath?: string,
    ): Promise<FileBuildAsset> {
        let xpiTempDir: string | undefined;
        if (xpiOutPath) {
            await fs.ensureDir(path.dirname(xpiOutPath));
        } else {
            xpiTempDir = await createTempDir('ff_signed_ext_xpi');
            xpiOutPath = path.join(xpiTempDir, 'signed.xpi');
        }

        this._logWrapper.info(`Moving '${srcXpiFile}' to '${xpiOutPath}'`);
        await fs.move(srcXpiFile, xpiOutPath, { overwrite: true });

        return Promise.resolve(new FileBuildAsset(
            temporary,
            xpiOutPath,
            xpiTempDir
        ));
    }

    protected isSignedXpiRequired(): boolean {
        return this._outSignedXpiBufferRequired || this._outSignedXpiFileRequirement !== undefined;
    }
}
