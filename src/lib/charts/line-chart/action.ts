import type { Readable } from 'svelte/store';
import type { ActionReturn } from 'svelte/action';
import createNS from '@mangos/debug-frontend';
//
import { createFontShortHand, isFontEqual } from './helpers';

import type { ChartCommands, CanvasSize, ChartOptions, ChartInternalState } from './types';
import processCommands from './process-commands';
import processChartResize from './process-chart-resize';

//
const debugAction = createNS('chart-canvas/action');

// action
function createObserverForCanvas(
	canvas: HTMLCanvasElement,
	notificationList: ((ci: CanvasSize) => void)[] = []
) {
	const observer = new ResizeObserver((entries) => {
		const entry = entries[0];
		const physicalPixelWidth = entry.devicePixelContentBoxSize[0].inlineSize;
		const physicalPixelHeight = entry.devicePixelContentBoxSize[0].blockSize;
		const height = entry.borderBoxSize[0].blockSize;
		const width = entry.borderBoxSize[0].inlineSize;
		const target: HTMLCanvasElement = entry.target as HTMLCanvasElement;
		target.width = physicalPixelWidth; //physicalPixelWidth;
		target.height = physicalPixelHeight; //physicalPixelHeight;
		const state = { physicalPixelWidth, physicalPixelHeight, height, width };
		notificationList.forEach((fn) => fn.call(target, state));
	});

	observer.observe(canvas, { box: 'device-pixel-content-box' });

	return function destroy() {
		observer.disconnect();
	};
}

type ReadableCanvasStore = Readable<CanvasSize> & {
	getSubscribers(): ((ci: CanvasSize) => void)[];
	sizeMetrics: CanvasSize;
};

type ChartAttributes = {
	'on:chart-resize'?: (e: CustomEvent<CanvasSize>) => void;
};

// action
export default function line_chart(
	canvas: HTMLCanvasElement,
	options: ChartOptions
): ActionReturn<ChartOptions, ChartAttributes> {
	const fnList: ((ci: CanvasSize) => void)[] = [
		(state) => {
			debugAction('dispatching resize event: %o', state);
			processChartResize(internalState, state, queue);
			processCommands(internalState, queue, 0);
			canvas.dispatchEvent(new CustomEvent('chart-resize', { detail: state }));
		}
	];
	const queue: ChartCommands[] = [];
	const destroyObserver = createObserverForCanvas(canvas, fnList);
	const renderCTX = canvas.getContext('2d');

	// push this command now, because "store.subscribe" will fire off a render
	const fontSH = createFontShortHand(options.font);
	// fire up font check/load in parallel
	if (fontSH) {
		queue.push({ type: 'font-check', fontSH });
	}

	const ctx = canvas.getContext('2d', {
		desynchronized: true,
		willReadFrequently: true,
		alpha: true
	});
	if (!ctx) {
		throw new Error('could not create 2d rendering context for canvas');
	}

	const csc = getComputedStyle(canvas);
	let csi: CanvasSize = {
		physicalPixelHeight: canvas.height,
		physicalPixelWidth: canvas.width,
		width: parseFloat(csc.width),
		height: parseFloat(csc.height)
	};
	const internalState: ChartInternalState = {
		ctx,
		size: csi,
		lastFontLoadError: null,
		// https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
		//  '10px sans-serif' is the default for canvas
		fontOptions: options.font ?? {},
		fontSH
	};

	return {
		update: (newOptions: ChartOptions) => {
			debugAction('options update received, newOptions: %o', newOptions);
			if (newOptions.font && !isFontEqual(newOptions.font, internalState.fontOptions)) {
				const fontSH = createFontShortHand(newOptions.font);
				if (fontSH) {
					internalState.fontOptions = newOptions.font;
					debugAction('update/ new fontSH: [%s]', fontSH);
					queue.push({ type: 'font-check', fontSH });
					processCommands(internalState, queue, 0);
				}
			}
		},
		destroy: () => {
			destroyObserver();
		}
	};
}
