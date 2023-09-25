import type { Readable } from 'svelte/store';
import type { ActionReturn } from 'svelte/action';
import createNS from '@mangos/debug-frontend';
//
import { createCommand } from './types';

import type {
	LineChartCommands,
	CanvasSizeInfomation,
	ChartOptions,
	ChartInternalState
} from './types';
import processCommands from './process-commands';
import processChartResize from './process-chart-resize';

//
const debugStore = createNS('chart-canvas/store');
const debugObd = createNS('chart-canvas/resize-observer');
const debugAction = createNS('chart-canvas/action');

function createObserverForCanvas(
	canvas: HTMLCanvasElement,
	fnList: ((ci: CanvasSizeInfomation) => void)[] = []
) {
	const observer = new ResizeObserver((entries) => {
		if (entries.length !== 1) {
			debugObd(
				'ResizeObserver subscribed to not exactly ONE one canvas, nr canveses (infer): [%s]',
				entries.length
			);
			return;
		}
		const entry = entries[0];
		if (canvas !== entry.target) {
			debugObd('ResizeObserver subscribed to more then one canvase');
			return;
		}
		const physicalPixelWidth = entry.devicePixelContentBoxSize[0].inlineSize;
		const physicalPixelHeight = entry.devicePixelContentBoxSize[0].blockSize;
		const height = entry.borderBoxSize[0].blockSize;
		const width = entry.borderBoxSize[0].inlineSize;
		const target: HTMLCanvasElement = entry.target as HTMLCanvasElement;
		target.width = width; //physicalPixelWidth;
		target.height = height; //physicalPixelHeight;
		const state = { physicalPixelWidth, physicalPixelHeight, height, width };
		fnList.forEach((fn) => fn.call(target, state));
	});

	observer.observe(canvas, { box: 'device-pixel-content-box' });

	return function destroy() {
		observer.disconnect();
	};
}

type ReadableCanvasStore = Readable<CanvasSizeInfomation> & {
	getSubscribers(): ((ci: CanvasSizeInfomation) => void)[];
	sizeMetrics: CanvasSizeInfomation;
};

// don't really need a store, this was from an idea I had previously
function createCanvasStore(
	canvas: HTMLCanvasElement,
	fnList: ((ci: CanvasSizeInfomation) => void)[] = []
): ReadableCanvasStore {
	const csc = getComputedStyle(canvas);
	let state: CanvasSizeInfomation = {
		physicalPixelHeight: canvas.height,
		physicalPixelWidth: canvas.width,
		width: parseFloat(csc.width),
		height: parseFloat(csc.height)
	};

	const readableState: ReadableCanvasStore = {
		getSubscribers() {
			return fnList.slice(0);
		},
		subscribe(fn: (ci: CanvasSizeInfomation) => void) {
			if (fnList.indexOf(fn) > -1) {
				throw new Error('already registered');
			}
			debugStore('passing state to store on initial subscribe [%o]', state);
			fn(state);
			fnList.push(fn);
			return () => {
				const idx = fnList.indexOf(fn);
				if (idx === -1) {
					return;
				}
				fnList.splice(idx, 1);
			};
		},
		get sizeMetrics() {
			return state;
		}
	};
	return readableState;
}

interface ChartAttributes {
	'on:chart-resize'?: (e: CustomEvent<CanvasSizeInfomation>) => void;
}

export default function line_chart(
	node: HTMLCanvasElement,
	options: ChartOptions
): ActionReturn<ChartOptions, ChartAttributes> {
	const fnList: ((ci: CanvasSizeInfomation) => void)[] = [];
	const queue: LineChartCommands[] = [];
	const destroyObserver = createObserverForCanvas(node, fnList);
	const store = createCanvasStore(node, fnList);

	// push this command now, because "store.subscribe" will fire off a render
	if (options.font) {
		queue.push(createCommand('font-check', options.font));
	}

	const internalState: ChartInternalState = {
		size: store.sizeMetrics,
		lastFontLoadError: null,
		// https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
		//  '10px sans-serif' is the default for canvas
		font: options.font || '10px sans-serif'
	};

	const disposeSubscription = store.subscribe((state) => {
		debugAction('dispatching resize event: %o', state);
		processChartResize(internalState, state, queue);
		processCommands(node, internalState, queue, 0);
		node.dispatchEvent(new CustomEvent('chart-resize', { detail: state }));
	});

	return {
		update: (newOptions: ChartOptions) => {
			if (newOptions.font && newOptions.font !== internalState.font) {
				queue.push(createCommand('font-check', newOptions.font));
				processCommands(node, internalState, queue, 0);
			}
			//generateCommands, new data, change font, other things
			//processCommands

			debugAction('options update received');
		},
		destroy: () => {
			destroyObserver();
			disposeSubscription();
		}
	};
}
