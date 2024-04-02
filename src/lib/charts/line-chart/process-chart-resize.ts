import type { ChartInternalState, CanvasSize, ChartCommands } from './types';
export default function processChartResize(
	iState: ChartInternalState,
	state: CanvasSize,
	queue: ChartCommands[]
): void {
	// if there are other resize commands in this queue remove them
	const size = iState.size;
	if (
		size.height === state.height &&
		size.width == state.width &&
		size.physicalPixelHeight === state.physicalPixelHeight &&
		size.physicalPixelWidth === state.physicalPixelWidth
	) {
		return; // do nothing
	}
	queue.push({ type: 'chart-set-size', size: state });
	queue.push({ type: 'chart-render' });
}
