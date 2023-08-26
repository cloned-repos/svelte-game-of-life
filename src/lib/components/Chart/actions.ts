import type { ActionReturn, Action } from 'svelte/action';
import createNS from '@mangos/debug-frontend';
const debug = createNS('canvas-resize-action');

const anon = 'anonymous';

export type CanvasInfomation = {
	physicalPixelHeight: number;
	physicalPixelWidth: number;
	width?: number;
	height?: number;
};

const resizeAction: Action<
	HTMLCanvasElement,
	string | undefined,
	{ 'on:cresize': (e: CustomEvent<CanvasInfomation>) => void }
> = function (canvas: HTMLCanvasElement, tagName = '') {
	const observer = new ResizeObserver((entries) => {
		if (entries.length !== 1) {
			debug('[%s] there is not exactly one entry: %d', tagName ?? anon, entries.length);
			return;
		}
		const entry = entries[0]; // its always there
		const physicalPixelWidth = entry.devicePixelContentBoxSize[0].inlineSize;
		const physicalPixelHeight = entry.devicePixelContentBoxSize[0].blockSize;
		const height = entry.borderBoxSize[0].blockSize;
		const width = entry.borderBoxSize[0].inlineSize;
		canvas.width = physicalPixelWidth;
		canvas.height = physicalPixelHeight;
		debug('[%s] there is not exactly one entry: %d', tagName ?? anon, entries.length);
		canvas.dispatchEvent(
			new CustomEvent('cresize', {
				detail: { physicalPixelWidth, physicalPixelHeight, height, width }
			})
		);
	});
	observer.observe(canvas, { box: 'device-pixel-content-box' });
	return {
		destroy() {
			// the node has been removed from the DOM
			observer.disconnect();
		}
	};
};

export default resizeAction;
