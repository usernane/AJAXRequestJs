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

    // Helper to simulate XHR response
    function simulateResponse(xhr, status, responseText) {
        xhr.status = status;
        xhr.responseText = responseText || '';
        xhr.readyState = 4;
        if (xhr.onreadystatechange) {
            xhr.onreadystatechange();
        }
    }

    describe('Promise return value', () => {
        test('send() returns a Promise', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const result = ajax.send();

            // Duck-type check — VM context has a separate Promise constructor
            expect(typeof result.then).toBe('function');
            expect(typeof result.catch).toBe('function');
            // settle to avoid unhandled rejection
            simulateResponse(xhrInstances[xhrInstances.length - 1], 200, '{}');
            return result;
        });

        test('Promise resolves on 2xx response', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const promise = ajax.send();
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 200, '{"data": "test"}');

            const response = await promise;
            expect(response.status).toBe(200);
            expect(response.jsonResponse).toEqual({ data: 'test' });
        });

        test('Promise resolves on 3xx response', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const promise = ajax.send();
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 302, '');

            const response = await promise;
            expect(response.status).toBe(302);
        });

        test('Promise rejects on 4xx response', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const promise = ajax.send();
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 404, '{"error": "Not found"}');

            await expect(promise).rejects.toMatchObject({
                type: 'clienterror',
                status: 404,
                jsonResponse: { error: 'Not found' }
            });
        });

        test('Promise rejects on 5xx response', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const promise = ajax.send();
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 500, '{"error": "Server error"}');

            await expect(promise).rejects.toMatchObject({
                type: 'servererror',
                status: 500
            });
        });

        test('Promise rejects when AJAX is disabled', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                enabled: false
            });

            const promise = ajax.send();

            await expect(promise).rejects.toMatchObject({
                type: 'disabled'
            });
        });

        test('Promise rejects on connection lost (status 0)', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });
            // Disable retry for this test
            ajax.retry.times = 0;

            const promise = ajax.send();
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 0, '');

            await expect(promise).rejects.toMatchObject({
                type: 'connectionlost',
                status: 0
            });
        });

        test('response object contains all expected properties', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const promise = ajax.send();
            const xhr = xhrInstances[xhrInstances.length - 1];
            xhr.getAllResponseHeaders = jest.fn(() => 'content-type: application/json\r\nx-custom: value');
            simulateResponse(xhr, 200, '{"test": true}');

            const response = await promise;
            expect(response).toHaveProperty('status', 200);
            expect(response).toHaveProperty('response', '{"test": true}');
            expect(response).toHaveProperty('jsonResponse', { test: true });
            expect(response).toHaveProperty('responseHeaders');
            expect(response.responseHeaders['content-type']).toBe('application/json');
        });
    });

    describe('callbacks still work with Promise', () => {
        test('onSuccess callback fires before Promise resolves', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onSuccess: function() {
                    callOrder.push('callback');
                }
            });

            const promise = ajax.send().then(() => {
                callOrder.push('promise');
            });
            
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 200, '{}');

            await promise;
            expect(callOrder).toEqual(['callback', 'promise']);
        });

        test('afterAjax callback fires before Promise settles', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onSuccess: function() {
                    callOrder.push('onSuccess');
                },
                afterAjax: function() {
                    callOrder.push('afterAjax');
                }
            });

            const promise = ajax.send().then(() => {
                callOrder.push('promise');
            });
            
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 200, '{}');

            await promise;
            expect(callOrder).toEqual(['onSuccess', 'afterAjax', 'promise']);
        });

        test('onClientErr callback fires before Promise rejects', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onClientErr: function() {
                    callOrder.push('callback');
                }
            });

            const promise = ajax.send().catch(() => {
                callOrder.push('promise');
            });
            
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 400, '{}');

            await promise;
            expect(callOrder).toEqual(['callback', 'promise']);
        });

        test('callback errors do not affect Promise settlement', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onSuccess: function() {
                    throw new Error('Callback error');
                }
            });

            const promise = ajax.send();
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 200, '{"data": "test"}');

            // Promise should still resolve despite callback throwing
            const response = await promise;
            expect(response.status).toBe(200);
        });
    });

    describe('async/await usage', () => {
        test('can use async/await for success', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const promise = ajax.send();
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 200, '{"message": "hello"}');

            const response = await promise;
            expect(response.jsonResponse.message).toBe('hello');
        });

        test('can use try/catch for errors', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const promise = ajax.send();
            const xhr = xhrInstances[xhrInstances.length - 1];
            simulateResponse(xhr, 500, '{"error": "fail"}');

            try {
                await promise;
                fail('Should have thrown');
            } catch (error) {
                expect(error.type).toBe('servererror');
                expect(error.status).toBe(500);
            }
        });
    });

    describe('GET requests', () => {
        test('GET request with no params', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const promise = ajax.send();

            expect(xhrInstances.length).toBeGreaterThan(0);
            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('GET', 'https://example.com/api');
            expect(xhr.send).toHaveBeenCalled();

            // Settle the promise to avoid unhandled rejection
            simulateResponse(xhr, 200, '{}');
            await promise;
        });

        test('GET request with object params', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { foo: 'bar', baz: 123 }
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith(
                'GET',
                expect.stringContaining('https://example.com/api?')
            );
            // Check params are in the URL
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('foo=bar');
            expect(url).toContain('baz=123');

            simulateResponse(xhr, 200, '{}');
            await promise;
        });

        test('GET request with string params', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: 'key1=value1&key2=value2'
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith(
                'GET',
                'https://example.com/api?key1=value1&key2=value2'
            );

            simulateResponse(xhr, 200, '{}');
            await promise;
        });
    });

    describe('POST requests', () => {
        test('POST request with FormData', async () => {
            const formData = new FormData();
            formData.append('username', 'testuser');

            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: formData
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('POST', 'https://example.com/api');
            expect(xhr.send).toHaveBeenCalledWith(formData);
            // Should NOT set Content-Type for FormData (browser handles it)
            expect(xhr.setRequestHeader).not.toHaveBeenCalledWith(
                'Content-Type',
                'application/x-www-form-urlencoded'
            );

            simulateResponse(xhr, 200, '{}');
            await promise;
        });

        test('POST request with object params converts to FormData', async () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: { username: 'testuser', age: 25 }
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('POST', 'https://example.com/api');
            expect(xhr.send).toHaveBeenCalled();

            simulateResponse(xhr, 200, '{}');
            await promise;
        });

        test('POST request with string params sets Content-Type', async () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: 'username=testuser&age=25'
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('POST', 'https://example.com/api');
            expect(xhr.setRequestHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/x-www-form-urlencoded'
            );

            simulateResponse(xhr, 200, '{}');
            await promise;
        });
    });

    describe('DELETE requests', () => {
        test('DELETE request', async () => {
            const ajax = new AJAXRequest({
                method: 'DELETE',
                url: 'https://example.com/api/resource/123'
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('DELETE', 'https://example.com/api/resource/123');
            expect(xhr.send).toHaveBeenCalled();

            simulateResponse(xhr, 200, '{}');
            await promise;
        });

        test('DELETE request with params', async () => {
            const ajax = new AJAXRequest({
                method: 'DELETE',
                url: 'https://example.com/api/resource',
                params: { id: 456 }
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('id=456');

            simulateResponse(xhr, 200, '{}');
            await promise;
        });
    });

    describe('PUT requests', () => {
        test('PUT request with object params', async () => {
            const ajax = new AJAXRequest({
                method: 'PUT',
                url: 'https://example.com/api/resource/123',
                params: { name: 'updated' }
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('PUT', 'https://example.com/api/resource/123');
            expect(xhr.send).toHaveBeenCalled();

            simulateResponse(xhr, 200, '{}');
            await promise;
        });
    });

    describe('disabled AJAX', () => {
        test('rejects Promise when AJAX is disabled', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                enabled: false
            });

            await expect(ajax.send()).rejects.toMatchObject({
                type: 'disabled'
            });
        });

        test('does not send request when disabled', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                enabled: false
            });

            try {
                await ajax.send();
            } catch (e) {
                // Expected rejection
            }

            // No XHR should have been opened/sent
            const sentXhrs = xhrInstances.filter(xhr => xhr.open.mock.calls.length > 0);
            expect(sentXhrs.length).toBe(0);
        });

        test('can be disabled via setEnabled()', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            ajax.setEnabled(false);
            
            await expect(ajax.send()).rejects.toMatchObject({
                type: 'disabled'
            });
        });
    });

    describe('custom headers', () => {
        test('custom headers are sent with GET request', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                headers: {
                    'X-Custom-Header': 'custom-value',
                    'Authorization': 'Bearer token123'
                }
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Custom-Header', 'custom-value');
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer token123');

            simulateResponse(xhr, 200, '{}');
            await promise;
        });

        test('custom headers are sent with POST request', async () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                headers: {
                    'X-Api-Key': 'api-key-123'
                },
                params: { data: 'test' }
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Api-Key', 'api-key-123');

            simulateResponse(xhr, 200, '{}');
            await promise;
        });

        test('headers added via addHeader() are sent', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            ajax.addHeader('X-Added-Header', 'added-value');
            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Added-Header', 'added-value');

            simulateResponse(xhr, 200, '{}');
            await promise;
        });
    });

    describe('base URL', () => {
        test('base URL is prepended to URL', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                base: 'https://api.example.com',
                url: '/users/123'
            });

            const promise = ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('GET', 'https://api.example.com/users/123');

            simulateResponse(xhr, 200, '{}');
            await promise;
        });
    });

    describe('beforeAjax callbacks', () => {
        test('beforeAjax error rejects Promise', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                beforeAjax: function() {
                    throw new Error('Validation failed');
                }
            });

            await expect(ajax.send()).rejects.toMatchObject({
                type: 'beforeajax_error'
            });
        });

        test('beforeAjax can disable request', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                beforeAjax: function() {
                    this.AJAXRequest.setEnabled(false);
                }
            });

            await expect(ajax.send()).rejects.toMatchObject({
                type: 'disabled'
            });
        });
    });

    describe('multiple concurrent requests', () => {
        test('multiple requests from same instance have independent Promises', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            const promise1 = ajax.send();
            const promise2 = ajax.send();

            expect(promise1).not.toBe(promise2);

            // Get the two XHRs
            const xhr1 = xhrInstances[xhrInstances.length - 2];
            const xhr2 = xhrInstances[xhrInstances.length - 1];

            // Simulate different responses
            simulateResponse(xhr1, 200, '{"id": 1}');
            simulateResponse(xhr2, 200, '{"id": 2}');

            const [response1, response2] = await Promise.all([promise1, promise2]);
            expect(response1.jsonResponse.id).toBe(1);
            expect(response2.jsonResponse.id).toBe(2);
        });
    });
});
