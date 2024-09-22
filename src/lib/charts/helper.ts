import Chart from './Chart';
import { CHANGE_SIZE } from './constants';
import type { Instruction } from './fonts/hp1345a/types';
import type { CanvasSize, DeviceRatioAffectOptions, Matrix, Vector } from './types';

const { trunc, round, max, min, abs } = Math;
const { EPSILON } = Number;

export { trunc, round, max, min, abs, EPSILON };

export function swap([a, b]: [number, number]) {
	return [b, a];
}

// ResizeObserver for canvas
export function createResizeObserverForCanvas(canvas: HTMLCanvasElement, chart: Chart) {
	const observer = new ResizeObserver((entries) => {
		const entry = entries[0];
		const physicalPixelWidth = entry.devicePixelContentBoxSize[0].inlineSize;
		const physicalPixelHeight = entry.devicePixelContentBoxSize[0].blockSize;
		const height = entry.borderBoxSize[0].blockSize;
		const width = entry.borderBoxSize[0].inlineSize;
		const size = { physicalPixelWidth, physicalPixelHeight, height, width };
		chart.enqueue({ type: CHANGE_SIZE, size }); // the processing of the resize trigger is synchroneous anyway
	});

	observer.observe(canvas, { box: 'device-pixel-content-box' });

	return function destroy() {
		observer.disconnect();
	};
}

export function sumObjectValues(o: Record<string, number>): number {
	return Array.from(Object.values(o)).reduce((c, v) => v + c);
}

export function isCanvasSizeEqual(a: CanvasSize, b: CanvasSize) {
	return (
		a.height === b.height &&
		a.width == b.width &&
		a.physicalPixelHeight === b.physicalPixelHeight &&
		a.physicalPixelWidth === b.physicalPixelWidth
	);
}

export function 
configChartCreator(
	devicePixelAspectRatio: (size?: CanvasSize) => number,
	pixelDeviceRatioAffect: DeviceRatioAffectOptions
) {
	let chart: Chart;

	function getChart() {
		return chart;
	}
	function createChart(canvas: HTMLCanvasElement) {
		if (chart) {
			throw new Error('can not add this action to multiple html tags');
		}
		if (false === canvas instanceof HTMLCanvasElement) {
			throw new Error('the tag being "actionized" is not a <canvas /> tag');
		}
		chart = new Chart(canvas, devicePixelAspectRatio, pixelDeviceRatioAffect);
		return {
			destroy:() => {
				chart.destroy();
			}
		};
	}
	return { getChart, createChart };
}

export function standardDevicePixelAspectRatio(size?: CanvasSize): number {
	return max(0, min(window.devicePixelRatio, 2));
}

export const standardAffectOptions: DeviceRatioAffectOptions = {
	canvasPositioning(devicePixelRatio: number, ...metrics: number[]): number[] {
		return metrics.map((m) => m * devicePixelRatio);
	},
	lineWidth(metric: number, dpr: number): number {
		return dpr * metric;
	}
};


export function doSkey(c: Matrix, sk12: number, sk21: number): Matrix {
	return {
		m11: c.m11 + sk21*c.m12,
		m12: c.m12 + sk12*c.m11,
		m13: c.m13,
		m21: c.m21 + sk21*c.m22,
		m22: c.m22 + sk12*c.m21,
		m23: c.m23,
	}
}

export function doRotate(c: Matrix, rx: number, ry: number): Matrix {
	return {
		m11: rx*c.m11 + ry*c.m12,
		m21: rx*c.m21 + ry*c.m22,
		m12: -ry*c.m11 + rx*c.m12,
		m22: -ry*c.m21 + rx*c.m22,
		m13: c.m13,
		m23: c.m23,
	};
}

export function doTrans(c: Matrix, tx: number, ty: number): Matrix {
	return {
		m11: c.m11,
		m21: c.m21,
		m12: c.m12,
		m22: c.m22,
		m13: tx*c.m11 + ty*c.m12 + c.m13,
		m23: tx*c.m21 + ty*c.m22 + c.m23,
	};
}

export function doScale(c: Matrix, sx: number, sy: number): Matrix {
	return {
		m11: c.m11*sx,
		m12: c.m12*sy,
		m13: c.m13,
		m21: c.m21*sx,
		m22: c.m22*sy,
		m23: c.m23,
	};
}

export function doMirrorOnX(c: Matrix): Matrix {
 	return {
		m11: c.m11,
		m12: -c.m12,
		m13: c.m13,
		m21: c.m21,
		m22: -c.m22,
		m23: c.m23,
	};
}

export function defaultMatrix(): Matrix {
	return {
		m11: 1,
		m12: 0,
		m13: 0,
		m21: 0,
		m22: 1,
		m23: 0
	}
}

export function applyVector(c: Matrix, v: Vector): Vector {
	return {
		t: v.t,
		x: c.m11*v.x + c.m12*v.y + c.m13,
		y: c.m21*v.x + c.m22*v.y + c.m23,
		z: 1,
	}
}

export function vector(ins: Instruction): Vector {
	return {
		...ins,
		z: 1,
	};
}

