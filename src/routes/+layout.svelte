<!-- runs on client and potentially on server -->
<script context="module" lang="ts">
	import font_bold from '../../node_modules/@easyfonts/league-junction-typeface/junction-bold.woff';
	import font_regular from '../../node_modules/@easyfonts/league-junction-typeface/junction-regular.woff';
	import font_light from '../../node_modules/@easyfonts/league-junction-typeface/junction-light.woff';
	//
	import Statistics from '$lib/components/Statistics/index.svelte';
	import ButtonActionBar from '$lib/components/ButtonActionBar/index.svelte';
	import Status from '$lib/components/Status/index.svelte';
	import SideBar from '$lib/components/SideBar/index.svelte';
	//
	import createNS, { register } from '@mangos/debug-frontend';
	import createBackEndMock from './debug-backend';
	register(createBackEndMock());
	const debug = createNS('app');
	import './css/app.css';
	import '@easyfonts/font-awesome-v6/solid.css';
	import '@easyfonts/font-awesome-v6/defs.css';
	import '@easyfonts/league-junction-typeface';
</script>

<svelte:head>
	<link rel="preload" href={font_bold} as="font" type="font/woff" crossorigin="true" />
	<link rel="preload" href={font_regular} as="font" type="font/woff" crossorigin="true" />
	<link rel="preload" href={font_light} as="font" type="font/woff" crossorigin="true" />
</svelte:head>

<div class="outer-container">
	<ButtonActionBar pos="button_action_bar" />
	<SideBar pos="sidebar" />
	<Status pos="status" />
	<Statistics pos="statistics" />
	<slot />
</div>

<style>
	:global(.outer-container) {
		width: 100%;
		height: 100%;
		display: grid;
		/*border: 4px black dashed;*/
		/*background-color: lightblue;*/
		grid:
			'sidebar statistics' auto
			'sidebar button_action_bar' auto
			'sidebar canvas' 1fr
			'status  status' auto
			/ auto 1fr;
	}
</style>
