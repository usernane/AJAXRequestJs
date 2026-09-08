/**
 * Node / SSR import smoke tests (#126, #125)
 *
 * Verifies that requiring/importing the built bundles in a plain Node process
 * does not throw (XMLHttpRequest is not defined in Node), and that the
 * exported value is a usable constructor. See ADR-0012.
 *
 * These tests run against the compiled dist/ files directly, not the source,
 * so they catch regressions where a build change re-introduces the global.
 *
 * ESM bundle verification is covered separately by tests/verify-esm.mjs
 * (run via `npm run test:esm`) because Jest runs in CJS mode by default.
 */

const path = require('path');

describe('Node / SSR import safety (#126)', () => {

    describe('CJS bundle (dist/ajaxrequest.cjs.js)', () => {
        let AJAXRequest;

        test('require() does not throw in Node (no XMLHttpRequest)', () => {
            expect(() => {
                AJAXRequest = require(path.resolve(__dirname, '../dist/ajaxrequest.cjs.js'));
            }).not.toThrow();
        });

        test('exported value is a constructor function', () => {
            expect(typeof AJAXRequest).toBe('function');
        });

        test('constructor name is AJAXRequest', () => {
            expect(AJAXRequest.name).toBe('AJAXRequest');
        });

        test('static META is accessible', () => {
            expect(AJAXRequest.META).toBeDefined();
            expect(AJAXRequest.META.VERSION).toBeDefined();
        });

        test('static CALLBACK_POOLS is accessible', () => {
            expect(Array.isArray(AJAXRequest.CALLBACK_POOLS)).toBe(true);
            expect(AJAXRequest.CALLBACK_POOLS).toContain('success');
        });
    });

    describe('CJS minified bundle (dist/ajaxrequest.cjs.min.js)', () => {
        let AJAXRequest;

        test('require() does not throw in Node', () => {
            expect(() => {
                AJAXRequest = require(path.resolve(__dirname, '../dist/ajaxrequest.cjs.min.js'));
            }).not.toThrow();
        });

        test('exported value is a constructor function', () => {
            expect(typeof AJAXRequest).toBe('function');
        });
    });
});

describe('UMD bundle runtime verification (#125)', () => {
    // UMD bundles use a factory pattern that falls back to CommonJS when
    // neither AMD nor a browser global is detected, making them loadable
    // via require() in Node. The UMD factory exposes AJAXRequest on the
    // exports object under the name configured in rollup ('AJAXRequest').

    describe('UMD bundle (dist/ajaxrequest.umd.js)', () => {
        let umdExports;

        test('require() does not throw in Node', () => {
            expect(() => {
                // UMD in Node: the factory receives the module's exports object.
                // We simulate a minimal CommonJS environment by requiring directly.
                umdExports = require(path.resolve(__dirname, '../dist/ajaxrequest.umd.js'));
            }).not.toThrow();
        });

        test('UMD exports AJAXRequest constructor', () => {
            // UMD with name 'AJAXRequest' exposes the constructor directly.
            const AJAXRequest = umdExports;
            expect(typeof AJAXRequest).toBe('function');
            expect(AJAXRequest.name).toBe('AJAXRequest');
        });

        test('UMD: static META is accessible', () => {
            expect(umdExports.META).toBeDefined();
            expect(umdExports.META.VERSION).toBeDefined();
        });

        test('UMD: static CALLBACK_POOLS is accessible', () => {
            expect(Array.isArray(umdExports.CALLBACK_POOLS)).toBe(true);
            expect(umdExports.CALLBACK_POOLS).toContain('success');
        });

        test('UMD: static BACKOFF enum is accessible', () => {
            expect(umdExports.BACKOFF).toBeDefined();
            expect(umdExports.BACKOFF.FIXED).toBe('fixed');
            expect(umdExports.BACKOFF.LINEAR).toBe('linear');
            expect(umdExports.BACKOFF.EXPONENTIAL).toBe('exponential');
        });
    });

    describe('UMD minified bundle (dist/ajaxrequest.umd.min.js)', () => {
        let umdExports;

        test('require() does not throw in Node', () => {
            expect(() => {
                umdExports = require(path.resolve(__dirname, '../dist/ajaxrequest.umd.min.js'));
            }).not.toThrow();
        });

        test('UMD minified exports AJAXRequest constructor', () => {
            expect(typeof umdExports).toBe('function');
        });
    });
});
