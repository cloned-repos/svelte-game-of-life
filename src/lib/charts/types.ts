export type CanvasSize = {
	physicalPixelHeight: number;
	physicalPixelWidth: number;
	width: number;
	height: number;
};

export type ChangeSize = {
	type: 'chart-set-size';
	size: CanvasSize; // new canvas metrics
};

type RPC = {
	reqId: number;
};

export type FontKey = {
	key: 'hAxe' | 'vAxe' | 'legendTop' | 'legendBottom';
};

export type Font = {
	font: FontOptions;
};

export type ChangeFont = Font &
	FontKey & {
		type: 'font-change';
	};

export type FontLoading = RPC &
	FontKey &
	Font & {
		type: 'font-loading';
	};

export type FontLoaded = RPC &
	Font &
	FontKey & {
		type: 'font-loaded';
		ts: string; // time font loaded
	};

export type FontLoadErrorPL = Font & {
	error: DOMException;
	ts: string; // time this error occurred
};

export type FontLoadError = RPC &
	FontKey &
	FontLoadErrorPL & {
		type: 'font-load-error';
	};

export type RenderChart = {
	type: 'chart-render';
};

export type CommonMsg =
	| ChangeSize
	| RenderChart
	| FontLoadError
	| FontLoaded
	| FontLoading
	| ChangeFont;

/*
[ 
	[ <‘font-style’> || <font-variant-css21> || <‘font-weight’> || <‘font-stretch’> ]? 
	<‘font-size’> [ / <‘line-height’> ]?
	<‘font-family’> 
] | caption | icon | menu | message-box | small-caption | status-bar

<‘font-style’> = 	normal | italic | oblique
<font-variant-css21> = [normal | small-caps]
<‘font-weight’> =normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
<‘font-stretch’> =	normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded
<‘font-size’> =	<absolute-size> | <relative-size> | <length-percentage>
<absolute-size> =[ xx-small | x-small | small | medium | large | x-large | xx-large ]
 <relative-size>=[ larger | smaller ]
<length-percentage>= [ <length> | <percentage> ], where the <percentage> will resolve to a <length>.

// normal and inherit are keywords
// do not do lineheight, that has no meaning in canvas
<'line-height> normal | <number> | <length> | <percentage> | inherit

*/
// https://www.w3.org/TR/CSS2/syndata.html#value-def-length
export type LengthPercentage = `${number}%`;

export type LengthRem = `${number}rem`;

export type LengthEm = `${number}em`;

export type LengthPx = `${number}px`;

export type Length = '0' | 0 | LengthPercentage | LengthEm | LengthRem | LengthPx;

// https://www.w3.org/TR/CSS2/visudet.html#propdef-line-height
export type LineHeight = 'normal' | Length;
export type FontStyle = 'normal' | 'italic' | 'oblique';
export type FontVariant = 'normal' | 'small-caps';
export type FontWeight =
	| 'normal'
	| 'bold'
	| 'lighter'
	| '100'
	| '200'
	| '300'
	| '400'
	| '500'
	| '600'
	| '700'
	| '800'
	| '900';
export type FontStretch =
	| 'normal'
	| 'ultra-condensed'
	| 'extra-condensed'
	| 'condensed'
	| 'semi-condensed'
	| 'semi-expanded'
	| 'expanded'
	| 'extra-expanded'
	| 'ultra-expanded';

export type FontSizeAbsolute =
	| 'xx-small'
	| 'x-small'
	| 'small'
	| 'medium'
	| 'large'
	| 'x-large'
	| 'xx-large';

export type FontSizeRelative = 'larger' | 'smaller';

// https://www.w3.org/TR/2018/REC-css-fonts-3-20180920/#propdef-font-size
export type FontSize = FontSizeAbsolute | FontSizeRelative | Length;

export type FontOptions = {
	style?: FontStyle;
	variant?: FontVariant;
	weight?: FontWeight;
	stretch?: FontStretch;
	size: FontSize;
	family: string;
	metrics?: FontMetrics;
	// https://www.w3.org/TR/CSS2/visudet.html#propdef-line-height
	lineHeight?: LineHeight;
};

export type GenericFontFamilies =
	| 'serif'
	| 'sans-serif'
	| 'monospace'
	| 'cursive'
	| 'fantasy'
	| 'system-ui'
	| 'math';

export type TestHarnas = {
	Date: typeof Date;
	setTimeout: typeof setTimeout;
	setInterval: typeof setInterval;
	setImmediate: typeof setImmediate;
	random: typeof Math.random;
	getRequestAnimationFrame: () => typeof window.requestAnimationFrame;
};

export type IOWaitsGroupNames = 'fontLoadTime' | 'fontloadErrorTime';

export type Waits = Record<IOWaitsGroupNames, Record<number, number>>;

export type ChartFontInfo = {
	fallback: GenericFontFamilies;
	[index: `fo${string}`]: FontOptions | FontLoadErrorPL;
};

export type ChartDebugInfo = {
	queue: ({ ts: string } & CommonMsg)[];
	fonts: ChartFontInfo;
	canvasSize: CanvasSize;
	waits: Waits;
};

export type FontMetrics = {
	topbl: number;
	fontAscent: number;
	actualAscent: number;
	alpbbl: number;
	botbl: number;
	fontDescent: number;
	actualDescent: number;
	cellHeight: number;
	min: number;
	max: number;
	aLeft: number;
	aRight: number;
	width: number;
};

export type FontBaseLineInfo = {
	alphabetic: number;
	middle: number;
	bottom: number;
	top: number;
};

export type FontAndActualMeasure = {
	font: number;
	actual: number;
};

export type DebugFontMetrics = {
	baselines: {
		top: FontAndActualMeasure;
		alphabetic: FontAndActualMeasure;
		bottom: FontAndActualMeasure;
	};
	// ascents and descents
	ascents: {
		font: FontBaseLineInfo;
		actual: FontBaseLineInfo;
	};
	descents: {
		font: FontBaseLineInfo;
		actual: FontBaseLineInfo;
	};
};
