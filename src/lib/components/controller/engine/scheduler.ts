import type { default as Engine, GridData } from './gol-engine';

export type Stats = GridData & { fps: number };

interface AnimationScheduler {
    start(): void;
    stop(): void;
    fps(): number;
    registerHooks(hooks: {
        beforeCondenseIQ?: () => void,
        beforePlotUpdates?: () => void,
        afterPlotUpdates?: () => void,
        beforeExecution?: () => void,
        afterExecution?: () => void,
        metrics?: (stats: Stats) => void;
    }): void;
    deRegisterHooks(hooks: {
        beforeCondenseIQ?: true,
        beforePlotUpdates?: true,
        afterPlotUpdates?: true,
        metrics: true
    }): void
};


// hook
function createAnimationTimeScheduler(engine: Engine): AnimationScheduler {

    let started = false;
    let nextAnimationFrame: number;

    let hookBeforeCondenseInstructionQueue: () => void;
    let hookBeforePlotUpdates: () => void;
    let hookAfterPlotUpdates: () => void;
    let hookStats: (stats: Stats) => void;
    let hookBeforeExecution: () => void;
    let hookAfterExecution: () => void;

    const last120runs = new Float32Array(120);

    function run() {
        if (!started){
            return;
        }
        nextAnimationFrame = requestAnimationFrame(ts => {
            last120runs.copyWithin(1, 0); // shift, keep it simple and fast
            last120runs[0] = ts;
            if (hookBeforeCondenseInstructionQueue) {
                hookBeforeCondenseInstructionQueue.call(engine);
            }
            engine.condenseInstructionsQueue();
            engine.plotUpdates();
            // execute next step after updates
            if (hookBeforeExecution) {
                hookBeforeExecution.call(engine);
            }
            engine.execute(
                hookBeforePlotUpdates,
                hookAfterPlotUpdates,
            );
            if (hookAfterExecution) {
                hookAfterExecution.call(engine);
            }
            if (hookStats) {
                // return some stats
                const fps = Math.round(1E6 / (last120runs[0] - last120runs[1])) / 1E3;
                const stats = { ...engine.gridData(), fps };
                hookStats(stats);
            }
            run();
        });
    }

    return {
        start() {
            if (started === false) {
                started = true;
                run();
            }
        },
        stop() {
            started = false;
            cancelAnimationFrame(nextAnimationFrame);
            nextAnimationFrame = null;
        },
        fps() {
            //  just use 2 samples for now, use more advanced filter over the 120 samples (should be around 2 sec)
            return 1000 / (last120runs[0] - last120runs[1]);
        },
        registerHooks(hooks) {
            const { beforeCondenseIQ, beforePlotUpdates, afterPlotUpdates, metrics, beforeExecution, afterExecution } = hooks;
            hookBeforeCondenseInstructionQueue = beforeCondenseIQ;
            hookBeforePlotUpdates = beforePlotUpdates;
            hookAfterPlotUpdates = afterPlotUpdates;
            hookStats = metrics;
            hookBeforeExecution = beforeExecution;
            hookAfterExecution = afterExecution;
        },
        deRegisterHooks(hooks) {
            const { beforeCondenseIQ, beforePlotUpdates, afterPlotUpdates, metrics } = hooks;
            if (beforeCondenseIQ) {
                hookBeforeCondenseInstructionQueue = undefined;
            }
            if (beforePlotUpdates) {
                hookBeforePlotUpdates = undefined;
            }
            if (afterPlotUpdates) {
                hookAfterPlotUpdates = undefined;
            }
            if (metrics) {
                hookStats = undefined;
            }
        }
    }
}

export default createAnimationTimeScheduler;
export type { AnimationScheduler };