<script lang="ts">
	import createNS from '../../../debug-frontend';
	import line_chart from '$lib/charts/action';
	import type { CanvasSize, ChartDebugInfo } from '$lib/charts/types';
	import {
		configChartCreator,
		standardAffectOptions,
		standardDevicePixelAspectRatio
	} from '$lib/charts/helper';
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
	const { getChart, createChart } = configChartCreator(
		standardDevicePixelAspectRatio,
		standardAffectOptions
	);

	function resizeNotification(event: CustomEvent<CanvasSize>) {
		state = event.detail;
	}

	function onDebug(event: CustomEvent<ChartDebugInfo>) {}

	function showQueue(e: Event) {
		const chart = getChart();
		console.log('show queue', chart.getInfo());
	}

	function doChartResize(e: Event) {
		const chart = getChart();
		chart.processChartResize();
	}

	function stopAnimFrame(e: Event) {
		const chart = getChart();
		chart.stopSyncOnAnimationFrame();
	}

	function startChartAnimFrame(e: Event) {
		const chart = getChart();
		chart.syncOnAnimationFrame();
	}

	function doChartRender(e: Event) {
		const chart = getChart();
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
	</ul>
	<div class="keyboard">
		<button name="space">{'[space]'}</button>
		<button name="hp"><i>{'hp'}</i></button>
		<button name="beta">{'ß'}</button>
		<button name="tick-up-from-baseline">{'[tick-up-from-base]'}</button>
		<button name="tick-down-from-baseline">{'[tick-down-from-base]'}</button>
		<button name="tick-up-from-baseline">{'[tick-up-from-base]'}</button>
		<button name="tick-left-from-baseline">{'[tick-left-from-base]'}</button>
		<button name="tick-right-from-baseline">{'[tick-right-from-base]'}</button>
		<button name="tick-left-right-from-baseline">{'[tick-left-right-from-base]'}</button>
		<button name="tick-up-down-from-baseline">{'[tick-up-down-from-base]'}</button>
		<button name="star-around-baseline">{'[star-around-baseline]'}</button>
		<button name="circle-around-baseline">{'[circle-around-baseline]'}</button>
		<button name="arrow-up">{'↑'}</button>
		<button name="arrow-left">{'←'}</button>
		<button name="arrow-down">{'↓'}</button>
		<button name="arrow-right">{'→'}</button>
		<button name="square-root">{'√'}</button>
		<button name="pi">{'π'}</button>
		<button name="delta">{'Δ'}</button>
		<button name="mhu">{'µ'}</button>
		<button name="mhu">{'µ'}</button>
		<button name="degree-sign">{'°'}</button>
		<button name="omaga">{'Ω'}</button>
		<button name="rho">{'ρ'}</button>
		<button name="gamma">{'Γ'}</button>
		<button name="theta">{'θ'}</button>
		<button name="lambda">{'λ'}</button>
		<button name="exclemation">{'!'}</button>
		<button name="double-quote-mark">{'"'}</button>
		<button name="right-single-quote-mark">{'(rsqm) ’'}</button>
		<button name="left-single-quote-mark">{'(lsqm) ‘'}</button>
		<button name="left-single-quote-mark">{'('}</button>
		<button name="left-parenthesis">{'('}</button>
		<button name="right-parenthesis">{')'}</button>
		<button name="asterisk">{'*'}</button>
		<button name="plus">{'+'}</button>
		<button name="comma">{','}</button>
		<button name="minus">{'-'}</button>
		<button name="period">{'.'}</button>
		<button name="forward-slash">{'/'}</button>
		<button name="zero">{'0'}</button>
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
