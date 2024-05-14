import createNS from '@mangos/debug-frontend';
import type { Enqueue } from './Enqueue';
import {
	CHANGE_SIZE,
	CHART_RENDER,
	FONT_CHANGE,
	FONT_LOADED,
	FONT_LOADING,
	FONT_LOAD_ERROR,
	canonicalText,
	defaultHarnas
} from './constants';
import {
	createFontShortHand,
	createObserverForCanvas,
	createSizer,
	defaultFontOptionValues,
	deviceCssPxRatio,
	drawHorizontalLine,
	drawHorizontalLines,
	drawText,
	fontSafeCheck,
	isCanvasSizeEqual,
	isFontLoadErrorPL,
	selectFont,
	updateStatistics
} from './helper';
import type {
	CanvasSize,
	ChangeFont,
	ChangeSize,
	ChartDebugInfo,
	ChartFontInfo,
	CommonMsg,
	Font,
	FontKey,
	FontLoadError,
	FontLoadErrorPL,
	FontLoaded,
	FontLoading,
	FontOptions,
	GenericFontFamilies,
	TestHarnas,
	Waits
} from './types';
import { systemSH } from './constants';
import { draw } from 'svelte/transition';
import Context from './Context';

const debugRender = createNS('Chart/render');

export default class Chart implements Enqueue<CommonMsg> {
	private ctx: Context;

	private size: CanvasSize;

	private readonly destroyObserver: ReturnType<typeof createObserverForCanvas>;

	private readonly queue: ({ ts: string } & CommonMsg)[];

	private readonly fonts: ChartFontInfo;

	private readonly waits: Waits;

	private cancelAnimationFrame: number;

	constructor(
		private readonly canvas: HTMLCanvasElement,
		fallback: GenericFontFamilies,
		// https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
		//  '10px sans-serif' is the default for canvas
		initialFonts?: (FontKey & Font)[],
		private readonly testHarnas: TestHarnas = defaultHarnas
	) {
		this.ctx = new Context(canvas);
		const csc = getComputedStyle(canvas);
		this.size = {
			physicalPixelHeight: canvas.height,
			physicalPixelWidth: canvas.width,
			width: parseFloat(csc.width),
			height: parseFloat(csc.height)
		};
		this.destroyObserver = createObserverForCanvas(canvas, this);
		this.queue = [];
		this.fonts = Object.assign(Object.create(null), { fallback });
		this.waits = Object.assign(Object.create(null), { fontLoadTime: Object.create(null) });

		// need to write it like this to make typscript understand "initialFonts" is defined
		if (Array.isArray(initialFonts)) {
			for (const fontOption of initialFonts) {
				const font = defaultFontOptionValues(fontOption?.font);
				const key = fontOption.key;
				this.enqueue({ type: FONT_CHANGE, font, key });
			}
		}
		this.cancelAnimationFrame = 0;
		this.fonts.fallback = fallback;
	}

