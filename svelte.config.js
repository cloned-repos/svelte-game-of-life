import nodeAdapter from '@sveltejs/adapter-node';
// import adapterAuto from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { parse, walk } from 'svelte/compiler';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [
		vitePreprocess({}),
		{
			name: 'remove-attributes',
			markup: (options) => {
				let { content, fileName } = options;
				if (content.includes('data-testid')) {
					const ast = parse(content, { filename: fileName });
					const slicers = [];
					//console.log('markup', JSON.stringify(ast.html, null, 4));
					walk(ast.html, {
						enter(node, parent, key, index) {
							if (node.type === 'Attribute' && node.name === 'data-testid') {
								const { start, end } = node;
								slicers.push({ start, end });
							}
						}
					});
					slicers.reverse();

					for (const slice of slicers) {
						content = content.slice(0, slice.start) + content.slice(slice.end);
					}
					return { code: content };
				}
				return;
			}
		}
	],
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/Nocs/adapters for more information about adapters.
		adapter: adapter()
	}
};

export default config;
