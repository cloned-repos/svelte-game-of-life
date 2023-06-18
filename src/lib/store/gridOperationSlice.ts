import { createSlice, original } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAction, createReducer } from '@reduxjs/toolkit';
import { sample, prepareGetCoordsRelative } from './helpers';

const emptyUint16Array = new Uint16Array(0);
const emptyUint8ClampedArray = new Uint8ClampedArray(0);

export type GridOperationalMetrics = {
	playFieldWidth: number;
	playFieldHeight: number;
	physicalCanvasWidth: number; // size in real pixels
	physicalCanvasHeight: number; // size in real pixels
	logicalDisplayCanvasWidth: number; // number of horizontal cells that can drawn on the canvas (excluding) padding etc
	logicalDisplayCanvasHeight: number; // number of vertical cells that can be drawn on the canvas (excluding) padding etc
	cellWidth: number;
	cellHeight: number;
	cellContentWidth: number;
	cellContentHeight: number;
	playField: Uint8ClampedArray; // representation of the logical playfield
	playFieldIndex: Uint16Array; // playfield is sparcely populated, so an index to speed things up
	updateIndex: Uint16Array; // the cells that need updating in his render loop
	populationSize: number;
	survived: number;
	died: number;
	birth: number;
	checked: number;
	paddingX: number; // (on both left and right side)
	paddingY: number; // (on both top and bottom side)
	deadColor: string; // empty (dead) cell
	liveColor1: string; // random colors for live cells (see colorDistribution)
	liveColor2: string;
	liveColor3: string;
	colorDistribution: [number, number, number];
};

const initialState: GridOperationalMetrics = {
	playFieldWidth: 0,
	playFieldHeight: 0,
	physicalCanvasWidth: 0,
	physicalCanvasHeight: 0,
	logicalDisplayCanvasWidth: 0, // number of horizontal cells that can drawn on the canvas (excluding) padding etc
	logicalDisplayCanvasHeight: 0, // number of vertical cells that can be drawn on the canvas (excluding) padding etc
	cellWidth: 6, // pixels
	cellHeight: 6, // pixels
	cellContentWidth: 4, // pixels
	cellContentHeight: 4, // pixels
	playField: emptyUint8ClampedArray, // representation of the logical playfield
	playFieldIndex: emptyUint16Array, // playfield is sparcely populated, so an index to speed things up
	updateIndex: emptyUint16Array, // the cells that need updating in his render loop
	populationSize: 0,
	survived: 0,
	died: 0,
	birth: 0,
	checked: 0,
	paddingX: 4, // pixels, (on both left and right side)
	paddingY: 4, // pixels, (on both top and bottom side)
	// colors
	deadColor: 'rgb(245, 247, 249)', // empty (dead) cell
	liveColor1: 'rgb(0, 166, 133)', // random colors for live cells (see colorDistribution)
	liveColor2: 'rgb(0, 204, 187)',
	liveColor3: 'rgb(210, 224, 49)',
	colorDistribution: [1 / 3, 1 / 3, 1 / 3]
};

