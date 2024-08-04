import Timeline from './Timeline';
import type IFetchInjector from './IFetchInjector';
import type IHarnas from './IHarnas';
import type ITimeline from './ITimeline';
import FetchInjector from './FetchInjector';
import type IlocationInjector from './ILocationInjector';
import LocationInjector from './LocationInjector';

export default class Harnas implements IHarnas {
    getTimeline(): ITimeline {
        return new Timeline()
    }
    getFetchInjector(): IFetchInjector {
        return new FetchInjector();
    }
    getLocationInjector(): IlocationInjector {
        return new LocationInjector();
    }
}