import { abs, max, min, round, trunc } from './helper';

export default class Context {
	private ctx: CanvasRenderingContext2D | null;
	constructor(private readonly canvas: HTMLCanvasElement) {
		this.ctx = canvas.getContext('2d');
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
				return;
			}
		}
		if (width !== w && height != h) {
			canvas.width = w;
			canvas.width = h;
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
	lineWidth(w: number) {
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
		let x1 = 0;
		let x0 = 0;
		let y1 = 0;
		let y0 = 0;
		const { ctx } = this;
		if (!ctx) {
			return this;
		}
		let xset = false;
		let yset = false;
		if (abs(px0 - px1) < 1) {
			x1 = round(min(px0,px1));
			x0 = round(px1);
			xset = true;
		}
		if (abs(y0 - y1) < 1) {
			// horizontal line
			y1 = round(min(py1, py1));
			y0 = round(py1);
			yset = true;
		}
		if (x1 === x0 && y1 === y0) {
			return this; // nothing to draw
		}
		if (x1 === x0) {
			// vertical line
			return this.fillRect(x0, y0, max(ctx.lineWidth, 1)), round(y1 - y0));
		}
		if (y1 === y0) {
			// horizontal line
			return this.fillRect(round(x0), round(y0), max(ctx.lineWidth, 1), round(y1 - y0));
		}
		/*
           

		*/
		if (x1 > x0) {
			x0 = round(x0 + 0.5);
		}
		const minX = x0 > x1 ? x0 : x1;
		const minY;
	}
}
