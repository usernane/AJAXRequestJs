/**
 * Node / SSR import smoke tests (#126)
 *
 * Verifies that requiring/importing the built bundles in a plain Node process
 * does not throw (XMLHttpRequest is not defined in Node), and that the
 * exported value is a usable constructor. See ADR-0012.
 *
 * These tests run against the compiled dist/ files directly, not the source,
 * so they catch regressions where a build change re-introduces the global.
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
