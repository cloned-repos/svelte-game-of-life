import createNS from '../../debug-frontend';
import type { Enqueue } from './Enqueue';
import {
	CHANGE_SIZE,
	FONT_CHANGE,
	FONT_LOADED,
	FONT_LOADING,
	FONT_LOAD_ERROR,
	canonicalText,
	defaultHarnas
} from './constants';
import {
	createResizeObserverForCanvas,
	defaultFontOptionValues,
	fontSafeCheck,
	isCanvasSizeEqual,
	isFontLoadErrorPL,
	selectFont,
	sumValues,
	updateStatistics
} from './helper';
import type {
	CanvasSize,
	FontChange,
	ChangeSize,
	ChartDebugInfo,
	ChartFontInfo,
	CommonMsg,
	DeviceRatioAffectOptions,
	Font,
	FontKey,
	FontLoadError,
	FontLoadErrorPL,
	FontLoading,
	GenericFontFamilies,
	TestHarnas,
	Waits
} from './types';
import { systemSH, fontGenericFamilies } from './constants';
import Context from './Context';
import BaseRenderer from './BaseRenderer';
import Harnas from '$lib/Harnas';
import createGlyps from './fonts/hp1345a';

const debug = createNS('class Chart');

export default class Chart implements Enqueue<CommonMsg> {
	private ctx: Context;

	private size: CanvasSize;

	private readonly destroyObserver: ReturnType<typeof createResizeObserverForCanvas>;

	private readonly queue: ({ ts: string } & CommonMsg)[];

	private readonly fonts: ChartFontInfo;

	private readonly waits: Waits;

	private readonly baseRenderer: BaseRenderer;

	private cancelAnimationFrame: number;

	constructor(
		private readonly canvas: HTMLCanvasElement,
		private readonly fallback: GenericFontFamilies,

		// https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
		//  '10px sans-serif' is the default for canvas
		private readonly initialFonts: () => (FontKey & Font)[],
		private readonly getDeviceAspectRatio: (size?: CanvasSize) => number,
		private readonly pixelDeviceRatioAffect: DeviceRatioAffectOptions,
		private readonly testHarnas: TestHarnas = defaultHarnas
	) {
		this.ctx = new Context(canvas, getDeviceAspectRatio, pixelDeviceRatioAffect);
		this.baseRenderer = new BaseRenderer(this.ctx.getCtx(), new Harnas); 
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
		this.fonts = { fallback };
		this.waits = { fontLoadTime: {}, fontloadErrorTime: {} };

		const fonts = this.initialFonts();

		for (const fontOption of fonts) {
			const font = defaultFontOptionValues(fontOption?.font);
			const key = fontOption.key;
			this.enqueue({ type: FONT_CHANGE, font, key });
		}
		this.cancelAnimationFrame = 0;
		const font = createGlyps();
		console.log(font);
	}

