export type CheckFontCommand = {
	type: 'font-check';
	payload: string; // the font shorthand
};

export type CheckFontLoadingCommand = {
	type: 'font-loading';
	payload: string; // the font shorthand
};

export type CheckFontLoadedCommand = {
	type: 'font-loaded';
	payload: string; // the font shorthand
};

export type CheckFontLoadErrorCommand = {
	type: 'font-load-error';
	payload: {
		font: string;
		error: DOMException; // the font shorthand
	};
};

export type CheckSize = {
	type: 'chart-size';
	payload: CanvasSizeInfomation; // the font shorthand
};

export type RerenderChart = {
	type: 'render';
};

//union type of lineChartCommands;
export type LineChartCommands =
	| CheckFontCommand
	| CheckSize
	| CheckFontLoadingCommand
	| CheckFontLoadedCommand
	| CheckFontLoadErrorCommand
	| RerenderChart;

// lookup table
type mapTypeToCommand = {
	[Command in LineChartCommands as Command['type']]: Command;
};

// lookup index values of the lookup table
type CommandType = keyof mapTypeToCommand;

// select a value of the lookup table by its key
type CommandSelectByType<T extends CommandType> = mapTypeToCommand[T];

// optional type
type Payload<T> = T extends { payload: infer P } ? [P] : never[];

export function createCommand<
	TName extends CommandType,
	TCommand extends CommandSelectByType<TName>,
	TPayload extends Payload<TCommand>
>(type: TName, ...payload: TPayload): TCommand {
	if (!payload.length) {
		return { type } as unknown as TCommand;
	}
	return { type, payload: payload[0] } as unknown as TCommand;
}

export type ChartOptions = {
	font?: FontOptions; // font shorthand
	xAxis?: Axis;
	yAxis?: Axis;
	data: any;
};

export type LengthPercentage = string | number;

export type MinMax = {
	collapseVisibility?: boolean;
	min?: LengthPercentage;
	max: LengthPercentage;
};

export type Axis = {
	label?: {
		// same font family as the font shirthand but different size
		fontSize: number | MinMax;
	};
	// if the yaxis font "descent" would overlap the x-axis label with this value then:
	// 1. x-labels are not drawn
	// or
	// 2. y-labels are not drawn
	tickSize?: number | MinMax;
};

export type ChartInternalState = {
	ctx: CanvasRenderingContext2D;
	size: CanvasSizeInfomation;
	fontOptions: FontOptions; // font shortHand
	fontSH: string; // inferred from fontOptions and cached
	xAxis: Axis;
	yAxis: Axis;
	lastFontLoadError: null | {
		ts: string; // ISO date when the error happened
		error: DOMException; // the Error from the browser
		font: string; // for what font-shorthand the error happened
	};
};

export type CanvasSizeInfomation = {
	physicalPixelHeight: number;
	physicalPixelWidth: number;
	width?: number;
	height?: number;
};

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

export type FontOptions = Partial<{
	style: FontStyle;
	variant: FontVariant;
	weight: FontWeight;
	stretch: FontStretch;
	size: FontSize;
	family: string;
}>;
