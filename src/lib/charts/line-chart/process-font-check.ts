import type { LineChartCommands, ChartInternalState } from './types';
import { createCommand } from './types';
import { systemSH } from './constants';

import processCommands from './process-commands';

export default function processCommandFontCheck(
	fontSH: string,
	queue: LineChartCommands[],
	internalstate: ChartInternalState
): void {
	internalstate.fontSH = fontSH;

	// system fonts dont need to be loaded they are assigned in the "render" phase directly to ctx.font = ...
	if (systemSH.includes(fontSH)) {
		return;
	}
	const reqId = Math.random();
	queue.push(createCommand('font-loading', [fontSH], [reqId]));

	try {
		const loaded = document.fonts.check(fontSH); // this can throw?
		if (loaded) {
			queue.push(createCommand('font-loaded', [fontSH], [reqId]));
			return processCommands(internalstate, queue);
		}
		document.fonts
			.load(fontSH)
			.then(([fontFace]) => {
				const command =
					fontFace === undefined
						? createCommand(
								'font-load-error',
								[
									{
										font: fontSH,
										error: new DOMException(`[${fontSH}] not found`)
									}
								],
								[reqId]
						  )
						: createCommand('font-loaded', [fontSH], [reqId]);
				queue.push(command);
				return processCommands(internalstate, queue);
			})
			.catch((error) => {
				queue.push(createCommand('font-load-error', [{ font: fontSH, error }], [reqId]));
				return processCommands(internalstate, queue);
			});
	} catch (error) {
		queue.push(
			createCommand(
				'font-load-error',
				[{ font: fontSH, error: error as DOMException }],
				[reqId]
			)
		);
		return processCommands(internalstate, queue);
	}
}
