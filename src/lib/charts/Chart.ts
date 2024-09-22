import createNS from '../../debug-frontend';
import type { Enqueue } from './Enqueue';
import { CHANGE_SIZE } from './constants';
import { createResizeObserverForCanvas, isCanvasSizeEqual } from './helper';
import type {
	CanvasSize,
	ChangeSize,
	ChartDebugInfo,
	CommonMsg,
	DeviceRatioAffectOptions
} from './types';

import Context from './Context';
import BaseRenderer from './BaseRenderer';
import { getFontMetrics, getTextMetrics } from './fonts/hp1345a';

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
		private readonly pixelDeviceRatioAffect: DeviceRatioAffectOptions
	) {
		this.ctx = new Context(canvas, getDeviceAspectRatio, pixelDeviceRatioAffect);
		this.baseRenderer = new BaseRenderer(this.ctx);
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
		this.syncOnAnimationFrame();
		const fontMetrics = getFontMetrics();
		// const textMetrics = getTextMetrics(, fontMetrics);
		debug('fontMetrics: %o', fontMetrics);
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
			canvasSize: this.size
		};
	}
}
