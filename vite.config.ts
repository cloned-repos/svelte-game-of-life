import { sveltekit, vitePreprocess } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import type { ManualChunkMeta } from 'rollup';

/** @type {import('@sveltejs/kit').Config} */
export default defineConfig({
	plugins: [sveltekit()],
	build: {
		//minify: false
		//rollupOptions: {
		//	output: {
		/*manualChunks: (id: string, meta: ManualChunkMeta) => {
					if (id.endsWith('.css')) {
						if (id.includes('?')) {
							return;
						}
						// if it has "?", strip
						const baseName = path.basename(id);
						const ext = path.extname(baseName);
						const final = baseName.replace(ext, '');
						console.log(final, id);
						return final;
					}
					//	return 'one';
				}*/
		//	}
		//}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
