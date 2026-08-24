/**
 * Tests for AJAXRequest CSRF token extraction
 */

const { loadAJAXRequest, resetContext, getContext } = require('./helpers/loader');

describe('AJAXRequest CSRF token extraction', () => {
    let AJAXRequest;
    let xhrInstances;
    let MockXMLHttpRequest;
    let context;

    beforeEach(() => {
        resetContext();

        xhrInstances = [];

        MockXMLHttpRequest = jest.fn(function() {
            this.open = jest.fn();
            this.send = jest.fn();
            this.setRequestHeader = jest.fn();
            this.readyState = 4;
            this.status = 200;
            this.active = false;
            xhrInstances.push(this);
        });

        AJAXRequest = loadAJAXRequest({
            mocks: {
                XMLHttpRequest: MockXMLHttpRequest,
                console: { ...console, info: jest.fn(), log: jest.fn(), warning: jest.fn() }
            }
        });

        context = getContext();
        // Reset window.csrfToken before each test
        context.window.csrfToken = undefined;
    });

    describe('getCsrfToken extraction', () => {
        test('extracts from window.csrfToken', () => {
            context.window.csrfToken = 'token-from-window';

            const ajax = new AJAXRequest();
            const token = ajax.getCsrfToken();

            expect(token).toBe('token-from-window');
        });

        test('extracts from meta tag with name="csrf-token"', () => {
            // Create meta tag in the document
            const meta = context.document.createElement('meta');
            meta.setAttribute('name', 'csrf-token');
            meta.setAttribute('content', 'token-from-meta');
            context.document.head.appendChild(meta);

            const ajax = new AJAXRequest();
            const token = ajax.getCsrfToken();

            expect(token).toBe('token-from-meta');

            // Cleanup
            context.document.head.removeChild(meta);
        });

        test('extracts from input element with name="csrf-token"', () => {
            // Create input element in the document
            const input = context.document.createElement('input');
            input.setAttribute('name', 'csrf-token');
            input.setAttribute('value', 'token-from-input');
            context.document.body.appendChild(input);

            const ajax = new AJAXRequest();
            const token = ajax.getCsrfToken();

            expect(token).toBe('token-from-input');

            // Cleanup
            context.document.body.removeChild(input);
        });

        test('returns undefined when token not found', () => {
            const ajax = new AJAXRequest();
            const token = ajax.getCsrfToken();

            expect(token).toBeUndefined();
        });

        test('window.csrfToken takes priority over meta tag', () => {
            context.window.csrfToken = 'token-from-window';

            const meta = context.document.createElement('meta');
            meta.setAttribute('name', 'csrf-token');
            meta.setAttribute('content', 'token-from-meta');
            context.document.head.appendChild(meta);

            const ajax = new AJAXRequest();
            const token = ajax.getCsrfToken();

            expect(token).toBe('token-from-window');

            // Cleanup
            context.document.head.removeChild(meta);
        });

        test('meta tag takes priority over input element', () => {
            const meta = context.document.createElement('meta');
            meta.setAttribute('name', 'csrf-token');
            meta.setAttribute('content', 'token-from-meta');
            context.document.head.appendChild(meta);

            const input = context.document.createElement('input');
            input.setAttribute('name', 'csrf-token');
            input.setAttribute('value', 'token-from-input');
            context.document.body.appendChild(input);

            const ajax = new AJAXRequest();
            const token = ajax.getCsrfToken();

            expect(token).toBe('token-from-meta');

            // Cleanup
            context.document.head.removeChild(meta);
            context.document.body.removeChild(input);
        });

        test('falls back to input when meta has no content', () => {
            const meta = context.document.createElement('meta');
            meta.setAttribute('name', 'csrf-token');
            meta.setAttribute('content', ''); // Empty content
            context.document.head.appendChild(meta);

            const input = context.document.createElement('input');
            input.setAttribute('name', 'csrf-token');
            input.setAttribute('value', 'token-from-input');
            context.document.body.appendChild(input);

            const ajax = new AJAXRequest();
            const token = ajax.getCsrfToken();

            expect(token).toBe('token-from-input');

            // Cleanup
            context.document.head.removeChild(meta);
            context.document.body.removeChild(input);
        });
    });

    describe('CSRF token in request headers', () => {
        beforeEach(() => {
            context.window.csrfToken = 'test-csrf-token';
        });

        test('token sent in X-CSRF-TOKEN header on POST', () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: { data: 'test' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-CSRF-TOKEN', 'test-csrf-token');
        });

        test('token sent in X-CSRF-TOKEN header on PUT', () => {
            const ajax = new AJAXRequest({
                method: 'PUT',
                url: 'https://example.com/api',
                params: { data: 'test' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-CSRF-TOKEN', 'test-csrf-token');
        });

        test('token sent in X-CSRF-TOKEN header on DELETE', () => {
            const ajax = new AJAXRequest({
                method: 'DELETE',
                url: 'https://example.com/api/resource/123'
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-CSRF-TOKEN', 'test-csrf-token');
        });

        test('token NOT sent on GET request', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).not.toHaveBeenCalledWith('X-CSRF-TOKEN', expect.anything());
        });

        test('token NOT sent when not available', () => {
            context.window.csrfToken = undefined;

            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: { data: 'test' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).not.toHaveBeenCalledWith('X-CSRF-TOKEN', expect.anything());
        });
    });

    describe('token caching', () => {
        test('token is cached in window.csrfToken after first extraction', () => {
            const meta = context.document.createElement('meta');
            meta.setAttribute('name', 'csrf-token');
            meta.setAttribute('content', 'cached-token');
            context.document.head.appendChild(meta);

            const ajax = new AJAXRequest();
            ajax.getCsrfToken();

            // Token should be cached in window
            expect(context.window.csrfToken).toBe('cached-token');

            // Cleanup
            context.document.head.removeChild(meta);
        });

        test('subsequent calls return cached token', () => {
            const meta = context.document.createElement('meta');
            meta.setAttribute('name', 'csrf-token');
            meta.setAttribute('content', 'original-token');
            context.document.head.appendChild(meta);

            const ajax = new AJAXRequest();
            const token1 = ajax.getCsrfToken();

            // Remove meta tag
            context.document.head.removeChild(meta);

            // Should still return cached token
            const token2 = ajax.getCsrfToken();

            expect(token1).toBe('original-token');
            expect(token2).toBe('original-token');
        });
    });
});
