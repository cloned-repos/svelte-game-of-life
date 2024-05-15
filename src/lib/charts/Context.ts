import { abs, isCanvasSizeEqual, max, metricsFrom, min, round, trunc } from './helper';
import type { DebugFontMetrics, FontMetrics } from './types';

export default class Context {
	private ctx: CanvasRenderingContext2D | null;
	constructor(private readonly canvas: HTMLCanvasElement) {
		this.ctx = canvas.getContext('2d', {
			willReadFrequently: true,
			alpha: true
		})!;
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
			ctx.font = fontSH;
		}
		return this;
	}
	setLineWidth(w: number) {
		const { ctx } = this;
		if (ctx) {
			ctx.lineWidth = w;
		}
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
			ctx.fillRect(x, y, w, h);
		}
		return this;
	}
	fillText(text: string, x: number, y: number) {
		const { ctx } = this;
		if (ctx) {
			ctx.fillText(text, x, y);
		}
		return this;
	}
	moveTo(x: number, y: number) {
		const { ctx } = this;
		if (ctx) {
			ctx.moveTo(x, y);
		}
		return this;
	}
	lineTo(x: number, y: number) {
		const { ctx } = this;
		if (ctx) {
			ctx.lineTo(x, y);
		}
		return this;
	}
	line(px0: number, py0: number, px1: number, py1: number) {
		const { ctx } = this;
		if (!ctx) {
			return this;
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
			width: 0
		};

		const sorted = Object.values(metrics).sort((a, b) => a - b);
		metrics.min = sorted[0];
		metrics.max = sorted[sorted.length - 1];
		metrics.cellHeight = metrics.max - metrics.min;
		metrics.aLeft = middleMetrics.actualBoundingBoxLeft;
		metrics.aRight = middleMetrics.actualBoundingBoxRight;
		metrics.width = middleMetrics.width;
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
