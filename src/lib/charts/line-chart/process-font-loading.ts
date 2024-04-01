import type {
	ChartInternalState,
	LineChartCommands,
	CheckFontLoadErrorCommand,
	CheckFontLoadedCommand,
	CheckFontLoadingCommand
} from './types';

import { createCommand } from './types';

export default function fontLoading(
	idx: number,
	queue: LineChartCommands[],
	internalState: ChartInternalState
) {
	const command = queue[idx] as CheckFontLoadingCommand;
	// try to reconcile with a font-loaded or font-load-error
	let delta = 1;
	let reconcile: CheckFontLoadErrorCommand | CheckFontLoadedCommand | undefined = undefined;
	for (let i = idx + 1; i < queue.length; i++) {
		const fle = queue[i];
		if (
			(fle.type === 'font-loaded' || fle.type === 'font-load-error') &&
			fle.reqId === command.reqId
		) {
			const fontSH = fle.type === 'font-loaded' ? fle.payload : fle.payload.font;
			reconcile = fle;
			queue.splice(i, 1);
			queue.splice(idx, 1);
			delta = 0;
			if (reconcile!.type === 'font-loaded') {
				// success
				internalState.fontSH = command.payload;
				internalState.lastFontLoadError = null;
				queue.push(createCommand('render', [], []));
			} else {
				// error
				internalState.lastFontLoadError = {
					font: reconcile!.payload.font,
					ts: new Date().toISOString(),
					error: reconcile!.payload.error
				};
				internalState.fontSH = '';
			}
			break;
		}
	}
	return idx + delta;
}
