import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

const emptyUint16Array = new Uint16Array(0);
const emptyUint8ClampedArray = new Uint8ClampedArray(0);

export type GridOperationalMetrics = {
	physicalCanvasWidth: number; // size in real pixels
	physicalCanvasHeight: number; // size in real pixels
	logicalDisplayCanvasWidth: number; // number of horizontal cells that can drawn on the canvas (excluding) padding etc
	logicalDisplayCanvasHeight: number; // number of vertical cells that can be drawn on the canvas (excluding) padding etc
	playField: Uint8ClampedArray; // representation of the logical playfield
	playFieldIndex: Uint16Array; // playfield is sparcely populated, so an index to speed things up
	updateIndex: Uint16Array; // the cells that need updating in his render loop
	populationSize: number;
	survived: number;
	died: number;
	birth: number;
	checked: number;
	lastFired: number;
	count: number;
	dt: number;
};

const initialState: GridOperationalMetrics = {
	physicalCanvasWidth: 0,
	physicalCanvasHeight: 0,
	logicalDisplayCanvasWidth: 0, // number of horizontal cells that can drawn on the canvas (excluding) padding etc
	logicalDisplayCanvasHeight: 0, // number of vertical cells that can be drawn on the canvas (excluding) padding etc
	playField: emptyUint8ClampedArray, // representation of the logical playfield
	playFieldIndex: emptyUint16Array, // playfield is sparcely populated, so an index to speed things up
	updateIndex: emptyUint16Array, // the cells that need updating in his render loop
	populationSize: 0,
	survived: 0,
	died: 0,
	birth: 0,
	checked: 0,
	lastFired: 0,
	count: 0,
	dt: 0
};
/**
 * 
 * 
 * 	'rgb(245, 247, 249)', // empty (dead) cell
		'rgb(0, 166, 133)', // random colors for live cells (see colorDistribution)
		'rgb(0, 204, 187)',
		'rgb(210, 224, 49)'
	];

export  GridConfig = {
	colors: string[];
	colorDistribution: number[];

};
*/

export const animationFrameSlice = createSlice({
	name: 'gridOperationalMetrics',
	initialState,
	reducers: {
		animationFrameFired: (state, action: PayloadAction<number>) => {
			const now = action.payload;
			const dt = now - (state.lastFired ?? now);
			state.lastFired = now;
			state.count += 1;
			state.dt = dt;
		}
	}
});

export const { animationFrameFired } = animationFrameSlice.actions;
export default animationFrameSlice.reducer;
