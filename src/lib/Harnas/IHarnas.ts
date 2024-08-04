import type IFetchInjector from './IFetchInjector';
import type IlocationInjector from './ILocationInjector';
import type ITimeline from './ITimeline';

export default interface IHarnas {
    getTimeline(): ITimeline;
    getFetchInjector(): IFetchInjector;
    getLocationInjector(): IlocationInjector;
}