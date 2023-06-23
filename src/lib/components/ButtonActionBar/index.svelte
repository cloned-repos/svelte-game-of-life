<script lang="ts">
	export let pos: string;
</script>

<div style="--grid-pos: {pos}" class="me">
	<span>ButtonActionBar</span>
</div>

<style>
	.me {
		border: 4px orange dashed;
		width: 100%;
		grid-area: --var(grid-pos);
	}
</style>
