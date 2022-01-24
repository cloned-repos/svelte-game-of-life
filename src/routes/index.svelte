<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	// app
	import Canvas from '$lib/components/Canvas.svelte';
	import debug from 'debug';
    const ns = debug('main');
	ns('hello'); // put in localStorage.debug = "main" and you will see the text
	
</script>

<div class:inner-container={true}>
	<Canvas />
</div>

<style>
	.inner-container {
		/*border-radius:2px;*/
		min-width: 200px;
		width: calc(100% - 20px);
		height: calc(100% - 20px);
		font-family: 'Raleway';
	}
</style>
