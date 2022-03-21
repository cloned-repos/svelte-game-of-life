import type { default as Engine, GridData } from './gol-engine';

type Stats = GridData & { fps: number };

interface AnimationScheduler {
    start(cb?: (stats: Stats) => void): void;
    stop(): void;
    fps(): number;
};

function createAnimationTimeScheduler(engine: Engine): AnimationScheduler {
    let started = false;
    let nextAnimationFrame: number;
    const last120runs = new Float32Array(120);

    function run(cb?: (stats: Stats)=> void){
        // ts = since browser "refresh"
        nextAnimationFrame = requestAnimationFrame(ts => {
            last120runs.copyWithin(1, 0); // shift, keep it simple and fast
            last120runs[0] = ts;
            engine.condenseInstructionsQueue();
            engine.plotUpdates();
            engine.execute();
            engine.nextStep();
            if (cb) {
                // return some stats
                const fps = Math.round(1E6/( last120runs[0] - last120runs[1] ))/1E3;
                const stats = { ...engine.gridData(), fps };
                cb(stats);
            }
            if (started){
                run(cb);
            }
        });
    }

    return {
        start(cb?: (stats: Stats)=> void){
            if (started === false){
                started = true;
                run(cb);
            }
        },
        stop(){
            if (started){
                started = false;
                cancelAnimationFrame(nextAnimationFrame);
            }
        },
        fps() {
            //  just use 2 samples for now, use more advanced filter over the 120 samples (should be around 2 sec)
            return 1000/( last120runs[0] - last120runs[1] );
        }
    }
}

export default createAnimationTimeScheduler;
export type { AnimationScheduler };