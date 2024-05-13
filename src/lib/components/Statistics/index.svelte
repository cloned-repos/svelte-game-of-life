<script lang="ts">
	import createNS from '@mangos/debug-frontend';
	import { onMount } from 'svelte';
	import line_chart from '$lib/charts/action';
	import type { CanvasSize, ChartDebugInfo, Font, FontKey, FontOptions } from '$lib/charts/types';
	import { createChartCreator } from '$lib/charts/helper';
	import { FONT_CHANGE } from '$lib/charts/constants';
	import type Chart from '$lib/charts/Chart';

	// const inits
	const debug = createNS('statistics/index.svelte');

	export let pos: string;

	let width = 'n/a';

	let state: CanvasSize;

	function resizeNotification(event: CustomEvent<CanvasSize>) {
		//state = event.detail;
		//debug('state', state);
	}

	function onDebug(event: CustomEvent<ChartDebugInfo>) {
		// console.log('debug', Object.assign(Object.create(null), event.detail));
	}

	let inputValue: string;
	let fontOptions: (FontKey & Font)[] = [
		{ font: { family: 'Junction', size: '24px', weight: '400' }, key: 'hAxe' }
	];
	const createChart = createChartCreator('sans-serif', fontOptions);
	function handleInputChange(e: Event) {
		inputValue = (e.target as HTMLInputElement).value;
	}

	function setFontSHValue(e: Event) {
		fontOptions = [{ font: { family: 'Junction', size: '16px', weight: '900' }, key: 'hAxe' }];
		const { chart } = createChart();
		chart.enqueue({ type: FONT_CHANGE, ...fontOptions[0] });
	}

	function showQueue(e: Event) {
		const { chart } = createChart();
		console.log('show queue', chart.getInfo());
	}

	function doFontChecks(e: Event) {
		const { chart } = createChart();
		chart.processFontChangeEvents();
	}
	function doFontLoadings(e: Event) {
		const { chart } = createChart();
		chart.processFontLoadingEvents();
	}
	function doFontLoadResults(e: Event) {
		const { chart } = createChart();
		chart.processFontLoadResultEvents();
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

<div style="--grid-pos: {pos}" class="me">
	Statistics
	<ul>
		<li>physical-width: {state?.physicalPixelWidth}</li>
		<li>physical-height: {state?.physicalPixelHeight}</li>
		<li>width: {state?.width}</li>
		<li>height: {state?.height}</li>
		<li><span class="fa fa-battery-3" /></li>
		<li>{(debug('rendering ul/il tag'), width)}</li>
	</ul>
	<div>
		<input type="text" on:input={handleInputChange} bind:value={inputValue} />
		<input type="button" value="set font shorthand" on:click={setFontSHValue} />
		<button name="show-queue" on:click={showQueue}>{'show'}</button>
		<button name="font-checks" on:click={doFontChecks}>{'font-checks'}</button>
		<button name="font-loading" on:click={doFontLoadings}>{'font-loading'}</button>
		<button name="font-loading-results" on:click={doFontLoadResults}
			>{'font-loading-results'}</button
		>
		<button name="chart-resize" on:click={doChartResize}>{'chart-resize'}</button>
		<button name="start-anim" on:click={startChartAnimFrame}>{'start'}</button>
		<button name="start-anim" on:click={doChartRender}>{'render'}</button>
		<button name="stop-anim" on:click={stopAnimFrame}>{'stop'}</button>
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
	.me {
		height: 450px;
		/*border: 4px darkkhaki dashed;*/
		width: 100%;
		grid-area: var(--grid-pos);
		display: flex;
		flex-direction: column;
		overflow: hidden; /* otherwise resize not work */
		resize: both;
	}

	canvas {
		min-height: 0; /* --> chrome needs this */
		width: 100%;
		height: 100%;
		align-self: stretch;
		image-rendering: crisp-edges;
	}
</style>
