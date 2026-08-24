/**
 * Tests for Promise support in AJAXRequest.send() - Issue #95
 * Tests retry mechanism with Promise continuity
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest.send() Promise with Retry', () => {
    let AJAXRequest;
    let xhrInstances;
    let MockXMLHttpRequest;

    beforeEach(() => {
        resetContext();
        jest.useFakeTimers();

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

        AJAXRequest = loadAJAXRequest({
            mocks: {
                XMLHttpRequest: MockXMLHttpRequest,
                console: {
                    ...console,
                    info: jest.fn(),
                    log: jest.fn(),
                    warn: jest.fn()
                }
            }
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    function simulateResponse(xhr, status, responseText) {
        xhr.status = status;
        xhr.responseText = responseText || '';
        xhr.readyState = 4;
        if (xhr.onreadystatechange) {
            xhr.onreadystatechange();
        }
    }

    function getLastXhr() {
        return xhrInstances[xhrInstances.length - 1];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Promise return value
    // ─────────────────────────────────────────────────────────────────────────
    describe('Promise return value', () => {
        test('send() returns a Promise', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const result = ajax.send();
            // Check it is thenable (Promise-like) — using duck-typing because
            // the VM context has a separate Promise constructor from the test context
            expect(typeof result.then).toBe('function');
            expect(typeof result.catch).toBe('function');
            // settle to avoid unhandled rejection
            simulateResponse(getLastXhr(), 200, '{}');
            return result;
        });

        test('Promise resolves on 2xx response', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 200, '{"data": "test"}');
            const response = await promise;
            expect(response.status).toBe(200);
            expect(response.jsonResponse).toEqual({ data: 'test' });
        });

        test('Promise resolves on 3xx response', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 302, '');
            const response = await promise;
            expect(response.status).toBe(302);
        });

        test('Promise rejects on 4xx response', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 404, '{"error": "Not found"}');
            await expect(promise).rejects.toMatchObject({
                type: 'clienterror',
                status: 404,
                jsonResponse: { error: 'Not found' }
            });
        });

        test('Promise rejects on 5xx response', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 500, '{"error": "Server error"}');
            await expect(promise).rejects.toMatchObject({
                type: 'servererror',
                status: 500
            });
        });

        test('Promise rejects when AJAX is disabled', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', enabled: false });
            await expect(ajax.send()).rejects.toMatchObject({ type: 'disabled' });
        });

        test('Promise rejects on connection lost when retry disabled (times=0)', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.retry.times = 0;
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 0, '');
            await expect(promise).rejects.toMatchObject({ type: 'connectionlost', status: 0 });
        });

        test('response object contains all expected properties', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const promise = ajax.send();
            const xhr = getLastXhr();
            xhr.getAllResponseHeaders = jest.fn(() => 'content-type: application/json\r\nx-custom: value');
            simulateResponse(xhr, 200, '{"test": true}');
            const response = await promise;
            expect(response).toHaveProperty('status', 200);
            expect(response).toHaveProperty('response', '{"test": true}');
            expect(response).toHaveProperty('jsonResponse', { test: true });
            expect(response).toHaveProperty('responseHeaders');
            expect(response.responseHeaders['content-type']).toBe('application/json');
            expect(response.responseHeaders['x-custom']).toBe('value');
        });

        test('error response shape contains type property', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 400, '{"msg": "bad"}');
            const error = await promise.catch(e => e);
            expect(error).toHaveProperty('type', 'clienterror');
            expect(error).toHaveProperty('status', 400);
            expect(error).toHaveProperty('response');
            expect(error).toHaveProperty('jsonResponse');
            expect(error).toHaveProperty('responseHeaders');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Callbacks still work alongside Promise
    // ─────────────────────────────────────────────────────────────────────────
    describe('callbacks execute before Promise settles', () => {
        test('onSuccess callback fires before Promise resolves', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onSuccess: function() { callOrder.push('callback'); }
            });
            const promise = ajax.send().then(() => { callOrder.push('promise'); });
            simulateResponse(getLastXhr(), 200, '{}');
            await promise;
            expect(callOrder).toEqual(['callback', 'promise']);
        });

        test('afterAjax fires after onSuccess but before Promise resolves', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onSuccess: function() { callOrder.push('onSuccess'); },
                afterAjax: function() { callOrder.push('afterAjax'); }
            });
            const promise = ajax.send().then(() => { callOrder.push('promise'); });
            simulateResponse(getLastXhr(), 200, '{}');
            await promise;
            expect(callOrder).toEqual(['onSuccess', 'afterAjax', 'promise']);
        });

        test('onClientErr callback fires before Promise rejects', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onClientErr: function() { callOrder.push('callback'); }
            });
            const promise = ajax.send().catch(() => { callOrder.push('promise'); });
            simulateResponse(getLastXhr(), 400, '{}');
            await promise;
            expect(callOrder).toEqual(['callback', 'promise']);
        });

        test('onServerErr callback fires before Promise rejects', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onServerErr: function() { callOrder.push('callback'); }
            });
            const promise = ajax.send().catch(() => { callOrder.push('promise'); });
            simulateResponse(getLastXhr(), 500, '{}');
            await promise;
            expect(callOrder).toEqual(['callback', 'promise']);
        });

        test('callback errors do not reject Promise', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onSuccess: function() { throw new Error('Callback boom'); }
            });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 200, '{"data": "ok"}');
            // Must resolve, not reject
            const response = await promise;
            expect(response.status).toBe(200);
        });

        test('multiple onSuccess callbacks all fire', async () => {
            const calls = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setOnSuccess(function() { calls.push('first'); });
            ajax.setOnSuccess(function() { calls.push('second'); });
            ajax.setOnSuccess(function() { calls.push('third'); });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 200, '{}');
            await promise;
            expect(calls).toEqual(['first', 'second', 'third']);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // beforeAjax
    // ─────────────────────────────────────────────────────────────────────────
    describe('beforeAjax interaction', () => {
        test('beforeAjax error rejects Promise', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                beforeAjax: function() { throw new Error('Validation failed'); }
            });
            await expect(ajax.send()).rejects.toMatchObject({ type: 'beforeajax_error' });
        });

        test('beforeAjax disabling request rejects Promise', async () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                beforeAjax: function() { this.AJAXRequest.setEnabled(false); }
            });
            await expect(ajax.send()).rejects.toMatchObject({ type: 'disabled' });
        });

        test('beforeAjax error object contains the thrown error', async () => {
            const err = new Error('input invalid');
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                beforeAjax: function() { throw err; }
            });
            const rejection = await ajax.send().catch(e => e);
            expect(rejection.type).toBe('beforeajax_error');
            expect(rejection.error).toBe(err);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Retry with Promise continuity
    // ─────────────────────────────────────────────────────────────────────────
    describe('retry Promise continuity', () => {
        test('original Promise resolves after successful retry on 2nd attempt', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(3, 2, function() {});

            const promise = ajax.send();

            // 1st attempt: connection lost
            simulateResponse(getLastXhr(), 0, '');
            // Countdown
            jest.advanceTimersByTime(2000);
            // 2nd attempt: success
            simulateResponse(getLastXhr(), 200, '{"retried": true}');

            const response = await promise;
            expect(response.status).toBe(200);
            expect(response.jsonResponse).toEqual({ retried: true });
        });

        test('original Promise resolves after successful retry on 3rd attempt', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(3, 1, function() {});

            const promise = ajax.send();

            simulateResponse(getLastXhr(), 0, ''); // fail 1
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 0, ''); // fail 2
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{"attempt": 3}'); // success on 3

            const response = await promise;
            expect(response.jsonResponse).toEqual({ attempt: 3 });
        });

        test('original Promise rejects after all retries exhausted', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 1, function() {});

            const promise = ajax.send();

            simulateResponse(getLastXhr(), 0, ''); // fail 1
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 0, ''); // fail 2 (retry 1)
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 0, ''); // fail 3 (retry 2, exhausted)

            await expect(promise).rejects.toMatchObject({
                type: 'connectionlost',
                status: 0
            });
        });

        test('a new send() call after retry exhaustion returns a fresh Promise', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});

            // First send — exhaust retries
            const promise1 = ajax.send();
            simulateResponse(getLastXhr(), 0, '');
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 0, '');
            await promise1.catch(() => {});

            // Second send should be a fresh, independent Promise
            const promise2 = ajax.send();
            expect(typeof promise2.then).toBe('function');
            expect(promise2).not.toBe(promise1);

            simulateResponse(getLastXhr(), 200, '{"fresh": true}');
            const response = await promise2;
            expect(response.jsonResponse).toEqual({ fresh: true });
        });

        test('retry state is isolated: retry count does not bleed between requests', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 1, function() {});

            // First request completes cleanly
            const p1 = ajax.send();
            simulateResponse(getLastXhr(), 200, '{}');
            await p1;

            // Second request uses fresh retry counters — should still allow 2 retries
            const p2 = ajax.send();
            simulateResponse(getLastXhr(), 0, '');     // fail 1
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 0, '');     // retry 1 fails
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{"ok": true}'); // retry 2 succeeds

            const response = await p2;
            expect(response.jsonResponse).toEqual({ ok: true });
        });

        test('retry countdown callback still fires during Promise retry', async () => {
            const retryCalls = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 3, function(remainingSec, passNum) {
                retryCalls.push({ remainingSec, passNum });
            });

            const promise = ajax.send();
            simulateResponse(getLastXhr(), 0, '');

            jest.advanceTimersByTime(1000);
            jest.advanceTimersByTime(1000);
            jest.advanceTimersByTime(1000);

            simulateResponse(getLastXhr(), 200, '{}');
            await promise;

            expect(retryCalls).toHaveLength(3);
            expect(retryCalls[0]).toMatchObject({ remainingSec: 2, passNum: 0 });
            expect(retryCalls[1]).toMatchObject({ remainingSec: 1, passNum: 0 });
            expect(retryCalls[2]).toMatchObject({ remainingSec: 0, passNum: 0 });
        });

        test('onDisconnected callbacks fire when retries exhausted', async () => {
            let disconnectedCalled = false;
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onDisconnected: function() { disconnectedCalled = true; }
            });
            ajax.setRetry(1, 1, function() {});

            const promise = ajax.send();
            simulateResponse(getLastXhr(), 0, '');
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 0, '');

            await promise.catch(() => {});
            expect(disconnectedCalled).toBe(true);
        });

        test('onDisconnected fires before Promise rejects on exhaustion', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onDisconnected: function() { callOrder.push('onDisconnected'); }
            });
            ajax.setRetry(1, 1, function() {});

            const promise = ajax.send().catch(() => { callOrder.push('promise'); });
            simulateResponse(getLastXhr(), 0, '');
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 0, '');

            await promise;
            expect(callOrder).toEqual(['onDisconnected', 'promise']);
        });

        test('Promise stays pending throughout retry countdown', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 5, function() {});

            const promise = ajax.send();
            let resolved = false;
            let rejected = false;
            promise.then(() => { resolved = true; }).catch(() => { rejected = true; });

            simulateResponse(getLastXhr(), 0, '');

            // Part way through wait — still pending
            jest.advanceTimersByTime(2000);
            expect(resolved).toBe(false);
            expect(rejected).toBe(false);

            // Remaining countdown
            jest.advanceTimersByTime(3000);
            // Now retry fires — succeed
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;
            expect(resolved).toBe(true);
            expect(rejected).toBe(false);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Multiple concurrent requests
    // ─────────────────────────────────────────────────────────────────────────
    describe('multiple concurrent requests', () => {
        test('concurrent requests return independent Promises', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });

            const promise1 = ajax.send();
            const promise2 = ajax.send();

            expect(promise1).not.toBe(promise2);

            const xhr1 = xhrInstances[xhrInstances.length - 2];
            const xhr2 = xhrInstances[xhrInstances.length - 1];

            simulateResponse(xhr1, 200, '{"id": 1}');
            simulateResponse(xhr2, 200, '{"id": 2}');

            const [r1, r2] = await Promise.all([promise1, promise2]);
            expect(r1.jsonResponse.id).toBe(1);
            expect(r2.jsonResponse.id).toBe(2);
        });

        test('one concurrent request failing does not affect another', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.retry.times = 0; // no retry for this test

            const promise1 = ajax.send();
            const promise2 = ajax.send();

            const xhr1 = xhrInstances[xhrInstances.length - 2];
            const xhr2 = xhrInstances[xhrInstances.length - 1];

            simulateResponse(xhr1, 500, '{"error": "fail"}');
            simulateResponse(xhr2, 200, '{"ok": true}');

            await expect(promise1).rejects.toMatchObject({ type: 'servererror' });
            await expect(promise2).resolves.toMatchObject({ status: 200 });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Edge cases
    // ─────────────────────────────────────────────────────────────────────────
    describe('edge cases', () => {
        test('200 response with non-JSON body still resolves', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 200, 'plain text response');
            const response = await promise;
            expect(response.status).toBe(200);
            expect(response.response).toBe('plain text response');
            expect(response.jsonResponse).toBeNull();
        });

        test('error response with non-JSON body still rejects with response', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 500, 'Internal Server Error');
            await expect(promise).rejects.toMatchObject({
                type: 'servererror',
                status: 500,
                response: 'Internal Server Error',
                jsonResponse: null
            });
        });

        test('204 No Content resolves with empty response', async () => {
            const ajax = new AJAXRequest({ method: 'DELETE', url: 'https://example.com/api/1' });
            const promise = ajax.send();
            simulateResponse(getLastXhr(), 204, '');
            const response = await promise;
            expect(response.status).toBe(204);
            expect(response.response).toBe('');
        });

        test('Promise resolves with xmlResponse when server returns XML', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const promise = ajax.send();
            const xhr = getLastXhr();
            xhr.responseXML = '<root><item>1</item></root>';
            simulateResponse(xhr, 200, '');
            const response = await promise;
            expect(response.xmlResponse).toBe('<root><item>1</item></root>');
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backward compatibility
// ─────────────────────────────────────────────────────────────────────────────
describe('AJAXRequest.send() backward compatibility', () => {
    let AJAXRequest;
    let xhrInstances;
    let MockXMLHttpRequest;

    beforeEach(() => {
        resetContext();
        xhrInstances = [];

        MockXMLHttpRequest = jest.fn(function() {
            this.open = jest.fn();
            this.send = jest.fn();
            this.setRequestHeader = jest.fn();
            this.readyState = 4;
            this.status = 200;
            this.responseText = '{}';
            this.getAllResponseHeaders = jest.fn(() => '');
            this.onreadystatechange = null;
            this.active = false;
            xhrInstances.push(this);
        });

        AJAXRequest = loadAJAXRequest({
            mocks: {
                XMLHttpRequest: MockXMLHttpRequest,
                console: { ...console, info: jest.fn(), log: jest.fn(), warn: jest.fn() }
            }
        });
    });

    function simulateResponse(xhr, status, responseText) {
        xhr.status = status;
        xhr.responseText = responseText || '';
        xhr.readyState = 4;
        if (xhr.onreadystatechange) xhr.onreadystatechange();
    }

    test('code ignoring return value still works', () => {
        const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
        // Old style: ignore return value entirely
        ajax.send();
        const xhr = xhrInstances[xhrInstances.length - 1];
        expect(xhr.open).toHaveBeenCalled();
        // settle to avoid unhandled rejection
        simulateResponse(xhr, 200, '{}');
    });

    test('callback-only code works without touching Promise', (done) => {
        const ajax = new AJAXRequest({
            method: 'GET',
            url: 'https://example.com/api',
            onSuccess: function() {
                expect(this.status).toBe(200);
                expect(this.jsonResponse).toEqual({ success: true });
                done();
            }
        });
        ajax.send();
        simulateResponse(xhrInstances[xhrInstances.length - 1], 200, '{"success": true}');
    });

    test('can mix callbacks and Promise — both see same data', async () => {
        let callbackData = null;
        const ajax = new AJAXRequest({
            method: 'GET',
            url: 'https://example.com/api',
            onSuccess: function() { callbackData = this.jsonResponse; }
        });
        const promise = ajax.send();
        simulateResponse(xhrInstances[xhrInstances.length - 1], 200, '{"mixed": true}');
        const response = await promise;
        expect(callbackData).toEqual({ mixed: true });
        expect(response.jsonResponse).toEqual({ mixed: true });
    });

    test('.then() chaining works', async () => {
        const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
        const resultPromise = ajax.send().then(r => r.jsonResponse.value * 2);
        simulateResponse(xhrInstances[xhrInstances.length - 1], 200, '{"value": 21}');
        expect(await resultPromise).toBe(42);
    });

    test('.catch() handles rejection', async () => {
        const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
        const resultPromise = ajax.send().catch(e => 'handled:' + e.type);
        simulateResponse(xhrInstances[xhrInstances.length - 1], 404, '{}');
        expect(await resultPromise).toBe('handled:clienterror');
    });

    test('.finally() runs on success', async () => {
        let ran = false;
        const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
        const promise = ajax.send().finally(() => { ran = true; });
        simulateResponse(xhrInstances[xhrInstances.length - 1], 200, '{}');
        await promise;
        expect(ran).toBe(true);
    });

    test('.finally() runs on rejection', async () => {
        let ran = false;
        const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
        const promise = ajax.send().catch(() => {}).finally(() => { ran = true; });
        simulateResponse(xhrInstances[xhrInstances.length - 1], 500, '{}');
        await promise;
        expect(ran).toBe(true);
    });

    test('Promise.all() works with multiple send() calls', async () => {
        const ajax1 = new AJAXRequest({ method: 'GET', url: 'https://example.com/api/1' });
        const ajax2 = new AJAXRequest({ method: 'GET', url: 'https://example.com/api/2' });

        const p1 = ajax1.send();
        const p2 = ajax2.send();

        simulateResponse(xhrInstances[xhrInstances.length - 2], 200, '{"id":1}');
        simulateResponse(xhrInstances[xhrInstances.length - 1], 200, '{"id":2}');

        const [r1, r2] = await Promise.all([p1, p2]);
        expect(r1.jsonResponse.id).toBe(1);
        expect(r2.jsonResponse.id).toBe(2);
    });

    test('async/await with try/catch works end-to-end', async () => {
        const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });

        let result = null;
        let caughtError = null;

        // Success path
        const p1 = ajax.send();
        simulateResponse(xhrInstances[xhrInstances.length - 1], 200, '{"ok": true}');
        try {
            result = await p1;
        } catch (e) {
            caughtError = e;
        }
        expect(result.jsonResponse).toEqual({ ok: true });
        expect(caughtError).toBeNull();

        // Error path
        const p2 = ajax.send();
        simulateResponse(xhrInstances[xhrInstances.length - 1], 403, '{"denied": true}');
        try {
            await p2;
        } catch (e) {
            caughtError = e;
        }
        expect(caughtError).toMatchObject({ type: 'clienterror', status: 403 });
    });
});
