<script lang="ts">
	import createNS from '@mangos/debug-frontend';
	import { createCanvasStore, createObserverForCanvas } from '$lib/store/canvas-resize-readable';
	import type { CanvasInfomation, ReadableCanvasStore } from '$lib/store/canvas-resize-readable';
	import { onMount } from 'svelte';
	import opentype from 'opentype.js';

	//import fontUrl from '../../../../node_modules/@easyfonts/league-junction-typeface/junction-light.woff';
	import { base } from '$app/paths';

	/*fetch(fontUrl)
		.then((response) => response.arrayBuffer())
		.then((bin) => {
			const fontInfo = opentype.parse(bin);
			debug('text metrics, fontinfo: %o', fontInfo);
		});*/
	// const inits
	const debug = createNS('statistics/index.svelte');
	const debugMount = createNS('statistics/index.svelte/onMount');

	const fnList: never[] = [];

	const { trunc, random } = Math;

	//debug('text metrics: junction-regular-font "font" is %s', fontUrl);
	//exports
	export let pos: string;

	//local
	let internal: HTMLCanvasElement | null = null;
	let store: ReadableCanvasStore;
	let width = 'n/a';

	function metricsFrom(
		font: string,
		text: string,
		baseline: CanvasRenderingContext2D['textBaseline'],
		ctx: CanvasRenderingContext2D
	): TextMetrics {
		ctx.save();
		ctx.font = font;
		ctx.textBaseline = baseline;
		const metrics = ctx.measureText(text);
		ctx.restore();
		return metrics;
	}

	onMount(() => {
		debugMount('on mount');
		debugMount('svelte canvas ref has value %o', internal);

		const disposeObserver = createObserverForCanvas(internal!, fnList);
		store = createCanvasStore(internal!, fnList);

		let unsub: () => void;
		let fontLoaded = 0;

		unsub = store.subscribe(function somefn(this: HTMLCanvasElement, state: CanvasInfomation) {
			if (!this) {
				return;
			}
			debug('sub callback', fontLoaded);
			if (fontLoaded === 0) {
				debug('loading font');
				fontLoaded = 1;
				document.fonts.load('400 14px Junction').then(([fontData]) => {
					debug('font loaded', fontData.weight);
					fontLoaded = 2;
					somefn.call(this, state);
					return;
				});
			}
			if (fontLoaded < 2) {
				return;
			}
			const ctx = this.getContext('2d')!;
			const font = '400 14px Junction';
			const text = 'MÊ|&T{Qszdcy'; //MÊ|²{Qszdcy
			const topMetrics = metricsFrom(font, text, 'top', ctx);
			const middleMetrics = metricsFrom(font, text, 'middle', ctx);
			const alphabeticBaselineMetrics = metricsFrom(font, text, 'alphabetic', ctx);
			const bottomMetrics = metricsFrom(font, text, 'bottom', ctx);

			const baseLineAscent = alphabeticBaselineMetrics.fontBoundingBoxAscent;
			const bbBaseLineAscent = alphabeticBaselineMetrics.actualBoundingBoxAscent;

			const baseLineDescent = alphabeticBaselineMetrics.fontBoundingBoxDescent;
			const bbBaseLineDescent = alphabeticBaselineMetrics.actualBoundingBoxDescent;

			const topLine = baseLineAscent - topMetrics.fontBoundingBoxAscent;
			const bottomLine = baseLineDescent - bottomMetrics.fontBoundingBoxDescent;
			//debug('metrics from top baseline: %o', topMetrics);
			//debug('metrics from bottom baseline: %o', bottomMetrics);

			const topToBottomDistance = topLine + bottomLine;

			debug('topLine: %s', topLine);
			debug('bottomLine: %s', bottomLine);
			debug('ascent: %s', baseLineAscent);
			debug('descent: %s', baseLineDescent);
			debug('%c, (font) top to bottom distance: %s', 'color:red', topToBottomDistance);
			debug(
				'%c, (font) ascent to descent distance: %s',
				'color:red',
				baseLineAscent + baseLineDescent
			);
			debug(
				'%c, [%s] ascent to descent distance: %s',
				'color:green',
				text,
				bbBaseLineAscent + bbBaseLineDescent,
				bbBaseLineAscent,
				bbBaseLineDescent
			);

			const baseLineY = bbBaseLineAscent + bbBaseLineDescent;
			const offsetX = 10;
			ctx.save();
			ctx.font = font;
			ctx.textBaseline = 'alphabetic';
			ctx.fillStyle = 'black';
			ctx.strokeStyle = 'black';
			ctx.fillText(text, offsetX, baseLineY);
			ctx.restore();
			// draw the text metrics guides
			return;
			ctx.save();
			ctx.lineWidth = 1;
			// baseline
			ctx.beginPath();
			ctx.strokeStyle = 'purple';
			ctx.moveTo(0, baseLineY);
			ctx.lineTo(ctx.canvas.width, baseLineY);
			ctx.closePath();
			ctx.stroke();
			// font - top
			ctx.beginPath();
			ctx.moveTo(0, baseLineY - topLine);
			ctx.strokeStyle = 'orange';
			ctx.lineTo(ctx.canvas.width, baseLineY - topLine);
			ctx.closePath();
			ctx.stroke();
			// font - bottom
			ctx.beginPath();
			ctx.moveTo(0, baseLineY + bottomLine);
			ctx.strokeStyle = 'orange';
			ctx.lineTo(ctx.canvas.width, baseLineY + bottomLine);
			ctx.closePath();
			ctx.stroke();
			// font -ascent
			ctx.beginPath();
			ctx.moveTo(0, baseLineY - baseLineAscent);
			ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
			ctx.lineTo(ctx.canvas.width, baseLineY - baseLineAscent);
			ctx.closePath();
			ctx.stroke();
			// font -descent
			ctx.beginPath();
			ctx.moveTo(0, baseLineY + baseLineDescent);
			ctx.setLineDash([1, 0, 2, 0, 1, 0]);
			ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
			ctx.lineTo(ctx.canvas.width, baseLineY + baseLineDescent);
			ctx.closePath();
			ctx.stroke();
			// actual ascent of used text (dashed)
			ctx.setLineDash([5, 15]);
			ctx.strokeStyle = 'blue';
			ctx.beginPath();
			ctx.moveTo(0, baseLineY - bbBaseLineAscent);
			ctx.lineTo(ctx.canvas.width, baseLineY - bbBaseLineAscent);
			ctx.closePath();
			ctx.stroke();
			// actual descent of used text
			ctx.beginPath();
			ctx.setLineDash([5, 15]);
			ctx.strokeStyle = 'blue';
			ctx.moveTo(0, baseLineY + bbBaseLineDescent);
			ctx.lineTo(ctx.canvas.width, baseLineY + bbBaseLineDescent);
			ctx.closePath();
			ctx.stroke();
			// restore everything
			ctx.restore();
		});

		return () => {
			debugMount('destroy function called');
			disposeObserver();
			unsub && unsub();
		};
	});
	// $: {
	// 	internal;
	// 	debug('internal is %o', internal);
	// 	width = !!internal ? getComputedStyle(internal)?.width : '2-na';
	// }

	debug('roundWidth on renderloop(?) %s', typeof width);
</script>

<div style="--grid-pos: {pos}" class="me">
	Statistics
	<ul>
		<li>physical-width: {$store?.physicalPixelWidth ?? trunc(random() * 1e3)}</li>
		<li>physical-height: {$store?.physicalPixelHeight ?? trunc(random() * 1e3)}</li>
		<li>width: {$store?.width ?? trunc(random() * 1e3)}</li>
		<li>height: {$store?.height ?? trunc(random() * 1e3)}</li>
		<li><span class="fa fa-battery-3" /></li>
		<li>{(debug('rendering ul > li'), width)}</li>
	</ul>
	<canvas bind:this={internal} class={$$props.class}>{debug('rendering canvas?') || ''}</canvas>
</div>

<style>
	.me {
		height: 450px;
		border: 4px darkkhaki dashed;
		width: 100%;
		grid-area: var(--grid-pos);
		display: flex;
		flex-direction: column;
	}

	canvas {
		min-height: 0; /* --> chrome needs this */
		width: 100%;
		height: 100%;
		align-self: stretch;
	}
</style>
