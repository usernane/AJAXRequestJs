/**
 * Tests for AJAXRequest.isValidURL (#76)
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest.isValidURL', () => {
    let AJAXRequest;

    beforeEach(() => {
        resetContext();
        AJAXRequest = loadAJAXRequest({
            mocks: {
                URL,
                console: { ...console, info: jest.fn(), warn: jest.fn() }
            }
        });
    });

    describe('valid URLs — should return true', () => {
        test('standard https URL', () => {
            expect(AJAXRequest.isValidURL('https://api.github.com')).toBe(true);
        });

        test('standard http URL', () => {
            expect(AJAXRequest.isValidURL('http://example.com')).toBe(true);
        });

        test('URL with path', () => {
            expect(AJAXRequest.isValidURL('https://api.github.com/repos/user/repo')).toBe(true);
        });

        test('URL with query string', () => {
            expect(AJAXRequest.isValidURL('https://packagist.org/packages/list.json?vendor=webfiori')).toBe(true);
        });

        test('URL with port', () => {
            expect(AJAXRequest.isValidURL('https://api.example.com:8443/v2')).toBe(true);
        });

        test('IPv4 address', () => {
            expect(AJAXRequest.isValidURL('http://192.168.1.1')).toBe(true);
        });

        test('IPv4 with port and path', () => {
            expect(AJAXRequest.isValidURL('http://192.168.1.1:8080/api')).toBe(true);
        });

        test.each([
            'http://[::1]:8080/api',
            'https://[2001:db8::1]/api?q=test#result',
            'http://[2001:DB8:0:0:0:0:0:1]',
            'http://[::]',
            'http://[::ffff:192.0.2.1]',
            '[::1]:8080/api'
        ])('bracketed IPv6 URL (#77): %s', (url) => {
            expect(AJAXRequest.isValidURL(url)).toBe(true);
        });

        test.each(['example.com/api', 'localhost:3000', '192.168.1.1/api'])(
            'URL without protocol: %s', (url) => {
                expect(AJAXRequest.isValidURL(url)).toBe(true);
            }
        );

        // #76 — localhost was rejected, should be true
        test('localhost (#76)', () => {
            expect(AJAXRequest.isValidURL('http://localhost')).toBe(true);
        });

        test('localhost with port (#76)', () => {
            expect(AJAXRequest.isValidURL('http://localhost:3000')).toBe(true);
        });

        test('localhost with path (#76)', () => {
            expect(AJAXRequest.isValidURL('http://localhost:3000/api/users')).toBe(true);
        });

        test('localhost with query string (#76)', () => {
            expect(AJAXRequest.isValidURL('http://localhost:8080/search?q=test')).toBe(true);
        });

        test('https localhost (#76)', () => {
            expect(AJAXRequest.isValidURL('https://localhost:3000')).toBe(true);
        });
    });

    describe('invalid URLs — should return false', () => {
        test('empty string', () => {
            expect(AJAXRequest.isValidURL('')).toBe(false);
        });

        test('plain string with no domain structure', () => {
            expect(AJAXRequest.isValidURL('not-a-url')).toBe(false);
        });

        test('string with spaces', () => {
            expect(AJAXRequest.isValidURL('http://example .com')).toBe(false);
        });

        test.each([
            'http://::1:8080/api',
            'http://[::1',
            'http://[]',
            'http://[1234]',
            'http://[1:2:3:4:5:6:7]',
            'http://[1:2:3:4:5:6:7:8:9]',
            'http://[2001::db8::1]',
            'http://[12345::1]',
            'http://[gggg::1]',
            'http://[::ffff:999.0.2.1]',
            'http://[127.0.0.1]',
            'http://[::1]example.com',
            'http://[::1]:abc/api',
            'http://[::1]/a b',
            'ftp://[::1]',
            'ftp://example.com',
            'http://example.com/a b'
        ])('malformed or unsupported URL: %s', (url) => {
            expect(AJAXRequest.isValidURL(url)).toBe(false);
        });
    });
});
