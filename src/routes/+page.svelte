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
	const dt = redux2SvelteReadable<RootState, AnimationState>(store, (store) => store.animFrame);

	onMount(() => {
		const cancel = startAnimFrameDispatcher();
		return cancel; // same as useEffect in react, can return a function
	});
</script>
