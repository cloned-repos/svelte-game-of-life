import {
	canonicalText,
	fontStretch,
	fontStyle,
	fontVariant,
	fontWeight,
	regExpFontSizeMetric
} from './constants';
import {
	EPSILON,
	abs,
	isCanvasSizeEqual,
	max,
	metricsFrom,
	min,
	round,
	swap,
	trunc
} from './helper';
import type {
	CanvasSize,
	DebugFontMetrics,
	DeviceRatioAffectOptions,
	FontMetrics,
	FontOptions
} from './types';

export default class Context {
	private ctx: CanvasRenderingContext2D | null;
	constructor(
		private readonly canvas: HTMLCanvasElement,
		private readonly pixelRatio: (size?: CanvasSize) => number,
		private readonly ratioOptions: DeviceRatioAffectOptions
	) {
		this.ctx = canvas.getContext('2d', {
			willReadFrequently: true,
			alpha: true
		})!;
	}

	private calculateForAltMetricUnit(font: FontOptions): FontOptions {
		const size = String(font.size);
		const metric = size.match(regExpFontSizeMetric);
		const unit = metric!.groups!.u;
		let target = parseFloat(metric!.groups!.nr);
		if (unit !== 'ch' && unit !== 'dp') {
			// pass through if it is not devicepixel "dp" unit
			return font;
		}
		const propName: 'cellHeight' | 'capHeight' = size.endsWith('dp')
			? 'cellHeight'
			: 'capHeight';
		let px0 = target;
		// calculate c0 first estimate

		let c0 = this.getfontMetrics(
			this.createFontShortHand({ ...font, size: `${px0}px` }),
			canonicalText
		)!.metrics[propName];

		let px1 = c0;
		// calculate c1 second estimate estimate

		let c1 = this.getfontMetrics(
			this.createFontShortHand({ ...font, size: `${px1}px` }),
			canonicalText
		)!.metrics[propName];

		let lastPx = abs(c0 - target) > abs(c1 - target) ? px1 : px0;
		let error = min(abs(c0 - target), abs(c1 - target));
		for (;;) {
			if (abs(c0 - target) < EPSILON) {
				return { ...font, size: `${px0}px` };
			}
			if (abs(c1 - target) < EPSILON) {
				return { ...font, size: `${px1}px` };
			}
			// parameterized
			// make c0 is always closest to target
			if (abs(c1 - target) < abs(c0 - target)) {
				[c0, c1] = swap([c0, c1]);
				[px0, px1] = swap([px0, px1]);
			}
			const dvX = px1 - px0;
			const dvC = c1 - c0;
			const l = (target - c0) / dvC;
			const pxn = px0 + l * dvX;

			const cn = this.getfontMetrics(
				this.createFontShortReal({ ...font, size: `${pxn}px` }),
				canonicalText
			)!.metrics[propName];

			// diverging? stop!
			if (error <= abs(target - cn)) {
				return { ...font, size: `${lastPx}px` };
			}
			c1 = cn;
			px1 = pxn;
			error = abs(target - cn);
			lastPx = pxn;
		}
	}

	createFontShortHand(opt: FontOptions): string {
		const size = String(opt.size).toLocaleLowerCase();
		// are these our own defined units, "ch" or "dp"
		if (size.endsWith('dp') || size.endsWith('ch')) {
			// translate to unit "px" on the fly
			// we translate to "px" untill the very last moment
			const fontAdjusted = this.calculateForAltMetricUnit(opt);
			return this.createFontShortReal(fontAdjusted);
		}
		return this.createFontShortReal(opt);
	}

	private getCanvasSize(): CanvasSize {
		const size = this.canvas.getBoundingClientRect();
		const cssWidth = trunc(size.right - size.left);
		const cssHeight = trunc(size.bottom - size.top);
		return {
			physicalPixelHeight: this.canvas.height,
			physicalPixelWidth: this.canvas.width,
			width: cssWidth,
			height: cssHeight
		};
	}

