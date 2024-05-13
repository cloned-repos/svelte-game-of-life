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
		const { topbl, alpbbl, botbl } = metrics;

		ctx.beginPath().setLineWidth(1).strokeStyle('red').line(0, 0, 12, 0).stroke().closePath();

		/*
		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(1, 2);
		rctx.lineTo(12, 2);
		rctx.strokeStyle = 'red';
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(1, 4.5);
		rctx.lineTo(12, 4.5);
		rctx.strokeStyle = 'red';
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 0.5;
		rctx.moveTo(0.5, 8.5);
		rctx.lineTo(9.5, 8.5);
		rctx.strokeStyle = 'red';
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(10, 8.5);
		rctx.lineTo(10, 18.5);
		rctx.strokeStyle = 'red';
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(15.5, 8.5);
		rctx.lineTo(15.5, 18.5);
		rctx.strokeStyle = 'red';
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(25, 8.0);
		rctx.strokeStyle = 'red';
		rctx.fillStyle = 'red';
		rctx.fillRect(25, 8, 1, 10);
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(26, 8.0);
		rctx.strokeStyle = 'orange';
		rctx.fillStyle = 'orange';
		rctx.fillRect(26, 8, 1, 10);
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(27.5, 8.0);
		rctx.strokeStyle = 'red';
		rctx.fillStyle = 'orange';
		rctx.lineTo(27.5, 18);
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(28.5, 8.0);
		rctx.strokeStyle = 'orange';
		rctx.fillStyle = 'orange';
		rctx.lineTo(28.5, 18);
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(29.5, 8.0);
		rctx.strokeStyle = 'orange';
		rctx.fillStyle = 'orange';
		rctx.lineTo(35.5, 18);
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		// 50-36 = 14  18-8 = 10, so the dx > dy
		// acts more like a horizontal line, in that case y axis needs to be 0.5 and -0.5 for bpttom
		// horizontal lines dont have horizontal correction only vertical correction
		rctx.moveTo(36, 8 + 0.5); // 50-36 = 14  18-8 = 10, so the dx > dy
		rctx.strokeStyle = 'orange';
		rctx.fillStyle = 'orange';
		rctx.lineTo(50, 18 - 0.5);
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(52.5, 17.5);
		rctx.strokeStyle = 'orange';
		rctx.fillStyle = 'orange';
		rctx.lineTo(65.5, 8.5);
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(66.5, 18);
		rctx.strokeStyle = 'orange';
		rctx.fillStyle = 'orange';
		rctx.lineTo(66.5, 8);
		rctx.stroke();
		this.rctx.closePath();

		rctx.beginPath();
		this.rctx.lineWidth = 1;
		rctx.moveTo(67.5, 18);
		rctx.strokeStyle = 'red';
		rctx.fillStyle = 'orange';
		rctx.lineTo(67.5, 8);
		rctx.stroke();
		this.rctx.closePath();

		const middlebl = 20;
		rctx.beginPath();
		rctx.font = fontSH;
		rctx.textBaseline = 'middle';
		rctx.fillStyle = 'orange';

		rctx.fillText(canonicalText, 75, middlebl);
		rctx.fillStyle = 'rgba(0,0,0,0.3)';
		rctx.fillRect(75, topbl, 1, 40);
		rctx.fillStyle = 'rgba(0,0,255,0.4)';
		rctx.fillRect(75 - metrics.aLeft, topbl, 1, 40);
		rctx.fillRect(Math.round(75 + metrics.aRight - 0.5), topbl, 1, 40);
		rctx.fillStyle = 'rgba(255,0,0,0.4)';
		rctx.fillRect(Math.round(75 + metrics.width - 0.5), topbl, 1, 40);

		rctx.moveTo(70, middlebl);
		rctx.fillStyle = 'rgba(255,0,0,0.5)';
		rctx.fillRect(70, middlebl, 40, 1);
		rctx.fillRect(70, Math.round(middlebl - metrics.topbl), 40, 1);
		rctx.fillRect(70, Math.round(middlebl - metrics.alpbbl), 40, 1);
		rctx.fillRect(70, Math.round(middlebl - metrics.botbl), 40, 1);

		rctx.fillStyle = 'rgba(0,255,0,0.5)';

		rctx.fillRect(70, Math.round(middlebl - metrics.actualAscent), 40, 1);
		rctx.fillRect(70, Math.round(middlebl - metrics.actualDescent), 40, 1);

		this.rctx.closePath();

		/*
		rctx.beginPath();
		//this.rctx.lineWidth = ratio;
		rctx.moveTo(0, 5.5);
		rctx.lineTo(5, 12.5);
		rctx.strokeStyle = 'green';
		rctx.stroke();
		this.rctx.closePath();
		rctx.beginPath();
		//this.rctx.lineWidth = ratio;
		rctx.moveTo(px(20), px(0.5));
		rctx.lineTo(px(30), px(0.5));
		rctx.strokeStyle = 'red';
		rctx.stroke();
		rctx.closePath();

		//this.rctx.lineWidth = ratio;
		
		*/
		/*this.rctx.restore();
		//
		// draw baselines
		const bottomPadding = 20;
		const blMiddle = 100; // this.size.physicalPixelHeight - (metrics.cellHeight << 1);
		console.log('draw horizontal lines baselines', [topbl, alpbbl, botbl, 0, blMiddle]);
		drawHorizontalLines(
			this.rctx,
			0,
			[topbl, alpbbl, botbl, 0].map((bl) => blMiddle - bl),
			this.size.physicalPixelWidth,
			'green'
		);

		const { fontAscent, fontDescent } = metrics;
		drawHorizontalLines(
			this.rctx,
			0,
			[fontAscent, fontDescent].map((bl) => blMiddle - bl),
			this.size.physicalPixelWidth,
			'rgba(255,0,0,0.5)'
		);
		drawText(rctx, canonicalText, 'red', fontSH, 40, blMiddle, 'middle');
		/*
		const middleBaseLine = this.rctx.canvas.height - bottomPadding - -min;

		// lets draw
		clear(this.rctx);
		const redDot = 'red';
		drawText(this.rctx, textsampleForMetrics, 'black', fontSH, 40, middleBaseLine, 'middle');
		// draw all baselines in dotted red
		debugRender('**queue is currently: %o', this.queue);
		debugRender('**internal state is currently: %o', {
			fontOptions: this.fontOptions,
			size: this.size
		});
		// render chart data here
		*/
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
