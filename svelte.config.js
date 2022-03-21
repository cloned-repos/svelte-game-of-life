import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess({
		replace: [
			['process.env.NODE_ENV', JSON.stringify(process.env.NODE_ENV)]
		],
		typescript: {
			tsconfigFile: './tsconfig.app.json',
			handleMixedImports: true
		}
	}),
	kit: {
		adapter: adapter(),
	}
};

export default config;
