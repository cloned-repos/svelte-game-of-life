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
import type { CanvasSize, CommonMsg, Font, FontOptions, RenderChart } from './types';

export function createObserverForCanvas(canvas: HTMLCanvasElement, chart: Chart) {
	const observer = new ResizeObserver((entries) => {
		const entry = entries[0];
		const physicalPixelWidth = entry.devicePixelContentBoxSize[0].inlineSize;
		const physicalPixelHeight = entry.devicePixelContentBoxSize[0].blockSize;
		const height = entry.borderBoxSize[0].blockSize;
		const width = entry.borderBoxSize[0].inlineSize;
		const target: HTMLCanvasElement = entry.target as HTMLCanvasElement;
		//target.width = physicalPixelWidth; //physicalPixelWidth;
		//target.height = physicalPixelHeight; //physicalPixelHeight;
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

export function createFontID(opt: FontOptions): string | null {
	let rc = '';
	if (fontStyle.includes(opt.style!)) {
		rc += opt.style;
	} else {
		return null;
	}
	if (opt.family) {
		rc += ' ' + opt.family;
	} else {
		return null;
	}
	return rc;
}

export function createFontShortHand(opt: FontOptions): string | null {
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
				return null;
		}
	}
	// add font family
	if (!opt.family) {
		return null;
	}
	rc += ' ' + opt.family;
	return rc;
}

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

	// these 2 are always the same?
	// middle baseline is the norm
	const topbl_font = midbl_fontAscent - topbl_fontAscent;
	const topbl_actual = midbl_actualAscent - topbl_actualAscent;

	// these 2 should be the same, mid-ascent < alpha-ascent
	const alpbl_font = midbl_fontAscent - alpbl_fontAscent;
	const alpbl_actual = midbl_actualAscent - alpbl_actualAscent;

	// these 2 should be the same, mid-ascent < bot-ascent
	const botbl_font = midbl_fontAscent - botbl_fontAscent;
	const botbl_actual = midbl_actualAscent - botbl_actualAscent;

	const metrics = {
		topbl: topbl_font,
		fontAscent: topbl_font + topbl_fontAscent,
		actualAscent: topbl_actual + topbl_actualAscent,
		alpbbl: alpbl_font,
		botbl: botbl_font,
		fontDescent: botbl_font - botbl_fontDescent,
		actualDescent: botbl_actual - botbl_actualDescent
	};
	// from top baseline to  bottom baseline
	// I am here
	return {
		metrics,
		debug: {
			baselines: {
				top: {
					font: topbl_font,
					actual: topbl_actual
				},
				alphabetic: {
					font: alpbl_font,
					actual: alpbl_actual
				},
				bottom: {
					font: botbl_font,
					actual: botbl_actual
				}
			},
			// ascents and descents
			ascents: {
				font: {
					alphabetic: alpbl_fontAscent,
					middle: midbl_fontAscent,
					bottom: botbl_fontAscent,
					top: topbl_fontAscent
				},
				actual: {
					alphabetic: alpbl_actualAscent,
					middle: midbl_actualAscent,
					bottom: botbl_actualAscent,
					top: topbl_actualAscent
				}
			},
			descents: {
				font: {
					alphabetic: -alpbl_fontDescent,
					middle: -midbl_fontDescent,
					bottom: -botbl_fontDescent,
					top: -topbl_fontDescent
				},
				actual: {
					alphabetic: -alpbl_actualDescent,
					middle: -midbl_actualDescent,
					bottom: -botbl_actualDescent,
					top: -topbl_actualDescent
				}
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

export function drawHorizontalLines(
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number[],
	x2: number,
	style: string,
	...lineDash: number[]
) {
	y1.forEach((y0) => drawHorizontalLine(ctx, x1, y0, x2, style, ...lineDash));
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

export function createChartCreator(fontOptions?: Font) {
	let chart: Chart;
	return function (canvas?: HTMLCanvasElement) {
		const destroy = () => {
			chart.detach();
		};
		if (canvas && chart) {
			throw new Error('can not add this action to multiple html tags');
		}
		if (chart) {
			return { chart, destroy };
		}
		if (!canvas) {
			throw new Error('no argument given for chart-action');
		}
		if (false === canvas instanceof window.HTMLCanvasElement) {
			throw new Error('the tag being "actionized" is not a <canvas /> tag');
		}
		chart = new Chart(canvas!, fontOptions);
		return { chart, destroy };
	};
}

export function defaultFontOptionValues(fontOptions?: FontOptions): FontOptions {
	return Object.assign({ size: '10px', family: 'sans-serif' }, fontOptions);
}

export function* eventGenerator<T extends CommonMsg>(
	queue: CommonMsg[],
	selector: (ev: CommonMsg) => boolean
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
export function cleanUpChartRenderMsgs(queue: CommonMsg[]) {
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
