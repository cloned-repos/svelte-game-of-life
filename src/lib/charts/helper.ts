import createNS from '@mangos/debug-frontend';

import Chart from './Chart';
import {
	CHANGE_SIZE,
	CHART_RENDER,
	RegExpFontSizeEM,
	RegExpFontSizePCT,
	RegExpFontSizePx,
	RegExpFontSizeREM,
	fontStretch,
	fontStyle,
	fontVariant,
	fontWeight,
	systemSH,
	textsampleForMetrics
} from './constants';
import type { CanvasSize, CheckFont, CommonMsg, FontOptions, RenderChart } from './types';

export function createObserverForCanvas(canvas: HTMLCanvasElement, chart: Chart) {
	const observer = new ResizeObserver((entries) => {
		const entry = entries[0];
		const physicalPixelWidth = entry.devicePixelContentBoxSize[0].inlineSize;
		const physicalPixelHeight = entry.devicePixelContentBoxSize[0].blockSize;
		const height = entry.borderBoxSize[0].blockSize;
		const width = entry.borderBoxSize[0].inlineSize;
		const target: HTMLCanvasElement = entry.target as HTMLCanvasElement;
		target.width = physicalPixelWidth; //physicalPixelWidth;
		target.height = physicalPixelHeight; //physicalPixelHeight;
		const size = { physicalPixelWidth, physicalPixelHeight, height, width };
		chart.enqueue({ type: CHANGE_SIZE, size });
	});

	observer.observe(canvas, { box: 'device-pixel-content-box' });

	return function destroy() {
		observer.disconnect();
	};
}

export function isFontEqual(o1?: FontOptions, o2?: FontOptions) {
	return (
		o1?.family === o2?.family &&
		o1?.size === o2?.size &&
		o1?.stretch === o2?.stretch &&
		o1?.style === o2?.style &&
		o1?.variant === o2?.variant &&
		o1?.weight === o2?.weight
	);
}

export function isCanvasSizeEqual(a: CanvasSize, b: CanvasSize) {
	return (
		a.height === b.height &&
		a.width == b.width &&
		a.physicalPixelHeight === b.physicalPixelHeight &&
		a.physicalPixelWidth === b.physicalPixelWidth
	);
}

export function createFontShortHand(opt: FontOptions): string | never {
	/* this is the font shorthand typedef from https://www.w3.org/TR/2018/REC-css-fonts-3-20180920/#font-prop
	Operator:
	'||' means at least one of these options need to be chosen
	'|' =mutual exclusive OR
	[ 
		[ <‘font-style’> || <font-variant-css21> || <‘font-weight’> || <‘font-stretch’> ]? 
		<‘font-size’> [ / <‘line-height’> ]?
		<‘font-family’> 
	] 
	| caption | icon | menu | message-box | small-caption | status-bar
*/
	// some checks, if font-family  is one of the systemSH then other options must be not set
	let rc = '';
	// fontstyle check
	if (opt.style) {
		if (fontStyle.includes(opt.style)) {
			rc = opt.style;
		}
	}
	// fontvariant check
	if (opt.variant) {
		if (fontVariant.includes(opt.variant)) {
			rc += (rc ? ' ' : '') + opt.variant;
		}
	}

	if (opt.weight) {
		if (fontWeight.includes(opt.weight)) {
			rc += (rc ? ' ' : '') + opt.weight;
		}
	}

	if (opt.stretch) {
		if (fontStretch.includes(opt.stretch)) {
			rc += (rc ? ' ' : '') + opt.stretch;
		}
	}

	if (opt.size) {
		switch (true) {
			case RegExpFontSizePx.test(opt.size):
			case RegExpFontSizeREM.test(opt.size):
			case RegExpFontSizeEM.test(opt.size):
			case RegExpFontSizePCT.test(opt.size):
				rc += (rc ? ' ' : '') + opt.size.toLocaleLowerCase();
				break;
			default:
				throw new Error(`invalid font size:${opt.size}`);
		}
	}
	// add font family
	if (opt.family) {
		rc += (rc ? ' ' : '') + opt.family;
	}
	return rc;
}

const debugMetrics = createNS('helper.ts/getfontMetrics');

function metricsFrom(
	text: string,
	baseline: CanvasRenderingContext2D['textBaseline'],
	ctx: CanvasRenderingContext2D
): TextMetrics {
	ctx.save();
	ctx.textBaseline = baseline;
	const metrics = ctx.measureText(text);
	ctx.restore();
	return metrics;
}

