import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import type {
	NormalizedOutputOptions,
	OutputBundle,
	PluginContext,
	RenderedChunk,
	SourceMapInput
} from 'rollup';
/*
	generateBundle: (
		this: PluginContext,
		options: NormalizedOutputOptions,
		bundle: OutputBundle,
		isWrite: boolean
	) => void;

	export interface OutputBundle {
	[fileName: string]: OutputAsset | OutputChunk;
}
*/
export default defineConfig({
	plugins: [
		{
			name: 'vite-inline-plugin',
			version: '0.0.1',
			renderChunk(
				code: string,
				chunk: RenderedChunk,
				options: NormalizedOutputOptions,
				meta: { chunks: Record<string, RenderedChunk> }
			): { code: string; map?: SourceMapInput } | string | null {
				if (code.includes('data-testid')) {
					console.log('=====>');
					//console.log(code);
					console.log('<=====');
				}

				return null;
			}
		},
		sveltekit()
	],
	build: {
		minify: false,
		sourcemap: true
	}
});
