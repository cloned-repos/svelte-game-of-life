<script context="module" lang="ts">
	// app
	import { animationFrameFired } from '$lib/store/animationFrameSlice';
	import { store, startAnimFrameDispatcher, redux2SvelteReadable } from '$lib/store';
	// app types
	import type { RootState } from '$lib/store';
	import type { Store } from '@reduxjs/toolkit';
	import type { AnimationState } from '$lib/store/animationFrameSlice';
	// svelte libs
	import { readable } from 'svelte/store';
	import { onMount } from 'svelte';
</script>

<script lang="ts">
	// dt is like a svelte "readonly" store,
	const dt = redux2SvelteReadable<RootState, AnimationState>(store, (store) => store.animFrame);

	onMount(() => {
		const cancel = startAnimFrameDispatcher();
		return cancel; // same as useEffect in react, can return a function
	});
</script>

<div class="wrapper">
	<h3>{$dt}</h3>
	<!--
		On Canvas
		from:
			https://www.w3.org/TR/2010/WD-html5-20100624/the-canvas-element.html#:~:text=The%20intrinsic%20dimensions%20of%20the,to%20fit%20this%20layout%20size.
			
			"The width attribute defaults to 300, and the height attribute defaults to 150."
	-->
	<canvas class="me">Alt text</canvas>
</div>

<style>
	.wrapper {
		opacity: 0.5;
		min-height: 0;
		border: 4px solid brown;
	}
	.me {
		min-height: 0; /* --> only chrome needs this (tested on chrome and firefox)  */
		border: 4px solid yellow;
		width: 100%;
		height: 100%;
		display: block;
		position: relative;
		z-index: -1;
	}
	/*.skeleton {
		background-color: #ccc;
		background-image: linear-gradient(90deg, #ddd 0px, #e8e8e8 40px, #ddd 80px);
		background-size: 600px;
		animation: shine-avatar 1.6s infinite linear;
	}*/
	@keyframes shine-lines {
		0% {
			background-position: -100px;
		}
		40%,
		100% {
			background-position: 140px;
		}
	}
</style>