export function getfontMetrics(ctx: CanvasRenderingContext2D, fontSH: string) {
	ctx.save(); // save contexts
	ctx.font = fontSH;
	// get metrics from all possible baselines
	const topMetrics = metricsFrom(textsampleForMetrics, 'top', ctx);
	const middleMetrics = metricsFrom(textsampleForMetrics, 'middle', ctx);
	const baseLineMetrics = metricsFrom(textsampleForMetrics, 'alphabetic', ctx);
	const bottomLineMetrics = metricsFrom(textsampleForMetrics, 'bottom', ctx);
	ctx.restore();
	//
	const topbl_fontAscent = topMetrics.fontBoundingBoxAscent;
	const topbl_actualAscent = topMetrics.actualBoundingBoxAscent;
	const topbl_fontDescent = topMetrics.fontBoundingBoxDescent;
	const topbl_actualDescent = topMetrics.actualBoundingBoxDescent;

	const alpbl_fontAscent = baseLineMetrics.fontBoundingBoxAscent;
	const alpbl_actualAscent = baseLineMetrics.actualBoundingBoxAscent;
	const alpbl_fontDescent = baseLineMetrics.fontBoundingBoxDescent;
	const alpbl_actualDescent = baseLineMetrics.actualBoundingBoxDescent;

	const botbl_fontAscent = bottomLineMetrics.fontBoundingBoxAscent;
	const botbl_actualAscent = bottomLineMetrics.actualBoundingBoxAscent;
	const botbl_fontDescent = bottomLineMetrics.fontBoundingBoxDescent;
	const botbl_actualDescent = bottomLineMetrics.actualBoundingBoxDescent;

	const midbl_fontAscent = middleMetrics.fontBoundingBoxAscent;
	const midbl_fontDescent = middleMetrics.fontBoundingBoxDescent;
	const midbl_actualAscent = middleMetrics.actualBoundingBoxAscent;
	const midbl_actualDescent = middleMetrics.actualBoundingBoxDescent;

	// some calculations
	debugMetrics('/font/ascent, basline-top: %s', topbl_fontAscent);
	debugMetrics('/actual/ascent, baseline-top: %s', topbl_actualAscent);
	debugMetrics('/font/descent, baseline-top: %s', topbl_fontDescent);
	debugMetrics('/actual/descent, baseline-top: %s', topbl_actualDescent);
	//
	debugMetrics('/font/ascent, fontAlphabeticAscent: %s', alpbl_fontAscent);
	debugMetrics('/actual/ascent, actualAlphabeticAscent: %s', alpbl_actualAscent);
	debugMetrics('/font/descent, fontAlphabeticDescent: %s', alpbl_fontDescent);
	debugMetrics('/actual/descent, actualAlphabeticDescent: %s', alpbl_actualDescent);
	//
	debugMetrics('/font/ascent, fontBottomAscent: %s', botbl_fontAscent);
	debugMetrics('/actual/ascent, actualBottomAscent: %s', botbl_actualAscent);
	debugMetrics('/font/descent, fontBottomDescent: %s', botbl_fontDescent);
	debugMetrics('/actual/descent, actualBottomDescent: %s', botbl_actualDescent);

	debugMetrics('ascent, fontMiddleAscent: %s', midbl_fontAscent);
	debugMetrics('ascent, actualMiddleAscent: %s', midbl_actualAscent);
	debugMetrics('descent, fontMiddleDescent: %s', midbl_fontDescent);
	debugMetrics('descent, actualMiddleDescent: %s', midbl_actualDescent);

	// these 2 are be the same
	const midbl_2_topbl_from_font_ascent = midbl_fontAscent - topbl_fontAscent;
	const midbl_2_topbl_from_actual_ascent = midbl_actualAscent - topbl_actualAscent;

	// these 2 should be the same, mid-ascent < alpha-ascent
	const midbl_2_alpha_from_font_ascent = alpbl_fontAscent - midbl_fontAscent;
	const midbl_2_alpha_from_actual_ascent = alpbl_actualAscent - midbl_actualAscent;

	// these 2 should be the same, mid-descent > bot-descent
	const midbl_2_botbl_from_font_descent = midbl_fontDescent - botbl_fontDescent;
	const midbl_2_botbl_from_actual_descent = midbl_fontDescent - botbl_actualDescent;

	// from top baseline to  bottom baseline
	// I am here
	const using_l_using_font_topbl_2_botbl =
		alphbl_2_topbl_from_font_ascent + alphbl_2_botbl_from_font_ascent;

	// from font ascent to font descent
	const using_alphbl_using_font_ascent_2_descent = alpbl_fontAscent + alpbl_fontDescent;

	// from actual ascent to actual descent
	const using_alphbl_using_actual_ascent_2_descent = alpbl_actualAscent + alpbl_actualDescent;

	debugMetrics(
		'%c using_alphbl_using_font_topbl_2_botbl [%s]',
		'color:green',
		using_alphbl_using_font_topbl_2_botbl
	);
	debugMetrics(
		'%c using_alphbl_using_font_ascent_2_descent [%s]',
		'color:green',
		using_alphbl_using_font_ascent_2_descent
	);
	debugMetrics(
		'%c using_alphbl_using_actual_ascent_2_descent [%s]',
		'color:green',
		using_alphbl_using_actual_ascent_2_descent
	);
	return {
		// cellHeights?
		heights: {
			using_alphbl_using_font_topbl_2_botbl,
			using_alphbl_using_font_ascent_2_descent,
			using_alphbl_using_actual_ascent_2_descent
		},
		baselines: {
			top: {
				alphbl_2_topbl_from_font_ascent,
				alphbl_2_topbl_from_actual_ascent
			},
			middle: {
				alphbl_2_midbl_from_font_ascent,
				alphbl_2_midbl_from_actual_ascent
			},
			bottom: {
				alphbl_2_midbl_from_actual_ascent,
				alphbl_2_midbl_from_font_ascent
			}
		},
		// ascents and descents
		ascents: {
			font: {
				alphabetic: alpbl_fontAscent,
				middle: midbl_fontAscent,
				bottom: botbl_fontAscent
			},
			actual: {
				alphabetic: alpbl_actualAscent,
				middle: midbl_actualAscent,
				bottom: botbl_actualAscent
			}
		},
		descents: {
			font: {
				alphabetic: alpbl_fontDescent,
				middle: midbl_fontDescent,
				bottom: botbl_fontDescent
			},
			actual: {
				alphabetic: alpbl_actualDescent,
				middle: midbl_actualDescent,
				bottom: botbl_actualDescent
			}
		}
	};
}

