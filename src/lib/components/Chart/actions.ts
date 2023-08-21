import createNS from '@mangos/debug-frontend';
const debug = createNS('canvas-resize-action');

const anon = 'anonymous';

export default function resizeActions(canvas: HTMLCanvasElement, tagName?: string) {
	const observer = new ResizeObserver((entries) => {
		if (entries.length !== 1) {
			debug('[%s] there is not exactly one entry: %d', tagName ?? anon, entries.length);
			return;
		}
		const entry = entries[0]; // its always there
		const width = entry.devicePixelContentBoxSize[0].inlineSize;
		const height = entry.devicePixelContentBoxSize[0].blockSize;
		canvas.width = width;
		canvas.height = height;
		debug('[%s] there is not exactly one entry: %d', tagName ?? anon, entries.length);
		canvas.dispatchEvent(new CustomEvent('cresize', { detail: { width, height } }));
	});
	observer.observe(canvas, { box: 'device-pixel-content-box' });
	return {
		destroy() {
			// the node has been removed from the DOM
			observer.disconnect();
		}
	};
}
