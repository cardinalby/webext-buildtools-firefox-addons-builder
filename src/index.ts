import { FirefoxAddonsBuilder } from './builder';

export default FirefoxAddonsBuilder;

export {IFirefoxAddonsOptions, UploadChannel} from '../declarations/options';
export {FirefoxAddonsBuildResult, FirefoxAddonsExtIdAsset} from './buildResult';

export {AddonsApiError} from './errors/AddonsApiError';
export {UnauthorizedError} from './errors/UnauthorizedError';
export {ValidationError} from './errors/ValidationError';
export {VersionAlreadyExistsError} from './errors/VersionAlreadyExistsError';
export {PollTimedOutError} from './errors/PollTimedOutError';
export {RequestThrottled} from './errors/RequestThrottled'

