import type { ActionReturn } from 'svelte/action';
import type { CanvasSize, ChartDebugInfo } from './types';
//
type ChartAttributes = {
	'on:chart-resize'?: (e: CustomEvent<CanvasSize>) => void;
	'on:chart-debug'?: (e: CustomEvent<ChartDebugInfo>) => void;
};

// action
export default function line_chart(
	canvas: HTMLCanvasElement,
	createChart: (canvas: HTMLCanvasElement) => { destroy: () => void }
): ActionReturn<undefined, ChartAttributes> {
	// finalize char creation since we now have the canvas
	const { destroy } = createChart(canvas);
	return {
		destroy
	};
}
