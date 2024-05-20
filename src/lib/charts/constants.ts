// needed for runtime checks
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
	ChangeFont,
	FontSizeRelative,
	FontSizeAbsolute,
	GenericFontFamilies,
	DeviceRatioAffectOptions
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
export const FONT_CHANGE: ChangeFont['type'] = 'font-change';

export const RegExpFontSizePx = /^(?<nr>\d*\.*\d*)(?<u>px)$/i;
export const RegExpFontSizeREM = /^(?<nr>\d*\.*\d*)(?<u>rem)$/i;
export const RegExpFontSizeEM = /^(?<nr>\d*\.*\d*)(?<u>em)$/i;
export const RegExpFontSizePERCENT = /^(?<nr>\d*\.*\d*)(?<u>%)$/i;

export const canonicalText = 'jçëMÊ|²{Qszdcy';

export const defaultHarnas: TestHarnas = {
	Date: globalThis.Date,
	setTimeout: globalThis.setTimeout,
	setInterval: globalThis.setInterval,
	setImmediate: globalThis.setImmediate,
	random: globalThis.Math.random,
	getRequestAnimationFrame: () => window.requestAnimationFrame
};

export const defaultPixelRatioScaleOptions: DeviceRatioAffectOptions = {
	font: true,
	canvasPositioning: true,
	lineWidth: true
}

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
