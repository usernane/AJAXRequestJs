import terser from '@rollup/plugin-terser';

const banner = `/**
 * AJAXRequest.js
 * A lightweight JavaScript library for making AJAX requests.
 * @version ${process.env.npm_package_version || '3.0.0'}
 * @license MIT
 */`;

export default [
    // ESM build
    {
        input: 'AJAXRequest.js',
        output: {
            file: 'dist/ajaxrequest.esm.js',
            format: 'esm',
            banner,
            sourcemap: true
        }
    },
    // ESM minified
    {
        input: 'AJAXRequest.js',
        output: {
            file: 'dist/ajaxrequest.esm.min.js',
            format: 'esm',
            banner,
            sourcemap: true
        },
        plugins: [terser()]
    },
    // CommonJS build
    {
        input: 'AJAXRequest.js',
        output: {
            file: 'dist/ajaxrequest.cjs.js',
            format: 'cjs',
            banner,
            sourcemap: true,
            exports: 'named'
        }
    },
    // CommonJS minified
    {
        input: 'AJAXRequest.js',
        output: {
            file: 'dist/ajaxrequest.cjs.min.js',
            format: 'cjs',
            banner,
            sourcemap: true,
            exports: 'named'
        },
        plugins: [terser()]
    },
    // UMD build (for browsers and script tags)
    {
        input: 'AJAXRequest.js',
        output: {
            file: 'dist/ajaxrequest.umd.js',
            format: 'umd',
            name: 'AJAXRequest',
            banner,
            sourcemap: true
        }
    },
    // UMD minified
    {
        input: 'AJAXRequest.js',
        output: {
            file: 'dist/ajaxrequest.umd.min.js',
            format: 'umd',
            name: 'AJAXRequest',
            banner,
            sourcemap: true
        },
        plugins: [terser()]
    }
];