	processFontChangeEvents() {
		// system fonts dont need to be loaded they are assigned in the "render" phase directly to ctx.font = ...
		// document.fonts.check(..) a system font results in an error loading system fonts results in an error
		const toDelete: ChangeFont[] = [];
		const completed: ChangeFont[] = [];
		const invlalidFontSH: FontLoadError[] = [];
		const nextStep: FontLoading[] = [];
		const ts = new this.testHarnas.Date().toISOString();
		this.queue.forEach((evt, i, arr) => {
			if (evt.type !== FONT_CHANGE) {
				return;
			}
			toDelete.push(evt);
			const fontSH = createFontShortHand(defaultFontOptionValues(evt.font))!;
			// are you trying to use one of the system fonts
			if (systemSH.find((sysf) => fontSH.includes(sysf))) {
				completed.push(evt);
				return;
			}
			const loaded = fontSafeCheck(fontSH);
			if (loaded === null) {
				invlalidFontSH.push({
					type: FONT_LOAD_ERROR,
					ts,
					error: new DOMException(`invalid font shorthand: ${fontSH}`),
					reqId: 0,
					key: evt.key,
					font: evt.font
				});
				return;
			}
			nextStep.push({
				type: FONT_LOADING,
				key: evt.key,
				font: evt.font,
				reqId: this.testHarnas.random()
			});
			//
		});
		for (let i = 0, walking = 0; i < toDelete.length; i++) {
			// indexOf is only interested in object reference not the type
			walking = this.queue.indexOf(toDelete[i] as any, walking);
			this.queue.splice(walking, 1);
		}
		invlalidFontSH.forEach((evt) => {
			this.fonts[`fo${evt.key}`] = { font: evt.font, error: evt.error, ts: evt.ts };
		});
		completed.forEach((evt) => {
			this.fonts[`fo${evt.key}`] = { ...evt.font };
		});
		nextStep.forEach((evt) => {
			const reqId = this.testHarnas.random();
			this.queue.push({
				type: FONT_LOADING,
				reqId,
				ts,
				key: evt.key,
				font: evt.font
			});
		});
	}

	processFontLoadingEvents() {
		const toDelete: FontLoading[] = [];

		this.queue.forEach((evt, i, arr) => {
			if (evt.type !== FONT_LOADING) {
				return;
			}
			toDelete.push(evt);
			const fontSH = createFontShortHand(defaultFontOptionValues(evt.font))!;
			const start = new this.testHarnas.Date(evt.ts);
			document.fonts
				.load(fontSH)
				.then((faces: FontFace[]) => {
					const end = new this.testHarnas.Date();
					updateStatistics(this.waits, 'fontLoadTime', start.valueOf(), end.valueOf());
					console.log('font loaded', evt.font);
					this.queue.push({
						type: FONT_LOADED,
						font: evt.font,
						ts: end.toISOString(),
						reqId: evt.reqId,
						key: evt.key
					});
				})
				.catch((err) => {
					const end = new this.testHarnas.Date();
					updateStatistics(
						this.waits,
						'fontloadErrorTime',
						start.valueOf(),
						end.valueOf()
					);
					this.queue.push({
						type: FONT_LOAD_ERROR,
						font: evt.font,
						error: new DOMException(err.message),
						ts: end.toISOString(),
						reqId: evt.reqId,
						key: evt.key
					});
				});
		});
		for (let i = 0, walking = 0; i < toDelete.length; i++) {
			// indexOf is only interested in object reference not the type
			walking = this.queue.indexOf(toDelete[i] as any, walking);
			this.queue.splice(walking, 1);
		}
	}

	processFontLoadResultEvents() {
		let renderFlag = false;
		for (let i = 0; i < this.queue.length; ) {
			const evt = this.queue[i];
			if (!(evt.type === FONT_LOAD_ERROR || evt.type === FONT_LOADED)) {
				i++;
				continue;
			}
			if (!this.fonts[`fo${evt.key}`]) {
				if (evt.type === FONT_LOAD_ERROR) {
					const errPL: FontLoadErrorPL = { font: evt.font, ts: evt.ts, error: evt.error };
					this.fonts[`fo${evt.key}`] = errPL;
				} else {
					console.log('font results processed', evt.font);
					this.fonts[`fo${evt.key}`] = { ...evt.font };
					renderFlag = true;
				}
			}
			this.queue.splice(i, 1);
		}
		return renderFlag;
	}

