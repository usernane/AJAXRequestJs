import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'script',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                XMLHttpRequest: 'readonly',
                FormData: 'readonly',
                File: 'readonly',
                Blob: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                // Library globals
                AJAXRequest: 'writable',
                ajax: 'writable'
            }
        },
        rules: {
            // Errors
            'semi': ['error', 'always'],

            // Warnings - code quality issues to fix later
            'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'caughtErrorsIgnorePattern': '^_' }],
            'no-redeclare': 'warn',
            'no-useless-assignment': 'warn',
            'no-console': 'off',
            'quotes': ['warn', 'single', { 'avoidEscape': true }],
            'indent': ['warn', 4],
            'no-trailing-spaces': 'warn',
            'eol-last': ['warn', 'always']
        }
    },
    {
        files: ['tests/**/*.js', 'jest.config.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                // Jest globals
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                jest: 'readonly',
                require: 'readonly',
                module: 'readonly',
                __dirname: 'readonly',
                // Runtime globals used by tests
                global: 'readonly',
                AbortController: 'readonly'
            }
        }
    },
    {
        files: ['eslint.config.js', 'rollup.config.js'],
        languageOptions: {
            sourceType: 'module',
            globals: {
                process: 'readonly'
            }
        }
    },
    {
        // AJAXRequest.js uses `export default` for module builds (ADR-0012)
        // no-redeclare: The source uses ES5 `var` declarations inside if/else branches
        //   (e.g. send(), getCallbacksIDs(), setRetry(), getRequestURL()). With `var`
        //   hoisting these are valid and intentional — fixing them would require
        //   significant refactoring of large pre-existing functions with risk of
        //   regression. Suppressed here; correctness is covered by the test suite.
        // indent: The same nested branches produce indent warnings in complex function
        //   bodies. Style-only; suppressed to keep signal-to-noise ratio high.
        files: ['AJAXRequest.js'],
        languageOptions: {
            sourceType: 'module'
        },
        rules: {
            'no-redeclare': 'off',
            'indent': 'off'
        }
    },
    {
        // .mjs files are always ES modules
        files: ['**/*.mjs'],
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 2022,
            globals: {
                process: 'readonly'
            }
        }
    },
    {
        ignores: ['dist/', 'node_modules/', 'coverage/', 'examples/']
    }
];
