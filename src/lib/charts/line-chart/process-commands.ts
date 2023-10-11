import createNS from '@mangos/debug-frontend';
import type {
	ChartInternalState,
	CheckFontLoadErrorCommand,
	CheckFontLoadedCommand,
	CheckSize,
	LineChartCommands
} from './types';
import processCommandFontCheck from './process-font-check';
import processCommandFontLoading from './process-font-loading';
import { getfontMetrics, drawHorizontalLine, clear, drawText } from './helpers';
import { textsampleForMetrics } from './constants';

const debug = createNS('process-commands');

export default function processCommands(
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
			if (command.payload) {
				processCommandFontCheck(command.payload, queue, internalState);
			} else {
				//no font shorthand could be created
				internalState.fontSH = '';
			}
		}
		i++;
	}

	// process all font loading that  have finished
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
	//
	const ctx = internalState.ctx;
	ctx.font = internalState.fontSH;
	const {
		cellHeightUsingActualBBAscentTDescent,
		cellHeightUsingFontAscentToDescent,
		cellHeightUsingTopToBottomTextBaseline,
		top,
		bottom,
		middle,
		fontAscent,
		fontDescent,
		actualAscent,
		actualDescent
	} = getfontMetrics(ctx, internalState.fontSH);
	// select max emHeight

	const heights = [
		cellHeightUsingActualBBAscentTDescent,
		cellHeightUsingFontAscentToDescent,
		cellHeightUsingTopToBottomTextBaseline
	];
	let maxHeightIdx = 0;
	for (let i = 1; i < 3; i++) {
		if (heights[i] > heights[maxHeightIdx]) {
			maxHeightIdx = i;
		}
	}
	const maxHeight = heights[maxHeightIdx];
	let above = 0;
	let below = 0;
	switch (maxHeightIdx) {
		case 0:
			above = actualAscent - middle;
			below = actualDescent + middle;
			break;
		case 1:
			above = fontAscent - middle;
			below = fontDescent + middle;
			break;
		case 2:
		default:
			above = top - middle;
			below = bottom + middle;
	}
	debug('selected: %s', maxHeightIdx);
	debug('above %s', above);
	debug('below %s', below);
	debug('max cellHeight: %s', maxHeight);
	const canvasHeight = internalState.ctx.canvas.height;
	const textBaseLineMiddle = canvasHeight - below - 12;
	const _fontAscent = textBaseLineMiddle - (fontAscent - middle);
	const _actualAscent = textBaseLineMiddle - (actualAscent - middle);
	const _fontDescentAscent = textBaseLineMiddle + (fontDescent + middle);
	const _actualDescentAscent = textBaseLineMiddle + (actualDescent + middle);
	const _topBaseLine = textBaseLineMiddle - (top - middle);
	const _alphaBeticLine = textBaseLineMiddle + middle;

	// lets draw
	clear(ctx);

	drawText(ctx, textsampleForMetrics, 'black', 40, textBaseLineMiddle, 'middle');

	// draw FontAscent orange
	//drawHorizontalLine(ctx, 0, _fontAscent, ctx.canvas.width, 'rgba(255,191,0, 0.5)');
	// draw ActualAscent red
	//drawHorizontalLine(ctx, 0, _actualAscent, ctx.canvas.width, 'rgba(255,0,0, 0.5)');

	// draw "top base line"
	drawHorizontalLine(ctx, 0, _topBaseLine, ctx.canvas.width, 'rgba(255,0,255, 0.5)');

	// draw "middle base line" in black
	drawHorizontalLine(ctx, 0, textBaseLineMiddle, ctx.canvas.width, 'rgba(0,0,0, 0.5)');

	// draw "alphabetic base line" in pink
	drawHorizontalLine(ctx, 0, _alphaBeticLine, ctx.canvas.width, 'rgb(248, 131, 121)');

	// draw FontDescent in orange
	//drawHorizontalLine(ctx, 0, _fontDescentAscent, ctx.canvas.width, 'rgba(255,191,0, 0.5)');
	// draw actualDescent in red
	//drawHorizontalLine(ctx, 0, _actualDescentAscent, ctx.canvas.width, 'rgba(255,0,0, 0.5)');

	debug('**queue is currently: %s', JSON.stringify(queue));
	debug('**internal state is currently: %o', JSON.stringify(internalState));
	// render chart data here
}