	processChartResize() {
		// console.log('process-chart-resize');
		let last: ChangeSize | undefined;
		// delete all but the last one
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
						// we cannot use half pixel spaces at the far end of the canvas
						height: Math.trunc(event.size.height),
						width: Math.trunc(event.size.width)
					};
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
			this.processFontChangeEvents();
			this.processFontLoadingEvents();
			const rc1 = this.processFontLoadResultEvents();
			const rc2 = this.processChartResize();
			if (rc1) {
				console.log('because font loading');
			}
			if (rc2) {
				console.log('because size change');
			}
			if (rc1 || rc2) {
				// const event = new CustomEvent('debug-on-render', { detail: this.getInfo() });
				// this.canvas.dispatchEvent(event);
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
		const { size, ctx, canvas } = this;

		ctx.setSize(size.physicalPixelWidth, size.physicalPixelHeight);
		const ratio = devicePixelRatio;

		// 20px from the bottom
		const fhAxe = selectFont(this.fonts, 'fohAxe');
		const fontSH = createFontShortHand(defaultFontOptionValues(fhAxe));
		const { metrics, debug } = ctx.getfontMetrics(fontSH, canonicalText) || {};
		if (!metrics) {
			return;
		}
		if (!debug) {
			// do nothing
			return;
		}

		// console.log({ ratio, metrics, debug, size });
		const { topbl, alpbbl, botbl, actualDescent, actualAscent } = metrics;

		const middlebl = 20;

		ctx.beginPath()
			.setLineWidth(1)
			.strokeStyle('red')
			.line(1, 2, 12, 2)
			.line(1, 4, 12, 4)
			.setLineWidth(0.5)
			.line(0, 8, 9, 8)
			.stroke()
			.closePath();

		//
		ctx.beginPath()
			.setLineWidth(1)
			.strokeStyle('red')
			.line(10, 8, 10, 18)
			.line(15, 8, 15, 18)
			.line(25, 8, 25, 18)
			.stroke()
			.closePath()
			.beginPath()
			.strokeStyle('orange')
			.line(26, 8, 26, 18)
			.line(27, 8, 27, 18)
			.line(28, 8, 28, 18)
			.line(29, 8, 35, 18)
			.line(36, 8, 50, 18)
			.line(52, 17, 65, 8)
			.line(66, 18, 66, 8)
			.line(67, 18, 67, 8)
			.textBaseLine('middle')
			.fillStyle('orange')
			.font(fontSH)
			.fillText(canonicalText, 75, middlebl)
			.stroke()
			.closePath()
			.beginPath()
			.strokeStyle('rgba(0,0,0,0.3)')
			.line(75, topbl, 115, topbl)
			.stroke()
			.closePath()
			.beginPath()
			.strokeStyle('rgba(0,0,255,0.05)')
			.line(75 - metrics.aLeft, topbl, 75 - metrics.aLeft, topbl + 40)
			.line(75 + metrics.aRight, topbl, 75 + metrics.aRight, topbl + 40)
			.stroke()
			.closePath()
			.beginPath()
			.strokeStyle('rgba(0,0,0,0.6)')
			.line(75 + metrics.width, topbl + 20, 75 + metrics.width, topbl + 40)
			.stroke()
			.beginPath()
			.strokeStyle('rgba(255,0,0,0.5)')
			.line(70, middlebl - topbl, 110, middlebl - topbl)
			.line(70, middlebl, 110, middlebl)
			.line(70, middlebl - alpbbl, 110, middlebl - alpbbl)
			.line(70, middlebl - botbl, 110, middlebl - botbl)
			.stroke()
			.closePath()
			.beginPath()
			.strokeStyle('rgba(0,255,0,1)')
			.line(70, middlebl - actualAscent, 110, middlebl - actualAscent)
			.line(70, middlebl - actualDescent, 110, middlebl - actualDescent)
			.stroke()
			.closePath();
	}

	public destroy() {
		this.destroyObserver();
	}

	// note, enqueue can only happen if the Chart instance is connected to the canvas and can receive events
	public enqueue(msg: CommonMsg): void {
		(msg as { ts: string }).ts = new this.testHarnas.Date().toISOString();
		this.queue.push(msg as CommonMsg & { ts: string });
	}

	public getInfo(): ChartDebugInfo {
		return {
			queue: this.queue.slice(0),
			fonts: this.fonts,
			canvasSize: this.size,
			waits: this.waits
		};
	}
}
