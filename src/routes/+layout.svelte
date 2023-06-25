<!-- runs on client and potentially on server -->
<script context="module" lang="ts">
	import Statistics from '$lib/components/Statistics/index.svelte';
	import ButtonActionBar from '$lib/components/ButtonActionBar/index.svelte';
	import Status from '$lib/components/Status/index.svelte';
	import SideBar from '$lib/components/SideBar/index.svelte';
</script>

<svelte:head>
	<title>Svelte Game of Life</title>
</svelte:head>

<div class="outer-container">
	<ButtonActionBar pos="button_action_bar" />

	<SideBar pos="sidebar" />
	<Status pos="status" />
	<Statistics pos="statistics" />
	<!--
	<Statistics pos="statistics" />
	<Status pos="status" />
	-->
	<!--
		<slot />
	-->
</div>

<style>
	@import './css/app.css';

	:global(.outer-container) {
		width: 100%;
		height: 100%;
		display: grid;
		border: 4px black dashed;
		background-color: lightblue;
		grid:
			'sidebar statistics' auto
			'sidebar button_action_bar' auto
			'sidebar canvas' 1fr
			'status  status' auto
			/ auto 1fr;
	}
</style>
