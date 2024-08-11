import createNS from '../../debug-frontend';
import type { Enqueue } from './Enqueue';
import {
	CHANGE_SIZE,
} from './constants';
import {
	createResizeObserverForCanvas,
	isCanvasSizeEqual,
} from './helper';
import type {
	CanvasSize,
	ChangeSize,
	ChartDebugInfo,
	CommonMsg,
	DeviceRatioAffectOptions,
} from './types';

import Context from './Context';
import BaseRenderer from './BaseRenderer';
import Harnas from '$lib/Harnas';
import createGlyps from './fonts/hp1345a';
import { isInstruction } from './fonts/hp1345a/helpers';

const debug = createNS('class Chart');

export default class Chart implements Enqueue<CommonMsg> {
	private ctx: Context;

	private size: CanvasSize;

	private readonly destroyObserver: ReturnType<typeof createResizeObserverForCanvas>;

	private readonly queue: ({ ts: string } & CommonMsg)[];

	private readonly baseRenderer: BaseRenderer;

	private cancelAnimationFrame: number;

	constructor(
		private readonly canvas: HTMLCanvasElement,

		private readonly getDeviceAspectRatio: (size?: CanvasSize) => number,
		private readonly pixelDeviceRatioAffect: DeviceRatioAffectOptions,
	) {
		this.ctx = new Context(canvas, getDeviceAspectRatio, pixelDeviceRatioAffect);
		this.baseRenderer = new BaseRenderer(this.ctx); 
		this.baseRenderer.enqueue({ type: 'st'});
		const csc = getComputedStyle(canvas);
		this.size = {
			physicalPixelHeight: canvas.height,
			physicalPixelWidth: canvas.width,
			width: parseFloat(csc.width),
			height: parseFloat(csc.height)
		};
		this.destroyObserver = createResizeObserverForCanvas(canvas, this);
		this.queue = [];
		this.cancelAnimationFrame = 0;
		const font = createGlyps();
		delete (font as any)['1'];
		// debug('our special font: [%o]', font);
		// some analysis
		let minX = NaN;
		let minY = NaN;
		let maxX = NaN;
		let maxY = NaN;
		for (const [id, glyph] of Object.entries(font)){
			// find s commands
			const findS = glyph.find(o => {
				if (isInstruction(o) && o.t === 's') {
					return true;
				}
				return false;
			});
			if (findS) {
				debug('glyph: %s, %o', id, glyph);
			}
			const xMin: number = glyph.reduce((mx: number, v) => {
				if (!isInstruction(v)) {
					return mx;
				}
				if (isNaN(mx)) {
					return v.x;
				}
				if (v.x < mx) {
					return v.x;
				}
				return mx;
			}, NaN);

			minX = isNaN(minX) ? xMin:
				   xMin < minX ? xMin: minX;
			   
			

			const xMax: number = glyph.reduce((mx: number, v) => {
				if (!isInstruction(v)) {
					return mx;
				}
				if (isNaN(mx)) {
					return v.x;
				}
				if (v.x > mx) {
					return v.x;
				}
				return mx;
			}, NaN);

			maxX = isNaN(maxX) ? xMax:
			xMax > maxX ? xMax: maxX;
			   
			

			const yMin: number = glyph.reduce((mx: number, v) => {
				if (!isInstruction(v)) {
					return mx;
				}
				if (isNaN(mx)) {
					return v.y;
				}
				if (v.y < mx) {
					return v.y;
				}
				return mx;
			}, NaN);

			minY = isNaN(minY) ? yMin:
				   yMin < minY ? yMin: minY;

			const yMax: number = glyph.reduce((mx: number, v) => {
				if (!isInstruction(v)) {
					return mx;
				}
				if (isNaN(mx)) {
					return v.y;
				}
				if (v.y > mx) {
					return v.y;
				}
				return mx;
			}, NaN);

			maxY = isNaN(maxY) ? yMax:
			yMax > maxY ? yMax: maxY;
		}
		/*
		with hp logo:
		{
			"minX": -18,
			"minY": -8,
			"maxX": 54,
			"maxY": 27
		}
		without hp logo:
			{"minX":-18,"minY":-8,"maxX":18,"maxY":23}
		*/
		debug('extrema: %o', { minX, minY, maxX, maxY })
	}

	processChartResize() {
		let last: ChangeSize | undefined;
		// process only the last entered resize instructon, the earlier ones are of no consequence
		for (let i = this.queue.length - 1; i >= 0; i--) {
			const event = this.queue[i];
			if (event.type !== CHANGE_SIZE) {
				continue;
			}
			if (!last) {
				if (!isCanvasSizeEqual(event.size, this.size)) {
					last = event;
					this.size = {
						...event.size,
						// internal usable space (in css pixels) for the chart
						height: Math.trunc(event.size.height),
						width: Math.trunc(event.size.width)
					};
					// broadcast resize events, for implementers who want to debug
					const ce = new CustomEvent('chart-resize', { detail: this.size });
					this.canvas.dispatchEvent(ce);
				}
			}
			this.queue.splice(i, 1);
		}
		return last ? true : false;
	}

	syncOnAnimationFrame() {
		if (this.cancelAnimationFrame) {
			return;
		}
		const run = (ts: number) => {
			const shouldRender = this.processChartResize();
		   	if (shouldRender) {
				debug('/syncOnAnimationFrame: render because canvas size changed');
			}
			if (shouldRender) {
				const event = new CustomEvent('debug-on-render', { detail: this.getInfo() });
				this.canvas.dispatchEvent(event);
				this.processChartRender();
			}
			if (this.cancelAnimationFrame) {
				this.cancelAnimationFrame = requestAnimationFrame(run);
			}
		};
		this.cancelAnimationFrame = requestAnimationFrame(run);
	}

	stopSyncOnAnimationFrame() {
		cancelAnimationFrame(this.cancelAnimationFrame);
		this.cancelAnimationFrame = 0;
	}

	processChartRender() {
		const { size, ctx } = this;
		ctx.setSize(size.physicalPixelWidth, size.physicalPixelHeight);
	}

	destroy() {
		this.destroyObserver();
	}

	// note, enqueue can only happen if the Chart instance is connected to the canvas and can receive events
	enqueue(msg: CommonMsg): void {
		// instructions are processon on "requestAnimationFrame"
		this.queue.push(msg as CommonMsg & { ts: string });
		
	}

	getInfo(): ChartDebugInfo {
		return {
			queue: this.queue.slice(0),
			canvasSize: this.size,
		};
	}
}
