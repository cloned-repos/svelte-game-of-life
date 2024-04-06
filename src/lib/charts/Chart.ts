import type { Enqueue } from './Enqueue';
import { PromiseExtended } from './PromiseExtended';
import { FONT_CHECK, FONT_LOADED, FONT_LOADING, FONT_LOAD_ERROR, defaultHarnas } from './constants';
import {
	createFontShortHand,
	createObserverForCanvas,
	defaultFontOptionValues,
	eventGenerator
} from './helper';
import type {
	CanvasSize,
	CheckFont,
	CommonMsg,
	FontLoading,
	FontOptions,
	TestHarnas
} from './types';
import { systemSH } from './constants';

export default class Chart implements Enqueue<CommonMsg> {
	private rctx: CanvasRenderingContext2D | null;
	private size: CanvasSize;
	private readonly destroyObserver: ReturnType<typeof createObserverForCanvas>;
	private lastFontLoadError: null | {
		ts: number; // time in ms since epoch, when the error happened
		error: DOMException; // the Error from the browser
		font: string; // for what font-shorthand the error happened
	};

	private queue: CommonMsg[];

	private triggerProcessing: PromiseExtended<void>;

	private async run() {
		do {
			await this.triggerProcessing.promise;
			this.triggerProcessing = new PromiseExtended(false);
			if (this.rctx === null) {
				continue;
			}
			// process queue batch commands
			const batch = this.queue.splice(0);
			if (batch.length === 0) {
				continue;
			}
			this.processFontCheckEvents();
		} while (this.rctx !== null);
	}

	private processFontCheckEvents() {
		// system fonts dont need to be loaded they are assigned in the "render" phase directly to ctx.font = ...
		// document.fonts.check(..) a system font results in an error loading system fonts results in an error
		const fontCheckEventsIterator = eventGenerator<CheckFont>(
			this.queue,
			(event) => event.type === FONT_CHECK
		);

		for (const event of fontCheckEventsIterator) {
			const {
				target: { fontSH },
				remove
			} = event;
			remove();
			if (systemSH.includes(fontSH)) {
				continue;
			}

			// load fonts
			let loaded: boolean;
			const reqId = this.testHarnas.random();
			try {
				loaded = this.testHarnas.checkFonts(fontSH); // this can throw!!!
				this.enqueue({ type: FONT_LOADING, fontSH, reqId });
			} catch (err) {
				continue;
			}
			if (loaded) {
				this.enqueue({ type: FONT_LOADED, fontSH, reqId });
				continue;
			}
			this.testHarnas
				.loadFonts(fontSH)
				.then(([fontFace]) => {
					if (fontFace === undefined) {
						this.enqueue({
							type: FONT_LOAD_ERROR,
							fontSH,
							error: new DOMException(`[${fontSH}] not found`),
							reqId
						});
					} else {
						this.enqueue({ type: FONT_LOADED, fontSH, reqId });
					}
				})
				.catch((error) => {
					this.enqueue({ type: FONT_LOAD_ERROR, fontSH, error, reqId });
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

		for (const event of fontLoadEventsIterator) {
			const { remove, idx, target } = event;
			// find counterpart loaded or error with the same reqId
			const resolved = this.queue.find(
				(ev) => ev.type === FONT_LOADED && ev.reqId && ev.reqId === target.reqId
			);
		}
	}

	constructor(
		private readonly canvas: HTMLCanvasElement,
		// https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
		//  '10px sans-serif' is the default for canvas
		private readonly fontOptions?: FontOptions,
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
		const fontSH = createFontShortHand(defaultFontOptionValues(fontOptions));

		this.lastFontLoadError = null;
		this.triggerProcessing = new PromiseExtended(false);
		this.queue = [];
		this.run();
		this.enqueue({ type: FONT_CHECK, fontSH });
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
