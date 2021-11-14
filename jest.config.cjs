const collectCoverageFrom = [
    'src/**/*.ts',
    'src/**/*.svelte',
    'src/components/**/*.test.ts',
    'src/service-worker.ts'
];

const testRegex = [
    'src/lib/dao/__test__/LocalStorageDriver.test.ts',
    'src/lib/components/__test__/Arrow.test.ts'
];

module.exports = {
    automock: false,
    collectCoverage: true,
    maxWorkers: '50%',
    collectCoverageFrom,
    coveragePathIgnorePatterns: ['node_modules', 'test', 'doc.ts'],
    coverageDirectory: 'coverage',
    coverageProvider: 'babel', //"v8" is still experimental, but use "v8" for walk through debugging
    //coverageProvider: 'v8', //"v8" is still experimental, but use "v8" for walk through debugging
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    cacheDirectory: '.jest-cache',
    testPathIgnorePatterns: ['/es6/', '/commonjs/','/build/', '/coverage/, /.svelte-kit/'],
    testRegex,
    moduleNameMapper: {
        '^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
    },
    transform: {
        '^.+\\.svelte$': [
            'svelte-jester',
            {
                // strange this exports the preprocess initialisation
                preprocess: './svelte.config.test.cjs'
            }
        ],
        '^.+\\.ts$': 'ts-jest',
        '^.+\\.js$': 'ts-jest'
    },
    moduleFileExtensions: ['js', 'ts', 'svelte'],
    //setupFiles: [""],
   setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
};


