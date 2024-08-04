import type IFetchInjector from './IFetchInjector';

export default class FetchInjector implements IFetchInjector {
    getFetchFunction() {
        // so easy to mock this
        return globalThis.fetch;
    }
}
