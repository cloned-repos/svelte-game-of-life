import type { default as Engine, GridData } from './gol-engine';

export type Stats = GridData & { fps: number };

interface AnimationScheduler {
	start(): void;
	stop(): void;
	fps(): number;
	registerHooks(hooks: {
		beforeCondenseIQ?: () => undefined;
		beforePlotUpdates?: () => undefined;
		afterPlotUpdates?: () => undefined;
		beforeExecution?: () => undefined;
		afterExecution?: () => undefined;
		metrics?: (stats: Stats) => void;
	}): void;
	deRegisterHooks(hooks: {
		beforeCondenseIQ?: true;
		beforePlotUpdates?: true;
		afterPlotUpdates?: true;
		metrics: true;
	}): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const FN_NO_ARG = () => {};
// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
const FN_STAT_ARG = (_stats: Stats) => {};

// hook
function createAnimationTimeScheduler(engine: Engine): AnimationScheduler {
	let started = false;
	let nextAnimationFrame: number;

	let hookBeforeCondenseInstructionQueue = FN_NO_ARG;
	let hookBeforePlotUpdates = FN_NO_ARG;
	let hookAfterPlotUpdates = FN_NO_ARG;
	let hookStats = FN_STAT_ARG;
	let hookBeforeExecution = FN_NO_ARG;
	let hookAfterExecution = FN_NO_ARG;

	const last120runs = new Float32Array(120);

	function run() {
		if (!started) {
			return;
		}
		nextAnimationFrame = requestAnimationFrame((ts) => {
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
			engine.execute(hookBeforePlotUpdates, hookAfterPlotUpdates);
			if (hookAfterExecution) {
				hookAfterExecution.call(engine);
			}
			if (hookStats) {
				// return some stats
				const fps = Math.round(1e6 / (last120runs[0] - last120runs[1])) / 1e3;
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
			nextAnimationFrame = 0;
		},
		fps() {
			//  just use 2 samples for now, use more advanced filter over the 120 samples (should be around 2 sec)
			return 1000 / (last120runs[0] - last120runs[1]);
		},
		registerHooks(hooks) {
			const {
				beforeCondenseIQ,
				beforePlotUpdates,
				afterPlotUpdates,
				metrics,
				beforeExecution,
				afterExecution
			} = hooks;
			hookBeforeCondenseInstructionQueue = beforeCondenseIQ ?? FN_NO_ARG;
			hookBeforePlotUpdates = beforePlotUpdates ?? FN_NO_ARG;
			hookAfterPlotUpdates = afterPlotUpdates ?? FN_NO_ARG;
			hookStats = metrics ?? FN_STAT_ARG;
			hookBeforeExecution = beforeExecution ?? FN_NO_ARG;
			hookAfterExecution = afterExecution ?? FN_NO_ARG;
		},
		deRegisterHooks(hooks) {
			const { beforeCondenseIQ, beforePlotUpdates, afterPlotUpdates, metrics } = hooks;
			if (beforeCondenseIQ) {
				hookBeforeCondenseInstructionQueue = FN_NO_ARG;
			}
			if (beforePlotUpdates) {
				hookBeforePlotUpdates = FN_NO_ARG;
			}
			if (afterPlotUpdates) {
				hookAfterPlotUpdates = FN_NO_ARG;
			}
			if (metrics) {
				hookStats = FN_STAT_ARG;
			}
		}
	};
}

export default createAnimationTimeScheduler;
export type { AnimationScheduler };
