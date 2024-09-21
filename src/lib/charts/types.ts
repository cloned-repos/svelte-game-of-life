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

export type CommonMsg = ChangeSize | RenderChart;

export interface TestHarnas {
	Date: typeof Date;
	setTimeout: typeof setTimeout;
	setInterval: typeof setInterval;
	setImmediate: typeof setImmediate;
	random: typeof Math.random;
	getRequestAnimationFrame: () => typeof window.requestAnimationFrame;
}

export type ChartDebugInfo = {
	queue: ({ ts: string } & CommonMsg)[];
	canvasSize: CanvasSize;
};

export type DeviceRatioAffectOptions = {
	canvasPositioning?: (devicePixelRatio: number, ...metrics: number[]) => number[];
	lineWidth?(metric: number, devicePixelRatio: number): number;
};

export type BoundingBox = {
	x: number;
	y: number;
	w: number;
	h: number;
};

/*
    m11 m12 m13       x
    m21 m22 m23  *  y
    0    0  m33     1


	translation (x+a,y+b)

	m11 = 1, m12 = 0, m13 = a
	m21 = 0, m22 = 1, m23 = b
	m33 = 1

	skew 
*/
export type Matrix2D = {};
