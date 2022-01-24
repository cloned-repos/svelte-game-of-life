<script context="module" lang="ts">
	export const prerender = true;

	// singletons so belongs here
</script>

<script lang="ts">
	// app
	import Canvas from '$lib/components/Canvas.svelte';
	import { onMount } from 'svelte';
	import debug from 'debug';
    const ns = debug('main');
	ns('hello');
	
</script>

<div class:inner-canvas={true}>
	<Canvas />
</div>

<style>
	.inner-canvas {
		/*border-radius:2px;*/
		min-width: 200px;
		width: calc(100% - 20px);
		height: calc(100% - 20px);
		font-family: 'Raleway';
	}
</style>
