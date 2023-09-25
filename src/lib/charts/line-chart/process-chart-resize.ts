import { createCommand } from './types';
import type { ChartInternalState, CanvasSizeInfomation, LineChartCommands } from './types';
export default function processChartResize(
	iState: ChartInternalState,
	state: CanvasSizeInfomation,
	queue: LineChartCommands[]
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
	queue.push(createCommand('chart-size', state));
	queue.push(createCommand('render'));
}