	processFontChangeEvents() {
		// system fonts dont need to be loaded they are assigned in the "render" phase directly to ctx.font = ...
		// document.fonts.check(..) a system font results in an error loading system fonts results in an error
		const completed: FontChange[] = [];
		const invlalidFontSH: FontLoadError[] = [];
		const nextStep: FontLoading[] = [];
		const ts = new this.testHarnas.Date().toISOString();
		for (let i = 0; i < this.queue.length; ) {
			const evt = this.queue[i];
			if (evt.type !== FONT_CHANGE) {
				i++;
				continue;
			}
			this.queue.splice(i, 1);
			const defaulted = defaultFontOptionValues(evt.font);
			const familySearchName = evt.font.family.toLowerCase();
			if (
				systemSH.find((sysf) => sysf === familySearchName) ||
				fontGenericFamilies.find((gff) => gff === familySearchName)
			) {
				completed.push(evt);
				continue;
			}
			const fontSH = this.ctx.createFontShortHand(defaulted);
			debug('/processFontChangeEvents, [fontSH]=[%s]', fontSH);
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
				continue;
			}
			nextStep.push({
				type: FONT_LOADING,
				key: evt.key,
				font: evt.font,
				reqId: this.testHarnas.random()
			});
		}
		invlalidFontSH.forEach((evt) => {
			this.fonts[`fo${evt.key}`] = { font: evt.font, error: evt.error, ts: evt.ts };
		});
		completed.forEach((evt) => {
			const fontSH = this.ctx.createFontShortHand(defaultFontOptionValues(evt.font));
			const metrics = this.ctx.getfontMetrics(fontSH, canonicalText);
			this.fonts[`fo${evt.key}`] = {
				...evt.font,
				...(metrics && { metrics })
			};
		});
		nextStep.forEach((evt) => {
			const reqId = this.testHarnas.random();
			//
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
		for (let i = 0; i < this.queue.length; ) {
			const evt = this.queue[i];
			if (evt.type !== FONT_LOADING) {
				i++;
				continue;
			}
			this.queue.splice(i, 1);
			const fontSH = this.ctx.createFontShortHand(defaultFontOptionValues(evt.font))!;
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
					const fontSH = this.ctx.createFontShortHand(defaultFontOptionValues(evt.font));
					const metrics = this.ctx.getfontMetrics(fontSH, canonicalText);
					this.fonts[`fo${evt.key}`] = {
						...evt.font,
						...(metrics && { metrics })
					};
					renderFlag = true;
				}
			}
			this.queue.splice(i, 1);
		}
		return renderFlag;
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
			this.processFontChangeEvents();
			this.processFontLoadingEvents();
			const rc1 = this.processFontLoadResultEvents();
			const rc2 = this.processChartResize();
			if (rc1) {
				debug('/syncOnAnimationFrame: render because font was loaded');
			}
			if (rc2) {
				debug('/syncOnAnimationFrame: render because canvas size changed');
			}
			if (rc1 || rc2) {
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

	private calculateXLowerAxeHeight(): number {
		const { size } = this;
		const xAxeBottom = {
			padding: 6,
			labelHeight: 12,
			LabelTickPadding: 3,
			tick: 9,
			smallTick: 3
		};
		return sumValues(xAxeBottom);
	}

	private drawAxis1() {
		const labels = ['00:00'];
		const { size, ctx, canvas } = this;
		const fhAxe = selectFont(this.fonts, 'fohAxe');
		// 16px;

		if (isFontLoadErrorPL(fhAxe)) {
			return;
		}

		ctx.beginPath().textBaseLine('middle').fillStyle('black').strokeStyle('rgba(255,0,0,0.5)');
		let xOffset = 20;
		let prevBottom = 10;
		const fontsizes = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42];
		const capHeights = [];
		const actualHeights = [];
		const fontHeights = [];
		for (let i = 0; i < fontsizes.length; i++) {
			const fs = fontsizes[i];
			const label = labels[0] + ` ${fs}px`;
			const f = structuredClone(fhAxe);
			f.size = `${fs}px`;
			const shortSH = ctx.createFontShortHand(f);
			const metrics = ctx.getfontMetrics(shortSH, label)!;
			ctx.font(shortSH);
			const {
				aux: { capHeight, cellHeightActual, cellHeightFont }
			} = metrics;
			console.log(
				'%spx -> capHeight:%s, cellHeightActual:%s, cellHeightFont:%s',
				fs,
				capHeight,
				cellHeightActual,
				cellHeightFont
			);
			capHeights.push(Number(capHeight.toFixed(2)));
			actualHeights.push(Number(cellHeightActual.toFixed(2)));
			fontHeights.push(Number(cellHeightFont.toFixed(2)));
			// here we position the font based on previous (if exists) "lineHeight" so fonts
			// 		do not draw over each other
			debug('metrics0: %o', metrics);
			const lineHeight = metrics.aux.max - metrics.aux.min;
			debug('lineHeight', lineHeight, metrics.aux.max, metrics.aux.min);
			const baseLine = metrics.aux.max + prevBottom;
			prevBottom += lineHeight * 1.2;
			ctx.fillText(label, xOffset, baseLine);
			// draw ruler
			const left = xOffset - 4;
			const right = metrics.aux.aRight;
			ctx.setLineWidth(1);
			/*
					x: number,
					align: 'right' | 'left',
					originY: number,
					maxY: number, // 0 - positive
					minY: number, // 0 - negative
					tickLength: number, // 0-3
					tickSpacing: number, // literally pixels
					tickThickness: number,
					color: string
		*/
			ctx.drawVerticalRuler(
				left,
				'left',
				baseLine,
				metrics.aux.max,
				metrics.aux.min,
				3,
				4,
				1,
				'hsla(120,60%,70%,0.5)'
			);
			ctx.stroke();
			// top base line
			ctx.setLineWidth(1);
			ctx.strokeStyle('hsl(120,60%,70%,0.5)');
			ctx.lreal(
				xOffset + metrics.aux.aLeft,
				baseLine - metrics.baselines.top,
				xOffset + metrics.aux.aRight * 0.25,
				baseLine - metrics.baselines.top
			);
			// middle base line
			ctx.setLineWidth(1);
			ctx.lreal(
				xOffset + metrics.aux.aLeft,
				baseLine,
				xOffset + metrics.aux.aRight * 0.25,
				baseLine
			)
				.stroke()
				.closePath();
			// alphabetic base line
			ctx.beginPath();
			ctx.lreal(
				xOffset + metrics.aux.aLeft,
				baseLine - metrics.baselines.alphabetic,
				xOffset + metrics.aux.aRight * 0.25,
				baseLine - metrics.baselines.alphabetic
			)
				.stroke()
				.closePath();
			// bottom base line
			ctx.beginPath();
			ctx.lreal(
				xOffset + metrics.aux.aLeft,
				baseLine - metrics.baselines.bottom,
				xOffset + metrics.aux.aRight * 0.25,
				baseLine - metrics.baselines.bottom
			)
				.stroke()
				.closePath();
			// actual ascent
			ctx.beginPath();
			ctx.strokeStyle('rgba(255, 0,0,0.2)');
			ctx.lreal(
				xOffset + metrics.aux.aLeft + metrics.aux.aRight * 0.25,
				baseLine - metrics.ascents.actual.middle,
				xOffset + metrics.aux.aRight * 0.5,
				baseLine - metrics.ascents.actual.middle
			)
				.stroke()
				.closePath();
			// actaul descent
			ctx.beginPath();
			ctx.lreal(
				xOffset + metrics.aux.aLeft + metrics.aux.aRight * 0.25,
				baseLine - metrics.descents.actual.middle,
				xOffset + metrics.aux.aRight * 0.5,
				baseLine - metrics.descents.actual.middle
			)
				.stroke()
				.closePath();
			// font ascent
			ctx.beginPath();
			ctx.strokeStyle('rgba(0,0,255,0.5)');
			ctx.lreal(
				xOffset + metrics.aux.aLeft + metrics.aux.aRight * 0.5,
				baseLine - metrics.ascents.font.middle,
				xOffset + metrics.aux.aRight * 0.75,
				baseLine - metrics.ascents.font.middle
			)
				.stroke()
				.closePath();
			// font descent
			ctx.beginPath();
			ctx.lreal(
				xOffset + metrics.aux.aLeft + metrics.aux.aRight * 0.5,
				baseLine - metrics.descents.font.middle,
				xOffset + metrics.aux.aRight * 0.75,
				baseLine - metrics.descents.font.middle
			)
				.stroke()
				.closePath();
			ctx.fill().stroke().closePath();
		}
		ctx.fill().stroke().closePath();
		console.log(`px<-c(${fontsizes.join(',')})`);
		console.log(`capH<-c(${capHeights.join(',')})`);
		console.log(`actH<-c(${actualHeights.join(',')})`);
		console.log(`fonH<-c(${fontHeights.join(',')})`);
	}

