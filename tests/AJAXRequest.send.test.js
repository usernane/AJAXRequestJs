/**
 * Tests for AJAXRequest.send() method
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest.send()', () => {
    let AJAXRequest;
    let xhrInstances;
    let MockXMLHttpRequest;

    beforeEach(() => {
        resetContext();

        // Track XHR instances
        xhrInstances = [];

        // Create mock XMLHttpRequest constructor
        MockXMLHttpRequest = jest.fn(function() {
            this.open = jest.fn();
            this.send = jest.fn();
            this.setRequestHeader = jest.fn();
            this.readyState = 4;
            this.status = 200;
            this.response = '{"success": true}';
            this.responseText = '{"success": true}';
            this.getAllResponseHeaders = jest.fn(() => 'content-type: application/json');
            this.onreadystatechange = null;
            this.onload = null;
            this.onprogress = null;
            this.active = false;
            xhrInstances.push(this);
        });

        // Load AJAXRequest with mocked XMLHttpRequest
        AJAXRequest = loadAJAXRequest({
            mocks: {
                XMLHttpRequest: MockXMLHttpRequest,
                console: { ...console, info: jest.fn(), log: jest.fn() } // Silence verbose logs
            }
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('GET requests', () => {
        test('GET request with no params', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const result = ajax.send();

            expect(result).toBe(true);
            expect(xhrInstances.length).toBeGreaterThan(0);
            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('GET', 'https://example.com/api');
            expect(xhr.send).toHaveBeenCalled();
        });

        test('GET request with object params', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { foo: 'bar', baz: 123 }
            });

            const result = ajax.send();

            expect(result).toBe(true);
            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith(
                'GET',
                expect.stringContaining('https://example.com/api?')
            );
            // Check params are in the URL
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('foo=bar');
            expect(url).toContain('baz=123');
        });

        test('GET request with string params', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: 'key1=value1&key2=value2'
            });

            const result = ajax.send();

            expect(result).toBe(true);
            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith(
                'GET',
                'https://example.com/api?key1=value1&key2=value2'
            );
        });
    });

    describe('POST requests', () => {
        test('POST request with FormData', () => {
            const formData = new FormData();
            formData.append('username', 'testuser');

            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: formData
            });

            const result = ajax.send();

            expect(result).toBe(true);
            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('POST', 'https://example.com/api');
            expect(xhr.send).toHaveBeenCalledWith(formData);
            // Should NOT set Content-Type for FormData (browser handles it)
            expect(xhr.setRequestHeader).not.toHaveBeenCalledWith(
                'Content-Type',
                'application/x-www-form-urlencoded'
            );
        });

        test('POST request with object params converts to FormData', () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: { username: 'testuser', age: 25 }
            });

            const result = ajax.send();

            expect(result).toBe(true);
            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('POST', 'https://example.com/api');
            expect(xhr.send).toHaveBeenCalled();
            // Object params get converted to FormData for POST, so Content-Type is NOT set
            // (FormData sets its own multipart boundary)
        });

        test('POST request with string params sets Content-Type', () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: 'username=testuser&age=25'
            });

            const result = ajax.send();

            expect(result).toBe(true);
            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('POST', 'https://example.com/api');
            expect(xhr.setRequestHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/x-www-form-urlencoded'
            );
        });
    });

    describe('DELETE requests', () => {
        test('DELETE request', () => {
            const ajax = new AJAXRequest({
                method: 'DELETE',
                url: 'https://example.com/api/resource/123'
            });

            const result = ajax.send();

            expect(result).toBe(true);
            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('DELETE', 'https://example.com/api/resource/123');
            expect(xhr.send).toHaveBeenCalled();
        });

        test('DELETE request with params', () => {
            const ajax = new AJAXRequest({
                method: 'DELETE',
                url: 'https://example.com/api/resource',
                params: { id: 456 }
            });

            const result = ajax.send();

            expect(result).toBe(true);
            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('id=456');
        });
    });

    describe('PUT requests', () => {
        test('PUT request with object params', () => {
            const ajax = new AJAXRequest({
                method: 'PUT',
                url: 'https://example.com/api/resource/123',
                params: { name: 'updated' }
            });

            const result = ajax.send();

            expect(result).toBe(true);
            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('PUT', 'https://example.com/api/resource/123');
            expect(xhr.send).toHaveBeenCalled();
        });
    });

    describe('disabled AJAX', () => {
        test('returns false when AJAX is disabled', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                enabled: false
            });

            const result = ajax.send();

            expect(result).toBe(false);
        });

        test('does not send request when disabled', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                enabled: false
            });

            ajax.send();

            // No XHR should have been opened/sent
            const sentXhrs = xhrInstances.filter(xhr => xhr.open.mock.calls.length > 0);
            expect(sentXhrs.length).toBe(0);
        });

        test('can be disabled via setEnabled()', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            ajax.setEnabled(false);
            const result = ajax.send();

            expect(result).toBe(false);
        });
    });

    describe('custom headers', () => {
        test('custom headers are sent with GET request', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                headers: {
                    'X-Custom-Header': 'custom-value',
                    'Authorization': 'Bearer token123'
                }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Custom-Header', 'custom-value');
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer token123');
        });

        test('custom headers are sent with POST request', () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                headers: {
                    'X-Api-Key': 'api-key-123'
                },
                params: { data: 'test' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Api-Key', 'api-key-123');
        });

        test('headers added via addHeader() are sent', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            ajax.addHeader('X-Added-Header', 'added-value');
            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Added-Header', 'added-value');
        });
    });

    describe('base URL', () => {
        test('base URL is prepended to URL', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                base: 'https://api.example.com',
                url: '/users/123'
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('GET', 'https://api.example.com/users/123');
        });
    });
});
