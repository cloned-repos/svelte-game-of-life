import createNS from '@mangos/debug-frontend';
import type { Enqueue } from './Enqueue';
import { PromiseExtended } from './PromiseExtended';
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
	drawText,
	eventGenerator,
	getfontMetrics,
	isCanvasSizeEqual
} from './helper';
import type {
	CanvasSize,
	ChangeFont,
	ChangeSize,
	CheckFont,
	CommonMsg,
	FontLoadError,
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
	private lastFontLoadError: null | {
		ts: number; // time in ms since epoch, when the error happened
		error: DOMException; // the Error from the browser
		font: FontOptions; // for what font-shorthand the error happened
	};

	private queue: (CommonMsg | CheckFont)[];

	private triggerProcessing: PromiseExtended<void>;

	private async run() {
		do {
			await this.triggerProcessing.promise;
			this.triggerProcessing = new PromiseExtended(false);
			if (this.rctx === null) {
				continue;
			}
			// process queue batch commands

			if (this.queue.length === 0) {
				continue;
			}
			this.processFontChangeEvents();
			this.processFontLoadingEvents();
			this.processChartResize();
			this.processChartRender();
		} while (this.rctx !== null);
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
				target: { fontOptions },
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
				this.enqueue({ type: FONT_LOADING, font: fontOptions, reqId });
			} catch (err) {
				continue;
			}
			if (loaded) {
				this.enqueue({ type: FONT_LOADED, font: fontOptions, reqId });
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
							reqId
						});
					} else {
						this.enqueue({ type: FONT_LOADED, font: fontOptions, reqId });
					}
				})
				.catch((error) => {
					this.enqueue({ type: FONT_LOAD_ERROR, font: fontOptions, error, reqId });
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

		const fontSH = createFontShortHand(defaultFontOptionValues(this.fontOptions));
		const {
			// cellHeights?
			baselines,
			ascents,
			descents,
			midbl_all
		} = getfontMetrics(this.rctx, fontSH);
		// select max emHeight
		console.log({ midbl_all, baselines, ascents, descents });

		return;
		/*
		let maxHeightIdx = 0;
		for (let i = 1; i < 3; i++) {
			if (heights[i] > heights[maxHeightIdx]) {
				maxHeightIdx = i;
			}
		}
		const maxHeight = heights[maxHeightIdx];
		let above = 0;
		let below = 0;
		switch (maxHeightIdx) {
			case 0:
				above = baselines.top.alphbl_2_topbl_from_actual_ascent;
				below = baselines.bottom.alphbl_2_midbl_from_actual_ascent;
				break;
			case 1:
				above = ascents.font.alphabetic;
				below = descents.font.alphabetic;
				break;
			case 2:
			default:
				above = ascents.actual.alphabetic;
				below = descents.actual.alphabetic;
		}
		debugRender('render/selected: %s', maxHeightIdx);
		debugRender('above %s', above);
		debugRender('below %s', below);
		debugRender('max cellHeight: %s', maxHeight);
		const canvasHeight = this.rctx.canvas.height;
		const max = Math.max;
		const textBaseLineMiddle =
			// the - 20 off the end is not put the lines on the canvas boundery but give it a small padding to check the
			// visual calculations are in fact correct
			canvasHeight - max(actualDescent + middle, fontDescent + middle, bottom + middle) - 20;

		const _fontAscent = textBaseLineMiddle - (fontAscent - middle);
		const _actualAscent = textBaseLineMiddle - (actualAscent - middle);
		const _fontDescent = textBaseLineMiddle + (fontDescent + middle);
		const _actualDescent = textBaseLineMiddle + (actualDescent + middle);
		const _topBaseLine = textBaseLineMiddle - (top - middle);
		const _alphaBeticLine = textBaseLineMiddle + middle;

		// lets draw
		clear(this.rctx);

		drawText(
			this.rctx,
			textsampleForMetrics,
			'black',
			fontSH,
			40,
			textBaseLineMiddle,
			'middle'
		);

		// draw FontAscent orange
		drawHorizontalLine(this.rctx, 0, _fontAscent, this.rctx.canvas.width, 'red', 50, 25);
		// draw ActualAscent red
		drawHorizontalLine(this.rctx, 0, _actualAscent, this.rctx.canvas.width, 'black', 10, 10);

		// draw "top base line"
		drawHorizontalLine(
			this.rctx,
			0,
			_topBaseLine,
			this.rctx.canvas.width,
			'rgba(255,0,255, 0.5)'
		);

		// draw "middle base line" in black
		drawHorizontalLine(
			this.rctx,
			0,
			textBaseLineMiddle,
			this.rctx.canvas.width,
			'rgba(0,0,0, 0.5)'
		);

		// draw "alphabetic base line" in pink
		drawHorizontalLine(
			this.rctx,
			0,
			_alphaBeticLine,
			this.rctx.canvas.width,
			'rgb(248, 131, 121)'
		);

		// draw FontDescent in orange
		drawHorizontalLine(this.rctx, 0, _fontDescent, this.rctx.canvas.width, 'red', 10, 10);
		// draw actualDescent in red
		drawHorizontalLine(this.rctx, 0, _actualDescent, this.rctx.canvas.width, 'black', 5, 5);

		debugRender('**queue is currently: %o', this.queue);
		debugRender('**internal state is currently: %o', {
			fontOptions: this.fontOptions,
			size: this.size
		});
		// render chart data here

		*/
	}

	constructor(
		private readonly canvas: HTMLCanvasElement,
		// https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
		//  '10px sans-serif' is the default for canvas
		private fontOptions?: FontOptions,
		private readonly testHarnas: TestHarnas = defaultHarnas
	) {
		this.rctx = canvas.getContext('2d', {
			desynchronized: true,
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
		this.lastFontLoadError = null;
		this.triggerProcessing = new PromiseExtended(false);
		this.queue = [];
		this.run();
		this.enqueue({ type: FONT_CHANGE, fontOptions: defaultFontOptionValues(fontOptions) });
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
		this.queue.push(msg);
		this.triggerProcessing.forceResolve();
	}
}
