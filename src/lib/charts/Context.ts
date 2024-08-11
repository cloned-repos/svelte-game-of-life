import {
	abs,
	round,
	trunc
} from './helper';
import type { CanvasSize, DeviceRatioAffectOptions } from './types';

export default class Context {
	private ctx: CanvasRenderingContext2D | null;
	constructor(
		private readonly canvas: HTMLCanvasElement,
		private readonly pixelRatio: (size?: CanvasSize) => number,
		private readonly ratioOptions: DeviceRatioAffectOptions
	) {
		this.ctx = this.createContext();
	}
	createContext(){
		this.ctx = this.canvas.getContext('2d', {
			willReadFrequently: true,
			alpha: true
		})!;
		return this.ctx;
	}
	getCtx() {
		return this.ctx;
	}
	getSizes(): CanvasSize {
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
	setSize(devicePixelWidth: number, devicePixelHeight: number) {
		const {
			ctx,
			canvas: { width, height },
			canvas
		} = this;
		if (ctx === null) {
			return this;
		}
		const w = trunc(devicePixelWidth);
		const h = trunc(devicePixelHeight);
	    if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		} else {
			// why should this happen w and h have not changed
			// a rerender is not always triggered by a canvas resize
			// in this case we need to clear out the canvas or we draw over previous information
			// in this render cycle
			ctx.clearRect(0, 0, w, h);
		}
		return this;
	}
	fillStyle(style: string | CanvasGradient | CanvasPattern) {
		if (this.ctx) {
			this.ctx.fillStyle = style;
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
			w0 = this.ratioOptions.lineWidth(this.pixelRatio(this.getSizes()), w);
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
	fillRect(x: number, y: number, w: number, h: number) {
		const { ctx } = this;
		if (ctx) {
			if (this.ratioOptions.canvasPositioning) {
				const metrics = this.ratioOptions.canvasPositioning(
					this.pixelRatio(this.getSizes()),
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
	moveTo(x: number, y: number, withRatio = true) {
		const { ctx } = this;
		if (!ctx) {
			return this;
		}
		if (withRatio && this.ratioOptions.canvasPositioning) {
			const metrics = this.ratioOptions.canvasPositioning(
				this.pixelRatio(this.getSizes()),
				x,
				y
			);
			ctx.moveTo.apply(ctx, metrics as [number, number]);
		}
		ctx.moveTo(x, y);
		return this;
	}
	lineTo(x: number, y: number, withRatio = true) {
		const { ctx } = this;
		if (!ctx) {
			return this;
		}
		if (!(withRatio && this.ratioOptions.canvasPositioning)) {
			ctx.lineTo(x, y);
			return this;
		}
		const metrics = this.ratioOptions.canvasPositioning(
			this.pixelRatio(this.getSizes()),
			x,
			y
		);
		ctx.lineTo.apply(ctx, metrics as [number, number]);
		return this;
	}
	lreal(ppx0: number, ppy0: number, ppx1: number, ppy1: number, withRatio = true) {
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
				this.pixelRatio(this.getSizes()),
				ppx0,
				ppy0,
				ppx1,
				ppy1
			);
		}
		const lineWidth = this.ctx?.lineWidth || 1;
		const h = abs(py1 - py0);
		const w = abs(px1 - px0);
		ctx.moveTo(px0, py0);
		ctx.lineTo(px1, py1);
		return this;
	}
	line(ppx0: number, ppy0: number, ppx1: number, ppy1: number, withRatio = true) {
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
				this.pixelRatio(this.getSizes()),
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
				ctx.moveTo(round(px0) + corr, round(py0));
				ctx.lineTo(round(px1) - corr, round(py1));
			} else if (px0 > px1) {
				// right to left
				ctx.moveTo(round(px0) - corr, round(py0));
				ctx.lineTo(round(px1) + corr, round(py1));
			} else {
				ctx.moveTo(round(px0) + corr, round(py0));
				ctx.lineTo(round(px1) + corr, round(py1));
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
	
	setLineDash(dots: number[]): this {
		const { ctx } = this;
		if (!ctx) {
			return this;
		}
		ctx.setLineDash(dots);
		return this;
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
	fill() {
		const { ctx } = this;
		if (ctx) {
			ctx.fill();
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

	save() {
		const { ctx } = this;
		if (ctx) {
			ctx.save();
		}
		return this;
	}
	restore() {
		const { ctx } = this;
		if (ctx) {
			ctx.restore();
		}
		return this;
	}
}
