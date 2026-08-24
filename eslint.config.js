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
            'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
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
                __dirname: 'readonly'
            }
        }
    },
    {
        files: ['eslint.config.js'],
        languageOptions: {
            sourceType: 'module'
        }
    },
    {
        ignores: ['dist/', 'node_modules/', 'coverage/', 'examples/']
    }
];
