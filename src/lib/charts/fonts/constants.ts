import type { FontChange, FontLoadError, FontLoaded, FontLoading, FontSizeAbsolute, FontSizeRelative, FontStretch, FontStyle, FontVariant, FontWeight, GenericFontFamilies } from "./types";

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
export const FONT_CHANGE: FontChange['type'] = 'font-change';

export const regExpFontSizeMetric = /^(?<nr>\d*\.*\d*)(?<u>(px|rem|em|%|dp|ch))$/i;
export const regExpSliceFamilyAndFontSize =
	/(?<size>[^\s]+)\s+(?<family>[^\s]+|("[^"]+")|('[^\']+'))$/;

export const canonicalText = 'jçë0193MÊ|²{Qszdcy0';

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


