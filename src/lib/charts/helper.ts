import Chart from './Chart';
import { CHANGE_SIZE } from './constants';
import type { CanvasSize, DeviceRatioAffectOptions } from './types';

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

export function configChartCreator(
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
			destroy() {
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
