import type ITimeline from './ITimeline';

export default class Timeline implements ITimeline {
    private now: number | undefined;

    // mimic Date class methods
    // for Date.now()
    getFromTimeLine(): Date {
        return new Date(this.now || Date.now());
    }

    // control functions for timeline
    setCurrentTimeFromString(date: string): false | Date {
        let rc: Date | false;
        try {
            // normalize since to iso
            rc = new Date(date);
            this.now = rc.valueOf();
        } catch (err) {
            // sink it
            rc = false;
        }
        return rc;
    }

    clearCurrentTime() {
        this.now = undefined;
    }

    // it is helps to mock concurrent test
    getSetTimeout(): typeof setTimeout {
        return globalThis.setTimeout;
    }
}
