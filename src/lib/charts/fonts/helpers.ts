// https://html.spec.whatwg.org/multipage/canvas.html#2dcontext

import {
	fontSizeAbsolute,
	fontSizeRelative,
	fontStyle,
	regExpFontSizeMetric,
	regExpSliceFamilyAndFontSize
} from './constants';

import type {
	ChartFontInfo,
	FontLoadErrorPL,
	FontOptions,
	FontSize,
	FontSizeAbsolute,
	FontSizeRelative,
	AuxiliaryTextMetrics
} from './types';

// '10px sans-serif' is the default for canvas
export function getFontSizeAndUnit(shortSH: string): null | { fontSize: number; sizeUnit: string } {
	const tol = shortSH.toLowerCase();
	const match = tol.match(regExpSliceFamilyAndFontSize);
	if (match === null) {
		return null;
	}
	const size = match.groups!.size;
	const metric = size.match(regExpFontSizeMetric)!;
	const fontSize = parseFloat(metric.groups!.nr);
	const sizeUnit = metric.groups!.u;
	return { fontSize, sizeUnit };
}

export function isFontLoadErrorPL(u: any): u is FontLoadErrorPL {
	return u?.error instanceof DOMException && typeof u?.ts === 'string';
}

export function isFontSizeRelative(size: FontSize): size is FontSizeRelative {
	// "larger",  "smaller"
	return fontSizeRelative.includes(String(size) as FontSizeRelative);
}

export function isFontSizeAbsolute(size: FontSize): size is FontSizeAbsolute {
	// 'xx-small' to xx-large
	return fontSizeAbsolute.includes(String(size) as FontSizeAbsolute);
}

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

export function getTextMetrics(
	ctx: CanvasRenderingContext2D,
	fontSH: string,
	text: string
): null | AuxiliaryTextMetrics {
	ctx.save(); // save contexts
	ctx.font = fontSH;
	// get metrics from all possible baselines
	const topMetrics = metricsFrom(text, 'top', ctx);
	const middleMetrics = metricsFrom(text, 'middle', ctx);
	const baseLineMetrics = metricsFrom(text, 'alphabetic', ctx);
	const bottomLineMetrics = metricsFrom(text, 'bottom', ctx);
	ctx.restore();
	// top baseline perspective
	const topbl_fontAscent = topMetrics.fontBoundingBoxAscent;
	const topbl_actualAscent = topMetrics.actualBoundingBoxAscent;
	const topbl_fontDescent = -topMetrics.fontBoundingBoxDescent;
	const topbl_actualDescent = -topMetrics.actualBoundingBoxDescent;

	// alphabetic baseline perspective
	const alpbl_fontAscent = baseLineMetrics.fontBoundingBoxAscent;
	const alpbl_actualAscent = baseLineMetrics.actualBoundingBoxAscent;
	const alpbl_fontDescent = -baseLineMetrics.fontBoundingBoxDescent;
	const alpbl_actualDescent = -baseLineMetrics.actualBoundingBoxDescent;

	// bottom baseline perspective
	const botbl_fontAscent = bottomLineMetrics.fontBoundingBoxAscent;
	const botbl_actualAscent = bottomLineMetrics.actualBoundingBoxAscent;
	const botbl_fontDescent = -bottomLineMetrics.fontBoundingBoxDescent;
	const botbl_actualDescent = -bottomLineMetrics.actualBoundingBoxDescent;

	// middle baseline perspective
	const midbl_fontAscent = middleMetrics.fontBoundingBoxAscent;
	const midbl_fontDescent = -middleMetrics.fontBoundingBoxDescent;
	const midbl_actualAscent = middleMetrics.actualBoundingBoxAscent;
	const midbl_actualDescent = -middleMetrics.actualBoundingBoxDescent;

	// top baseline (posive) relative to the middle baseline, positive nr, how much px above the middle baseline
	const topbl = midbl_fontAscent - topbl_fontAscent;
	// is the same as above: const topbl_actual = midbl_actualAscent - topbl_actualAscent;

	// alphabetic baseline relative to the middle baseline, negative number since the alphabetic baseline is below the middle baseline
	const alpbl = midbl_fontAscent - alpbl_fontAscent;
	// is the same as above: const alpbl_actual = midbl_actualAscent - alpbl_actualAscent;

	// these 2 should be the same, mid-ascent < bot-ascent
	const botbl = midbl_fontAscent - botbl_fontAscent;
	// is the same as above: const botbl_actual = midbl_actualAscent - botbl_actualAscent;

	const sorted = [
		midbl_fontAscent,
		midbl_fontDescent,
		midbl_actualAscent,
		midbl_actualDescent
	].sort((a, b) => a - b);
	const min = sorted[0];
	const max = sorted[sorted.length - 1];
	console.log('sorted', sorted);
	//
	const cellHeightFont = midbl_fontAscent - midbl_fontDescent;
	const cellHeightActual = midbl_actualAscent - midbl_actualDescent;
	const aLeft = middleMetrics.actualBoundingBoxLeft;
	const aRight = middleMetrics.actualBoundingBoxRight;
	const width = middleMetrics.width;
	const capHeight = topbl - alpbl;
	const topBottom = topbl - botbl;
	return {
		aux: {
			min,
			max,
			cellHeightActual,
			cellHeightFont,
			aLeft,
			aRight,
			width,
			capHeight,
			topBottom
		},
		baselines: {
			top: topbl,
			alphabetic: alpbl,
			bottom: botbl
		},
		// ascents and descents
		ascents: {
			font: {
				alphabetic: alpbl_fontAscent,
				middle: midbl_fontAscent,
				bottom: botbl_fontAscent,
				top: topbl_fontAscent
			},
			actual: {
				alphabetic: alpbl_actualAscent,
				middle: midbl_actualAscent,
				bottom: botbl_actualAscent,
				top: topbl_actualAscent
			}
		},
		descents: {
			font: {
				alphabetic: alpbl_fontDescent,
				middle: midbl_fontDescent,
				bottom: botbl_fontDescent,
				top: topbl_fontDescent
			},
			actual: {
				alphabetic: alpbl_actualDescent,
				middle: midbl_actualDescent,
				bottom: botbl_actualDescent,
				top: topbl_actualDescent
			}
		}
	};
}
