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
	getfontMetrics,
	isCanvasSizeEqual
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
	FontLoading,
	FontOptions,
	TestHarnas
} from './types';
import { systemSH } from './constants';

const debugRender = createNS('Chart/render');

export default class Chart implements Enqueue<CommonMsg> {
	private rctx: CanvasRenderingContext2D | null;

	private size: CanvasSize;

	private readonly destroyObserver: ReturnType<typeof createObserverForCanvas>;

	private queue: ({ ts: string } & CommonMsg)[];

	private fonts: Record<string, FontOptions | FontLoadErrorPL>;

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
		this.fonts = {};

		// need to write it like this to make typscript understand "initialFonts" is defined
		if (Array.isArray(initialFonts)) {
			for (const fontOption of initialFonts) {
				const font = defaultFontOptionValues(fontOption?.font);
				const key = fontOption?.key || creatFontID(font)!; // because of the default values createFontID(..) will be ok
				this.enqueue({ type: FONT_CHANGE, font, key });
			}
		}
	}

	public async nextStep() {
		if (this.rctx === null) {
			return;
		}
		if (this.queue.length === 0) {
			return;
		}
		this.processFontChangeEvents();
		this.processFontLoadingEvents();
		//this.processChartResize();
		//this.processChartRender();
	}

	private processFontChangeEvents() {
		// system fonts dont need to be loaded they are assigned in the "render" phase directly to ctx.font = ...
		// document.fonts.check(..) a system font results in an error loading system fonts results in an error
		const fontCheckEventsIterator = eventGenerator<ChangeFont>(
			this.queue,
			(event) => event.type === FONT_CHANGE
		);

		for (const event of fontCheckEventsIterator) {
			const {
				target: { font: fontOptions, key },
				remove
			} = event;

			remove();
			const fontSH = createFontShortHand(defaultFontOptionValues(fontOptions));
			if (systemSH.find((sysf) => fontSH.includes(sysf))) {
				this.enqueue({ type: CHART_RENDER });
				continue;
			}

			// load fonts
			let loaded: boolean;
			const reqId = this.testHarnas.random();
			try {
				document.fonts.ready;
				loaded = document.fonts.check(fontSH); // this can throw!!!
				this.enqueue({ type: FONT_LOADING, font: fontOptions, reqId, key });
			} catch (err) {
				continue;
			}
			if (loaded) {
				this.enqueue({ type: FONT_LOADED, font: fontOptions, reqId, key });
				continue;
			}
			document.fonts
				.load(fontSH)
				.then(([fontFace]) => {
					if (fontFace === undefined) {
						this.enqueue({
							type: FONT_LOAD_ERROR,
							font: fontOptions,
							error: new DOMException(`[${fontSH}] not found`),
							reqId,
							key
						});
					} else {
						this.enqueue({ type: FONT_LOADED, font: fontOptions, reqId, key });
					}
				})
				.catch((error) => {
					this.enqueue({ type: FONT_LOAD_ERROR, font: fontOptions, error, reqId, key });
				});
		}
	}

	private processFontLoadingEvents() {
		// system fonts dont need to be loaded they are assigned in the "render" phase directly to ctx.font = ...
		// document.fonts.load(..) a system font results in an error loading system fonts results in an error
		const fontLoadEventsIterator = eventGenerator<FontLoading>(
			this.queue,
			(event) => event.type === FONT_LOADING
		);
		let fontLoaded = false;
		for (const event of fontLoadEventsIterator) {
			const { remove, idx, target } = event;
			// find counterpart loaded or error with the same reqId
			const resolved = this.queue.findIndex(
				(ev) => ev.type === FONT_LOADED && ev.reqId && ev.reqId === target.reqId
			);
			if (resolved > -1) {
				this.queue.splice(resolved, 1);
				remove();
				fontLoaded = true;
				this.fontOptions = target.font;
			} else {
				const rejected = this.queue.findIndex(
					(ev) => ev.type === FONT_LOAD_ERROR && ev.reqId && ev.reqId === target.reqId
				);
				if (rejected > -1) {
					const fontLoadError = this.queue[rejected] as FontLoadError;
					this.queue.splice(resolved, 1);
					remove();
					this.lastFontLoadError = { ...fontLoadError, ts: this.testHarnas.Date.now() };
				}
			}
		}
		if (fontLoaded) {
			if (this.queue.length && this.queue[this.queue.length - 1].type === CHART_RENDER) {
				return;
			}
			this.enqueue({ type: CHART_RENDER });
		}
	}

	private processChartResize() {
		let resizeMsg: ChangeSize | null = null;
		let i = this.queue.length - 1;
		for (; i >= 0 && i < this.queue.length; i--) {
			const msg = this.queue[i];
			if (msg.type === CHANGE_SIZE) {
				if (!resizeMsg) {
					resizeMsg = msg;
				}
				this.queue.splice(i, 1);
			}
		}
		if (!resizeMsg) {
			return; // nothing to be done
		}
		if (isCanvasSizeEqual(this.size, resizeMsg.size)) {
			return;
		}
		this.size = resizeMsg.size;
		this.rctx!.canvas.width = resizeMsg.size.physicalPixelWidth;
		this.rctx!.canvas.height = resizeMsg.size.physicalPixelHeight;
		if (this.queue.length && this.queue[this.queue.length - 1].type === CHART_RENDER) {
			return;
		}
		this.enqueue({ type: CHART_RENDER });
	}

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
		/*drawHorizontalLines(
			this.rctx,
			0,
			[
				middleBaseLine,
				-metrics.topbl + middleBaseLine,
				-metrics.botbl + middleBaseLine,
				-metrics.alpbbl + middleBaseLine
			],
			this.rctx.canvas.width,
			'orange',
			4,
			4
		);
		// font ascent/descent
		drawHorizontalLines(
			this.rctx,
			0,
			[-metrics.fontAscent + middleBaseLine, -metrics.fontDescent + middleBaseLine],
			this.rctx.canvas.width,
			'purple',
			4,
			4
		);
		drawHorizontalLines(
			this.rctx,
			0,
			[-metrics.actualAscent + middleBaseLine, -metrics.actualDescent + middleBaseLine],
			this.rctx.canvas.width,
			'red',
			4,
			4
		);*/
		debugRender('**queue is currently: %o', this.queue);
		debugRender('**internal state is currently: %o', {
			fontOptions: this.fontOptions,
			size: this.size
		});
		// render chart data here
	}

	public detach() {
		this.destroyObserver();
		this.rctx = null;
	}

	public getFontShortHand() {
		return createFontShortHand(defaultFontOptionValues(this.fontOptions));
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
		return { queue: this.queue.slice(0), fo: this.fontOptions, canvas: this.size };
	}
}
function creatFontID(font: FontOptions): string | undefined {
	throw new Error('Function not implemented.');
}
