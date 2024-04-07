<script lang="ts">
	import createNS from '@mangos/debug-frontend';
	import { onMount } from 'svelte';
	import line_chart from '$lib/charts/action';
	import type { CanvasSize, FontOptions } from '$lib/charts/types';
	import { createChartCreator } from '$lib/charts/helper';
	import { FONT_CHANGE, FONT_CHECK } from '$lib/charts/constants';

	// const inits
	const debug = createNS('statistics/index.svelte');

	export let pos: string;

	let width = 'n/a';

	let state: CanvasSize;

	function resizeNotification(event: CustomEvent<CanvasSize>) {
		state = event.detail;
		debug('state', state);
	}

	let inputValue: string;
	let fontOptions: FontOptions = { family: 'sans-serif', size: '16px', weight: 'bold' };
	const createChart = createChartCreator(fontOptions);
	function handleInputChange(e: Event) {
		inputValue = (e.target as HTMLInputElement).value;
	}

	function setFontSHValue(e: Event) {
		fontOptions = { family: 'Junction', size: '150px', weight: '200' };
		const chart = createChart();
		chart.enqueue({ type: FONT_CHANGE, fontOptions });
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
		<li>{(debug('rendering ul > li'), width)}</li>
	</ul>
	<input type="text" on:input={handleInputChange} bind:value={inputValue} />
	<input type="button" value="set font shorthand" on:click={setFontSHValue} />
	<canvas use:line_chart={createChart} on:chart-resize={resizeNotification}
		>{(debug('rendering canvas?'), '')}</canvas
	>
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
