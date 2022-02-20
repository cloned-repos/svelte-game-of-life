<script context="module" lang="ts">
	export const prerender = true;

	import { default as Engine, DrawInstruction } from '$lib/components/controller/gol-engine';
</script>

<script lang="ts">
	// app
	import Canvas from '$lib/components/leaf/canvas/index.svelte';
	import debug from 'debug';
	import { onMount } from 'svelte';
	
	const ns = debug('main');
	ns('hello'); // put in localStorage.debug = "main" and you will see the text
	let gridWidth: number;
	let gridHeight: number;
	let nrCells: number;
	let canvas: Canvas;
	let firstDrawAfterMount = false;

	const engine = new Engine();

	// handlers
	function up(e: CustomEvent) {
		//console.log(e.detail);
	}

	function move(e: CustomEvent) {
		//console.log(e.detail);
	}

	// let the canvas tell the HOC what it its initial size is, and base a decision on that
	function hasResized({ type, detail: { gridHeight: gh, gridWidth: gw } }: CustomEvent) {
		// this is how subsequent inforation about the grid reaches HOC, will be calculated on mount and dispatched
		console.log(`index/event/resize ${type}, width(event)=${gw} , height(event)=${gh}, gridHeight=${gridHeight}, gridWidth=${gridWidth}`);
		engine.updateGridSize(gw, gh);
		
		if (firstDrawAfterMount){
			firstDrawAfterMount = false;
			canvas.clear();
			engine.seedGrid(0.2);
			console.log('index/event/resize first draw after mount, clear and seed(0.2)');
		}
		nrCells = canvas.update(engine.gridData());
		cnt++;
	}

	onMount(() => {
		firstDrawAfterMount = true;
		// discovered when it is mounted the gw and gh are undefined
		console.log(`index/onMount: gw=${gridWidth}, gh=${gridHeight}`);
		console.log(`index/onMount: canvas.name=${canvas?.constructor?.name}`);
		
		//
		start();
	});

	let fps = 0;

	/*function delay(ts) {
		return new Promise((resolve) => {
			setTimeout(resolve, ts);
		});
	}*/

	function start(prevTs: number = 0) {
		requestAnimationFrame((ts) => {
			if (prevTs) {
				fps = Math.round(1000 / (ts - prevTs));
			}
			// JKF do Engine NextStep here
			nrCells = canvas.update(engine.gridData());
			prevTs = ts;
			start(ts);
		});
	}

	/*
		1	  0.645
		0.95  0.6124
		0.9   0.58297
		0.8   0.550
		0.7   0.50
		0.6   0.45
		0.5   0.393
		0.4   0.32
		0.3   0.259
		0.2   0.180
		0.1	  0.095
		0.05  0.0488
		0.02  0.0198
	*/
	let cnt = 0;
	nrCells = 0;
	gridWidth = 1;
	gridHeight = 1;

	$: {
		if (canvas){
		}
		//nrCells = engine.seedGrid(0.04).length;
		nrCells = nrCells;
		size = size;
		cnt;
	}

	$: fraction = Math.round((1e5 * nrCells) / size) / 1e5;
	$: size = gridWidth * gridHeight;

	
</script>

<div class:outer-container={true}>
   <span>width:{gridWidth}, height:{gridHeight} fps:{fps}, nrBlocks={size} nrCells={nrCells} fraction={fraction}</span>

	<div class:inner-container={true}>
		<Canvas
			bind:this={canvas}
			bind:gridWidth
			bind:gridHeight
			on:up={up}
			on:move={move}
			on:resized={hasResized}
		/>
	</div>
</div>

<style>
	span {
		color: white;
		display: block;
		flex-grow: 0;
		font-size: 12px;
	}

	.outer-container {
		border: 10px solid red;
		width: 100%;
		height: 100%;
		align-items: stretch;
		display: flex;
		flex-direction: column;
	}

	.inner-container {
		writing-mode: vertical-lr;
		border: 10px solid orange;
		width: 100%;
		height: 100%;
		font-family: 'Raleway';
	}
</style>