export function drawLine(
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	style: string
) {
	ctx.save();
	ctx.closePath();
	ctx.strokeStyle = style;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

export function drawHorizontalLine(
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number,
	x2: number,
	style: string,
	...lineDash: number[]
) {
	ctx.save();
	ctx.closePath();
	ctx.setLineDash(lineDash);
	ctx.strokeStyle = style;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y1);
	ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

export function clear(ctx: CanvasRenderingContext2D) {
	ctx.save();
	ctx.closePath();
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.restore();
}

export function drawText(
	ctx: CanvasRenderingContext2D,
	text: string,
	fillStyle: string,
	fontSH: string,
	x: number,
	y: number,
	textBaseline: CanvasRenderingContext2D['textBaseline']
) {
	ctx.save();
	ctx.closePath();
	ctx.font = fontSH;
	ctx.textBaseline = textBaseline;
	ctx.fillStyle = fillStyle;
	ctx.fillText(text, x, y);
	ctx.closePath();
	ctx.restore();
}

export function createChartCreator(fontOptions?: FontOptions) {
	let chart: Chart;
	return function (canvas?: HTMLCanvasElement) {
		if (canvas && chart) {
			throw new Error('can not add this action to multiple html tags');
		}
		if (chart) {
			return chart;
		}
		if (!canvas) {
			throw new Error('no argument given for chart-action');
		}
		if (false === canvas instanceof window.HTMLCanvasElement) {
			throw new Error('the tag being "actionized" is not a <canvas /> tag');
		}
		chart = new Chart(canvas!, fontOptions);
		return chart;
	};
}

export function defaultFontOptionValues(fontOptions?: FontOptions): FontOptions {
	return Object.assign({ size: '10px', family: 'sans-serif' }, fontOptions);
}

export function* eventGenerator<T extends CommonMsg | CheckFont>(
	queue: (CommonMsg | CheckFont)[],
	selector: (ev: CommonMsg | CheckFont) => boolean
): Generator<{ readonly idx: number; target: T; remove: () => void }, undefined, void> {
	let i = 0;
	while (i < queue.length) {
		const length = queue.length;
		const ev = queue[i];
		const fr = i;
		if (selector(ev)) {
			yield {
				get idx() {
					return fr;
				},
				target: ev as T,
				remove() {
					queue.splice(fr, 1);
				}
			};
			if (length !== queue.length) {
				// remove() was called
				continue;
			}
		}
		i++;
	}
	return;
}

// clean up chart render unless the last one
export function cleanUpChartRenderMsgs(queue: (CommonMsg | CheckFont)[]) {
	let renderMsg: RenderChart | null = null;
	let i = queue.length - 1;
	for (; i >= 0 && i < queue.length; i--) {
		const msg = queue[i];
		if (msg.type === CHART_RENDER) {
			if (!renderMsg) {
				renderMsg = msg;
			}
			queue.splice(i, 1);
		}
	}
	if (!renderMsg) {
		return false; // nothing to be done
	}
	return true;
}
