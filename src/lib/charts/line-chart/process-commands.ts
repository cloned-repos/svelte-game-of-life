import createNS from '@mangos/debug-frontend';
import type {
	ChartInternalState,
	CheckFontLoadErrorCommand,
	CheckFontLoadedCommand,
	CheckSize,
	LineChartCommands
} from './types';
import { createCommand } from './types';
import processCommandFontCheck from './process-font-check';
import processCommandFontLoading from './process-font-loading';

const debug = createNS('process-commands');

export default function processCommands(
	canvas: HTMLCanvasElement,
	internalState: ChartInternalState,
	queue: LineChartCommands[],
	offset = 0
): void {
	debug('queue is currently: %s', JSON.stringify(queue));
	if (queue[offset] === undefined) {
		debug('queue processing done for now: %o', queue);
		return;
	}
	// process all font-checks, kick off font loading at the soonest (this this takes time)
	let i = offset;
	while (i < queue.length) {
		const command = queue[i];
		if (command.type === 'font-check') {
			queue.splice(i, 1);
			return processCommandFontCheck(canvas, command.payload, queue, internalState);
		}
		i++;
	}

	// process all font loading
	i = offset;
	while (i < queue.length) {
		const command = queue[i];
		if (command.type === 'font-loading') {
			i = processCommandFontLoading(i, queue, internalState);
			continue;
		}
		i++;
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
	debug('**internal state is currently: %o', JSON.stringify(internalState));
	// render chart data here
}
