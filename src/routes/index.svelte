<script context="module" lang="ts">
	export const prerender = true;
	const { min, max, trunc, round, random } = Math;

	import { afterNavigate } from '$app/navigation';
	import { default as Engine } from '$lib/components/controller/engine/gol-engine';
</script>

<script lang="ts">
	// app
	import Canvas from '$lib/components/leaf/canvas/index.svelte';
	import debug from 'debug';
	import { onMount, onDestroy } from 'svelte';

	const ns = debug('main');
	ns('hello'); // put in localStorage.debug = "main" and you will see the text
	let gridWidth: number;
	let gridHeight: number;
	let nrCells: number;
	let canvas: Canvas;

	const engine = new Engine();

	// handlers
	function up(e: CustomEvent) {
		//console.log(e.detail);
	}

	function move(e: CustomEvent) {
		//console.log(e.detail);
	}

	// let the canvas tell the HOC what it its initial size is, and base a decision on that
	/*function hasResized({ type, detail: { gridHeight: gh, gridWidth: gw } }: CustomEvent) {
		// this is how subsequent inforation about the grid reaches HOC, will be calculated on mount and dispatched
		console.log(
			`index/event/resize ${type}, width(event)=${gw} , height(event)=${gh}, gridHeight=${gridHeight}, gridWidth=${gridWidth}`
		);
		//engine.updateGridSize(gw, gh);
		//engine.plotUpdates();
		//cnt++;
	}*/

	onMount(() => {
		// discovered when it is mounted the gw and gh are undefined
		engine.register(canvas);
		// queue
		engine.clear();
		engine.seedGrid(20);
		//
		console.log(`index/onMount: gw=${gridWidth}, gh=${gridHeight}`);
		console.log(`index/onMount: canvas.name=${canvas?.constructor?.name}`);
		console.log('index/onMount: seedGrid(0.2)');
		cnt++;
		// next macrotask
		//setTimeout(start);
	});

	afterNavigate;

	onDestroy(() => {
		engine.unregister();
	});

	let fps = 0;
	let activeAnimationFrame;
	function start(prevTs: number = 0) {
		activeAnimationFrame = requestAnimationFrame((ts) => {
			if (prevTs) {
				fps = round(1000 / (ts - prevTs));
			}
			engine.condenseInstructionsQueue();
			engine.nextStep();
			engine.plotUpdates();
			engine.execute();
			cnt++;
			prevTs = ts;
			if (activeAnimationFrame !== null){
				start(ts);
			}
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
	let latestInstruction = 0;

	let debugCommands: string[][] = [];

	$: {
		//nrCells = engine.seedGrid(0.04).length;
		nrCells = nrCells;
		size = size;
		debugCommands = engine.debugGetCommandsInQueue();
		latestInstruction = engine.latestInstruction;
		cnt;
	}

	$: fraction = round((1e5 * nrCells) / size) / 1e5;
	$: size = gridWidth * gridHeight;

	function nextStep(e: MouseEvent) {
		console.log('nextstep clicked');
		engine.nextStep();
		engine.plotUpdates();
		engine.execute();
		cnt++;
	}

	function seed(e: MouseEvent) {
		engine.seedGrid(50);
		console.log('seed clicked');
		cnt++;
	}

	function preProcess(e: MouseEvent) {
		console.log('preProcess clicked');
		engine.condenseInstructionsQueue();
		cnt++;
	}

	function execute(e: MouseEvent) {
		console.log('execute clicked');
		engine.execute();
		cnt++;
	}

	function doPlot(e: MouseEvent) {
		console.log('doPlot clicked', e);
		engine.plotUpdates();
		cnt++;
	}

	function clear(_e: MouseEvent) {
		console.log('clear clicked', _e);
		engine.clear();
		cnt++;
	}

	function testPattern(_e: MouseEvent) {
		console.log('testpattern clicked', _e);
		const data = engine.gridData();

		/*
	public gridData(): GridData {
        return {
            grid: this.playField, // return copy
            index: this.playFieldIndex,
            updates: this.updateIndex,
            width: this.width,
            height: this.height,
            colors: this.colors
        };
    }
	*/

		const { width } = engine;
		engine.playField.fill(0);
		engine.playFieldIndex = new Uint16Array(9 * 3);
		engine.updateIndex = new Uint16Array( 9*3 );
		
		// print single block
		let cursorIndex = 0;
		let cursorUpdates = 0;
		for (let x = 0; x < 3; x++) {
			for (let y = 0; y < 3; y++) {
				const coords = width * y + x;
				engine.playField[coords] = 2;
				//
				engine.playFieldIndex[cursorIndex] = 2;
				engine.playFieldIndex[cursorIndex + 1] = x;
				engine.playFieldIndex[cursorIndex + 2] = y;
				cursorIndex += 3;
				//
				engine.updateIndex[cursorUpdates] = 2;
				engine.updateIndex[cursorUpdates + 1] = x;
				engine.updateIndex[cursorUpdates + 2] = y;
				cursorUpdates += 3;
			}
		}




		engine.plotUpdates();
		cnt++;
	}

	function go(){
		engine.plotUpdates();
		engine.condenseInstructionsQueue();
		engine.execute();
		start();
	}
</script>

<div class:outer-container={true}>
	<span>width:{gridWidth}, height:{gridHeight} {fps}, nrBlocks={size} {nrCells} {fraction}</span>
	<div class:buttonbar={true}>
		<button on:click={go}>START!</button>
		<button on:click={testPattern}>test pattern</button>
		<button on:click={nextStep}>next-step</button>
		<button on:click={clear}>clear field</button>
		<button on:click={seed}>seed</button>
		<button on:click={preProcess}>pre-process command queue</button>
		<button on:click={execute}>execute command queue</button>
		<button on:click={doPlot}>plot-the-results-of-executing-command-queue</button>
	</div>
	<div class:inner-container={true}>
		<Canvas
			bind:this={canvas}
			bind:gridWidth
			bind:gridHeight
			on:up={up}
			on:move={move}
			on:resized
		/>
	</div>
	<div id="console">
		<span>{latestInstruction}</span>
		<ul>
			{#each debugCommands as command, i}
				<li><span>{command[0]}</span><span>{command[1]}</span></li>
			{/each}
		</ul>
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
	.buttonbar {
		background: yellow;
	}

	.inner-container {
		writing-mode: vertical-lr;
		border: 10px solid orange;
		width: 100%;
		height: 100%;
		font-family: 'Raleway';
	}

	#console {
		position: fixed;
		width: 200px;
		height: 600px;
		background: rgba(0, 0, 0, 0.4);
		right: 0px;
		bottom: 0px;
		overflow-y: scroll;
	}

	#console > ul {
		display: table;
	}
	#console > ul > li {
		display: table-row;
	}
	#console > ul > li > span {
		display: table-cell;
	}
</style>
