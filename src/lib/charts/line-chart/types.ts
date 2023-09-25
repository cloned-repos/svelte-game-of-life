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
	font?: string; // font shorthand
	data: any;
};

export type ChartInternalState = {
	size: CanvasSizeInfomation;
	font: string; // font shortHand
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
