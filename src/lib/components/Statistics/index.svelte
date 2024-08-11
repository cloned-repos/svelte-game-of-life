<script lang="ts">
	import createNS from '../../../debug-frontend';
	import line_chart from '$lib/charts/action';
	import type { CanvasSize, ChartDebugInfo } from '$lib/charts/types';
	import { configChartCreator, standardAffectOptions, standardDevicePixelAspectRatio } from '$lib/charts/helper';
	// attributes
	export let pos: string;

	// internal state
	let width = 0;
	let inputValue: string;
	let state: CanvasSize = {
		physicalPixelHeight: 0,
		physicalPixelWidth: 0,
		height: 0,
		width: 0
	};

	// initialization
	const debug = createNS('statistics/index.svelte');

	const createChart = configChartCreator(
	    standardDevicePixelAspectRatio,
		standardAffectOptions
	);

	//  event handlers

	function resizeNotification(event: CustomEvent<CanvasSize>) {}
	function onDebug(event: CustomEvent<ChartDebugInfo>) {}


	function showQueue(e: Event) {
		const { chart } = createChart();
		console.log('show queue', chart.getInfo());
	}


	function doChartResize(e: Event) {
		const { chart } = createChart();
		chart.processChartResize();
	}

	function stopAnimFrame(e: Event) {
		const { chart } = createChart();
		chart.stopSyncOnAnimationFrame();
	}

	function startChartAnimFrame(e: Event) {
		const { chart } = createChart();
		chart.syncOnAnimationFrame();
	}

	function doChartRender(e: Event) {
		const { chart } = createChart();
		chart.processChartRender();
	}
</script>

<div data-testid={'dingbats'} style="--grid-pos: {pos}" class="me">
	Statistics
	<ul class="me-ul">
		<li data-testid={'dingbats2'}>physical-width: {state?.physicalPixelWidth}</li>
		<li>physical-height: {state?.physicalPixelHeight}</li>
		<li>width: {state?.width}</li>
		<li>height: {state?.height}</li>
		<li><span class="fa fa-battery-3" /></li>
		<li>{debug('reactive trigger on "width" value change: %s', width)}</li>
	</ul>
	<div>
		<input type="text" bind:value={inputValue} />
		<button name="show-queue" on:click={showQueue}>{'show'}</button>
		<button name="chart-resize" on:click={doChartResize}>{'chart-resize'}</button>
		<button name="start-anim" on:click={startChartAnimFrame}>{'start'}</button>
		<button name="start-anim" on:click={doChartRender}>{'render'}</button>
		<button name="stop-anim" on:click={stopAnimFrame}>{'stop'}</button>
		<span class="btnstyle">{'jçëMÊ|²{Qszdcy'}</span>
	</div>
	<canvas
		use:line_chart={createChart}
		on:chart-resize={resizeNotification}
		on:chart-debug={onDebug}
	>
		{(debug('rendering canvas?'), '')}
	</canvas>
</div>

<style>
	.me > ul {
		list-style: none;
	}
	.me {
		height: 650px;
		border: 4px darkkhaki dashed;
		width: 100%;
		grid-area: var(--grid-pos);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		resize: both;
	}

	canvas {
		min-height: 0; /* --> chrome needs this */
		width: 100%;
		height: 100%;
		/*align-self: stretch;*/
		image-rendering: crisp-edges;
		border: 2px solid red;
	}
</style>
