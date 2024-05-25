import Chart from './Chart';
import type Context from './Context';
import {
	CHANGE_SIZE,
	RegExpFontSizeDevicePixel,
	RegExpFontSizeEM,
	RegExpFontSizePERCENT,
	RegExpFontSizePx,
	RegExpFontSizeREM,
	canonicalText,
	defaultPixelRatioScaleOptions,
	fontSizeAbsolute,
	fontSizeRelative,
	fontStretch,
	fontStyle,
	fontVariant,
	fontWeight
} from './constants';
import type {
	CanvasSize,
	ChartFontInfo,
	DeviceRatioAffectOptions,
	Font,
	FontKey,
	FontLoadErrorPL,
	FontOptions,
	FontSize,
	FontSizeAbsolute,
	FontSizeRelative,
	GenericFontFamilies,
	IOWaitsGroupNames,
	Waits
} from './types';

const { trunc, round, max, min, abs } = Math;
const { EPSILON } = Number;

export { trunc, round, max, min, abs, EPSILON };

export function swap([a, b]: [number, number]) {
	return [b, a];
}

// ResizeObserver for canvas
export function createResizeObserverForCanvas(canvas: HTMLCanvasElement, chart: Chart) {
	const observer = new ResizeObserver((entries) => {
		const entry = entries[0];
		const physicalPixelWidth = entry.devicePixelContentBoxSize[0].inlineSize;
		const physicalPixelHeight = entry.devicePixelContentBoxSize[0].blockSize;
		const height = entry.borderBoxSize[0].blockSize;
		const width = entry.borderBoxSize[0].inlineSize;
		// const target: HTMLCanvasElement = entry.target as HTMLCanvasElement;
		const size = { physicalPixelWidth, physicalPixelHeight, height, width };
		chart.enqueue({ type: CHANGE_SIZE, size });
	});

	observer.observe(canvas, { box: 'device-pixel-content-box' });

	return function destroy() {
		observer.disconnect();
	};
}

export function isCanvasSizeEqual(a: CanvasSize, b: CanvasSize) {
	return (
		a.height === b.height &&
		a.width == b.width &&
		a.physicalPixelHeight === b.physicalPixelHeight &&
		a.physicalPixelWidth === b.physicalPixelWidth
	);
}

export function createFontID(opt: FontOptions): string | null {
	let rc = '';
	if (fontStyle.includes(opt.style!)) {
		rc += opt.style;
	} else {
		return null;
	}
	if (opt.family) {
		rc += ' ' + opt.family;
	} else {
		return null;
	}
	return rc;
}

export function metricsFrom(
	text: string,
	baseline: CanvasTextBaseline,
	ctx: CanvasRenderingContext2D
): TextMetrics {
	ctx.save();
	ctx.textBaseline = baseline;
	const metrics = ctx.measureText(text);
	ctx.restore();
	return metrics;
}

export function createChartCreator(
	fallback: GenericFontFamilies,
	fontOptions: () => (Font & FontKey)[],
	devicePixelAspectRatio = standardDevicePixelAspectRatio,
	pixelDeviceRatio: DeviceRatioAffectOptions = defaultPixelRatioScaleOptions
) {
	let chart: Chart;
	return function (canvas?: HTMLCanvasElement) {
		if (canvas && chart) {
			throw new Error('can not add this action to multiple html tags');
		}
		if (chart) {
			return { chart };
		}
		if (!canvas) {
			throw new Error('no argument given for chart-action');
		}
		if (false === canvas instanceof window.HTMLCanvasElement) {
			throw new Error('the tag being "actionized" is not a <canvas /> tag');
		}
		chart = new Chart(canvas, fallback, fontOptions, devicePixelAspectRatio, pixelDeviceRatio);
		return {
			chart,
			destroy() {
				chart.destroy();
			}
		};
	};
}

export function standardDevicePixelAspectRatio(size?: CanvasSize): number {
	return window.devicePixelRatio;
}

export function defaultFontOptionValues(fontOptions?: Partial<FontOptions>): FontOptions {
	return Object.assign({ size: '10px', family: 'sans-serif' }, fontOptions);
}

export function fontSafeCheck(fontSH: string): boolean | null {
	try {
		// https://drafts.csswg.org/css-font-loading/#font-face-set-check
		return document.fonts.check(fontSH);
	} catch (err) {
		// misspelled
		return null;
	}
}

export function updateStatistics(waits: Waits, ns: IOWaitsGroupNames, start: number, end: number) {
	const delay = end - start;
	waits[ns][delay] = waits[ns][delay] || 0;
	waits[ns][delay]++;
}

function isFontLoadErrorPL(u: any): u is FontLoadErrorPL {
	return u?.error instanceof DOMException && typeof u?.ts === 'string';
}

export function isFontSizeRelative(size: FontSize): size is FontSizeRelative {
	return fontSizeRelative.includes(size as never);
}

export function isFontSizeAbsolute(size: FontSize): size is FontSizeAbsolute {
	return fontSizeAbsolute.includes(size as never);
}
/*
export function isLengthInPx(size: FontSize): size is LengthPx {
	return RegExpFontSizePx.test(String(size));
}

export function isFontSizeInRem(size: FontSize): size is LengthRem {
	return RegExpFontSizeREM.test(String(size));
}
*/
export function selectFont(fonts: ChartFontInfo, key: `fo${string}`): FontOptions {
	const foAxe = fonts['fohAxe'];
	// not defined, seek fallback font
	let font: FontOptions;
	if (foAxe === undefined) {
		font = defaultFontOptionValues({ family: fonts.fallback });
	} else if (isFontLoadErrorPL(foAxe)) {
		font = defaultFontOptionValues({
			...foAxe.font,
			family: fonts.fallback
		});
	} else {
		font = defaultFontOptionValues(foAxe);
	}
	return font;
}

/*
export function scaleFontSH(fontSH: string, scale: number): string {
	const matched0 = fontSH.match(/(?<rest>.*?)(?<size>[^\s]+)\s+(?<family>[^\s]+)$/);
	if (!matched0 || !matched0.groups){
		return fontSH;
	}
	const { rest, family, size } = matched0.groups;
	if (!size) {
		return fontSH;
	}
	const prevFontSH = matched0.groups.size;
	const regExp = RegExpFontSizePx.test(prevFontSH) ? RegExpFontSizePx :
	 RegExpFontSizeREM.test(prevFontSH) ? RegExpFontSizeREM: 
	 RegExpFontSizeEM.test(prevFontSH) ? RegExpFontSizeEM : 
	 RegExpFontSizePERCENT.test(prevFontSH) ?  
		? RegExpFontSizePERCENT:  undefined;

	if (regExp === undefined) {
		return fontSH;
	}

	const matched = prevFontSH.match(regExp);
	if (!matched || !matched.groups) {
		return fontSH;
	}
	if (!matched.groups.u || !matched.groups.nr) {
		return fontSH;
	}
	const nr = parseFloat(matched.groups.nr) * scale;
	const u = matched.groups.u.toLocaleLowerCase();
		
	return `${rest} ${nr}${u} ${family}`;
}
*/
