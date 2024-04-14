import { configureStore } from '@reduxjs/toolkit';
import animationFrameReducer, { animationFrameFired } from './animationFrameSlice';
import type { EnhancedStore } from '@reduxjs/toolkit';
import type { Readable } from 'svelte/store';

export const store = configureStore({
	reducer: {
		animFrame: animationFrameReducer
	}
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export function redux2SvelteReadable<T extends RootState, S>(
	reduxStore: EnhancedStore,
	selector: (s: T) => S
) {
	// this is the svelte store contract,
	// optionally: "set" method (to set the value)
	// because there is no set, it is like a "readlonly"
	// import { readonly } from 'svelte/store'
	return {
		subscribe(fn: (data: S) => void) {
			fn(selector(reduxStore.getState()));
			return reduxStore.subscribe(() => {
				fn(selector(reduxStore.getState()));
			});
		}
	} as Readable<S>;
}
