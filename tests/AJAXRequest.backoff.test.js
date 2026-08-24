/**
 * Tests for retry backoff strategies — Issue #113
 * Covers: fixed, linear, exponential backoff + jitter + setRetry() object form
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('Retry backoff strategies (#113)', () => {
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

    function loseConnection(xhr) {
        simulateResponse(xhr, 0, '');
    }

    function getLastXhr() {
        return xhrInstances[xhrInstances.length - 1];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BACKOFF enum
    // ─────────────────────────────────────────────────────────────────────────
    describe('AJAXRequest.BACKOFF enum', () => {
        test('BACKOFF is defined as a static property', () => {
            expect(AJAXRequest.BACKOFF).toBeDefined();
        });

        test('BACKOFF.FIXED equals "fixed"', () => {
            expect(AJAXRequest.BACKOFF.FIXED).toBe('fixed');
        });

        test('BACKOFF.LINEAR equals "linear"', () => {
            expect(AJAXRequest.BACKOFF.LINEAR).toBe('linear');
        });

        test('BACKOFF.EXPONENTIAL equals "exponential"', () => {
            expect(AJAXRequest.BACKOFF.EXPONENTIAL).toBe('exponential');
        });

        test('BACKOFF is frozen (immutable)', () => {
            const before = AJAXRequest.BACKOFF.FIXED;
            try { AJAXRequest.BACKOFF.FIXED = 'hacked'; } catch (e) { /* strict mode throws */ }
            expect(AJAXRequest.BACKOFF.FIXED).toBe(before);
        });

        test('setRetry accepts BACKOFF.FIXED', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry({ times: 2, baseWait: 2, backoff: AJAXRequest.BACKOFF.FIXED, func: function() {} })).toBe(true);
        });

        test('setRetry accepts BACKOFF.LINEAR', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry({ times: 2, baseWait: 2, backoff: AJAXRequest.BACKOFF.LINEAR, func: function() {} })).toBe(true);
        });

        test('setRetry accepts BACKOFF.EXPONENTIAL', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry({ times: 2, baseWait: 2, backoff: AJAXRequest.BACKOFF.EXPONENTIAL, func: function() {} })).toBe(true);
        });

        test('default retry backoff is BACKOFF.FIXED', () => {
            const ajax = new AJAXRequest();
            expect(ajax.retry.backoff).toBe(AJAXRequest.BACKOFF.FIXED);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // setRetry() — object config form
    // ─────────────────────────────────────────────────────────────────────────
    describe('setRetry() object config form', () => {
        test('accepts object with times and baseWait', () => {
            const ajax = new AJAXRequest();
            const result = ajax.setRetry({ times: 3, baseWait: 2, func: function() {} });
            expect(result).toBe(true);
            expect(ajax.retry.times).toBe(3);
            expect(ajax.retry.baseWait).toBe(2);
        });

        test('sets backoff strategy', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 3, baseWait: 1, backoff: AJAXRequest.BACKOFF.EXPONENTIAL, func: function() {} });
            expect(ajax.retry.backoff).toBe(AJAXRequest.BACKOFF.EXPONENTIAL);
        });

        test('sets linear backoff strategy', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 3, baseWait: 2, backoff: AJAXRequest.BACKOFF.LINEAR, func: function() {} });
            expect(ajax.retry.backoff).toBe(AJAXRequest.BACKOFF.LINEAR);
        });

        test('sets jitter flag', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 3, baseWait: 2, jitter: true, func: function() {} });
            expect(ajax.retry.jitter).toBe(true);
        });

        test('sets maxWait', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 3, baseWait: 2, maxWait: 30, func: function() {} });
            expect(ajax.retry.maxWait).toBe(30);
        });

        test('defaults backoff to fixed when not specified', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 2, baseWait: 3, func: function() {} });
            expect(ajax.retry.backoff).toBe(AJAXRequest.BACKOFF.FIXED);
        });

        test('defaults jitter to false when not specified', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 2, baseWait: 3, func: function() {} });
            expect(ajax.retry.jitter).toBe(false);
        });

        test('defaults maxWait to 60 when not specified', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 2, baseWait: 3, func: function() {} });
            expect(ajax.retry.maxWait).toBe(60);
        });

        test('func is optional in object form', () => {
            const ajax = new AJAXRequest();
            const result = ajax.setRetry({ times: 2, baseWait: 3 });
            expect(result).toBe(true);
        });

        test('returns false for invalid times (negative)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry({ times: -1, baseWait: 3 })).toBe(false);
        });

        test('returns false for invalid baseWait (zero)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry({ times: 2, baseWait: 0 })).toBe(false);
        });

        test('returns false for invalid baseWait (negative)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry({ times: 2, baseWait: -1 })).toBe(false);
        });

        test('returns false for invalid maxWait (zero)', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry({ times: 2, baseWait: 2, maxWait: 0 })).toBe(false);
        });

        test('returns false for unknown backoff strategy', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry({ times: 2, baseWait: 2, backoff: 'random-walk' })).toBe(false);
        });

        test('times: 0 disables retry via object form', () => {
            const ajax = new AJAXRequest();
            const result = ajax.setRetry({ times: 0, baseWait: 2, func: function() {} });
            expect(result).toBe(true);
            expect(ajax.retry.times).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // setRetry() — legacy positional form still works
    // ─────────────────────────────────────────────────────────────────────────
    describe('setRetry() legacy positional form (backward compatibility)', () => {
        test('positional form sets fixed backoff', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry(3, 5, function() {});
            expect(ajax.retry.backoff).toBe('fixed');
            expect(ajax.retry.baseWait).toBe(5);
            expect(ajax.retry.times).toBe(3);
        });

        test('positional form returns true', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry(2, 4, function() {})).toBe(true);
        });

        test('positional form returns false on invalid times', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry(-1, 4, function() {})).toBe(false);
        });

        test('positional form returns false on invalid wait', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry(2, 0, function() {})).toBe(false);
        });

        test('positional form returns false on missing func', () => {
            const ajax = new AJAXRequest();
            expect(ajax.setRetry(2, 4, 'not-a-function')).toBe(false);
        });

        test('positional form sets jitter to false', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry(2, 3, function() {});
            expect(ajax.retry.jitter).toBe(false);
        });

        test('positional form sets maxWait to 60', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry(2, 3, function() {});
            expect(ajax.retry.maxWait).toBe(60);
        });

        test('positional form accepts props as 4th arg', () => {
            const ajax = new AJAXRequest();
            const props = { key: 'value' };
            ajax.setRetry(2, 3, function() {}, props);
            expect(ajax.retry.props).toEqual(props);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Default retry config
    // ─────────────────────────────────────────────────────────────────────────
    describe('default retry config', () => {
        test('defaults: times=3, baseWait=5, backoff=fixed, jitter=false, maxWait=60', () => {
            const ajax = new AJAXRequest();
            expect(ajax.retry.times).toBe(3);
            expect(ajax.retry.baseWait).toBe(5);
            expect(ajax.retry.backoff).toBe('fixed');
            expect(ajax.retry.jitter).toBe(false);
            expect(ajax.retry.maxWait).toBe(60);
        });

        test('wait mirrors baseWait for backward compat', () => {
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 2, baseWait: 7, func: function() {} });
            expect(ajax.retry.wait).toBe(7);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Fixed backoff (default)
    // ─────────────────────────────────────────────────────────────────────────
    describe('fixed backoff', () => {
        test('wait is the same for every attempt', async () => {
            const waits = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 3, baseWait: 3, backoff: AJAXRequest.BACKOFF.FIXED, func: function() {} });
            ajax.setOnRetry(function() {
                if (this.remainingSeconds === 0) {
                    waits.push(this.attemptNumber);
                }
            });

            const promise = ajax.send();
            loseConnection(getLastXhr());        // fail 1
            jest.advanceTimersByTime(3000);       // wait 3s
            loseConnection(getLastXhr());        // fail 2
            jest.advanceTimersByTime(3000);       // wait 3s
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;
            // Both retries waited 3 seconds — confirmed by attempt numbers at remainingSeconds=0
            expect(waits).toEqual([1, 2]);
        });

        test('fixed: 2s wait, 2 retries — correct total timer advance', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 2, baseWait: 2, backoff: AJAXRequest.BACKOFF.FIXED, func: function() {} });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000);
            simulateResponse(getLastXhr(), 200, '{}');

            const response = await promise;
            expect(response.status).toBe(200);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Linear backoff
    // ─────────────────────────────────────────────────────────────────────────
    describe('linear backoff', () => {
        test('wait grows linearly: attempt 1 = base, attempt 2 = 2*base, attempt 3 = 3*base', async () => {
            const countdowns = []; // collect (attemptNumber, totalWait) pairs
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 3, baseWait: 2, backoff: AJAXRequest.BACKOFF.LINEAR, func: function() {} });
            // Capture the first tick of each attempt to infer the total wait
            let lastAttempt = 0;
            let firstTickRemaining = null;
            ajax.setOnRetry(function() {
                if (this.attemptNumber !== lastAttempt) {
                    lastAttempt = this.attemptNumber;
                    firstTickRemaining = this.remainingSeconds;
                    // totalWait = firstTickRemaining + 1 (since we've already ticked once)
                    countdowns.push({ attempt: this.attemptNumber, totalWait: firstTickRemaining + 1 });
                }
            });

            const promise = ajax.send();

            // Attempt 1: linear(1) = 2*1 = 2s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000);

            // Attempt 2: linear(2) = 2*2 = 4s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(4000);

            // Attempt 3: linear(3) = 2*3 = 6s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(6000);

            // Exhausted
            loseConnection(getLastXhr());
            await promise.catch(() => {});

            expect(countdowns[0]).toEqual({ attempt: 1, totalWait: 2 });
            expect(countdowns[1]).toEqual({ attempt: 2, totalWait: 4 });
            expect(countdowns[2]).toEqual({ attempt: 3, totalWait: 6 });
        });

        test('linear with baseWait=1: attempt 1=1s, 2=2s, 3=3s', async () => {
            const ticks = {};
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 3, baseWait: 1, backoff: AJAXRequest.BACKOFF.LINEAR, func: function() {} });
            ajax.setOnRetry(function() {
                var a = this.attemptNumber;
                if (!ticks[a]) ticks[a] = [];
                ticks[a].push(this.remainingSeconds);
            });

            const promise = ajax.send();

            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000); // attempt 1: 1s total
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000); // attempt 2: 2s total
            simulateResponse(getLastXhr(), 200, '{}');

            await promise;

            // attempt 1: 1 tick (0 remaining)
            expect(ticks[1]).toEqual([0]);
            // attempt 2: 2 ticks (1, 0 remaining)
            expect(ticks[2]).toEqual([1, 0]);
        });

        test('linear succeeds on 2nd attempt after correct wait', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 3, baseWait: 2, backoff: AJAXRequest.BACKOFF.LINEAR, func: function() {} });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000); // attempt 1: 2s
            simulateResponse(getLastXhr(), 200, '{"ok": true}');

            const response = await promise;
            expect(response.jsonResponse).toEqual({ ok: true });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Exponential backoff
    // ─────────────────────────────────────────────────────────────────────────
    describe('exponential backoff', () => {
        test('wait doubles each attempt: base*2^0, base*2^1, base*2^2', async () => {
            const countdowns = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 3, baseWait: 1, backoff: AJAXRequest.BACKOFF.EXPONENTIAL, func: function() {} });
            let lastAttempt = 0;
            ajax.setOnRetry(function() {
                if (this.attemptNumber !== lastAttempt) {
                    lastAttempt = this.attemptNumber;
                    countdowns.push({ attempt: this.attemptNumber, totalWait: this.remainingSeconds + 1 });
                }
            });

            const promise = ajax.send();

            // attempt 1: 1 * 2^0 = 1s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);
            // attempt 2: 1 * 2^1 = 2s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000);
            // attempt 3: 1 * 2^2 = 4s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(4000);
            loseConnection(getLastXhr()); // exhausted

            await promise.catch(() => {});

            expect(countdowns[0]).toEqual({ attempt: 1, totalWait: 1 });
            expect(countdowns[1]).toEqual({ attempt: 2, totalWait: 2 });
            expect(countdowns[2]).toEqual({ attempt: 3, totalWait: 4 });
        });

        test('exponential with baseWait=2: 2, 4, 8 seconds', async () => {
            const totalWaits = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 3, baseWait: 2, backoff: AJAXRequest.BACKOFF.EXPONENTIAL, func: function() {} });
            let lastAttempt = 0;
            ajax.setOnRetry(function() {
                if (this.attemptNumber !== lastAttempt) {
                    lastAttempt = this.attemptNumber;
                    totalWaits.push(this.remainingSeconds + 1);
                }
            });

            const promise = ajax.send();

            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000); // 2s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(4000); // 4s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(8000); // 8s
            loseConnection(getLastXhr());

            await promise.catch(() => {});

            expect(totalWaits).toEqual([2, 4, 8]);
        });

        test('exponential is capped by maxWait', async () => {
            const totalWaits = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 4, baseWait: 2, backoff: AJAXRequest.BACKOFF.EXPONENTIAL, maxWait: 5, func: function() {} });
            let lastAttempt = 0;
            ajax.setOnRetry(function() {
                if (this.attemptNumber !== lastAttempt) {
                    lastAttempt = this.attemptNumber;
                    totalWaits.push(this.remainingSeconds + 1);
                }
            });

            const promise = ajax.send();

            // attempt 1: min(2*2^0, 5) = 2s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000);
            // attempt 2: min(2*2^1, 5) = 4s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(4000);
            // attempt 3: min(2*2^2, 5) = 5s (capped)
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(5000);
            // attempt 4: min(2*2^3, 5) = 5s (capped)
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(5000);
            loseConnection(getLastXhr());

            await promise.catch(() => {});

            expect(totalWaits[0]).toBe(2);
            expect(totalWaits[1]).toBe(4);
            expect(totalWaits[2]).toBe(5);
            expect(totalWaits[3]).toBe(5);
        });

        test('exponential succeeds on retry', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 3, baseWait: 1, backoff: AJAXRequest.BACKOFF.EXPONENTIAL, func: function() {} });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000); // attempt 1: 1s
            simulateResponse(getLastXhr(), 200, '{"exp": true}');

            const response = await promise;
            expect(response.jsonResponse).toEqual({ exp: true });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // maxWait cap
    // ─────────────────────────────────────────────────────────────────────────
    describe('maxWait cap', () => {
        test('linear backoff is capped by maxWait', async () => {
            const totalWaits = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 3, baseWait: 3, backoff: AJAXRequest.BACKOFF.LINEAR, maxWait: 5, func: function() {} });
            let lastAttempt = 0;
            ajax.setOnRetry(function() {
                if (this.attemptNumber !== lastAttempt) {
                    lastAttempt = this.attemptNumber;
                    totalWaits.push(this.remainingSeconds + 1);
                }
            });

            const promise = ajax.send();

            // attempt 1: min(3*1, 5) = 3s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(3000);
            // attempt 2: min(3*2, 5) = 5s (capped)
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(5000);
            // attempt 3: min(3*3, 5) = 5s (capped)
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(5000);
            loseConnection(getLastXhr());

            await promise.catch(() => {});

            expect(totalWaits[0]).toBe(3);
            expect(totalWaits[1]).toBe(5);
            expect(totalWaits[2]).toBe(5);
        });

        test('fixed backoff is not affected by maxWait when below cap', async () => {
            const totalWaits = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 2, baseWait: 3, backoff: AJAXRequest.BACKOFF.FIXED, maxWait: 10, func: function() {} });
            let lastAttempt = 0;
            ajax.setOnRetry(function() {
                if (this.attemptNumber !== lastAttempt) {
                    lastAttempt = this.attemptNumber;
                    totalWaits.push(this.remainingSeconds + 1);
                }
            });

            const promise = ajax.send();
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(3000);
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(3000);
            loseConnection(getLastXhr());

            await promise.catch(() => {});

            expect(totalWaits).toEqual([3, 3]);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Jitter
    // ─────────────────────────────────────────────────────────────────────────
    describe('jitter', () => {
        test('jitter=true produces wait within ±25% of base', () => {
            // Mock Math.random to produce deterministic results
            const originalRandom = Math.random;

            // Test with random = 0 (lower bound: base - 25%)
            Math.random = () => 0;
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 3, baseWait: 4, backoff: AJAXRequest.BACKOFF.FIXED, jitter: true, func: function() {} });

            const lowerBound = Math.round(4 - 4 * 0.25 + 0); // = 3
            expect(lowerBound).toBeGreaterThanOrEqual(1);

            // Test with random = 1 (upper bound: base + 25%)
            Math.random = () => 1;
            const upperBound = Math.round(4 - 4 * 0.25 + 4 * 0.25 * 2 * 1); // = 5
            expect(upperBound).toBeLessThanOrEqual(6);

            Math.random = originalRandom;
        });

        test('jitter=true: wait is always >= 1', () => {
            const originalRandom = Math.random;
            Math.random = () => 0; // worst case: subtract full jitter range
            const ajax = new AJAXRequest();
            ajax.setRetry({ times: 3, baseWait: 1, backoff: AJAXRequest.BACKOFF.FIXED, jitter: true, func: function() {} });

            // calculateWait(1, { baseWait:1, backoff:'fixed', jitter:true })
            // wait = 1; jitterRange = 0.25; result = 1 - 0.25 + 0 = 0.75 → rounds to 1
            // max(1, round(0.75)) = max(1, 1) = 1
            Math.random = originalRandom;
        });

        test('jitter=false: wait is deterministic (no randomness)', () => {
            const spy = jest.spyOn(Math, 'random');
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 1, baseWait: 3, backoff: AJAXRequest.BACKOFF.FIXED, jitter: false, func: function() {} });

            ajax.send().catch(() => {});
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(3000);
            simulateResponse(getLastXhr(), 200, '{}');

            // Math.random should never be called when jitter is false
            expect(spy).not.toHaveBeenCalled();
        });

        test('jitter=true: wait is always within ±25% of base wait', async () => {
            // Run several retries and confirm each wait is within [base*0.75, base*1.25]
            // Rounded and clamped to minimum 1
            const totalWaits = [];
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 5, baseWait: 4, backoff: AJAXRequest.BACKOFF.FIXED, jitter: true, func: function() {} });
            let lastAttempt = 0;
            ajax.setOnRetry(function() {
                if (this.attemptNumber !== lastAttempt) {
                    lastAttempt = this.attemptNumber;
                    totalWaits.push(this.remainingSeconds + 1);
                }
            });

            const promise = ajax.send();

            // Advance enough time for 3 retries regardless of jitter (use generous bounds)
            for (var i = 0; i < 3; i++) {
                loseConnection(getLastXhr());
                jest.advanceTimersByTime(10000); // 10s always exceeds 4 ± 25% = [3, 5]
            }
            simulateResponse(getLastXhr(), 200, '{}');
            await promise;

            // Each wait must be in [3, 5] — base=4, jitter±25% = ±1
            for (var w = 0; w < totalWaits.length; w++) {
                expect(totalWaits[w]).toBeGreaterThanOrEqual(3);
                expect(totalWaits[w]).toBeLessThanOrEqual(5);
            }
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Integration with Promise and onRetry/onRetryEnd
    // ─────────────────────────────────────────────────────────────────────────
    describe('integration with Promise and retry pools', () => {
        test('exponential: onRetry.remainingSeconds reflects actual wait', async () => {
            const ticks = {};
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 2, baseWait: 1, backoff: AJAXRequest.BACKOFF.EXPONENTIAL, func: function() {} });
            ajax.setOnRetry(function() {
                var a = this.attemptNumber;
                if (!ticks[a]) ticks[a] = [];
                ticks[a].push(this.remainingSeconds);
            });

            const promise = ajax.send();

            // attempt 1: 1*2^0 = 1s → 1 tick with remaining=0
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000);

            // attempt 2: 1*2^1 = 2s → 2 ticks: 1, 0
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000);

            simulateResponse(getLastXhr(), 200, '{}');
            await promise;

            expect(ticks[1]).toEqual([0]);
            expect(ticks[2]).toEqual([1, 0]);
        });

        test('linear: Promise resolves after correct backoff waits', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 3, baseWait: 2, backoff: AJAXRequest.BACKOFF.LINEAR, func: function() {} });

            const promise = ajax.send();

            // linear attempt 1 = 2s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000);

            // linear attempt 2 = 4s → success
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(4000);
            simulateResponse(getLastXhr(), 200, '{"linear": "ok"}');

            const response = await promise;
            expect(response.jsonResponse).toEqual({ linear: 'ok' });
        });

        test('onRetryEnd.attempts reflects correct count with exponential backoff', async () => {
            let endAttempts = null;
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 2, baseWait: 1, backoff: AJAXRequest.BACKOFF.EXPONENTIAL, func: function() {} });
            ajax.setOnRetryEnd(function() { endAttempts = this.attempts; });

            const promise = ajax.send();

            loseConnection(getLastXhr());
            jest.advanceTimersByTime(1000); // attempt 1: 1s
            loseConnection(getLastXhr());
            jest.advanceTimersByTime(2000); // attempt 2: 2s
            loseConnection(getLastXhr());   // exhausted

            await promise.catch(() => {});
            expect(endAttempts).toBe(2);
        });

        test('backoff config is isolated per concurrent request', async () => {
            const ajax = new AJAXRequest({ method: 'GET', url: 'https://example.com/api' });
            ajax.setRetry({ times: 2, baseWait: 1, backoff: AJAXRequest.BACKOFF.EXPONENTIAL, func: function() {} });
            ajax.retry.times = 0; // disable for clean concurrent test

            const p1 = ajax.send();
            const p2 = ajax.send();

            const xhr1 = xhrInstances[xhrInstances.length - 2];
            const xhr2 = xhrInstances[xhrInstances.length - 1];

            simulateResponse(xhr1, 200, '{"r":1}');
            simulateResponse(xhr2, 200, '{"r":2}');

            const [r1, r2] = await Promise.all([p1, p2]);
            expect(r1.jsonResponse.r).toBe(1);
            expect(r2.jsonResponse.r).toBe(2);
        });
    });
});
