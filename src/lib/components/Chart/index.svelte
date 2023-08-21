<script lang="ts">
	import oresize_action from './actions';

	function handleEvent(e: CustomEvent<{ width: number; height: number }>) {
		console.info('event: %o', e.detail);
	}
</script>

<div class={$$props.class}>
	<canvas use:oresize_action on:cresize={handleEvent}><slot /></canvas>
</div>

<style>
	.me {
		border: 4px purple dashed;
	}

	canvas {
		min-height: 0; /* --> chrome needs this */
		width: 100%;
		height: 100%;
	}
</style>
