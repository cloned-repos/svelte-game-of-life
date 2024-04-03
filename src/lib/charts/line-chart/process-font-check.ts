import { FONT_LOADING, systemSH } from '../constants';
import processCommands from './process-commands';

export default function processCommandFontCheck(
	fontSH: string,
	queue: ChartCommands[],
	internalstate: ChartInternalState
): void {
	internalstate.fontSH = fontSH;

	// system fonts dont need to be loaded they are assigned in the "render" phase directly to ctx.font = ...
	// document.fonts.check(..) a system font results in an error loading system fonts results in an error
	if (systemSH.includes(fontSH)) {
		return;
	}
	const reqId = random();
	queue.push({ type: FONT_LOADING, fontSH, reqId });

	try {
		const loaded = document.fonts.check(fontSH); // this can throw?
		if (loaded) {
			queue.push(createCommand('font-loaded', [fontSH], [reqId: r]));
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
