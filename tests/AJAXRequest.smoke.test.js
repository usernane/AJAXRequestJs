/**
 * Smoke test to verify Jest setup works with AJAXRequest
 */

const { loadAJAXRequest } = require('./helpers/loader');

const AJAXRequest = loadAJAXRequest();

describe('AJAXRequest', () => {
    describe('smoke test', () => {
        test('AJAXRequest class is defined', () => {
            expect(typeof AJAXRequest).toBe('function');
        });

        test('can create an instance', () => {
            const ajax = new AJAXRequest();
            expect(ajax).toBeInstanceOf(AJAXRequest);
        });

        test('META property exists', () => {
            expect(AJAXRequest.META).toBeDefined();
        });

        test('CALLBACK_POOLS contains expected pools', () => {
            expect(AJAXRequest.CALLBACK_POOLS).toContain('success');
            expect(AJAXRequest.CALLBACK_POOLS).toContain('servererror');
            expect(AJAXRequest.CALLBACK_POOLS).toContain('clienterror');
            expect(AJAXRequest.CALLBACK_POOLS).toContain('beforeajax');
            expect(AJAXRequest.CALLBACK_POOLS).toContain('afterajax');
        });

        test('instance has expected methods', () => {
            const ajax = new AJAXRequest();
            expect(typeof ajax.send).toBe('function');
            expect(typeof ajax.setURL).toBe('function');
            expect(typeof ajax.setMethod).toBe('function');
            expect(typeof ajax.setParams).toBe('function');
            expect(typeof ajax.setOnSuccess).toBe('function');
        });
    });
});
