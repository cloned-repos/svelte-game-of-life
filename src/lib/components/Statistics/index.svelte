<script lang="ts">
	import createNS from '@mangos/debug-frontend';
	import { onMount } from 'svelte';
	import line_chart from '$lib/charts/line-chart/action';
	import type { CanvasSizeInfomation, ChartOptions } from '$lib/charts/line-chart/types';

	// const inits
	const debug = createNS('statistics/index.svelte');

	export let pos: string;

	let width = 'n/a';

	let state: CanvasSizeInfomation;

	function resizeNotification(event: CustomEvent<CanvasSizeInfomation>) {
		state = event.detail;
	}

	let inputValue: string;
	let chartProps: ChartOptions = { data: null, font: { family: 'menu' } };
	function handleInputChange(e: Event) {
		inputValue = (e.target as HTMLInputElement).value;
	}

	function setFontSHValue(e: Event) {
		chartProps = {
			data: null,
			font: { family: 'Junction', size: '100px', style: 'normal', weight: 'bold' }
		};
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
	<canvas use:line_chart={chartProps} on:chart-resize={resizeNotification}
		>{(debug('rendering canvas?'), '')}</canvas
	>
</div>

<style>
	.me {
		height: 450px;
		border: 4px darkkhaki dashed;
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
