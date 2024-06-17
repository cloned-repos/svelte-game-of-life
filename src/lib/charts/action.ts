import type { ActionReturn } from 'svelte/action';
import createNS from '../../debug-frontend';
import type { CanvasSize, ChartDebugInfo } from './types';
import type { configChartCreator } from './helper';

//
const debug = createNS('charts/action');

type ChartAttributes = {
	'on:chart-resize'?: (e: CustomEvent<CanvasSize>) => void;
	'on:chart-debug'?: (e: CustomEvent<ChartDebugInfo>) => void;
};

// action
export default function line_chart(
	canvas: HTMLCanvasElement,
	chartCreator: ReturnType<typeof configChartCreator>
): ActionReturn<never, ChartAttributes> {
	// finalize char creation since we now have the canvas
	const { destroy, chart } = chartCreator(canvas);
	chart.syncOnAnimationFrame();

	return {
		destroy
	};
}
