import type {
	ChartInternalState,
	LineChartCommands,
	CheckFontLoadErrorCommand,
	CheckFontLoadedCommand
} from './types';

import { createCommand } from './types';

export default function fontLoading(
	idx: number,
	queue: LineChartCommands[],
	internalState: ChartInternalState
) {
	const command = queue[idx] as CheckFontLoadedCommand;
	// try to reconcile with a font-loaded or font-load-error
	const length = queue.length;
	let reconcile: CheckFontLoadErrorCommand | CheckFontLoadedCommand | undefined = undefined;
	for (let i = idx + 1; i < queue.length; i++) {
		const fle = queue[i];
		if (fle.type === 'font-loaded' || fle.type === 'font-load-error') {
			const fontSH = fle.type === 'font-loaded' ? fle.payload : fle.payload.font;
			reconcile = fle;
			if (fontSH === command.payload) {
				queue.splice(i, 1);
				queue.splice(idx, 1);
				break;
			}
		}
	}
	const delta = length === queue.length ? 1 : 0;
	let i = idx + delta;
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
	return idx + delta;
}
