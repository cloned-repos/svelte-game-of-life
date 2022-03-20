<script lang="ts" context="module">
	import type { GridData } from '$lib/components/controller/engine/gol-engine';
	const { max } = Math;
	import { drawBlocks, resize, calcGridSize } from './canvas-helper';
	import type { GridSize } from './canvas-helper';
	let cntDestroyed = 0;
</script>

<script lang="ts">
	import {
		beforeUpdate,
		afterUpdate,
		onDestroy,
		tick,
		onMount,
		createEventDispatcher
	} from 'svelte';

	let canvas: HTMLCanvasElement = null;

	export let cellWidth = 6;
	export let cellHeight = 6;
	export let cellContentWidth = 4;
	export let cellContentHeight = 4;
	export let paddingX = 4;
	export let paddingY = 4;
	export let gridColor = 'rgb(245, 247, 249)';
	
	export let gridHeight: number;
	export let gridWidth: number;

	let globalCTX: CanvasRenderingContext2D = null;
	let resizeObserver: ResizeObserver = null;

	beforeUpdate(() => {
		//	console.log('%c Canvas/beforeUpdate', 'color:red;');
	});

	afterUpdate(() => {
		//	console.log('%c Canvas/afterUpdate', 'color:red');
	});

	const dispatch = createEventDispatcher();

	function getGridSizeFromCanvasViewPort(): GridSize | null {
		const blk_w =
			(canvas.width - paddingX * 2 - ((canvas.width - paddingX * 2) % cellWidth)) / cellWidth;
		const blk_h =
			(canvas.height - paddingY * 2 - ((canvas.height - paddingY * 2) % cellHeight)) / cellHeight;
		return {
			w: canvas.width,
			h: canvas.height,
			blk_w: max(0, blk_w),
			blk_h: max(0, blk_h)
		};
	}

	onMount(() => {
		// does canvas exist
		const currentSize = getGridSizeFromCanvasViewPort();

		console.log('Canvas/life/onmount: canvas=', currentSize);
		//console.log(`Canvas/life/onmount: grid-with=${gridWidth}, gridHeight=${gridHeight}`);
		globalCTX = canvas.getContext('2d');
		resizeObserver = new ResizeObserver(() => {
			//console.log(`Canvas/ResizeObserver: block-grid-with=${gridWidth}, gridHeight=${gridHeight}`);
			//console.log(`Canvas/ResizeObserver: intrinic-pixel-width=${canvas.width}, intrinsic-pixel-height=${canvas.height}`);
			//console.log(`Canvas/ResizeObserver: pixel-width=${canvas.clientWidth}, pixel-height=${canvas.clientHeight}`);
			
			// the canvas has a part that is "kneejurky" reflex,
			// 		-> this part is intrinsic to the canvas not under control
			//		-> of any HOC
			const currentGridSize = getGridSizeFromCanvasViewPort();
			//  if we resize canvas with canvas.length, canvas.height, it gets cleared
			// 		so make "backup"
			//      the default 1 is to make it not "break" the "getImageData" function
			const backupData = globalCTX.getImageData(0, 0, canvas.width || 1, canvas.height || 1);
			// set new intrinsic width
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			// put it back "backup" image
			globalCTX.putImageData(backupData, 0, 0);
			// get new grid size
			const newSize = getGridSizeFromCanvasViewPort();
			// update current props
			gridHeight = newSize.blk_h;
			gridWidth = newSize.blk_w;
			// this function will paint new grid blocks if the canvas enlarged by resizing
			// 	-> taking into account that grid blocks have a size, 
			//	-> there is not always new additions of grid blocks when canvas grows by
			//	-> a few pixels
			//  
			//  return value is true if there were blocks added (or deleted) from the grid
			//		-> in any direction
			const isResized = resize(
				globalCTX,
				currentGridSize,
				newSize,
				paddingY,
				cellHeight,
				paddingX,
				cellWidth,
				cellContentWidth,
				cellContentHeight,
				gridColor
			);
			// notify HOC if the "block grid" changed
			if (isResized) {
				dispatch('resized', { gridWidth: newSize.blk_w, gridHeight: newSize.blk_h });
			}
			//console.log(
			//	`Canvas/ResizeObserver: after resize dispatched,  grid-with=${gridWidth}, gridHeight=${gridHeight}`
			//);
			
		});
		resizeObserver.observe(canvas);
	});

	onDestroy(() => {
		resizeObserver && resizeObserver.unobserve(canvas);
		const prefix = `Canvas/life/destroyed/${cntDestroyed++}`
		console.log(`${prefix}: canvas=${canvas?.constructor?.name}`);
		console.log(`${prefix}: globalCTX=${globalCTX}`);
	});

	export function sliceCanvas(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		w: number,
		h: number
	): ImageData {
		// the right and bottom pixels inclusive
		// 0--1--2--3--4--5--6      , x= 3 w = 3, h= 3
		//          4
		// calculate what pixel we want ("left" side of the pixel and "top" side of the pixel)
		const sx = x - ((w - 1) >> 1);
		const sy = y - ((h - 1) >> 1);
		return ctx.getImageData(sx, sy, w, h);
	}

	export function clear() {
		if (!globalCTX) {
			return;
		}
		globalCTX.clearRect(0, 0, canvas.width, canvas.height);
		globalCTX.globalAlpha = 1; // this can be a fraction of 1?
		globalCTX.lineWidth = 1;
		globalCTX.lineCap = 'square';
		globalCTX.fillStyle = gridColor;
		const size = getGridSizeFromCanvasViewPort();
		drawBlocks(
			globalCTX,
			0,
			0,
			size.blk_w,
			size.blk_h,
			paddingY,
			cellHeight,
			paddingX,
			cellWidth,
			cellContentWidth,
			cellContentHeight
		);
	}

	export function plotTheUpdates(data: GridData) {
		const { updates, colors } = data;
		if (!canvas) {
			return;
		}

		if (updates.length % 3 !== 0){
			throw new Error('updates.length not multiple or 3, '+ updates.length )
		}
		
		for (let i = 0; i < updates.length; i+=3){
			const idxColor = updates[i];
			const xcor = updates[i+1];
			const ycor = updates[i+2];
			const realColor = colors[idxColor];
			plot(xcor,ycor, realColor);
		}

		return updates.length/3;
	}

	function plot(x: number, y: number, color:string){
			globalCTX.fillStyle = color;
			globalCTX.fillRect(
				paddingX + x * cellWidth,
				paddingY + y * cellHeight,
				cellContentWidth,
				cellContentHeight
			);
		}
	
	function mouseMove(e: MouseEvent) {
		dispatch('move', {
			...calcGridSize(e, paddingX, paddingY, cellWidth, cellHeight, gridWidth, gridHeight),
			buttons: e.buttons
		});
	}
	function mouseDown(e: MouseEvent) {
		dispatch('down', {
			...calcGridSize(e, paddingX, paddingY, cellWidth, cellHeight, gridWidth, gridHeight)
		});
	}
	function mouseUp(e: MouseEvent) {
		dispatch('up', {
			...calcGridSize(e, paddingX, paddingY, cellWidth, cellHeight, gridWidth, gridHeight)
		});
	}
</script>

<canvas
	bind:this={canvas}
	width={0}
	height={0}
/>

<style>
	canvas {
		display: block;
		background: white;
		/* indefinity size, this causes the canvas to fire resize events when size change */
		width: 100%;
		height: 100%;
		image-rendering: -moz-crisp-edges;
		image-rendering: -webkit-crisp-edges;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
	}
</style>
