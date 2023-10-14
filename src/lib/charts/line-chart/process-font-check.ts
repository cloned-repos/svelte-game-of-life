import type { LineChartCommands, ChartInternalState } from './types';
import { createCommand } from './types';
import { systemSH } from './constants';

import processCommands from './process-commands';

export default function processCommandFontCheck(
	fontSH: string,
	queue: LineChartCommands[],
	internalstate: ChartInternalState
): void {
	// font not loaded
	let loaded = false;
	internalstate.fontSH = fontSH;
	if (systemSH.includes(fontSH)) {
		return;
	}
	try {
		loaded = document.fonts.check(fontSH);
		if (loaded) {
			return;
		}

		queue.push(createCommand('font-loading', fontSH));
		document.fonts
			.load(fontSH)
			.then(([fontFace]) => {
				const command =
					fontFace === undefined
						? createCommand('font-load-error', {
								font: fontSH,
								error: new DOMException(`[${fontSH}] not found`)
						  })
						: createCommand('font-loaded', fontSH);
				queue.push(command);
				return processCommands(internalstate, queue);
			})
			.catch((error) => {
				queue.push(createCommand('font-load-error', { font: fontSH, error }));
			});
	} catch (error) {
		queue.push(
			createCommand('font-load-error', { font: fontSH, error: error as DOMException })
		);
	}
}
