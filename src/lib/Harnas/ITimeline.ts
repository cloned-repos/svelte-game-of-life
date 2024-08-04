
export default interface ITimeline {
    getFromTimeLine(): Date;
    // control functions for timeline
    setCurrentTimeFromString(date: string): false | Date;
    clearCurrentTime(): void;
    getSetTimeout(): typeof globalThis.setTimeout;
}

