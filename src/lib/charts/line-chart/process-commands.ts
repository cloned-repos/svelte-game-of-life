import createNS from '@mangos/debug-frontend';
import type {
	ChartInternalState,
	CheckFontLoadErrorCommand,
	CheckFontLoadedCommand,
	CheckSize,
	LineChartCommands
} from './types';
import { createCommand } from './types';
import { processCommandFontCheck } from './process-font-check';

const debug = createNS('process-commands');

export default function processCommands(
	canvas: HTMLCanvasElement,
	internalState: ChartInternalState,
	queue: LineChartCommands[],
	offset = 0
): void {
	debug('queue is currently: %s', JSON.stringify(queue));
	const command = queue[offset];
	if (!command) {
		debug('queue processing done: %o', queue);
		return;
	}

	if (command.type === 'font-check') {
		queue.shift();
		return processCommandFontCheck(canvas, command.payload, queue, internalState);
	}

	if (command.type === 'font-loading') {
		// try to reconcile with a font-loaded or font-load-error
		const length = queue.length;
		let reconcile: CheckFontLoadErrorCommand | CheckFontLoadedCommand | undefined = undefined;
		for (let i = offset + 1; i < queue.length; i++) {
			const fle = queue[i];
			if (fle.type === 'font-loaded' || fle.type === 'font-load-error') {
				const fontSH = fle.type === 'font-loaded' ? fle.payload : fle.payload.font;
				reconcile = fle;
				if (fontSH === command.payload) {
					queue.splice(i, 1);
					queue.splice(offset, 1);
					break;
				}
			}
		}
		const delta = length === queue.length ? 1 : 0;
		let i = offset + delta;
		for (; i < queue.length; i++) {
			if (queue[i].type === 'font-loading') {
				break;
			}
		}
		if (i >= queue.length && reconcile) {
			if (reconcile!.type === 'font-loaded') {
				internalState.font = command.payload;
				internalState.lastFontLoadError = null;
				queue.push(createCommand('render'));
			} else {
				internalState.lastFontLoadError = {
					font: reconcile!.payload.font,
					ts: new Date().toISOString(),
					error: reconcile!.payload.error
				};
				internalState.font = '';
			}
		}
		return processCommands(canvas, internalState, queue, offset + delta);
	}

	// clean up all chart resize command except the last one
	{
		let lastResizeIdx = -1;
		const length = queue.length;
		for (let i = queue.length - 1; i >= offset; ) {
			if (queue[i].type === 'chart-size') {
				if (lastResizeIdx === -1) {
					lastResizeIdx = i;
					i--;
					continue;
				}
				queue.splice(i, 1);
				lastResizeIdx--;
			}
			i--;
		}
	}
	// clean up all chart render command except the last one
	{
		let lastRenderIdx = -1;
		const length = queue.length;
		for (let i = queue.length - 1; i >= offset; ) {
			if (queue[i].type === 'render') {
				if (lastRenderIdx === -1) {
					lastRenderIdx = i;
					i--;
					continue;
				}
				queue.splice(i, 1);
				lastRenderIdx--;
			}
			i--;
		}
		if (lastRenderIdx > -1) {
			if (lastRenderIdx !== queue.length - 1) {
				const lastRender = queue[lastRenderIdx];
				queue.splice(lastRenderIdx, 1);
				queue.push(lastRender);
			}
		}
	}
	debug('**queue is currently: %s', JSON.stringify(queue));
}
