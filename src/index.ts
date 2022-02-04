import { FirefoxAddonsBuilder } from './builder';

export default FirefoxAddonsBuilder;

export {IFirefoxAddonsOptions, ISignAddonLibOptions} from '../declarations/options';
export {FirefoxAddonsBuildResult, FirefoxAddonsExtIdAsset} from './buildResult';
export {UnauthorizedError} from './errors/UnauthorizedError';
export {ValidationError} from './errors/ValidationError';
export {SameVersionAlreadyUploadedError} from './errors/SameVersionAlreadyUploadedError';
export {PollTimedOutError} from './errors/PollTimedOutError';

