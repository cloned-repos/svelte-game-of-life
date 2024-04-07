export type CanvasSize = {
	physicalPixelHeight: number;
	physicalPixelWidth: number;
	width?: number;
	height?: number;
};

export type ChangeSize = {
	type: 'chart-set-size';
	size: CanvasSize; // new canvas metrics
};

type RPC = {
	reqId: number;
};

type Font = {
	font: FontOptions;
};

// internal message for the chart
export type CheckFont = Font & {
	type: 'font-check';
};

export type ChangeFont = {
	type: 'font-change';
	fontOptions: FontOptions;
};

export type FontLoading = RPC &
	Font & {
		type: 'font-loading';
	};

export type FontLoaded = RPC &
	Font & {
		type: 'font-loaded';
	};

export type FontLoadError = RPC &
	Font & {
		type: 'font-load-error';
		error: DOMException; // the error
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
//| CheckFont;

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

export type FontSizeLengthPercentage = `${number}%`;

export type FontSizeLengthRem = `${number}rem`;

export type FontSizeLengthem = `${number}em`;

export type FontSizeLengthPx = `${number}px`;

export type FontSize =
	| FontSizeAbsolute
	| FontSizeRelative
	| FontSizeLengthPercentage
	| FontSizeLengthRem
	| FontSizeLengthem
	| FontSizeLengthPx;

export type FontOptions = {
	style?: FontStyle;
	variant?: FontVariant;
	weight?: FontWeight;
	stretch?: FontStretch;
	size: FontSize;
	family: string;
};

export type TestHarnas = {
	Date: typeof Date;
	setTimeout: typeof setTimeout;
	setInterval: typeof setInterval;
	setImmediate: typeof setImmediate;
	random: typeof Math.random;
};
