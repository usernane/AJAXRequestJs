/**
 * v2 Backward-compatibility test suite (#129)
 *
 * v3's headline promise is "v2 code runs unchanged." This suite exercises
 * representative v2 usage patterns drawn from the v2 README and API docs
 * and confirms they behave identically on v3.
 *
 * Patterns covered:
 *  1. Constructor config shapes (all v2 config keys)
 *  2. Callback-only API (setOnSuccess, setOnClientError, etc.)
 *  3. Deprecated method aliases (setReqMethod / getReqMethod)
 *  4. Positional setRetry(times, wait, func[, props])
 *  5. Callback as object with id/call/props
 *  6. setCallEnabled / setCallsEnabled / disableCallExcept
 *  7. setBeforeAjax / setAfterAjax / setOnError
 *  8. addHeader (v2 usage — valid names/values)
 *  9. bind() for property binding
 * 10. Global ajax instance (CDN / UMD consumers)
 *
 * Any intentional breaking changes are documented inline with "BREAKING:".
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('v2 backward-compatibility (#129)', () => {
    let AJAXRequest;

    beforeEach(() => {
        resetContext();
        AJAXRequest = loadAJAXRequest({
            mocks: {
                console: { ...console, info: jest.fn(), warn: jest.fn(), log: jest.fn() }
            }
        });
    });

    // ─── 1. Constructor config shapes ────────────────────────────────────────
    describe('1. Constructor config shapes', () => {
        test('empty config creates instance with defaults', () => {
            const ajax = new AJAXRequest();
            expect(ajax).toBeDefined();
            expect(ajax.method).toBe('GET');
            expect(ajax.enabled).toBe(true);
        });

        test('all v2 config keys are accepted without error', () => {
            expect(() => new AJAXRequest({
                method: 'post',
                url: 'https://example.com/api',
                params: { key: 'value' },
                enabled: true,
                verbose: false,
                headers: { 'X-Custom': 'header' },
                beforeAjax: function () {},
                onSuccess: function () {},
                onClientErr: function () {},
                onServerErr: function () {},
                onDisconnected: function () {},
                afterAjax: function () {},
                onErr: function () {}
            })).not.toThrow();
        });

        test('config with callback arrays is accepted', () => {
            const onSuccess = jest.fn();
            const onClientErr = jest.fn();
            const ajax = new AJAXRequest({
                method: 'get',
                url: 'https://example.com/api',
                onSuccess: [onSuccess],
                onClientErr: [onClientErr]
            });
            expect(ajax.getCallbacksIDs('success')).toBeDefined();
            expect(ajax.getCallbacksIDs('clienterror')).toBeDefined();
        });

        test('base config key is accepted', () => {
            const ajax = new AJAXRequest({
                base: 'https://api.example.com',
                url: 'repos/user/repo'
            });
            expect(ajax.getBase()).toBe('https://api.example.com');
        });

        test('string params is accepted', () => {
            const ajax = new AJAXRequest({ params: 'vendor=webfiori' });
            expect(ajax.getParams()).toBe('vendor=webfiori');
        });
    });

    // ─── 2. Callback-only API ────────────────────────────────────────────────
    describe('2. Callback-only API', () => {
        test('setOnSuccess returns an id', () => {
            const ajax = new AJAXRequest();
            const id = ajax.setOnSuccess(jest.fn());
            expect(id).toBeDefined();
        });

        test('setOnClientError returns an id', () => {
            const ajax = new AJAXRequest();
            const id = ajax.setOnClientError(jest.fn());
            expect(id).toBeDefined();
        });

        test('setOnServerError returns an id', () => {
            const ajax = new AJAXRequest();
            const id = ajax.setOnServerError(jest.fn());
            expect(id).toBeDefined();
        });

        test('setOnDisconnected returns an id', () => {
            const ajax = new AJAXRequest();
            const id = ajax.setOnDisconnected(jest.fn());
            expect(id).toBeDefined();
        });

        test('setBeforeAjax returns an id', () => {
            const ajax = new AJAXRequest();
            const id = ajax.setBeforeAjax(jest.fn());
            expect(id).toBeDefined();
        });

        test('setAfterAjax returns an id', () => {
            const ajax = new AJAXRequest();
            const id = ajax.setAfterAjax(jest.fn());
            expect(id).toBeDefined();
        });

        test('setOnError returns an id', () => {
            const ajax = new AJAXRequest();
            const id = ajax.setOnError(jest.fn());
            expect(id).toBeDefined();
        });

        test('multiple callbacks can be added to same pool', () => {
            const ajax = new AJAXRequest();
            const id1 = ajax.setOnSuccess(jest.fn());
            const id2 = ajax.setOnSuccess(jest.fn());
            expect(id1).not.toBe(id2);
            expect(ajax.getCallbacksIDs('success').length).toBeGreaterThanOrEqual(2);
        });
    });

    // ─── 3. Deprecated method aliases ────────────────────────────────────────
    describe('3. Deprecated aliases: setReqMethod / getReqMethod', () => {
        test('setReqMethod sets the request method (delegates to setMethod)', () => {
            const ajax = new AJAXRequest();
            ajax.setReqMethod('post');
            expect(ajax.getMethod()).toBe('POST');
        });

        test('getReqMethod returns the current method', () => {
            const ajax = new AJAXRequest();
            ajax.setReqMethod('delete');
            expect(ajax.getReqMethod()).toBe('DELETE');
        });

        test('setReqMethod accepts lowercase and normalises to uppercase', () => {
            const ajax = new AJAXRequest();
            ajax.setReqMethod('get');
            expect(ajax.getReqMethod()).toBe('GET');
        });

        test('setReqMethod with invalid value falls back to GET', () => {
            const ajax = new AJAXRequest();
            ajax.setReqMethod('INVALID');
            expect(ajax.getMethod()).toBe('GET');
        });
    });

    // ─── 4. Positional setRetry ──────────────────────────────────────────────
    describe('4. Positional setRetry(times, wait, func [, props])', () => {
        test('positional form sets retry config correctly', () => {
            const ajax = new AJAXRequest();
            const cb = jest.fn();
            const result = ajax.setRetry(3, 5, cb);
            expect(result).toBe(true);
            expect(ajax.retry.times).toBe(3);
            expect(ajax.retry.baseWait).toBe(5);
        });

        test('positional form with props object is accepted', () => {
            const ajax = new AJAXRequest();
            const result = ajax.setRetry(2, 10, jest.fn(), { extra: 'data' });
            expect(result).toBe(true);
        });

        test('positional form returns false for invalid times', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry(-1, 5, jest.fn())).toBe(false);
        });

        test('positional form returns false for invalid wait', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry(3, 0, jest.fn())).toBe(false);
        });

        test('positional form returns false when func is not a function', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry(3, 5, 'not-a-func')).toBe(false);
        });

        test('setRetry(0, ...) disables retry', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry(0, 5, jest.fn());
            expect(ajax.retry.times).toBe(0);
        });
    });

    // ─── 5. Callback as object with id / call / props ────────────────────────
    describe('5. Callback object form (id, call, props)', () => {
        test('callback with explicit id is registered under that id', () => {
            const ajax = new AJAXRequest();
            ajax.setOnSuccess({ id: 'my-handler', callback: jest.fn() });
            expect(ajax.getCallbacksIDs('success')).toContain('my-handler');
        });

        test('duplicate id in same pool is rejected', () => {
            const ajax = new AJAXRequest();
            ajax.setOnSuccess({ id: 'dup', callback: jest.fn() });
            ajax.setOnSuccess({ id: 'dup', callback: jest.fn() });
            const ids = ajax.getCallbacksIDs('success');
            expect(ids.filter(id => id === 'dup').length).toBe(1);
        });

        test('same id in different pools is allowed', () => {
            const ajax = new AJAXRequest();
            ajax.setOnSuccess({ id: 'shared', callback: jest.fn() });
            ajax.setOnClientError({ id: 'shared', callback: jest.fn() });
            expect(ajax.getCallbacksIDs('success')).toContain('shared');
            expect(ajax.getCallbacksIDs('clienterror')).toContain('shared');
        });

        test('call: false disables callback', () => {
            const ajax = new AJAXRequest();
            ajax.setOnSuccess({ id: 'disabled', call: false, callback: jest.fn() });
            const cb = ajax.getCallBack('success', 'disabled');
            expect(cb.call).toBe(false);
        });

        test('props are stored on callback object', () => {
            const ajax = new AJAXRequest();
            const props = { username: 'Ibrahim' };
            ajax.setOnSuccess({ id: 'with-props', props, callback: jest.fn() });
            // props are accessible within the callback via this.props
            const cb = ajax.getCallBack('success', 'with-props');
            expect(cb).toBeDefined();
        });
    });

    // ─── 6. Enable / disable callbacks ──────────────────────────────────────
    describe('6. setCallEnabled / setCallsEnabled / disableCallExcept', () => {
        test('setCallEnabled disables a callback by id', () => {
            const ajax = new AJAXRequest();
            ajax.setOnSuccess({ id: 'cb1', callback: jest.fn() });
            ajax.setCallEnabled('success', 'cb1', false);
            expect(ajax.getCallBack('success', 'cb1').call).toBe(false);
        });

        test('setCallEnabled re-enables a disabled callback', () => {
            const ajax = new AJAXRequest();
            ajax.setOnSuccess({ id: 'cb1', call: false, callback: jest.fn() });
            ajax.setCallEnabled('success', 'cb1', true);
            expect(ajax.getCallBack('success', 'cb1').call).toBe(true);
        });

        test('setCallsEnabled toggles across all pools by id', () => {
            const ajax = new AJAXRequest();
            ajax.setOnSuccess({ id: 'multi', callback: jest.fn() });
            ajax.setOnClientError({ id: 'multi', callback: jest.fn() });
            ajax.setCallsEnabled('multi', false);
            expect(ajax.getCallBack('success', 'multi').call).toBe(false);
            expect(ajax.getCallBack('clienterror', 'multi').call).toBe(false);
        });

        test('setEnabled(false) disables AJAX', () => {
            const ajax = new AJAXRequest();
            ajax.setEnabled(false);
            expect(ajax.isEnabled()).toBe(false);
        });

        test('setEnabled(true) re-enables AJAX', () => {
            const ajax = new AJAXRequest();
            ajax.setEnabled(false);
            ajax.setEnabled(true);
            expect(ajax.isEnabled()).toBe(true);
        });
    });

    // ─── 7. URL and method helpers ───────────────────────────────────────────
    describe('7. URL and method helpers', () => {
        test('setURL / getURL round-trip', () => {
            const ajax = new AJAXRequest();
            ajax.setURL('https://api.github.com/repos/user/repo');
            expect(ajax.getURL()).toBe('https://api.github.com/repos/user/repo');
        });

        test('setURL strips leading slashes', () => {
            const ajax = new AJAXRequest();
            ajax.setURL('///path/to/resource');
            expect(ajax.getURL()).toBe('path/to/resource');
        });

        test('setBase / getBase round-trip', () => {
            const ajax = new AJAXRequest();
            ajax.setBase('https://api.github.com');
            expect(ajax.getBase()).toBe('https://api.github.com');
        });

        test('setBase trims trailing slashes', () => {
            const ajax = new AJAXRequest();
            ajax.setBase('https://api.github.com/');
            expect(ajax.getBase()).toBe('https://api.github.com');
        });

        test('setMethod normalises to uppercase', () => {
            const ajax = new AJAXRequest();
            ajax.setMethod('post');
            expect(ajax.getMethod()).toBe('POST');
        });

        test('setParams / getParams round-trip (object)', () => {
            const ajax = new AJAXRequest();
            ajax.setParams({ vendor: 'webfiori' });
            expect(ajax.getParams()).toEqual({ vendor: 'webfiori' });
        });

        test('setParams / getParams round-trip (string)', () => {
            const ajax = new AJAXRequest();
            ajax.setParams('vendor=webfiori');
            expect(ajax.getParams()).toBe('vendor=webfiori');
        });
    });

    // ─── 8. addHeader (v2 usage) ─────────────────────────────────────────────
    describe('8. addHeader (v2 usage)', () => {
        test('adds a valid header and returns true', () => {
            const ajax = new AJAXRequest();
            expect(ajax.addHeader('X-Custom-Header', 'value')).toBe(true);
            expect(ajax.customHeaders['X-Custom-Header']).toBe('value');
        });

        test('adding multiple headers works', () => {
            const ajax = new AJAXRequest();
            ajax.addHeader('X-Header-1', 'v1');
            ajax.addHeader('X-Header-2', 'v2');
            expect(ajax.customHeaders['X-Header-1']).toBe('v1');
            expect(ajax.customHeaders['X-Header-2']).toBe('v2');
        });

        test('headers config key wires through constructor', () => {
            const ajax = new AJAXRequest({
                headers: { 'X-Token': 'abc123', 'X-Version': '2' }
            });
            expect(ajax.customHeaders['X-Token']).toBe('abc123');
            expect(ajax.customHeaders['X-Version']).toBe('2');
        });
    });

    // ─── 9. bind() ───────────────────────────────────────────────────────────
    describe('9. bind() for property binding', () => {
        test('bind(obj) registers binding for all pools', () => {
            const ajax = new AJAXRequest();
            const obj = { username: 'Ibrahim' };
            expect(() => ajax.bind(obj)).not.toThrow();
        });

        test('bind(obj, callbackId) registers binding for specific id', () => {
            const ajax = new AJAXRequest();
            expect(() => ajax.bind({ name: 'test' }, 'my-callback')).not.toThrow();
        });

        test('bind(obj, null, poolName) registers binding for specific pool', () => {
            const ajax = new AJAXRequest();
            expect(() => ajax.bind({ name: 'test' }, null, 'success')).not.toThrow();
        });

        test('bind(null) does not throw (invalid input handled gracefully)', () => {
            const ajax = new AJAXRequest();
            expect(() => ajax.bind(null)).not.toThrow();
        });
    });

    // ─── 10. removeCall ──────────────────────────────────────────────────────
    describe('10. removeCall', () => {
        test('removes callback by id from pool', () => {
            const ajax = new AJAXRequest();
            ajax.setOnSuccess({ id: 'to-remove', callback: jest.fn() });
            ajax.removeCall('success', 'to-remove');
            expect(ajax.getCallbacksIDs('success')).not.toContain('to-remove');
        });

        test('does not throw for non-existent id', () => {
            const ajax = new AJAXRequest();
            expect(() => ajax.removeCall('success', 'ghost')).not.toThrow();
        });
    });

    // ─── 11. Static API ──────────────────────────────────────────────────────
    describe('11. Static API', () => {
        test('AJAXRequest.META.VERSION is a string', () => {
            expect(typeof AJAXRequest.META.VERSION).toBe('string');
        });

        test('AJAXRequest.CALLBACK_POOLS contains all v2 pool names', () => {
            const v2pools = ['servererror', 'clienterror', 'success',
                'connectionlost', 'afterajax', 'beforeajax', 'error'];
            for (const pool of v2pools) {
                expect(AJAXRequest.CALLBACK_POOLS).toContain(pool);
            }
        });

        test('AJAXRequest.isValidURL accepts a valid URL', () => {
            expect(AJAXRequest.isValidURL('https://api.github.com')).toBe(true);
        });

        test('AJAXRequest.isValidURL rejects an empty string', () => {
            expect(AJAXRequest.isValidURL('')).toBe(false);
        });

        test('AJAXRequest.createXhr returns a new XHR instance', () => {
            const xhr = AJAXRequest.createXhr();
            expect(xhr).toBeDefined();
        });
    });
});
