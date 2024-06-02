// needed for runtime checks
import { getFontSizeAndUnit, max, min } from './helper';
import type {
	FontVariant,
	FontStyle,
	FontWeight,
	FontStretch,
	FontLoading,
	FontLoaded,
	FontLoadError,
	ChangeSize,
	RenderChart,
	TestHarnas,
	FontChange,
	FontSizeRelative,
	FontSizeAbsolute,
	GenericFontFamilies,
	DeviceRatioAffectOptions,
} from './types';
export const systemSH = ['caption', 'icon', 'menu', 'message-box', 'small-caption', 'status-bar'];
export const fontStyle: FontStyle[] = ['normal', 'italic', 'oblique'];
export const fontVariant: FontVariant[] = ['normal', 'small-caps'];

export const fontWeight: FontWeight[] = [
	'normal',
	'bold',
	'lighter',
	'100',
	'200',
	'300',
	'400',
	'500',
	'600',
	'700',
	'800',
	'900'
];

export const fontStretch: FontStretch[] = [
	'normal',
	'ultra-condensed',
	'extra-condensed',
	'condensed',
	'semi-condensed',
	'semi-expanded',
	'expanded',
	'extra-expanded',
	'ultra-expanded'
];

export const FONT_LOADING: FontLoading['type'] = 'font-loading';
export const FONT_LOADED: FontLoaded['type'] = 'font-loaded';
export const FONT_LOAD_ERROR: FontLoadError['type'] = 'font-load-error';
export const CHANGE_SIZE: ChangeSize['type'] = 'chart-set-size';
export const CHART_RENDER: RenderChart['type'] = 'chart-render';
export const FONT_CHANGE: FontChange['type'] = 'font-change';

export const regExpFontSizeMetric = /^(?<nr>\d*\.*\d*)(?<u>(px|rem|em|%|dp|ch))$/i;
export const regExpSliceFamilyAndFontSize = /(?<size>[^\s]+)\s+(?<family>[^\s]+|("[^"]+")|('[^\']+'))$/;

export const canonicalText = 'jçë0193MÊ|²{Qszdcy0';

export const defaultHarnas: TestHarnas = {
	Date: globalThis.Date,
	setTimeout: globalThis.setTimeout,
	setInterval: globalThis.setInterval,
	setImmediate: globalThis.setImmediate,
	random: globalThis.Math.random,
	getRequestAnimationFrame: () => window.requestAnimationFrame
};


export const fontSizeRelative: FontSizeRelative[] = ['larger', 'smaller'];

export const fontSizeAbsolute: FontSizeAbsolute[] = [
	'xx-small',
	'x-small',
	'small',
	'medium',
	'large',
	'x-large',
	'xx-large'
];

export const fontGenericFamilies: GenericFontFamilies[] = [
	'serif',
	'sans-serif',
	'monospace',
	'cursive',
	'fantasy',
	'system-ui',
	'math'
];


export const standardAffectOptions : DeviceRatioAffectOptions = {
	font(fontSH: string, dpr: number): string {
	   const length = getFontSizeAndUnit(fontSH);
	   if (length === null) {
			return fontSH;
	   }
	   const { fontSize, sizeUnit } = length;
	   const key = `${fontSize}${sizeUnit}`;
	   return fontSH.replace(key, `${fontSize*dpr}${sizeUnit}`);
	},
	canvasPositioning(devicePixelRatio: number, ...metrics: number[]): number[] {
		return metrics.map(m => m * devicePixelRatio);
	},
	lineWidth(metric: number, dpr: number): number {
		return dpr*metric;
	}
};

