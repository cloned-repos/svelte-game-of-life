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
	if (opt.family && systemSH.includes(opt.family.toLocaleLowerCase())) {
		if (Object.keys(opt).length > 1) {
			throw new Error(`Can not specify other font properties with ${opt.family}`);
		}
		return opt.family.toLocaleLowerCase();
	}
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
	ctx.save(); // main save
	ctx.font = fontSH;
	const topMetrics = metricsFrom(textsampleForMetrics, 'top', ctx);
	const middleMetrics = metricsFrom(textsampleForMetrics, 'middle', ctx);
	const baseLineMetrics = metricsFrom(textsampleForMetrics, 'alphabetic', ctx);
	const bottomLineMetrics = metricsFrom(textsampleForMetrics, 'bottom', ctx);
	ctx.restore();
	//
	const fontTopAscent = topMetrics.fontBoundingBoxAscent;
	const actualTopAscent = topMetrics.actualBoundingBoxAscent;
	const fontTopDescent = topMetrics.fontBoundingBoxDescent;
	const actualTopDescent = topMetrics.actualBoundingBoxDescent;

	const fontAlphabeticAscent = baseLineMetrics.fontBoundingBoxAscent;
	const actualAlphabeticAscent = baseLineMetrics.actualBoundingBoxAscent;
	const fontAlphabeticDescent = baseLineMetrics.fontBoundingBoxDescent;
	const actualAlphabeticDescent = baseLineMetrics.actualBoundingBoxDescent;

	const fontBottomAscent = bottomLineMetrics.fontBoundingBoxAscent;
	const actualBottomAscent = bottomLineMetrics.actualBoundingBoxAscent;
	const fontBottomDescent = bottomLineMetrics.fontBoundingBoxDescent;
	const actualBottomDescent = bottomLineMetrics.actualBoundingBoxDescent;

	const fontMiddleAscent = middleMetrics.fontBoundingBoxAscent;
	const fontMiddleDescent = middleMetrics.fontBoundingBoxDescent;
	const actualMiddleAscent = middleMetrics.actualBoundingBoxAscent;
	const actualMiddleDescent = middleMetrics.actualBoundingBoxDescent;

	// some calculations
	debugMetrics('ascent, fontTopAscent: %s', fontTopAscent);
	debugMetrics('ascent, actualTopAscent: %s', actualTopAscent);
	debugMetrics('descent, fontTopDescent: %s', fontTopDescent);
	debugMetrics('descent, actualTopDescent: %s', actualTopDescent);
	//
	debugMetrics('ascent, fontAlphabeticAscent: %s', fontAlphabeticAscent);
	debugMetrics('ascent, actualAlphabeticAscent: %s', actualAlphabeticAscent);
	debugMetrics('descent, fontAlphabeticDescent: %s', fontAlphabeticDescent);
	debugMetrics('descent, actualAlphabeticDescent: %s', actualAlphabeticDescent);
	//
	debugMetrics('ascent, fontBottomAscent: %s', fontBottomAscent);
	debugMetrics('ascent, actualBottomAscent: %s', actualBottomAscent);
	debugMetrics('descent, fontBottomDescent: %s', fontBottomDescent);
	debugMetrics('descent, actualBottomDescent: %s', actualBottomDescent);

	debugMetrics('ascent, fontMiddleAscent: %s', fontBottomAscent);
	debugMetrics('ascent, actualMiddleAscent: %s', actualBottomAscent);
	debugMetrics('descent, fontMiddleDescent: %s', fontMiddleDescent);
	debugMetrics('descent, actualMiddleDescent: %s', actualMiddleDescent);

	// these 2 are be the same
	// we pick the first
	const topBaselineFromFontAscent = fontAlphabeticAscent - fontTopAscent;
	//const topBaselineFromActualAscent = actualAlphabeticAscent - actualTopAscent;

	debugMetrics('%ctopBaselineFromFontAscent [%s]', 'color:orange', topBaselineFromFontAscent);
	//debugMetrics('%ctopBaselineFromActualAscent [%s]', 'color:orange', topBaselineFromActualAscent);

	// these 2 are be the same
	// we pick the first
	const middleBaselineFromFontAscent = fontAlphabeticAscent - fontMiddleAscent;
	//const middleBaselineFromActualAscent = actualAlphabeticAscent - actualMiddleAscent;

	debugMetrics(
		'%cmiddleBaselineFromFontAscent [%s]',
		'color:orange',
		middleBaselineFromFontAscent
	);

	// these 2 are be the approx the same
	const bottomBaselineFromFontDescent = fontAlphabeticDescent - fontBottomDescent;
	//const bottomBaselineFromActualAscent = actualAlphabeticDescent - actualBottomDescent;

	debugMetrics(
		'%cbottomBaselineFromFontDescent [%s]',
		'color:orange',
		bottomBaselineFromFontDescent
	);

	const cellHeightUsingTopToBottomTextBaseline =
		topBaselineFromFontAscent + bottomBaselineFromFontDescent;
	const cellHeightUsingFontAscentToDescent = fontAlphabeticAscent + fontAlphabeticDescent;
	const cellHeightUsingActualBBAscentTDescent = actualAlphabeticAscent + actualAlphabeticDescent;

	debugMetrics(
		'%ccellHeightUsingTopAndBottomBaseline [%s]',
		'color:green',
		cellHeightUsingTopToBottomTextBaseline
	);
	debugMetrics(
		'%ccellHeightFontAscentDescent [%s]',
		'color:green',
		cellHeightUsingFontAscentToDescent
	);
	debugMetrics(
		'%ccellHeightActualAscentDescent [%s]',
		'color:green',
		cellHeightUsingActualBBAscentTDescent
	);
	return {
		// cellHeights?
		cellHeightUsingTopToBottomTextBaseline,
		cellHeightUsingFontAscentToDescent,
		cellHeightUsingActualBBAscentTDescent,
		// baselines, ("alphabetic" is always 0)
		top: topBaselineFromFontAscent,
		middle: middleBaselineFromFontAscent,
		bottom: bottomBaselineFromFontDescent,
		// ascents and descents
		fontAscent: fontAlphabeticAscent,
		fontDescent: fontAlphabeticDescent,
		actualAscent: actualAlphabeticAscent,
		actualDescent: actualAlphabeticDescent
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
	x: number,
	y: number,
	textBaseline: CanvasRenderingContext2D['textBaseline']
) {
	ctx.save();
	ctx.closePath();
	ctx.textBaseline = textBaseline;
	ctx.fillStyle = fillStyle;
	ctx.fillText(text, x, y);
	ctx.closePath();
	ctx.restore();
}

export function createChartCreator(fontOptions?: FontOptions) {
	let chart: Chart;
	return function (canvas?: HTMLCanvasElement) {
		if (chart) {
			return chart;
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
	for (; i >= 0; i--) {
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
	if (queue[queue.length - 1].type !== CHART_RENDER) {
		queue.push({ type: CHART_RENDER });
	}
	return true;
}