const gridOperationalMetricsSlice = createSlice({
	name: 'gridOperationalMetrics',
	initialState,
	reducers: {
		resizeGrid: (state, action: PayloadAction<{ width: number; height: number }>) => {
			const {
				physicalCanvasHeight: oldCanvasHeight,
				physicalCanvasWidth: oldCanvasWidth,
				paddingX,
				paddingY,
				cellHeight,
				cellWidth
			} = state;
			const { width: newCanvasWidth, height: newCanvasHeight } = action.payload;
			const blk_w =
				(newCanvasWidth - paddingX * 2 - ((newCanvasWidth - paddingX * 2) % cellWidth)) / cellWidth;
			const blk_h =
				(newCanvasHeight - paddingY * 2 - ((newCanvasHeight - paddingY * 2) % cellHeight)) /
				cellHeight;
			// set
			state.physicalCanvasWidth = newCanvasWidth;
			state.physicalCanvasHeight = newCanvasHeight;
			state.logicalDisplayCanvasWidth = blk_w;
			state.logicalDisplayCanvasHeight = blk_h;
		},
		clear: (state) => {
			state.playFieldIndex = emptyUint16Array;
			state.updateIndex = emptyUint16Array;
			const pf = original(state.playField)!;
			pf.fill(0);
		},
		seed: (state, action: PayloadAction<number>) => {
			// TODO: replace this with a WASM function
			const pf = original(state.playField)!;
			let pct = action.payload > 1 ? action.payload / 100 : action.payload;
			if (state.playFieldHeight === 0 || state.playFieldWidth === 0) {
				return;
			}
			state.playField.fill(0);
			// select cells untill
			let seeded = 0;
			let nrRetries = 10;
			done: while (nrRetries > 0) {
				for (;;) {
					const currentPCT = seeded / state.playField.length;
					if (currentPCT >= pct) {
						break done;
					}
					const x = Math.trunc(Math.random() * state.playFieldWidth);
					const y = Math.trunc(Math.random() * state.playFieldHeight);
					const idx = y * state.playFieldWidth + x;
					if (state.playField[idx] > 0) {
						break;
					}
					nrRetries = 10;
					pf[idx] = sample(...state.colorDistribution);
					seeded++;
				}
				nrRetries--;
			}
			// 2nd pass, create  [p]lay [f]ield [i]ndex
			if (seeded > 0) {
				const pfi = new Uint16Array(3 * seeded);
				let pfiCursor = 0;
				let idx = 0;
				// column major layout in canvas
				for (let y = 0; y < state.playFieldHeight; y++) {
					for (let x = 0; x < state.playFieldWidth; x++) {
						if (pf[idx] > 0) {
							pfi[pfiCursor] = pf[idx];
							pfi[pfiCursor + 1] = x;
							pfi[pfiCursor + 2] = y;
						}
						pfiCursor += 3;
					}
					idx++;
				}
				state.playFieldIndex = pfi;
			}
		},
		prepareNextDraw: (state) => {
			const pf = original(state.playField)!;
			const pfi = original(state.playFieldIndex)!;
			// these 2 are enough to calculate the next step,
			// lets try 2 pass step, calculate number of changes and then allocate memory for the actual changes
			// this should be fast enough
			// since the index was stored in row major, this makes it also easier to slice later
			let willDie = 0;
			let birth = 0;
			let survive = 0;
			let checked = 0;

			for (let i = 0; i < pfi.length; i += 3) {
				// check
				const color = pfi[i];
				const x = pfi[i + 1];
				const y = pfi[i + 2];
				const idx = x + y * state.playFieldWidth;
				if (color <= 0) {
					console.error(`Internal Error, color ${color} encountered at x=${x}, y=${y}, idx=${idx}`);
				}
				let neighbours = 0;
				const getCoordsRel = prepareGetCoordsRelative(
					idx,
					state.playFieldWidth,
					state.playFieldHeight
				);
				let neighbors = 0;
				for (let xd = -1; xd <= 1; xd++) {
					for (let yd = -1; yd <= 1; yd++) {
						// dont count yourself
						if (xd === 0 && yd === 0) {
							continue;
						}
						const idx2 = getCoordsRel(xd, yd);
						if (pfi[idx2] === 0) {
							pfi[idx2] = state.colorDistribution.length + 2;
							checked++;
							// dead cell resurrection
							let neighboursOfDead = 0;
							for (let xdd = -1; xdd <= 1; xdd++) {
								for (let ydd = -1; ydd <= 1; ydd++) {
									if (xdd === 0 && ydd === 0) {
										continue;
									}
									const idx3 = getCoordsRel(xd + xdd, yd + ydd);
									const color = pfi[idx3];
									if (color && color < state.colorDistribution.length) {
										neighboursOfDead++;
									}
								}
							}
							if (neighboursOfDead === 3) {
								pfi[idx2] = state.colorDistribution.length + 1;
								birth++;
							}
							continue;
						}
						if (color > state.colorDistribution.length) {
							continue;
						}
						neighbors++;
					}
				}
				if (neighbors === 3 || neighbors === 2) {
					survive++;
					continue;
				}
				pf[idx] = 0;
				willDie++;
			}

			// second pass
			// I AM HERE
			const changes = new Uint16Array((willDie + birth) * 3);
			const playFieldIndex2 = new Uint16Array((survive + birth) * 3);

			for (let i = 0; i < pfi.length; i += 3) {
				// check
				const color = pfi[i];
				const x = pfi[i + 1];
				const y = pfi[i + 2];
				const idx = x + y * state.playFieldWidth;
				if (color <= 0) {
					console.error(`Internal Error, color ${color} encountered at x=${x}, y=${y}, idx=${idx}`);
				}
				let neighbours = 0;
				const getCoordsRel = prepareGetCoordsRelative(
					idx,
					state.playFieldWidth,
					state.playFieldHeight
				);
				let neighbors = 0;
				for (let xd = -1; xd <= 1; xd++) {
					for (let yd = -1; yd <= 1; yd++) {
						// dont count yourself
						if (xd === 0 && yd === 0) {
							continue;
						}
						const idx2 = getCoordsRel(xd, yd);
						if (pfi[idx2] === 0) {
							pfi[idx2] = state.colorDistribution.length + 2;
							checked++;
							// dead cell resurrection
							let neighboursOfDead = 0;
							for (let xdd = -1; xdd <= 1; xdd++) {
								for (let ydd = -1; ydd <= 1; ydd++) {
									if (xdd === 0 && ydd === 0) {
										continue;
									}
									const idx3 = getCoordsRel(xd + xdd, yd + ydd);
									const color = pfi[idx3];
									if (color && color < state.colorDistribution.length) {
										neighboursOfDead++;
									}
								}
							}
							if (neighboursOfDead === 3) {
								pfi[idx2] = state.colorDistribution.length + 1;
								birth++;
							}
							continue;
						}
						if (color > state.colorDistribution.length) {
							continue;
						}
						neighbors++;
					}
				}
				if (neighbors === 3 || neighbors === 2) {
					survive++;
					continue;
				}
				pf[idx] = 0;
				willDie++;
			}
		}
	}
});

export const { resizeGrid } = gridOperationalMetricsSlice.actions;
export default gridOperationalMetricsSlice.reducer;
