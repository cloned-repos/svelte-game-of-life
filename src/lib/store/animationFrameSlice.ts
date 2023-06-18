import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AnimationState {
	lastFired: number;
	count: number;
	dt: number;
}

const initialState: AnimationState = {
	lastFired: Date.now(),
	count: 0,
	dt: 0
};

const animationFrameSlice = createSlice({
	name: 'requestAnimationFrame',
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
