<script context="module" lang="ts">
	export const prerender = true;
	const { min, max, trunc, round, random } = Math;

	import { afterNavigate } from '$app/navigation';
	import { default as Engine } from '$lib/components/controller/engine/gol-engine';
	import type { AnimationScheduler } from '$lib/components/controller/engine/scheduler';
	import createAnimationTimeScheduler from '$lib/components/controller/engine/scheduler';
</script>

<script lang="ts">
	// svelte
	import { onMount, onDestroy } from 'svelte';

	//3rd party
	import debug from 'debug';

	// app
	import Canvas from '$lib/components/leaf/canvas/index.svelte';
	

	// logging
	const log = debug('main');
	
	// to display statistics
	let nrCells = 0;
	let gridWidth = 1;
	let gridHeight = 1;
	let fps = 0;
	let size = 0;
	let checked = 0;
	let died = 0;
	let latestInstruction = 0;
	let debugCommands: string[][] = [];
	
	// bind canvas (so we can pass this to the "engine")
	let canvas: Canvas;

	// engine
	const engine = new Engine();

	// animationScheduler
	let timeScheduler: AnimationScheduler;

	// handlers
	function up(e: CustomEvent) {
		//log(e.detail);
	}

	function move(e: CustomEvent) {
		//log(e.detail);
	}

	

	onMount(() => {
		// discovered when it is mounted the gw and gh are undefined
		engine.register(canvas);
		timeScheduler = createAnimationTimeScheduler(engine);
		
		// queue
		engine.clear();

		// maybe not do this by default?
		engine.seedGrid(20);
	    
		
		//
		log(`index/onMount: gw=${gridWidth}, gh=${gridHeight}`);
		log(`index/onMount: canvas.name=${canvas?.constructor?.name}`);
		log('index/onMount: seedGrid(0.2)');
		
	});

	onDestroy(() => {
		timeScheduler && timeScheduler.stop();
		engine.unregister();
	});

	
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
	
	


	
	function nextStep(e: MouseEvent) {
		log('nextstep clicked');
		engine.nextStep();
		engine.plotUpdates();
		engine.execute();
		const { debugCommands: _debugCommands, nrInstructionsInQueue } = engine.gridData();
		debugCommands = _debugCommands;
		latestInstruction = nrInstructionsInQueue;
	}

	function seed(e: MouseEvent) {
		engine.seedGrid(50);
		log('seed clicked');
		const { debugCommands: _debugCommands, nrInstructionsInQueue } = engine.gridData();
		debugCommands = _debugCommands;
		latestInstruction = nrInstructionsInQueue;
	}

	function preProcess(e: MouseEvent) {
		log('preProcess clicked');
		engine.condenseInstructionsQueue();
		const { debugCommands: _debugCommands, nrInstructionsInQueue } = engine.gridData();
		debugCommands = _debugCommands;
		latestInstruction = nrInstructionsInQueue;
	}

	function execute(e: MouseEvent) {
		log('execute clicked');
		engine.execute();
		const { debugCommands: _debugCommands, nrInstructionsInQueue } = engine.gridData();
		debugCommands = _debugCommands;
		latestInstruction = nrInstructionsInQueue;
	}

	function doPlot(e: MouseEvent) {
		log('doPlot clicked', e);
		engine.plotUpdates();
		const { debugCommands: _debugCommands, nrInstructionsInQueue } = engine.gridData();
		debugCommands = _debugCommands;
		latestInstruction = nrInstructionsInQueue;
	}

	function clear(_e: MouseEvent) {
		log('clear clicked', _e);
		engine.clear();
		const { debugCommands: _debugCommands, nrInstructionsInQueue } = engine.gridData();
		debugCommands = _debugCommands;
		latestInstruction = nrInstructionsInQueue;
	}

	function go(){
		timeScheduler.start( stats => {
			const { fps: _fps, died: _died, survive, checked: _checked, birth, width, height, debugCommands: _debugCommands, nrInstructionsInQueue} = stats;
			fps = _fps;
			size = width*height;
			nrCells = birth + survive;
			died = _died;
			checked = _checked;
			debugCommands = _debugCommands;
			latestInstruction = nrInstructionsInQueue;
		});
	}

	function stop(){
		timeScheduler.stop();
	}
</script>

<div class:outer-container={true}>
	<table>
		<tr>
		<th>width</th>	
		<th>height</th>
		<th>fps</th>
		<th>size</th>
		<th>alive cells</th>
		<th>deaths</th>
		<th>checked</th>
		</tr>
		<tr>
	      <td>{gridWidth}</td>
		  <td>{gridHeight}</td>
		  <td>{fps}</td>
		  <td>{size}</td>
		  <td>{nrCells}</td>
		  <td>{died}</td>
		  <td>{checked}</td>
		<tr>
	</table>
	<div class:buttonbar={true}>
		<button on:click={go}>START!</button>
		<button on:click={stop}>STOP!</button>
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
	table {
		color: green;
		font-family: monospace;
	}
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
