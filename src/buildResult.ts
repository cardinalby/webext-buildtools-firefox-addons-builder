import { BaseBuildResult, BasicTypeBuildAsset, BufferBuildAsset, FileBuildAsset } from 'webext-buildtools-utils';

/**
 * Contains extension id on Firefox Addons store.
 * Mostly used as a stub because it duplicates id from options
 */
export class FirefoxAddonsExtIdAsset extends BasicTypeBuildAsset<string> {}

export class FirefoxAddonsBuildResult extends BaseBuildResult<{
    deployedExtStoreId: FirefoxAddonsExtIdAsset,
    signedExtStoreId?: FirefoxAddonsExtIdAsset;
    signedXpiFile?: FileBuildAsset;
    signedXpiBuffer?: BufferBuildAsset;    
}>
{
}
