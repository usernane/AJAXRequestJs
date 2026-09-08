/**
 * Tests for addHeader() input validation (#74, #75)
 *
 * #74 — validate header names against RFC 7230 token character set
 * #75 — validate header values against CRLF injection
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest.addHeader() validation', () => {
    let AJAXRequest;

    beforeEach(() => {
        resetContext();
        AJAXRequest = loadAJAXRequest({
            mocks: {
                console: { ...console, info: jest.fn(), warn: jest.fn(), log: jest.fn() }
            }
        });
    });

    // -------------------------------------------------------------------------
    // Existing behaviour — must keep passing
    // -------------------------------------------------------------------------
    describe('baseline (existing valid behaviour)', () => {
        test('accepts a valid header name and value, returns true', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Custom-Header', 'some-value')).toBe(true);
            expect(ajax.customHeaders['X-Custom-Header']).toBe('some-value');
        });

        test('accepts all RFC 7230 tchar characters in header name', () => {
            const ajax = new AJAXRequest();
            // tchar = ALPHA / DIGIT / ! # $ % & ' * + - . ^ _ ` | ~
            expect(ajax.addHeader("X-Valid!#$%&'*+-.^_`|~Name", 'v')).toBe(true);
        });

        test('returns false for non-string name', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader(123, 'value')).toBe(false);
        });

        test('returns false for empty name', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('', 'value')).toBe(false);
        });

        test('returns false for non-string value', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Header', 123)).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // #74 — header name validation (RFC 7230 token characters)
    // -------------------------------------------------------------------------
    describe('#74 — header name must contain only valid token characters', () => {
        test('rejects name containing CR (\\r)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Evil\rHeader', 'value')).toBe(false);
        });

        test('rejects name containing LF (\\n)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Evil\nHeader', 'value')).toBe(false);
        });

        test('rejects name containing CRLF (\\r\\n)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Evil\r\nInjected: attack', 'value')).toBe(false);
        });

        test('rejects name containing colon (:)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Bad:Name', 'value')).toBe(false);
        });

        test('rejects name containing space', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X Bad Name', 'value')).toBe(false);
        });

        test('rejects name containing null byte', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Bad\x00Name', 'value')).toBe(false);
        });

        test('rejects name containing parentheses', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Bad(Name)', 'value')).toBe(false);
        });

        test('does not store a rejected header name', () => {
            const ajax = new AJAXRequest();
            ajax.addHeader('X-Evil\r\nInjected: attack', 'value');
            expect(Object.keys(ajax.customHeaders).length).toBe(0);
        });
    });

    // -------------------------------------------------------------------------
    // #75 — header value validation (no CRLF injection)
    // -------------------------------------------------------------------------
    describe('#75 — header value must not contain CRLF sequences', () => {
        test('rejects value containing CR (\\r)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Header', 'value\rinjected')).toBe(false);
        });

        test('rejects value containing LF (\\n)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Header', 'value\ninjected')).toBe(false);
        });

        test('rejects value containing CRLF (\\r\\n)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Header', 'value\r\nX-Injected: attack')).toBe(false);
        });

        test('rejects value containing null byte', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Header', 'value\x00injected')).toBe(false);
        });

        test('accepts value with normal printable characters including spaces', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Header', 'Bearer token123 with spaces')).toBe(true);
        });

        test('accepts value with unicode characters', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Header', 'ünïcödé')).toBe(true);
        });

        test('does not store a rejected header value', () => {
            const ajax = new AJAXRequest();
            ajax.addHeader('X-Header', 'value\r\nX-Injected: attack');
            expect(ajax.customHeaders['X-Header']).toBeUndefined();
        });
    });
});
