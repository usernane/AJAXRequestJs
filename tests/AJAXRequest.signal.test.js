/**
 * Tests for AJAXRequest AbortController / signal support (#106).
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest AbortController support', () => {
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
            this.abort = jest.fn(function () {
                this.status = 0;
                this.readyState = 4;
                if (this.onreadystatechange) {
                    this.onreadystatechange();
                }
            });
            this.readyState = 1;
            this.status = 0;
            this.response = '';
            this.responseText = '';
            this.responseXML = null;
            this.timeout = 0;
            this.getAllResponseHeaders = jest.fn(() => '');
            this.onreadystatechange = null;
            this.ontimeout = null;
            this.onload = null;
            this.onprogress = null;
            this.active = false;
            xhrInstances.push(this);
        });

        AJAXRequest = loadAJAXRequest({
            mocks: {
                XMLHttpRequest: MockXMLHttpRequest,
                AbortController: global.AbortController,
                console: { ...console, info: jest.fn(), log: jest.fn(), warn: jest.fn() }
            }
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function lastXhr() {
        return xhrInstances[xhrInstances.length - 1];
    }

    describe('setSignal() / getSignal()', () => {
        test('getSignal returns null by default', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            expect(ajax.getSignal()).toBeNull();
        });

        test('setSignal stores a valid AbortSignal and returns true', () => {
            const controller = new AbortController();
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            expect(ajax.setSignal(controller.signal)).toBe(true);
            expect(ajax.getSignal()).toBe(controller.signal);
        });

        test('setSignal(null) clears the signal and returns true', () => {
            const controller = new AbortController();
            const ajax = new AJAXRequest({ url: 'https://example.com/api', signal: controller.signal });
            expect(ajax.setSignal(null)).toBe(true);
            expect(ajax.getSignal()).toBeNull();
        });

        test('setSignal rejects an invalid value and returns false', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            expect(ajax.setSignal({ not: 'a signal' })).toBe(false);
            expect(ajax.getSignal()).toBeNull();
        });

        test('signal can be provided via config', () => {
            const controller = new AbortController();
            const ajax = new AJAXRequest({ url: 'https://example.com/api', signal: controller.signal });
            expect(ajax.getSignal()).toBe(controller.signal);
        });
    });

    describe('cancellation via controller.abort()', () => {
        test('aborting the controller aborts the in-progress request', () => {
            const controller = new AbortController();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', signal: controller.signal });
            const p = ajax.send();
            const xhr = lastXhr();
            controller.abort();
            expect(xhr.abort).toHaveBeenCalledTimes(1);
            return p.catch(() => {});
        });

        test('Promise rejects with type "abort" when controller aborts', async () => {
            const controller = new AbortController();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', signal: controller.signal });
            const p = ajax.send();
            controller.abort();
            await expect(p).rejects.toMatchObject({ type: 'abort' });
        });

        test('fires onAbort callbacks when controller aborts', async () => {
            const onAbort = jest.fn();
            const controller = new AbortController();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', signal: controller.signal });
            ajax.setOnAbort(onAbort);
            const p = ajax.send();
            controller.abort();
            await p.catch(() => {});
            expect(onAbort).toHaveBeenCalledTimes(1);
        });
    });

    describe('already-aborted signal (fail fast)', () => {
        test('send() with an already-aborted signal rejects immediately without sending the XHR', async () => {
            const controller = new AbortController();
            controller.abort();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', signal: controller.signal });
            const p = ajax.send();
            await expect(p).rejects.toMatchObject({ type: 'abort' });
            // The pooled XHR must not have been opened/sent.
            const xhr = lastXhr();
            expect(xhr.open).not.toHaveBeenCalled();
            expect(xhr.send).not.toHaveBeenCalled();
        });

        test('fires onAbort when sending with an already-aborted signal', async () => {
            const onAbort = jest.fn();
            const controller = new AbortController();
            controller.abort();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', signal: controller.signal });
            ajax.setOnAbort(onAbort);
            const p = ajax.send();
            await p.catch(() => {});
            expect(onAbort).toHaveBeenCalledTimes(1);
        });
    });

    describe('listener cleanup', () => {
        test('aborting the controller AFTER the request completes is a no-op', async () => {
            const controller = new AbortController();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', signal: controller.signal });
            const p = ajax.send();
            const xhr = lastXhr();
            // Complete the request successfully.
            xhr.status = 200;
            xhr.responseText = '{}';
            xhr.readyState = 4;
            xhr.onreadystatechange();
            await p;
            // Now abort the controller; the completed request must not be re-aborted.
            controller.abort();
            expect(xhr.abort).not.toHaveBeenCalled();
        });
    });
});