	private renderChart1() {
		const { size, ctx } = this;
		const fhAxe = selectFont(this.fonts, 'fohAxe');
		const fontSH = this.ctx.createFontShortHand(defaultFontOptionValues(fhAxe));
		const fontMetrics = ctx.getfontMetrics(fontSH, canonicalText);
		if (fontMetrics === null) {
			return;
		}

		const {
			baselines: { top, alphabetic, bottom },
			ascents: { actual: ascentsActual },
			descents: { actual: descentActual },
			aux: { aLeft, aRight, width }
		} = fontMetrics;

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
		ctx.setLineWidth(1)
			.strokeStyle('red')
			.line(10, 8, 10, 18)
			.line(15, 8, 15, 18)
			.line(25, 8, 25, 18)
			.stroke()
			.strokeStyle('orange')
			.line(26, 8, 26, 18)
			.line(27, 8, 27, 18)
			.line(28, 8, 28, 18)
			.line(29, 8, 35, 18)
			.line(36, 8, 50, 18)
			.line(52, 17, 65, 8)
			.line(66, 18, 66, 8)
			.line(67, 18, 67, 8)
			.stroke()
			.textBaseLine('middle')
			.fillStyle('black')
			.font(fontSH)
			.fillText(canonicalText, 75, middlebl)
			.beginPath()
			.strokeStyle('rgba(0,0,0,0.3)')
			.line(75, top, 115, top)
			.stroke()
			.beginPath()
			.strokeStyle('rgba(0,0,255,0.05)')
			.line(75 - aLeft, top, 75 - aLeft, top + 40)
			.line(75 + aRight, top, 75 + aRight, top + 40)
			.stroke()
			.beginPath()
			.strokeStyle('rgba(0,0,0,0.6)')
			.line(75 + width, top + 20, 75 + width, top + 40)
			.stroke()
			.beginPath()
			.strokeStyle('rgba(255,0,0,0.5)')
			.line(70, middlebl - top, 110, middlebl - top)
			.line(70, middlebl, 110, middlebl)
			.line(70, middlebl - alphabetic, 110, middlebl - alphabetic)
			.line(70, middlebl - bottom, 110, middlebl - bottom)
			.stroke()
			.beginPath()
			.strokeStyle('rgba(0,255,0,1)');

		ctx.line(70, middlebl - ascentsActual.middle, 110, middlebl - ascentsActual.middle)
			.line(70, middlebl - descentActual.middle, 110, middlebl - descentActual.middle)
			.stroke();
	}
	processChartRender() {
		const { size, ctx } = this;
		ctx.setSize(size.physicalPixelWidth, size.physicalPixelHeight);
		this.drawAxis1();
		// lets try to draw axis with ticks and labels
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
