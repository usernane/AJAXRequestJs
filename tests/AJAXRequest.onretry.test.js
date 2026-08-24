/**
 * Tests for onRetry and onRetryEnd callback pools — Issues #112 and #114
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('onRetry and onRetryEnd callback pools', () => {
    let AJAXRequest;
    let xhrInstances;
    let MockXMLHttpRequest;

    beforeEach(() => {
        resetContext();
        jest.useFakeTimers();
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

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    function simulateResponse(xhr, status, responseText) {
        xhr.status = status;
        xhr.responseText = responseText || '{}';
        xhr.readyState = 4;
        if (xhr.onreadystatechange) xhr.onreadystatechange();
    }

    function getLastXhr() {
        return xhrInstances[xhrInstances.length - 1];
    }

    function loseConnection(xhr) {
        simulateResponse(xhr, 0, '');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CALLBACK_POOLS registration
    // ─────────────────────────────────────────────────────────────────────────
    describe('CALLBACK_POOLS registration', () => {
        test('"retry" is in CALLBACK_POOLS', () => {
            expect(AJAXRequest.CALLBACK_POOLS).toContain('retry');
        });

        test('"retryend" is in CALLBACK_POOLS', () => {
            expect(AJAXRequest.CALLBACK_POOLS).toContain('retryend');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Pool initialisation
    // ─────────────────────────────────────────────────────────────────────────
    describe('pool initialisation', () => {
        test('onretrypool is initialised as empty array', () => {
            const ajax = new AJAXRequest();
            expect(Array.isArray(ajax.onretrypool)).toBe(true);
            expect(ajax.onretrypool).toHaveLength(0);
        });

        test('onretryendpool is initialised as empty array', () => {
            const ajax = new AJAXRequest();
            expect(Array.isArray(ajax.onretryendpool)).toBe(true);
            expect(ajax.onretryendpool).toHaveLength(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // setOnRetry
    // ─────────────────────────────────────────────────────────────────────────
    describe('setOnRetry()', () => {
        test('returns an ID when a function is added', () => {
            const ajax = new AJAXRequest();
            const id = ajax.setOnRetry(function() {});
            expect(id).toBeDefined();
        });

        test('adds callback to onretrypool', () => {
            const ajax = new AJAXRequest();
            ajax.setOnRetry(function() {});
            expect(ajax.onretrypool).toHaveLength(1);
        });

        test('multiple callbacks can be added', () => {
            const ajax = new AJAXRequest();
            ajax.setOnRetry(function() {});
            ajax.setOnRetry(function() {});
            ajax.setOnRetry(function() {});
            expect(ajax.onretrypool).toHaveLength(3);
        });

        test('accepts callback as an object with id', () => {
            const ajax = new AJAXRequest();
            ajax.setOnRetry({ id: 'my-retry', callback: function() {} });
            expect(ajax.onretrypool[0].id).toBe('my-retry');
        });

        test('rejects duplicate id in same pool', () => {
            const ajax = new AJAXRequest();
            ajax.setOnRetry({ id: 'dup', callback: function() {} });
            const result = ajax.setOnRetry({ id: 'dup', callback: function() {} });
            expect(result).toBeUndefined();
            expect(ajax.onretrypool).toHaveLength(1);
        });

        test('can be added via constructor config as function', () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ onRetry: cb });
            expect(ajax.onretrypool).toHaveLength(1);
        });

        test('can be added via constructor config as array', () => {
            const ajax = new AJAXRequest({ onRetry: [function() {}, function() {}] });
            expect(ajax.onretrypool).toHaveLength(2);
        });

        test('can be added via constructor config as object with id', () => {
            const ajax = new AJAXRequest({
                onRetry: { id: 'cfg-retry', callback: function() {} }
            });
            expect(ajax.onretrypool[0].id).toBe('cfg-retry');
        });

        test('addCallback with pool "retry" also works', () => {
            const ajax = new AJAXRequest();
            ajax.addCallback(function() {}, 'retry');
            expect(ajax.onretrypool).toHaveLength(1);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // setOnRetryEnd
    // ─────────────────────────────────────────────────────────────────────────
    describe('setOnRetryEnd()', () => {
        test('returns an ID when a function is added', () => {
            const ajax = new AJAXRequest();
            const id = ajax.setOnRetryEnd(function() {});
            expect(id).toBeDefined();
        });

        test('adds callback to onretryendpool', () => {
            const ajax = new AJAXRequest();
            ajax.setOnRetryEnd(function() {});
            expect(ajax.onretryendpool).toHaveLength(1);
        });

        test('multiple callbacks can be added', () => {
            const ajax = new AJAXRequest();
            ajax.setOnRetryEnd(function() {});
            ajax.setOnRetryEnd(function() {});
            expect(ajax.onretryendpool).toHaveLength(2);
        });

        test('accepts callback as an object with id', () => {
            const ajax = new AJAXRequest();
            ajax.setOnRetryEnd({ id: 'my-retryend', callback: function() {} });
            expect(ajax.onretryendpool[0].id).toBe('my-retryend');
        });

        test('rejects duplicate id in same pool', () => {
            const ajax = new AJAXRequest();
            ajax.setOnRetryEnd({ id: 'dup', callback: function() {} });
            const result = ajax.setOnRetryEnd({ id: 'dup', callback: function() {} });
            expect(result).toBeUndefined();
            expect(ajax.onretryendpool).toHaveLength(1);
        });

        test('can be added via constructor config as function', () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ onRetryEnd: cb });
            expect(ajax.onretryendpool).toHaveLength(1);
        });

        test('can be added via constructor config as array', () => {
            const ajax = new AJAXRequest({ onRetryEnd: [function() {}, function() {}] });
            expect(ajax.onretryendpool).toHaveLength(2);
        });

        test('addCallback with pool "retryend" also works', () => {
            const ajax = new AJAXRequest();
            ajax.addCallback(function() {}, 'retryend');
            expect(ajax.onretryendpool).toHaveLength(1);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // onRetry callback firing behaviour
    // ─────────────────────────────────────────────────────────────────────────
    describe('onRetry callback firing', () => {
        test('onRetry fires on each countdown tick', () => {
            const ticks = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(3, 3, function() {});
            ajax.setOnRetry(function() {
                ticks.push({ rem: this.remainingSeconds, att: this.attemptNumber });
            });

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());

            jest.advanceTimersByTime(1000);
            jest.advanceTimersByTime(1000);
            jest.advanceTimersByTime(1000);

            // 3 ticks: remaining 2, 1, 0
            expect(ticks).toEqual([
                { rem: 2, att: 1 },
                { rem: 1, att: 1 },
                { rem: 0, att: 1 }
            ]);
        });

        test('onRetry provides correct remainingSeconds each tick', () => {
            const remainings = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 4, function() {});
            ajax.setOnRetry(function() { remainings.push(this.remainingSeconds); });

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());

            jest.advanceTimersByTime(4000);

            expect(remainings).toEqual([3, 2, 1, 0]);
        });

        test('onRetry provides correct attemptNumber across multiple retries', async () => {
            const attempts = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 1, function() {});
            ajax.setOnRetry(function() { attempts.push(this.attemptNumber); });

            const promise = ajax.send();
            loseConnection(getLastXhr()); // fail 1
            jest.advanceTimersByTime(1000); // retry 1 fires
            loseConnection(getLastXhr()); // fail 2
            jest.advanceTimersByTime(1000); // retry 2 fires
            simulateResponse(getLastXhr(), 200, '{}'); // success

            await promise;
            // attempt 1 at tick for retry 1, attempt 2 at tick for retry 2
            expect(attempts).toEqual([1, 2]);
        });

        test('onRetry provides maxAttempts', () => {
            const maxAttempts = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(5, 1, function() {});
            ajax.setOnRetry(function() { maxAttempts.push(this.maxAttempts); });

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);

            expect(maxAttempts[0]).toBe(5);
        });

        test('onRetry provides AJAXRequest instance', () => {
            let capturedInstance = null;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetry(function() { capturedInstance = this.AJAXRequest; });

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);

            expect(capturedInstance).toBe(ajax);
        });

        test('multiple onRetry callbacks all fire each tick', () => {
            const log = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetry(function() { log.push('first'); });
            ajax.setOnRetry(function() { log.push('second'); });

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);

            expect(log).toEqual(['first', 'second']);
        });

        test('onRetry is NOT called when retry is disabled (times=0)', () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(0, 1, function() {});
            ajax.setOnRetry(cb);

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(5000);

            expect(cb).not.toHaveBeenCalled();
        });

        test('onRetry is NOT called for non-connection-lost responses (success)', async () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 1, function() {});
            ajax.setOnRetry(cb);

            const promise = ajax.send();
            simulateResponse(getLastXhr(), 200, '{}');
            await promise;
            jest.advanceTimersByTime(5000);

            expect(cb).not.toHaveBeenCalled();
        });

        test('onRetry is NOT called for 4xx responses', async () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 1, function() {});
            ajax.setOnRetry(cb);

            const promise = ajax.send().catch(() => {});
            simulateResponse(getLastXhr(), 404, '{}');
            await promise;
            jest.advanceTimersByTime(5000);

            expect(cb).not.toHaveBeenCalled();
        });

        test('onRetry disabled callback is skipped', () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetry({ id: 'skip-me', call: false, callback: cb });

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);

            expect(cb).not.toHaveBeenCalled();
        });

        test('onRetry call as function is evaluated', () => {
            const cb = jest.fn();
            let shouldCall = false;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 2, function() {});
            ajax.setOnRetry({
                call: function() { return shouldCall; },
                callback: cb
            });

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());

            jest.advanceTimersByTime(1000); // shouldCall = false → skipped
            expect(cb).not.toHaveBeenCalled();

            shouldCall = true;
            jest.advanceTimersByTime(1000); // shouldCall = true → fires
            expect(cb).toHaveBeenCalledTimes(1);
        });

        test('onRetry error does not crash retry mechanism', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetry(function() { throw new Error('Callback error'); });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');

            const response = await promise;
            expect(response.status).toBe(200);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // onRetryEnd callback firing behaviour
    // ─────────────────────────────────────────────────────────────────────────
    describe('onRetryEnd callback firing', () => {
        test('onRetryEnd fires with succeeded=true when retry succeeds', async () => {
            let result = null;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 1, function() {});
            ajax.setOnRetryEnd(function() { result = this.succeeded; });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;
            expect(result).toBe(true);
        });

        test('onRetryEnd fires with succeeded=false when retries exhausted', async () => {
            let result = null;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetryEnd(function() { result = this.succeeded; });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            loseConnection(getLastXhr()); // exhausted

            await promise.catch(() => {});
            expect(result).toBe(false);
        });

        test('onRetryEnd provides attempts count on success', async () => {
            let attempts = null;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(3, 1, function() {});
            ajax.setOnRetryEnd(function() { attempts = this.attempts; });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}'); // succeeded on attempt 2

            await promise;
            expect(attempts).toBe(2);
        });

        test('onRetryEnd provides attempts count on exhaustion', async () => {
            let attempts = null;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 1, function() {});
            ajax.setOnRetryEnd(function() { attempts = this.attempts; });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            loseConnection(getLastXhr()); // exhausted after 2 retries

            await promise.catch(() => {});
            expect(attempts).toBe(2);
        });

        test('onRetryEnd provides AJAXRequest instance', async () => {
            let captured = null;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetryEnd(function() { captured = this.AJAXRequest; });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;
            expect(captured).toBe(ajax);
        });

        test('onRetryEnd fires BEFORE onSuccess', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetryEnd(function() { callOrder.push('onRetryEnd'); });
            ajax.setOnSuccess(function() { callOrder.push('onSuccess'); });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;
            expect(callOrder.indexOf('onRetryEnd')).toBeLessThan(callOrder.indexOf('onSuccess'));
        });

        test('onRetryEnd fires BEFORE onDisconnected when exhausted', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onDisconnected: function() { callOrder.push('onDisconnected'); }
            });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetryEnd(function() { callOrder.push('onRetryEnd'); });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            loseConnection(getLastXhr()); // exhausted

            await promise.catch(() => {});
            expect(callOrder.indexOf('onRetryEnd')).toBeLessThan(callOrder.indexOf('onDisconnected'));
        });

        test('onRetryEnd fires BEFORE Promise settles', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetryEnd(function() { callOrder.push('onRetryEnd'); });

            const promise = ajax.send().then(() => { callOrder.push('promise'); });
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;
            expect(callOrder).toEqual(['onRetryEnd', 'promise']);
        });

        test('onRetryEnd does NOT fire when retry never happened (first success)', async () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 1, function() {});
            ajax.setOnRetryEnd(cb);

            const promise = ajax.send();
            simulateResponse(getLastXhr(), 200, '{}'); // success on first attempt

            await promise;
            expect(cb).not.toHaveBeenCalled();
        });

        test('onRetryEnd does NOT fire when retry is disabled (times=0)', async () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(0, 1, function() {});
            ajax.setOnRetryEnd(cb);

            const promise = ajax.send().catch(() => {});
            loseConnection(getLastXhr());

            await promise;
            expect(cb).not.toHaveBeenCalled();
        });

        test('multiple onRetryEnd callbacks all fire', async () => {
            const log = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetryEnd(function() { log.push('first'); });
            ajax.setOnRetryEnd(function() { log.push('second'); });
            ajax.setOnRetryEnd(function() { log.push('third'); });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;
            expect(log).toEqual(['first', 'second', 'third']);
        });

        test('onRetryEnd disabled callback is skipped', async () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetryEnd({ id: 'skip', call: false, callback: cb });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;
            expect(cb).not.toHaveBeenCalled();
        });

        test('onRetryEnd error does not prevent onSuccess from firing', async () => {
            const successCb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetryEnd(function() { throw new Error('retryend error'); });
            ajax.setOnSuccess(successCb);

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;
            expect(successCb).toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Interaction with existing callback management methods
    // ─────────────────────────────────────────────────────────────────────────
    describe('interaction with existing callback management', () => {
        test('setCallEnabled can disable an onRetry callback by id', () => {
            const cb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetry({ id: 'my-retry', callback: cb });

            ajax.setCallEnabled('retry', 'my-retry', false);

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);

            expect(cb).not.toHaveBeenCalled();
        });

        test('setCallsEnabled can toggle onRetry and onRetryEnd with same id', async () => {
            const retryCb = jest.fn();
            const retryEndCb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetry({ id: 'shared', callback: retryCb });
            ajax.setOnRetryEnd({ id: 'shared', callback: retryEndCb });

            // Disable both by shared ID
            ajax.setCallsEnabled('shared', false);

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');
            await promise;

            expect(retryCb).not.toHaveBeenCalled();
            expect(retryEndCb).not.toHaveBeenCalled();
        });

        test('removeCall removes onRetry callback', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setOnRetry({ id: 'rm-me', callback: function() {} });
            expect(ajax.onretrypool).toHaveLength(1);

            ajax.removeCall('retry', 'rm-me');
            expect(ajax.onretrypool).toHaveLength(0);
        });

        test('removeCall removes onRetryEnd callback', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setOnRetryEnd({ id: 'rm-end', callback: function() {} });
            expect(ajax.onretryendpool).toHaveLength(1);

            ajax.removeCall('retryend', 'rm-end');
            expect(ajax.onretryendpool).toHaveLength(0);
        });

        test('getCallbacksIDs includes retry pool', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setOnRetry({ id: 'r1', callback: function() {} });
            const ids = ajax.getCallbacksIDs('retry');
            expect(ids).toContain('r1');
        });

        test('getCallbacksIDs includes retryend pool', () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setOnRetryEnd({ id: 're1', callback: function() {} });
            const ids = ajax.getCallbacksIDs('retryend');
            expect(ids).toContain('re1');
        });

        test('getCallbacksIDs() with no args includes retry and retryend pools', () => {
            const ajax = new AJAXRequest();
            const all = ajax.getCallbacksIDs();
            expect(all).toHaveProperty('retry');
            expect(all).toHaveProperty('retryend');
        });

        test('props binding works in onRetry callback', () => {
            const obj = { label: 'hello' };
            let captured = null;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 1, function() {});
            ajax.bind(obj, null, 'retry');
            ajax.setOnRetry(function() { captured = this.props.label; });

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);

            expect(captured).toBe('hello');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Integration: full retry lifecycle with both pools
    // ─────────────────────────────────────────────────────────────────────────
    describe('full retry lifecycle integration', () => {
        test('correct event order: onRetry ticks → onRetryEnd → onSuccess → afterAjax → Promise', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(1, 2, function() {});
            ajax.setOnRetry(function() { callOrder.push('onRetry:' + this.remainingSeconds); });
            ajax.setOnRetryEnd(function() { callOrder.push('onRetryEnd:' + this.succeeded); });
            ajax.setOnSuccess(function() { callOrder.push('onSuccess'); });
            ajax.setAfterAjax(function() { callOrder.push('afterAjax'); });

            const promise = ajax.send().then(() => { callOrder.push('promise'); });
            loseConnection(getLastXhr());

            jest.advanceTimersByTime(1000);
            jest.advanceTimersByTime(1000);
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;

            expect(callOrder).toEqual([
                'onRetry:1',
                'onRetry:0',
                'onRetryEnd:true',
                'onSuccess',
                'afterAjax',
                'promise'
            ]);
        });

        test('correct event order on exhaustion: onRetry ticks → onRetryEnd → onDisconnected → afterAjax → Promise', async () => {
            const callOrder = [];
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                onDisconnected: function() { callOrder.push('onDisconnected'); },
                afterAjax: function() { callOrder.push('afterAjax'); }
            });
            ajax.setRetry(1, 1, function() {});
            ajax.setOnRetry(function() { callOrder.push('onRetry:' + this.remainingSeconds); });
            ajax.setOnRetryEnd(function() { callOrder.push('onRetryEnd:' + this.succeeded); });

            const promise = ajax.send().catch(() => { callOrder.push('promise'); });
            loseConnection(getLastXhr());

            jest.advanceTimersByTime(1000);
            loseConnection(getLastXhr()); // exhausted

            await promise;

            expect(callOrder).toEqual([
                'onRetry:0',
                'onRetryEnd:false',
                'onDisconnected',
                'afterAjax',
                'promise'
            ]);
        });

        test('no retry pool callbacks when first request succeeds immediately', async () => {
            const retryCb = jest.fn();
            const retryEndCb = jest.fn();
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(3, 2, function() {});
            ajax.setOnRetry(retryCb);
            ajax.setOnRetryEnd(retryEndCb);

            const promise = ajax.send();
            simulateResponse(getLastXhr(), 200, '{}');
            await promise;

            expect(retryCb).not.toHaveBeenCalled();
            expect(retryEndCb).not.toHaveBeenCalled();
        });

        test('UI cleanup scenario — banner shown on retry, hidden on retryEnd', async () => {
            let bannerVisible = false;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry(2, 1, function() {});
            ajax.setOnRetry(function() { bannerVisible = true; });
            ajax.setOnRetryEnd(function() { bannerVisible = false; });

            const promise = ajax.send();
            loseConnection(getLastXhr());

            jest.advanceTimersByTime(1000);
            expect(bannerVisible).toBe(true); // shown during retry

            simulateResponse(getLastXhr(), 200, '{}');
            await promise;
            expect(bannerVisible).toBe(false); // cleaned up
        });
    });
});
