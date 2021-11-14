module.exports = {
	root: false,
	ignorePatterns: [
		'build',
		'coverage'
	],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	parser: '@typescript-eslint/parser',
	reportUnusedDisableDirectives: false,
	plugins: ['svelte3', '@typescript-eslint'],
	parserOptions: {
		ecmaVersion: 2021,
		sourceType: 'module',
		ecmaFeatures: {
			globalReturn: false,
			impliedStrict: true,
			jsx: false
		},
		debug: true,
		project: './tsconfig-eslint.json',
		extraFileExtensions: ['.cjs']
	},
	env: {
		es2021: true,
		es6: true,
		browser: true,
		node: true,
		worker: true,
		jest: true
	},
	overrides: [
		{
			files: ['*.svelte'],
			processor: 'svelte3/svelte3'
		}
	],
	settings: {
		'svelte3/typescript': () => require('typescript')
	},
	rules: {
		quotes: ['error', 'single']
	}
};
