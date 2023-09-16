<script lang="ts">
	import createNS from '@mangos/debug-frontend';
	import { createCanvasStore, createObserverForCanvas } from '$lib/store/canvas-resize-readable';
	import type { ReadableCanvasStore } from '$lib/store/canvas-resize-readable';
	import { onMount } from 'svelte';
	import opentype from 'opentype.js';

	import fontUrl from '../../../../node_modules/@easyfonts/league-junction-typeface/junction-regular.woff';

	fetch(fontUrl)
		.then((response) => response.arrayBuffer())
		.then((bin) => {
			const fontInfo = opentype.parse(bin);
			debug('fontinfo: %o', fontInfo);
		});
	// const inits
	const debug = createNS('statistics/index.svelte');
	const debugMount = createNS('statistics/index.svelte/onMount');

	debug('junction-regular-font "font" is %s', fontUrl);
	//exports
	export let pos: string;

	//local
	let internal: HTMLCanvasElement | null = null;
	let store: ReadableCanvasStore;
	let width = 'n/a';
	onMount(() => {
		debugMount('on mount');
		debugMount('svelte canvas ref has value %o', internal);
		const fnList: never[] = [];
		const disposeObserver = createObserverForCanvas(internal!, fnList);
		store = createCanvasStore(internal!, fnList);

		const ctx = internal!.getContext('2d');
		if (ctx) {
			ctx.font = '100px Junction';
			ctx.textBaseline = 'alphabetic';
			const metrics = ctx.measureText('M');
			debug('text Metrics: %o', metrics);
		}

		return () => {
			debugMount('destroy function called');
			disposeObserver();
		};
	});
	// $: {
	// 	internal;
	// 	debug('internal is %o', internal);
	// 	width = !!internal ? getComputedStyle(internal)?.width : '2-na';
	// }

	debug('roundWidth on renderloop(?) %s', typeof width);
</script>

<div style="--grid-pos: {pos}" class="me">
	Statistics
	<ul>
		<li>physical-width: {$store?.physicalPixelWidth}</li>
		<li>physical-height: {$store?.physicalPixelHeight}</li>
		<li>width: {$store?.width}</li>
		<li>height: {$store?.height}</li>
		<li><span class="fa fa-battery-3" /></li>
		<li>{(debug('rendering ul > li'), width)}</li>
	</ul>
	<canvas bind:this={internal} class={$$props.class}> {debug('rendering canvas?')}</canvas>
</div>

<style>
	.me {
		height: 450px;
		border: 4px darkkhaki dashed;
		width: 100%;
		grid-area: var(--grid-pos);
		display: flex;
		flex-direction: column;
	}

	canvas {
		min-height: 0; /* --> chrome needs this */
		width: 100%;
		height: 100%;
		align-self: stretch;
	}
</style>
