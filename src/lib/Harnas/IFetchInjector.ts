export default interface IFetchInjector {
    getFetchFunction(): typeof globalThis.fetch;
}