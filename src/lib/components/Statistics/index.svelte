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


	function linconfigChartCreatore_chart(arg0: HTMLCanvasElement, arg1: (canvas: HTMLCanvasElement) => { destroy(): void; }): any {
		throw new Error('Function not implemented.');
	}

	const buttons:[ string, string, number][] = [
		['space','[space]', 0],
		['hp','hp', 1],
		['beta','ß', 2],
		['tick-up-from-baseline','[tick-up-from-base]', 4],
		['tick-down-from-baseline','[tick-down-from-base]', 5],
		['tick-left-from-baseline','[tick-left-from-base]', 6],
		['tick-right-from-baseline','[tick-right-from-base]', 7],
		['tick-left-right-from-baseline','[tick-left-right-from-base]', 14],
		['tick-up-down-from-baseline','[tick-up-down-from-base]', 15],
		['star-around-baseline','[star-around-baseline]', 16],
		['circle-around-baseline','[circle-around-baseline]', 17],
		['arrow-up','↑', 18],
		['arrow-left','←', 19],
		['arrow-down','↓', 20],
		['arrow-right','→', 21],
		['square-root','√', 22],
		['pi','π', 23],
		['delta','Δ', 24],
		['mhu','µ', 25],
		['degree-sign','°', 26],
		['omaga','Ω', 27],
		['rho','ρ', 28],
		['gamma','Γ', 29],
		['theta','θ', 30 ],
		['lambda','λ', 31],
		['exclamation','!', 0x21],
		['double-quote-mark','"', 0x22],
		['pound','#', 0x23],
		['dollar','$', 0x24],
		['percent','%', 0x25],
		['ampersand','&', 0x26],
		['right-single-quote-mark','(rsqm) ’', 0x27],
		['left-parenthesis','(', 0x28 ],
		['right-parenthesis',')', 0x29],
		['asterisk', '*', 0x2a],
		['plus','+', 0x2b],
		['comma',',', 0x2c],
		['minus','-', 0x2d],
		['period','.', 0x2e],
		['forward-slash','/', 0x2f],
		['0','0', 0x30],
		['1','1', 0x31],
		['2','2', 0x32],
		['3','3', 0x33],
		['4','4', 0x34],
		['5','5', 0x35],
		['6','6', 0x36],
		['7','7', 0x37],
		['8','8', 0x38],
		['9','9', 0x39],
		['colon',':', 0x3a],
		['semicolon',';', 0x3b],
		['less-then','<', 0x3c],
		['equal','=', 0x3d],
		['greater-then','>', 0x3e],
		['question-mark','?', 0x3f],
		['at-sign','@', 0x40],
		['A','A', 0x41],
		['B','B', 0x42],
		['C','C', 0x43],
		['D','D', 0x44],
		['E','E', 0x45],
		['F','F', 0x46],
		['G','G', 0x47],
		['H','H', 0x48],
		['I','I', 0x49],
		['J','J', 0x4a],
		['K','K', 0x4b],
		['L','L', 0x4c],
		['M','M', 0x4d],
		['N','N', 0x4e],
		['O','O', 0x4f],
		['P','P', 0x50],
		['Q','Q', 0x51],
		['R','R', 0x52],
		['S','S', 0x53],
		['T','T', 0x54],
		['U','U', 0x55],
		['V','V', 0x56],
		['W','W', 0x57],
		['X','X', 0x58],
		['Y','Y', 0x59],
		['Z','Z', 0x5a],
		['left-bracket','[', 0x5b],
        ['backslash', '\\', 0x5c],
		['right-bracket', ']', 0x5d],
		['caret','^',0x5e],
    	['underline-backward','^',0x5f],
		['backtick','`',0x60],
		['a','a', 0x61],
		['b','b', 0x62],
		['c','c', 0x63],
		['d','d', 0x64],
		['e','e', 0x65],
		['f','f', 0x66],
		['g','g', 0x67],
		['h','h', 0x68],
		['i','i', 0x69],
		['j','j', 0x6a],
		['k','k', 0x6b],
		['l','l', 0x6c],
		['m','m', 0x6d],
		['n','n', 0x6e],
		['o','o', 0x6f],
		['p','p', 0x70],
		['q','q', 0x71],
		['r','r', 0x72],
		['s','s', 0x73],
		['t','t', 0x74],
		['u','u', 0x75],
		['v','v', 0x76],
		['w','w', 0x77],
		['x','x', 0x78],
		['y','y', 0x79],
		['z','z', 0x7a],
		['z','z', 0x7a],
		['left-brace','{', 0x7b],
		['broken-bar','|', 0x7c],
		['right-brace','}', 0x7d],
		['unknown-char','[uc]', 0xb9],
		['underline-forward', '_', 0xdf],
	]
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
		{#each buttons as [id, display, code], i}
			<button name={id} on:click={() => {}}>{display}</button>
		{/each}
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
