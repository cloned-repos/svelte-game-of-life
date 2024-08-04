import type IlocationInjector from './ILocationInjector';

export default class LocationInjector implements IlocationInjector {
    // https://developer.mozilla.org/docs/Web/API/Location
    getLocationObject(): typeof window.location {
        return window.location;
    }

}