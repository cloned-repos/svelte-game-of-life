import { configureStore } from '@reduxjs/toolkit';
import animationFrameReducer, { animationFrameFired } from './animationFrameSlice';

export const store = configureStore({
	reducer: {
		animFrame: animationFrameReducer
	}
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export function startAnimFrameDispatcher() {
	let stop = false;
	let nextAnimationFrame = window.requestAnimationFrame(run);
	function run(ts: number) {
		if (stop) {
			cancelAnimationFrame(nextAnimationFrame);
			return;
		}

		store.dispatch(animationFrameFired(ts));
		nextAnimationFrame = requestAnimationFrame(run);
	}
	return () => {
		stop = true;
		cancelAnimationFrame(nextAnimationFrame);
	};
}
