// needed for runtime checks
import type {
	FontVariant,
	FontStyle,
	FontWeight,
	FontStretch,
	CheckFont,
	FontLoading,
	FontLoaded,
	FontLoadError,
	ChangeSize,
	RenderChart,
	TestHarnas,
	ChangeFont
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

export const FONT_CHECK: CheckFont['type'] = 'font-check';
export const FONT_LOADING: FontLoading['type'] = 'font-loading';
export const FONT_LOADED: FontLoaded['type'] = 'font-loaded';
export const FONT_LOAD_ERROR: FontLoadError['type'] = 'font-load-error';
export const CHANGE_SIZE: ChangeSize['type'] = 'chart-set-size';
export const CHART_RENDER: RenderChart['type'] = 'chart-render';
export const FONT_CHANGE: ChangeFont['type'] = 'font-change';

export const RegExpFontSizePx = /^(?:\d*\.*\d*)px$/i;
export const RegExpFontSizeREM = /^(?:\d*\.*\d*)rem$/i;
export const RegExpFontSizeEM = /^(?:\d*\.*\d*)em$/i;
export const RegExpFontSizePCT = /^(?:\d*\.*\d*)%$/i;

export const textsampleForMetrics = 'MÊ|²{Qszdcy';

export const defaultHarnas: TestHarnas = {
	Date: globalThis.Date,
	setTimeout: globalThis.setTimeout,
	setInterval: globalThis.setInterval,
	setImmediate: globalThis.setImmediate,
	random: globalThis.Math.random
};