	private createFontShortReal(opt: FontOptions): string {
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
		const size = String(opt.size).toLowerCase();
		rc += (rc ? ' ' : '') + size;
		// finally
		rc += ' ' + opt.family;
		return rc;
	}

	setSize(devicePixelWidth: number, devicePixelHeight: number) {
		const w = trunc(devicePixelWidth);
		const h = trunc(devicePixelHeight);
		const {
			canvas: { width, height },
			canvas
		} = this;
		if (this.ctx === null) {
			this.ctx = canvas.getContext('2d');
			if (this.ctx === null) {
				return this;
			}
		}
		if (this.canvas.width !== w || this.canvas.height !== h) {
			this.canvas.width = w;
			this.canvas.height = h;
		} else {
			this.ctx.clearRect(0, 0, w, h);
		}
		return this;
	}
	fillStyle(style: string | CanvasGradient | CanvasPattern) {
		const { ctx } = this;
		if (ctx) {
			ctx.fillStyle = style;
		}
		return this;
	}
	font(fontSH: string) {
		const { ctx } = this;
		if (ctx) {
			if (!this.ratioOptions.font) {
				ctx.font = fontSH;
				return this;
			}
			const size = this.canvas.getBoundingClientRect();
			const cssWidth = trunc(size.right - size.left);
			const cssHeight = trunc(size.bottom - size.top);
			const ratio = this.pixelRatio({
				physicalPixelHeight: this.canvas.height,
				physicalPixelWidth: this.canvas.width,
				width: cssWidth,
				height: cssHeight
			});
			const newFontSH = this.ratioOptions.font(fontSH, ratio);
			ctx.font = this.ratioOptions.font(fontSH, ratio);
		}
		return this;
	}
	setLineWidth(w: number) {
		const { ctx } = this;
		if (!ctx) {
			return this;
		}
		let w0 = w;
		if (this.ratioOptions.lineWidth) {
			w0 = this.ratioOptions.lineWidth(this.pixelRatio(this.getCanvasSize()), w);
		}
		ctx.lineWidth = w0;
		return this;
	}
	strokeStyle(style: string) {
		const { ctx } = this;
		if (ctx) {
			ctx.strokeStyle = style;
		}
		return this;
	}
	textAlign(style: 'left' | 'right' | 'center' | 'start' | 'end') {
		const { ctx } = this;
		if (ctx) {
			ctx.textAlign = style;
		}
		return this;
	}
	textBaseLine(baseLine: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom') {
		const { ctx } = this;
		if (ctx) {
			ctx.textBaseline = baseLine;
		}
		return this;
	}
	fillRect(x: number, y: number, w: number, h: number) {
		const { ctx } = this;
		if (ctx) {
			if (this.ratioOptions.canvasPositioning) {
				const metrics = this.ratioOptions.canvasPositioning(
					this.pixelRatio(this.getCanvasSize()),
					x,
					y,
					w,
					h
				);
				ctx.fillRect.apply(ctx, metrics as [number, number, number, number]);
				return this;
			}
			ctx.fillRect(x, y, w, h);
		}
		return this;
	}
	fillText(text: string, x: number, y: number) {
		const { ctx } = this;

		if (ctx) {
			if (!this.ratioOptions.canvasPositioning) {
				ctx.fillText(text, x, y);
				return this;
			}

			const size = this.getCanvasSize();
			const ratio = this.pixelRatio(size);
			const metrics = this.ratioOptions.canvasPositioning(ratio, x, y);

			ctx.fillText.apply(ctx, [text, ...metrics] as [string, number, number]);
			return this;
		}
		return this;
	}

