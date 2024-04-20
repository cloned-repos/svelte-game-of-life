import createNS from '@mangos/debug-frontend';
import type { Enqueue } from './Enqueue';
import {
	CHANGE_SIZE,
	CHART_RENDER,
	FONT_CHANGE,
	FONT_LOADED,
	FONT_LOADING,
	FONT_LOAD_ERROR,
	defaultHarnas,
	textsampleForMetrics
} from './constants';
import {
	cleanUpChartRenderMsgs,
	clear,
	createFontShortHand,
	createObserverForCanvas,
	defaultFontOptionValues,
	drawHorizontalLine,
	drawHorizontalLines,
	drawText,
	eventGenerator,
	fontSafeCheck,
	getfontMetrics,
	isCanvasSizeEqual,
	updateStatistics
} from './helper';
import type {
	CanvasSize,
	ChangeFont,
	ChangeSize,
	CommonMsg,
	Font,
	FontKey,
	FontLoadError,
	FontLoadErrorPL,
	FontLoaded,
	FontLoading,
	FontOptions,
	TestHarnas,
	Waits
} from './types';
import { systemSH } from './constants';

const debugRender = createNS('Chart/render');

export default class Chart implements Enqueue<CommonMsg> {
	private rctx: CanvasRenderingContext2D | null;

	private size: CanvasSize;

	private readonly destroyObserver: ReturnType<typeof createObserverForCanvas>;

	private queue: ({ ts: string } & CommonMsg)[];

	private fonts: Record<string, FontOptions | FontLoadErrorPL>;

	private waits: Waits;

	constructor(
		private readonly canvas: HTMLCanvasElement,
		// https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
		//  '10px sans-serif' is the default for canvas
		initialFonts?: (FontKey & Font)[],
		private readonly testHarnas: TestHarnas = defaultHarnas
	) {
		this.rctx = canvas.getContext('2d', {
			willReadFrequently: true,
			alpha: true
		})!;
		const csc = getComputedStyle(canvas);
		this.size = {
			physicalPixelHeight: canvas.height,
			physicalPixelWidth: canvas.width,
			width: parseFloat(csc.width),
			height: parseFloat(csc.height)
		};
		this.destroyObserver = createObserverForCanvas(canvas, this);
		this.queue = [];
		this.fonts = Object.create(null);
		this.waits = Object.assign(Object.create(null), { fontLoadTime: Object.create(null) });

		// need to write it like this to make typscript understand "initialFonts" is defined
		if (Array.isArray(initialFonts)) {
			for (const fontOption of initialFonts) {
				const font = defaultFontOptionValues(fontOption?.font);
				const key = fontOption?.key || creatFontID(font)!; // because of the default values createFontID(..) will be ok
				this.enqueue({ type: FONT_CHANGE, font, key });
			}
		}
	}

	/*public async nextStep() {
		if (this.rctx === null) {
			return;
		}
		if (this.queue.length === 0) {
			return;
		}
		//this.processFontChangeEvents();
		//this.processFontLoadingEvents();
		//this.processChartResize();
		//this.processChartRender();
	}
	*/

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
			this.fonts[evt.key] = { font: evt.font, error: evt.error, ts: evt.ts };
		});
		completed.forEach((evt) => {
			this.fonts[evt.key] = { ...evt.font };
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
		const toDelete: (FontLoaded | FontLoadError)[] = [];
		this.queue.forEach((evt) => {
			if (!(evt.type === FONT_LOAD_ERROR || evt.type === FONT_LOADED)) {
				return;
			}
			if (evt.type === FONT_LOAD_ERROR) {
				const errPL: FontLoadErrorPL = { font: evt.font, ts: evt.ts, error: evt.error };
				this.fonts[evt.key] = errPL;
			} else {
				this.fonts[evt.key] = { ...evt.font };
			}
			toDelete.push(evt);
			return;
		});
		for (let i = 0, walking = 0; i < toDelete.length; i++) {
			// indexOf is only interested in object reference not the type
			walking = this.queue.indexOf(toDelete[i] as any, walking);
			this.queue.splice(walking, 1);
		}
	}

	processChartResize() {
		const toDelete: ChangeSize[] = [];
		this.queue.forEach((evt) => {
			if (!(evt.type === CHANGE_SIZE)) {
				return;
			}
			toDelete.push(evt);
		});
		// delete all but the last one
		const last = toDelete[toDelete.length - 1];
		const length = toDelete.length + (isCanvasSizeEqual(last.size, this.size) ? 0 : -1);
		for (let i = 0, walking = 0; i < length; i++) {
			// indexOf is only interested in object reference not the type
			walking = this.queue.indexOf(toDelete[i] as any, walking);
			this.queue.splice(walking, 1);
		}
	}

	/*
	private processChartRender() {
		// clean up all chart render command except the last one
		if (false === cleanUpChartRenderMsgs(this.queue)) {
			// nothing to do
			return;
		}
		if (!this.rctx) {
			return;
		}
		//  here the rendering happens
		// after font loading the font here is assigned

		const fontSH = createFontShortHand(defaultFontOptionValues(this.fontOptions!));
		const {
			// cellHeights?
			metrics,
			debug
		} = getfontMetrics(this.rctx, fontSH);
		// select max emHeight
		const sorted = Object.values(metrics)
			.sort((a, b) => a - b)
			.reverse();
		console.log({ sorted });
		const min = sorted.slice(-1)[0];
		console.log(min);
		console.log({ metrics, debug });
		const bottomPadding = 20;

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
	}
	*/

	public detach() {
		this.destroyObserver();
		this.rctx = null;
	}

	// note, enqueue can only happen if the Chart instance is connected to the canvas and can receive events
	public enqueue(msg: CommonMsg): void {
		// this.rctx === null, only if the Chart instance is disconnected because the canvas was destroyed by svelte
		if (!this.rctx) {
			// do nothing
			return;
		}
		(msg as any).ts = new this.testHarnas.Date().toISOString();
		this.queue.push(msg as any);
	}

	public getQueue() {
		return {
			queue: this.queue.slice(0),
			fonts: this.fonts,
			canvasSize: this.size,
			waits: this.waits
		};
	}
}
function creatFontID(font: FontOptions): string | undefined {
	throw new Error('Function not implemented.');
}
