import type { Instruction } from './fonts/hp1345a/types';

export type CanvasSize = {
	physicalPixelHeight: number;
	physicalPixelWidth: number;
	width: number;
	height: number;
};

export type ChangeSize = {
	type: 'set-size';
	size: CanvasSize; // new canvas metrics
};

export type RenderChart = {
	type: 'render';
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

export type Matrix = { m11: number, m12: number; m13: number; m21: number; m22: number; m23: number };

export type Vector = Instruction & { z: 1 };
