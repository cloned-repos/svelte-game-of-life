<script lang="ts">
	import Chart from '../Chart/index.svelte';
	export let pos: string;
</script>

<div style="--grid-pos: {pos}" class="me">
	<span>Statistics</span>
	<Chart class="me2">Some alt text</Chart>
</div>

<style>
	.me {
		height: 100px;
		border: 4px darkkhaki dashed;
		width: 100%;
		grid-area: var(--grid-pos);
		display: flex;
		flex-direction: column;
	}

	:global(.me2) {
		border: 4px red solid;
		/*width: 100%;*/
		/*flex-basis: 200px;*/
		/*flex-grow: 1;*/
		justify-self: stretch;
		display: block;
		height: auto;
		min-height: 0;
	}
</style>
