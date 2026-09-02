/**
 * Tests for AJAXRequest timeout support (config.timeout + onTimeout pool).
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest timeout', () => {
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

    // Simulate the browser firing the timeout event.
    function simulateTimeout(xhr) {
        xhr.status = 0;
        xhr.readyState = 4;
        if (xhr.ontimeout) {
            xhr.ontimeout();
        }
    }

    describe('config.timeout', () => {
        test('defaults to 0 (no timeout) when not provided', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            expect(ajax.timeout).toBe(0);
        });

        test('stores a valid numeric timeout from config', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api', timeout: 5000 });
            expect(ajax.timeout).toBe(5000);
        });

        test('coerces a numeric string timeout', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api', timeout: '2500' });
            expect(ajax.timeout).toBe(2500);
        });

        test('ignores an invalid (non-numeric) timeout', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api', timeout: 'abc' });
            expect(ajax.timeout).toBe(0);
        });

        test('ignores a negative timeout', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api', timeout: -100 });
            expect(ajax.timeout).toBe(0);
        });

        test('applies the timeout to the underlying XHR on send()', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', timeout: 3000 });
            const p = ajax.send();
            expect(lastXhr().timeout).toBe(3000);
            // settle to avoid unhandled rejection
            simulateTimeout(lastXhr());
            return p.catch(() => {});
        });

        test('does not set a timeout on the XHR when timeout is 0', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            const p = ajax.send();
            expect(lastXhr().timeout).toBe(0);
            expect(lastXhr().ontimeout).toBeNull();
            lastXhr().status = 200;
            lastXhr().onreadystatechange();
            return p.catch(() => {});
        });
    });

    describe('timeout behaviour', () => {
        test('Promise rejects with type "timeout" when the request times out', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', timeout: 1000 });
            const p = ajax.send();
            simulateTimeout(lastXhr());
            await expect(p).rejects.toMatchObject({ type: 'timeout' });
        });

        test('fires onTimeout pool callbacks on timeout', async () => {
            const onTimeout = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', timeout: 1000 });
            ajax.setOnTimeout(onTimeout);
            const p = ajax.send();
            simulateTimeout(lastXhr());
            await p.catch(() => {});
            expect(onTimeout).toHaveBeenCalledTimes(1);
        });

        test('onTimeout can be registered via config', async () => {
            const onTimeout = jest.fn();
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                timeout: 1000,
                onTimeout: onTimeout
            });
            const p = ajax.send();
            simulateTimeout(lastXhr());
            await p.catch(() => {});
            expect(onTimeout).toHaveBeenCalledTimes(1);
        });

        test('does NOT fire onDisconnected pool on timeout (distinct from disconnect)', async () => {
            const onDisconnected = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', timeout: 1000 });
            ajax.setOnDisconnected(onDisconnected);
            const p = ajax.send();
            simulateTimeout(lastXhr());
            await p.catch(() => {});
            expect(onDisconnected).not.toHaveBeenCalled();
        });

        test('fires afterAjax callbacks on timeout', async () => {
            const afterAjax = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api', timeout: 1000 });
            ajax.setAfterAjax(afterAjax);
            const p = ajax.send();
            simulateTimeout(lastXhr());
            await p.catch(() => {});
            expect(afterAjax).toHaveBeenCalledTimes(1);
        });
    });

    describe('pool registration', () => {
        test("'timeout' is a recognised callback pool", () => {
            expect(AJAXRequest.CALLBACK_POOLS).toContain('timeout');
        });

        test('setOnTimeout returns an id and registers the callback', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            const id = ajax.setOnTimeout(function () {});
            expect(id).toBeDefined();
            const ids = ajax.getCallbacksIDs('timeout');
            expect(ids).toContain(id);
        });
    });

    describe('setTimeout() / getTimeout()', () => {
        test('getTimeout returns 0 by default', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            expect(ajax.getTimeout()).toBe(0);
        });

        test('getTimeout reflects the value set via config', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api', timeout: 4000 });
            expect(ajax.getTimeout()).toBe(4000);
        });

        test('setTimeout updates the timeout and returns true', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            expect(ajax.setTimeout(7000)).toBe(true);
            expect(ajax.getTimeout()).toBe(7000);
        });

        test('setTimeout parses a numeric string', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            expect(ajax.setTimeout('3500')).toBe(true);
            expect(ajax.getTimeout()).toBe(3500);
        });

        test('setTimeout parses (truncates) a fractional value via parseInt', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api' });
            expect(ajax.setTimeout(1500.9)).toBe(true);
            expect(ajax.getTimeout()).toBe(1500);
        });

        test('setTimeout accepts 0 to disable the timeout', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api', timeout: 5000 });
            expect(ajax.setTimeout(0)).toBe(true);
            expect(ajax.getTimeout()).toBe(0);
        });

        test('setTimeout rejects a negative value, returns false and leaves value unchanged', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api', timeout: 5000 });
            expect(ajax.setTimeout(-1)).toBe(false);
            expect(ajax.getTimeout()).toBe(5000);
        });

        test('setTimeout rejects a non-numeric value, returns false and leaves value unchanged', () => {
            const ajax = new AJAXRequest({ url: 'https://example.com/api', timeout: 5000 });
            expect(ajax.setTimeout('not-a-number')).toBe(false);
            expect(ajax.getTimeout()).toBe(5000);
        });

        test('a timeout set via setTimeout() is applied to the XHR on send()', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setTimeout(2000);
            const p = ajax.send();
            expect(lastXhr().timeout).toBe(2000);
            simulateTimeout(lastXhr());
            return p.catch(() => {});
        });
    });
});
