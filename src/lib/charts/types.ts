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

export type RPC = {
	reqId: number;
};

export type RenderChart = {
	type: 'chart-render';
};

export type CommonMsg =
	| ChangeSize
	| RenderChart;

export interface TestHarnas {
	Date: typeof Date;
	setTimeout: typeof setTimeout;
	setInterval: typeof setInterval;
	setImmediate: typeof setImmediate;
	random: typeof Math.random;
	getRequestAnimationFrame: () => typeof window.requestAnimationFrame;
};

export type ChartDebugInfo = {
	queue: ({ ts: string } & CommonMsg)[];
	canvasSize: CanvasSize;
};

export type DeviceRatioAffectOptions = {
	canvasPositioning?: (devicePixelRatio: number, ...metrics: number[]) => number[];
	lineWidth?(metric: number, devicePixelRatio: number): number;
};