	moveTo(x: number, y: number) {
		const { ctx } = this;
		if (ctx) {
			if (!this.ratioOptions.canvasPositioning) {
				ctx.moveTo(x, y);
				return this;
			}
			const metrics = this.ratioOptions.canvasPositioning(
				this.pixelRatio(this.getCanvasSize()),
				x,
				y
			);

			ctx.moveTo.apply(ctx, metrics as [number, number]);
		}
		return this;
	}
	lineTo(x: number, y: number) {
		const { ctx } = this;
		if (!ctx) {
			return this;
		}
		if (!this.ratioOptions.canvasPositioning) {
			ctx.lineTo(x, y);
			return this;
		}
		const metrics = this.ratioOptions.canvasPositioning(
			this.pixelRatio(this.getCanvasSize()),
			x,
			y
		);
		ctx.lineTo.apply(ctx, metrics as [number, number]);
		return this;
	}
	line(ppx0: number, ppy0: number, ppx1: number, ppy1: number) {
		const { ctx } = this;
		if (!ctx) {
			return this;
		}
		let px0 = ppx0;
		let py0 = ppy0;
		let px1 = ppx1;
		let py1 = ppy1;
		if (this.ratioOptions.canvasPositioning) {
			[px0, py0, px1, py1] = this.ratioOptions.canvasPositioning(
				this.pixelRatio(this.getCanvasSize()),
				ppx0,
				ppy0,
				ppx1,
				ppy1
			);
		}
		const lineWidth = this.ctx?.lineWidth || 1;
		const h = abs(py1 - py0);
		const w = abs(px1 - px0);
		const corr = round(lineWidth) % 2 ? 0.5 : 0;

		if (h > w) {
			// more vertical then horizontal
			if (px0 < px1) {
				// left to right
				ctx.moveTo(round(px0) + corr, py0);
				ctx.lineTo(round(px1) - corr, py1);
			} else if (px0 > px1) {
				// right to left
				ctx.moveTo(round(px0) - corr, py0);
				ctx.lineTo(round(px1) + corr, py1);
			} else {
				ctx.moveTo(round(px0) + corr, py0);
				ctx.lineTo(round(px1) + corr, py1);
			}
		} else {
			// more horizontal then vertical
			if (py0 < py1) {
				// top to bottom
				ctx.moveTo(round(px0), round(py0) + corr);
				ctx.lineTo(round(px1), round(py1) - corr);
			} else if (py0 > py1) {
				// bottom to top
				ctx.moveTo(round(px0), round(py0) - corr);
				ctx.lineTo(round(px1), round(py1) + corr);
			} else {
				ctx.moveTo(round(px0), round(py0) + corr);
				ctx.lineTo(round(px1), round(py1) + corr);
			}
		}
		return this;
	}
	getfontMetrics(
		fontSH: string,
		text: string
	): null | { debug: DebugFontMetrics; metrics: FontMetrics } {
		const { ctx } = this;
		if (!ctx) {
			return null;
		}
		ctx.save(); // save contexts
		ctx.font = fontSH;
		// get metrics from all possible baselines
		const topMetrics = metricsFrom(text, 'top', ctx);
		const middleMetrics = metricsFrom(text, 'middle', ctx);
		const baseLineMetrics = metricsFrom(text, 'alphabetic', ctx);
		const bottomLineMetrics = metricsFrom(text, 'bottom', ctx);
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

		// todo: checkout textMetics.width and (actualBoundingBoxRight-actualBoundingBoxLeft)

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
			actualDescent: botbl_actual - botbl_actualDescent,
			cellHeight: 0,
			min: 0,
			max: 0,
			aLeft: 0,
			aRight: 0,
			width: 0,
			capHeight: 0
		};

		const sorted = Object.values(metrics).sort((a, b) => a - b);
		metrics.min = sorted[0];
		metrics.max = sorted[sorted.length - 1];
		metrics.cellHeight = metrics.max - metrics.min;
		metrics.aLeft = middleMetrics.actualBoundingBoxLeft;
		metrics.aRight = middleMetrics.actualBoundingBoxRight;
		metrics.width = middleMetrics.width;
		metrics.capHeight = sorted[sorted.length - 2] - metrics.alpbbl;
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
	beginPath() {
		const { ctx } = this;
		if (ctx) {
			ctx.beginPath();
		}
		return this;
	}
	stroke() {
		const { ctx } = this;
		if (ctx) {
			ctx.stroke();
		}
		return this;
	}
	closePath() {
		const { ctx } = this;
		if (ctx) {
			ctx.closePath();
		}
		return this;
	}
}
