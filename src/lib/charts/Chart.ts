import type { Enqueue } from './Enqueue';
import { PromiseExtended } from './PromiseExtended';
import { FONT_CHECK } from './constants';
import { createFontShortHand, createObserverForCanvas, defaultFontOptionValues } from './helper';
import type { CanvasSize, CommonMsg, FontOptions } from './types';

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
		while (this.triggerProcessing.isResolved === false) {
			await this.triggerProcessing.promise;
			this.triggerProcessing = new PromiseExtended(false);
			// process queue batch commands
		}
	}

	constructor(
		private readonly canvas: HTMLCanvasElement,
		// https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
		//  '10px sans-serif' is the default for canvas
		private readonly fontOptions?: FontOptions
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
		this.enqueue({ type: FONT_CHECK, fontSH });
		this.run();
	}
	public detach() {
		this.destroyObserver();
		this.rctx = null;
	}

	public getFontShortHand() {
		return createFontShortHand(defaultFontOptionValues(this.fontOptions));
	}
	public enqueue(msg: CommonMsg): void {
		// i need PromiseExtended form the node-jumbo project
		if (!this.rctx) {
			// do nothing
			return;
		}
		this.queue.push(msg);
		this.triggerProcessing.forceResolve();
	}
}
