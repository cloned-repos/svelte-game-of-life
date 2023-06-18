import { sveltekit, vitePreprocess } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

/** @type {import('@sveltejs/kit').Config} */
export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
