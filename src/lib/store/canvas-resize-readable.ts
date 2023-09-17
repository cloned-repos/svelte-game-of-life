import type { Readable } from 'svelte/store';
import createNS from '@mangos/debug-frontend';

const debugStore = createNS('canvas-resize-observable/store');
const debugObd = createNS('canvas-resize-observable/observable');

export type CanvasInfomation = {
	physicalPixelHeight: number;
	physicalPixelWidth: number;
	width?: number;
	height?: number;
};

export type ReadableCanvasStore = Readable<CanvasInfomation> & {
	getSubscribers(): ((ci: CanvasInfomation) => void)[];
};

export function createCanvasStore(
	canvas: HTMLCanvasElement,
	fnList: ((ci: CanvasInfomation) => void)[] = []
): ReadableCanvasStore {
	const csc = getComputedStyle(canvas);
	let state: CanvasInfomation = {
		physicalPixelHeight: canvas.height,
		physicalPixelWidth: canvas.width,
		width: parseFloat(csc.width),
		height: parseFloat(csc.height)
	};

	const readableState: ReadableCanvasStore = {
		getSubscribers() {
			return fnList.slice(0);
		},
		subscribe(fn: (ci: CanvasInfomation) => void) {
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
		}
	};
	return readableState;
}

export function createObserverForCanvas(
	canvas: HTMLCanvasElement,
	fnList: ((ci: CanvasInfomation) => void)[] = []
) {
	const observer = new ResizeObserver((entries) => {
		if (entries.length !== 1) {
			debugObd('[%s] there is not exactly 1 entry: %d', entries.length);
			return;
		}
		const entry = entries[0]; // it's always there
		const physicalPixelWidth = entry.devicePixelContentBoxSize[0].inlineSize;
		const physicalPixelHeight = entry.devicePixelContentBoxSize[0].blockSize;
		const height = entry.borderBoxSize[0].blockSize;
		const width = entry.borderBoxSize[0].inlineSize;
		const target: HTMLCanvasElement = entry.target as HTMLCanvasElement;
		target.width = physicalPixelWidth;
		target.height = physicalPixelHeight;
		const state = { physicalPixelWidth, physicalPixelHeight, height, width };
		debugObd('Observable passing state to store: [%o]', state);
		fnList.forEach((fn) => fn.call(target, state));
	});

	observer.observe(canvas, { box: 'device-pixel-content-box' });

	return function destroy() {
		observer.disconnect();
	};
}
