// needed for runtime checks
import type { FontVariant, FontStyle, FontWeight, FontStretch, CollisionState } from './types';
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

export const RegExpFontSizePx = /^(?:\d*\.*\d*)px$/i;
export const RegExpFontSizeREM = /^(?:\d*\.*\d*)rem$/i;
export const RegExpFontSizeEM = /^(?:\d*\.*\d*)em$/i;
export const RegExpFontSizePCT = /^(?:\d*\.*\d*)%$/i;

export const textsampleForMetrics = 'MÊ|²{Qszdcy';

export const soft: CollisionState = 'collision-soft';
export const hard: CollisionState = 'collision-hard';
export const far: CollisionState = 'far';
export const near: CollisionState = 'near';
