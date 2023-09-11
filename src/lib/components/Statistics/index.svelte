<script lang="ts">
	import createNS from '@mangos/debug-frontend';
	import { createCanvasStore, createObserverForCanvas } from '$lib/store/canvas-resize-readable';
	import type { ReadableCanvasStore } from '$lib/store/canvas-resize-readable';
	import { onMount } from 'svelte';

	// const inits
	const debug = createNS('statistics/index.svelte');
	//exports
	export let pos: string;

	//local
	let internal: HTMLCanvasElement | null = null;
	let store: ReadableCanvasStore;
	let width = 'n/a';
	onMount(() => {
		debug('on mount');
		debug('svelte canvas ref has value %o', internal);
		const fnList: never[] = [];
		const disposeObserver = createObserverForCanvas(internal!, fnList);
		store = createCanvasStore(internal!, fnList);
		return () => {
			disposeObserver();
		};
	});
	$: {
		internal;
		debug('internal is %o', internal);
		width = !!internal ? getComputedStyle(internal)?.width : '2-na';
	}
	debug('roundWidth on renderloop(?) %s', typeof width);
</script>

<div style="--grid-pos: {pos}" class="me">
	<span
		>Statistics {$store?.physicalPixelWidth}
		{$store?.physicalPixelHeight}
		{(debug('rendering span?'), width)}</span
	>
	<canvas bind:this={internal} class={$$props.class}> {debug('rendering canvas?')}</canvas>
</div>

<style>
	.me {
		height: 150px;
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
