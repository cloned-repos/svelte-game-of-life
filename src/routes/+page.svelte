<script context="module" lang="ts">
	// app
	import { animationFrameFired } from '$lib/store/animationFrameSlice';
	import { store, startAnimFrameDispatcher, redux2SvelteReadable } from '$lib/store';
	// app types
	import type { RootState } from '$lib/store';
	import type { Store } from '@reduxjs/toolkit';
	import type { AnimationState } from '$lib/store/animationFrameSlice';
	// svelte libs
	import { onMount } from 'svelte';
</script>

<script lang="ts">
	const frame = redux2SvelteReadable<RootState, AnimationState>(
		store,
		(store) => store.animFrame
	);

	onMount(() => {
		const cancel = startAnimFrameDispatcher();
		return cancel; // same as useEffect in react, can return a function
	});
</script>

<div class="wrapper">
	{JSON.stringify($frame)}
	<canvas class="me" />
</div>

<style>
	.wrapper {
		opacity: 0.5;
		min-height: 0;
		/*border: 4px solid brown;*/
		display: flex;
		flex-direction: column;
	}
	.me {
		min-height: 0; /* --> only chrome needs this (tested on chrome and firefox)  */
		/*border: 4px solid yellow;*/
		width: 100%;
		height: min-content;
		display: block;
		height: 100%;
		/*position: relative;*/
	}
</style>
