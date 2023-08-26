<script lang="ts">
	import oresize_action from './actions';
	import type { CanvasInfomation } from './actions';
	import createNS from '@mangos/debug-frontend';

	const debug = createNS('canvas-text');

	function handleEvent(e: CustomEvent<CanvasInfomation>) {
		const ctx = (e.target as HTMLCanvasElement).getContext('2d')!;

		const text = '00:00';
		ctx.fillStyle = 'black';
		ctx.direction = 'ltr';
		ctx.font = '12px system-ui';
		ctx.textAlign = 'left';
		const textMetric = ctx.measureText(text);
		debug('canvas-size: %o', e.detail);
		debug('text-metric: %o', textMetric);
		ctx.textBaseline = 'alphabetic';
	}
</script>

<div class={$$props.class}>
	<canvas use:oresize_action on:cresize={handleEvent}><slot /></canvas>
</div>

<style>
	canvas {
		min-height: 0; /* --> chrome needs this */
		width: 100%;
		height: 100%;
	}
</style>
