/**
 * Tests for AJAXRequest.abort() (#105).
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest.abort()', () => {
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
                // Emulate the browser: aborting an in-flight request drives
                // readyState to 4 with status 0 and fires the handler.
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

    describe('basic behaviour', () => {
        test("'abort' is a recognised callback pool", () => {
            expect(AJAXRequest.CALLBACK_POOLS).toContain('abort');
        });

        test('abort() calls XMLHttpRequest.abort() on the active request', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const p = ajax.send();
            const xhr = lastXhr();
            ajax.abort();
            expect(xhr.abort).toHaveBeenCalledTimes(1);
            return p.catch(() => {});
        });

        test('abort() returns true when a request was aborted', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const p = ajax.send();
            expect(ajax.abort()).toBe(true);
            return p.catch(() => {});
        });

        test('abort() returns false when there is nothing in progress', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            expect(ajax.abort()).toBe(false);
        });

        test('Promise rejects with type "abort"', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const p = ajax.send();
            ajax.abort();
            await expect(p).rejects.toMatchObject({ type: 'abort' });
        });
    });

    describe('onAbort pool', () => {
        test('fires onAbort callbacks on abort', async () => {
            const onAbort = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setOnAbort(onAbort);
            const p = ajax.send();
            ajax.abort();
            await p.catch(() => {});
            expect(onAbort).toHaveBeenCalledTimes(1);
        });

        test('onAbort can be registered via config', async () => {
            const onAbort = jest.fn();
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onAbort: onAbort
            });
            const p = ajax.send();
            ajax.abort();
            await p.catch(() => {});
            expect(onAbort).toHaveBeenCalledTimes(1);
        });

        test('fires afterAjax callbacks on abort', async () => {
            const afterAjax = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setAfterAjax(afterAjax);
            const p = ajax.send();
            ajax.abort();
            await p.catch(() => {});
            expect(afterAjax).toHaveBeenCalledTimes(1);
        });

        test('does NOT fire onDisconnected pool on abort', async () => {
            const onDisconnected = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setOnDisconnected(onDisconnected);
            const p = ajax.send();
            ajax.abort();
            await p.catch(() => {});
            expect(onDisconnected).not.toHaveBeenCalled();
        });

        test("setOnAbort returns an id and registers the callback", () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            const id = ajax.setOnAbort(function () {});
            expect(id).toBeDefined();
            const ids = ajax.getCallbacksIDs('abort');
            expect(ids).toContain(id);
        });
    });

    describe('retry interaction', () => {
        test('aborting during a request does not trigger a retry', async () => {
            const retryTick = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(3, 5, function () {});
            ajax.setOnRetry(retryTick);
            const p = ajax.send();
            ajax.abort();
            await p.catch(() => {});
            // No retry countdown callbacks fired.
            expect(retryTick).not.toHaveBeenCalled();
        });

        test('abort() clears a pending retry interval', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(3, 5, function () {});
            const p = ajax.send();
            const xhr = lastXhr();
            // Attach a no-op catch up front so the eventual rejection is handled.
            p.catch(() => {});
            // Simulate a disconnect (status 0) to start the retry countdown.
            xhr.status = 0;
            xhr.readyState = 4;
            xhr._aborted = false;
            xhr.onreadystatechange();
            // A retry interval should now be pending.
            expect(xhr.retry.id).toBeDefined();
            // Aborting must clear it so no further retry fires.
            ajax.abort();
            expect(xhr.retry.id).toBeUndefined();
        });
    });
});
