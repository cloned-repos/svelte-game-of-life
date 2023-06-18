<script context="module" lang="ts">
	import { animationFrameFired } from '$lib/store/animationFrameSlice';
	import { store, startAnimFrameDispatcher, redux2SvelteReadbale } from '$lib/store';
	import type { RootState } from '$lib/store';
	import type { Store } from '@reduxjs/toolkit';
	import type { AnimationState } from '$lib/store/animationFrameSlice';

	/*export const prerender = true;
	//const { min, max, trunc, round, random } = Math;

	import type { Stats } from '$lib/components/controller/engine/scheduler.ots';
	import { default as Engine } from '$lib/components/controller/engine/gol-engine';
	import type { AnimationScheduler } from '$lib/components/controller/engine/scheduler.ots';
	import createAnimationTimeScheduler from '$lib/components/controller/engine/scheduler.ots';

	// engine
	const engine = new Engine();*/
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	import { readable } from 'svelte/store';

	const dt = redux2SvelteReadbale<RootState, AnimationState>(store, (store) => store.animFrame);

	onMount(() => {
		const cancel = startAnimFrameDispatcher();
		return cancel;
	});

	/*
	// app
	import Canvas from '$lib/components/leaf/canvas/indexo.osvelte';

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

	// nr of instructions in the queue
	let latestInstruction = 0;

	// commands in the command queue
	let debugCommands: string[][] = [];

	// bind canvas (so we can pass this to the "engine")
	let canvas: Canvas;

	// animationScheduler
	let timeScheduler: AnimationScheduler;

	// handlers
	function canvasMouseUp(e: CustomEvent) {
		//log(e.detail);
	}

	function canvasMouseMove(e: CustomEvent) {
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

	function nextStep(e: MouseEvent) {
		log('nextstep clicked');
		engine.nextTick();
		engine.plotUpdates();
		engine.condenseInstructionsQueue();
		const { debugCommands: _debugCommands, nrInstructionsInQueue } = engine.gridData();
		// update this is how svelte makes things reactive
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

	function go() {
		timeScheduler.registerHooks({
			afterExecution() {
				this.nextTick();
			},
			metrics(stats: Stats) {
				const {
					fps: _fps,
					died: _died,
					survive,
					checked: _checked,
					birth,
					width,
					height,
					debugCommands: _debugCommands,
					nrInstructionsInQueue
				} = stats;
				fps = _fps;
				size = width * height;
				nrCells = birth + survive;
				died = _died;
				checked = _checked;
				debugCommands = _debugCommands;
				latestInstruction = nrInstructionsInQueue;
			}
		});
		timeScheduler.start();
	}

	function stop() {
		timeScheduler.stop();
	}
	*/
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
			<td>{$dt.lastFired}</td>
			<td>{$dt.count}</td>
			<td>{$dt.dt}</td>
			<!--<td>{size}</td>
			<td>{nrCells}</td>
			<td>{died}</td>(())
			<td>{checked}</td>
		-->
		</tr><tr />
	</table>
	<!--
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
-->
	<div class:inner-container={true}>
		<!--
		<Canvas
			bind:this={canvas}
			bind:gridWidth
			bind:gridHeight
			on:up={canvasMouseUp}
			on:move={canvasMouseMove}
			on:resized
		/>
		-->
	</div>
	<!--
	<div id="console">
		<span>{latestInstruction}</span>
		<ul>
			{#each debugCommands as command, i}
				<li><span>{command[0]}</span><span>{command[1]}</span></li>
			{/each}
		</ul>
	</div>
	-->
</div>

<style>
	table {
		grid-area: stats;
		color: green;
		font-family: monospace;
	}
	.outer-container {
		width: 100%;
		height: 100%;
		display: grid;

		grid:
			'stats stats stats'
			'bar bar bar'
			'canvas canvas canvas' 1fr
			'canvas canvas canvas' 1fr
			'canvas canvas canvas' 1fr
			/ 1fr 1fr 1fr;
	}
	.buttonbar {
		grid-area: bar;
	}

	.inner-container {
		grid-area: canvas;
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
