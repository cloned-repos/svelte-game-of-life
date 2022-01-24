<script lang="ts" context="module">
	export type GridSize = {
		blk_w: number;
		blk_h: number;
		w: number;
		h: number;
	};
	const { max, round, min } = Math;
	
</script>

<script lang="ts">
	import { beforeUpdate, afterUpdate, onDestroy, tick, onMount, createEventDispatcher } from 'svelte';

	let canvas: HTMLCanvasElement = null;

	export let cellWidth = 6;
	export let cellHeight = 6;
	export let cellContentWidth = 4;
	export let cellContentHeight = 4;
	export let paddingX = 4;
	export let paddingY = 4;
	export let gridColor = 'rgb(245, 247, 249)';
	export let colors: string[] = ['rgb(0, 166, 133)', 'rgb(0, 204, 187)', 'rgb(210, 224, 49)'];

	export let gridHeight: number = 0;
	export let gridWidth: number = 0;


	let ctx: CanvasRenderingContext2D = null;
	let resizeObserver: ResizeObserver = null;

	const dispatch = createEventDispatcher();

	function getGridSizeFromCanvasViewPort(): GridSize|null {
		if (!canvas) return null;
		const blk_w = (canvas.width - paddingX * 2 - ((canvas.width - paddingX * 2) % cellWidth)) / cellWidth;
		const blk_h = (canvas.height - paddingY * 2 - ((canvas.height - paddingY * 2) % cellHeight)) /cellHeight;
		return {
			w: canvas.width,
			h: canvas.height,
			blk_w: max(0, blk_w),
			blk_h: max(0, blk_h)
		};
	}

	
	onMount(() => {
		console.log('ONMOUNT');
		ctx = canvas.getContext('2d');
		resizeObserver = new ResizeObserver(() => {
			const oldSize = getGridSizeFromCanvasViewPort();
			// if we resize canvas with canvas.length, canvas.height, it gets cleared
			const backupData = ctx.getImageData(0,0, canvas.width || 1, canvas.height || 1);
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			ctx.putImageData(backupData, 0,0);
			const newSize = getGridSizeFromCanvasViewPort();
			gridHeight = newSize.blk_h;
			gridWidth = newSize.blk_w;
			resize(oldSize, newSize);
		});
		resizeObserver.observe(canvas);
		ctx = canvas.getContext('2d');
	});

	onDestroy(() => {
		resizeObserver && resizeObserver.unobserve(canvas);
		console.log('DESTROYED');
	});


	function drawBlocks(sx, sy, w, h) {
		if (w <= 0 || h <= 0) return;
		if (sy < 0 || sx < 0){
			console.log('weird');
		}
		let cursorY = paddingY + sy * cellHeight;
		let iy = 0;
		do {
			let ix = 0;
			// reset X
			let cursorX = paddingX + sx * cellWidth;
			do {
				ctx.fillRect(cursorX, cursorY, cellContentWidth, cellContentHeight);
				cursorX += cellWidth;
				ix++;
			} while (ix < w);
			cursorY += cellHeight;
			iy++;
		} while (iy < h);
	}
	// render does not resize by itself, it gets instructions from parent component
	function resize(o: GridSize, n: GridSize) {
		ctx.fillStyle = gridColor;
		const paddingRightStart = paddingX + n.blk_w * cellWidth;
		if (n.w !== o.w) {
			const w = n.w - paddingRightStart;
			// clear beyond last column of cells
			ctx.clearRect(paddingRightStart, 0, w, n.h);
		}

		const paddingBottomStart = paddingY + n.blk_h * cellHeight;

		if (n.h !== o.h) {
			const h = n.h - paddingBottomStart;
			// clear beyond last column of cells
			ctx.clearRect(0, paddingBottomStart, n.w, h);
		}

		if (n.blk_w === o.blk_w && n.blk_h === o.blk_h) {
			return;
		}

		/*
scenario: ↓ ↘ →

old            new
+-----------+--|
|           |  |
|           |  |
|           |  |
|           | A|
|           |  |
+-----------+  |
|     B     |  |
+--------------+

  n.w >= o.w
  n.h > o.h
  A = box(o.w, 0, (n.w-o.w), (n.h-0))
  B = box(0, o.h, (o.w-0), (n.h-o.h))

  {o: {…}, n: {…}}
  n: {w: 918, h: 686, blk_w: 151, blk_h: 113}
  o: {w: 918, h: 687, blk_w: 151, blk_h: 113}
  


*/

		if (n.blk_w >= o.blk_w && n.blk_h >= o.blk_h) {
			console.log('scenario: ↓ ↘ →');
			// area A
			drawBlocks(o.blk_w, 0, n.blk_w - o.blk_w, n.blk_h);
			// area B
			drawBlocks(0, o.blk_h, o.blk_w - 0, n.blk_h - o.blk_h);
			return;
		}

		/*
scenario:↑ ↗ →
           old new
+-----------+--+
|           |  |
|           |  |
|           |  |
|           | A|
|           |  |
+-----------+--+
|     B     |  
+-----------+

 n.w >= o.w
 n.h <= o.h

 A = box(O.w, 0, (n.w-o.w), (n.h-0))
 B = NA
*/

		if (n.blk_w >= o.blk_w && n.blk_h < o.blk_h) {
			console.log('scenario: ↑ ↗ →');
			// area A
			drawBlocks(o.blk_w, 0, n.blk_w - o.blk_w, n.blk_h);
			return;
		}
		/*
scenario:← ↖ ↑
           new old
+-----------+--+
|           |  |
|           |  |
|           |  |
|           | A|
|           |  |
+-----------+--+
|     B     |  |  
+-----------+--+

n.w <= o.w
n.h <= o.h

 A = NA
 B = NA
*/
		if (n.blk_w <= o.blk_w && n.blk_h <= o.blk_h) {
			console.log('scenario: ← ↖ ↑');
			// no extra blocks to draw
			return;
		}
		/*
scenario:← ↙ ↓
           new old
+-----------+--+
|           |  |
|           |  |
|           |  |
|           | A|
|           |  |
+-----------+--+ old
|     B     |  |  
+-----------+--+ new

n.w <= o.w
n.h >= o.h

 A = NA
 B = Box(0, o.h, n.w, (n.h-o.h))
*/

		if (n.blk_w <= o.blk_w && n.blk_h >= o.blk_h) {
			console.log('scenario: ← ↙ ↓');
			drawBlocks(0, o.blk_h, n.blk_w, n.blk_h - o.blk_h);
			return;
		}
	}

	export function sliceCanvas(x: number, y: number, w: number, h: number): ImageData {
		// the right and bottom pixels inclusive
		// 0--1--2--3--4--5--6      , x= 3 w = 3, h= 3
		//          4
		// calculate what pixel we want ("left" side of the pixel and "top" side of the pixel)
		const sx = x - ((w - 1) >> 1);
		const sy = y - ((h - 1) >> 1);
		return ctx.getImageData(sx, sy, w, h);
	}

	export function clear() {
		if (!ctx){
			return;
		}
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 1; // this can be a fraction of 1?
		ctx.lineWidth = 1;
		ctx.lineCap = 'square';
		ctx.fillStyle = gridColor;
		const size =  getGridSizeFromCanvasViewPort();
		drawBlocks(0,0, size.blk_w, size.blk_h);
	}

	export function differentialUpdate(updatePixels: Int32Array, currentFrame: Uint8ClampedArray) {
		if (!canvas){
			return;
		}
		canvas.style.visibility = 'hidden';
		for (let i = 0; i < updatePixels.length; i++) {
			const coords = updatePixels[i];
			const xcor = coords % gridWidth;
			const ycor = (coords - xcor) / gridWidth;
			const colorIndex = currentFrame[coords];
			const realColor = colors[colorIndex];
			ctx.fillStyle = realColor;
			ctx.fillRect(
				paddingX + xcor * cellWidth,
				paddingY + ycor * cellHeight,
				cellContentWidth,
				cellContentHeight
			);
		}
		canvas.style.visibility = 'visible';
	}

	// plot a pixel from the current frame on the convas
	function plot(x: number, y: number, currentFrame: Uint8ClampedArray) {
		const coords = x + y * gridWidth;
		const colorIndex = currentFrame[coords];
		const realColor = colors[colorIndex];
		ctx.fillStyle = realColor;
		ctx.fillRect(
			paddingX + x * cellWidth,
			paddingY + y * cellHeight,
			cellContentWidth,
			cellContentHeight
		);
	}

	function calcGridCoords(rect: DOMRect, clientX: number, clientY: number): { x: number, y: number }{
		const diffx = (clientX-rect.left - paddingX);
		const diffy = (clientY-rect.top - paddingY);
		const x = min(max(round(diffx/cellWidth), 0), gridWidth-1);
		const y = min(max(round(diffy/cellHeight), 0), gridHeight-1);
		return { x, y };
	}

	function mouseMove(e: MouseEvent){
		const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
		const { x, y } = calcGridCoords(rect, e.clientX, e.clientY);
		const pl = { x, y, buttons: e.buttons };
		dispatch('move', pl);
	}

	function mouseDown(e){
		const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
		const { x, y } = calcGridCoords(rect, e.clientX, e.clientY);
		const pl = { x, y, buttons: e.buttons };
		dispatch('down', pl);
	}

	function mouseUp(e){
		const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
		const { x, y } = calcGridCoords(rect, e.clientX, e.clientY);
		const pl = { x, y };
		dispatch('up', pl);
	}

</script>

<canvas 
	bind:this={canvas} 
	width={0} 
	height={0} 
	on:mousemove|stopPropagation={mouseMove} 
	on:mousedown|stopPropagation={mouseDown}
	on:mouseup|stopPropagation={mouseUp}
	/>

<style>
	canvas {
		/*border: 4px solid red;*/
		background: white;
		width: 100%;
		height: 100%;
	}
</style>
