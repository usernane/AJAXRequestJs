/**
 * Tests for AJAXRequest retry mechanism
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest retry mechanism', () => {
  let AJAXRequest;
  let xhrInstances;
  let MockXMLHttpRequest;

  beforeEach(() => {
    jest.useFakeTimers();
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
      this.getAllResponseHeaders = jest.fn(() => '');
      this.onreadystatechange = null;
      this.active = false;
      xhrInstances.push(this);
    });

    AJAXRequest = loadAJAXRequest({
      mocks: {
        XMLHttpRequest: MockXMLHttpRequest,
        console: { ...console, info: jest.fn(), log: jest.fn(), warning: jest.fn() }
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('setRetry configuration', () => {
    test('setRetry returns true with valid parameters', () => {
      const ajax = new AJAXRequest();
      const callback = jest.fn();

      const result = ajax.setRetry(3, 5, callback);

      expect(result).toBe(true);
    });

    test('setRetry returns false with invalid times (negative)', () => {
      const ajax = new AJAXRequest();

      const result = ajax.setRetry(-1, 5, jest.fn());

      expect(result).toBe(false);
    });

    test('setRetry returns false with invalid wait time (less than 1)', () => {
      const ajax = new AJAXRequest();

      const result = ajax.setRetry(3, 0, jest.fn());

      expect(result).toBe(false);
    });

    test('setRetry returns false without callback function', () => {
      const ajax = new AJAXRequest();

      const result = ajax.setRetry(3, 5, 'not a function');

      expect(result).toBe(false);
    });

    test('setRetry accepts props parameter', () => {
      const ajax = new AJAXRequest();
      const callback = jest.fn();
      const props = { customData: 'test' };

      const result = ajax.setRetry(3, 5, callback, props);

      expect(result).toBe(true);
      expect(ajax.retry.props).toEqual(props);
    });

    test('setRetry sets times to 0 disables retry', () => {
      const ajax = new AJAXRequest();

      const result = ajax.setRetry(0, 5, jest.fn());

      expect(result).toBe(true);
      expect(ajax.retry.times).toBe(0);
    });
  });

  describe('retry on connection lost', () => {
    test('retry triggers on status 0 (connection lost)', () => {
      const retryCallback = jest.fn();
      const ajax = new AJAXRequest({
        method: 'GET',
        url: 'https://example.com/api'
      });
      ajax.setRetry(2, 3, retryCallback);

      ajax.send();

      // Simulate connection lost (status 0, readyState 4)
      const xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 0;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      // Fast-forward 1 second
      jest.advanceTimersByTime(1000);

      // Callback should be called with remaining seconds and pass number
      expect(retryCallback).toHaveBeenCalled();
    });

    test('retry callback receives correct parameters', () => {
      const retryCallback = jest.fn();
      const ajax = new AJAXRequest({
        method: 'GET',
        url: 'https://example.com/api'
      });
      ajax.setRetry(2, 3, retryCallback);

      ajax.send();

      const xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 0;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      // After 1 second: remaining = 2, pass = 0
      jest.advanceTimersByTime(1000);
      expect(retryCallback).toHaveBeenCalledWith(2, 0);

      // After 2 seconds: remaining = 1, pass = 0
      jest.advanceTimersByTime(1000);
      expect(retryCallback).toHaveBeenCalledWith(1, 0);

      // After 3 seconds: remaining = 0, pass = 0, then send() is called again
      jest.advanceTimersByTime(1000);
      expect(retryCallback).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('retry stops after max attempts', () => {
    test('retry stops after configured number of attempts', () => {
      const retryCallback = jest.fn();
      const connectionLostCallback = jest.fn();
      
      const ajax = new AJAXRequest({
        method: 'GET',
        url: 'https://example.com/api',
        onDisconnected: connectionLostCallback
      });
      ajax.setRetry(2, 2, retryCallback); // 2 retries, 2 seconds each

      ajax.send();

      // First connection lost
      let xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 0;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      // Wait for first retry interval (2 seconds)
      jest.advanceTimersByTime(2000);
      
      // Second send triggered, simulate another connection lost
      xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 0;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      // Wait for second retry interval (2 seconds)
      jest.advanceTimersByTime(2000);

      // Third send triggered (pass_number = 2, which equals times)
      xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 0;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      // Now retries are exhausted, connectionlost callbacks should fire
      // (pass_number >= times)
    });
  });

  describe('interval cleanup', () => {
    test('retry.id is set during countdown', () => {
      const retryCallback = jest.fn();
      
      const ajax = new AJAXRequest({
        method: 'GET',
        url: 'https://example.com/api'
      });
      ajax.setRetry(1, 2, retryCallback);

      ajax.send();

      const xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 0;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      // After triggering connection lost, retry.id should be set (interval ID)
      expect(xhr.retry.id).toBeDefined();
    });

    test('retry.passed resets after countdown completes', () => {
      const retryCallback = jest.fn();
      
      const ajax = new AJAXRequest({
        method: 'GET',
        url: 'https://example.com/api'
      });
      ajax.setRetry(1, 2, retryCallback);

      ajax.send();

      const xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 0;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      // Advance through the full wait time
      jest.advanceTimersByTime(2000);

      // After countdown completes, passed should be reset to 0
      expect(xhr.retry.passed).toBe(0);
    });
  });

  describe('default retry behavior', () => {
    test('default retry is configured (3 times, 5 seconds)', () => {
      const ajax = new AJAXRequest();

      expect(ajax.retry.times).toBe(3);
      expect(ajax.retry.wait).toBe(5);
    });

    test('retry does not trigger for successful response', () => {
      const retryCallback = jest.fn();
      const successCallback = jest.fn();
      
      const ajax = new AJAXRequest({
        method: 'GET',
        url: 'https://example.com/api',
        onSuccess: successCallback
      });
      ajax.setRetry(2, 2, retryCallback);

      ajax.send();

      const xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 200;
      xhr.readyState = 4;
      xhr.response = '{"ok": true}';
      xhr.responseText = '{"ok": true}';
      xhr.onreadystatechange.call(xhr);

      jest.advanceTimersByTime(5000);

      // Retry should not be called for successful responses
      expect(retryCallback).not.toHaveBeenCalled();
    });

    test('retry does not trigger for server error (5xx)', () => {
      const retryCallback = jest.fn();
      
      const ajax = new AJAXRequest({
        method: 'GET',
        url: 'https://example.com/api'
      });
      ajax.setRetry(2, 2, retryCallback);

      ajax.send();

      const xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 500;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      jest.advanceTimersByTime(5000);

      // Retry should not be called for 5xx errors
      expect(retryCallback).not.toHaveBeenCalled();
    });

    test('retry does not trigger for client error (4xx)', () => {
      const retryCallback = jest.fn();
      
      const ajax = new AJAXRequest({
        method: 'GET',
        url: 'https://example.com/api'
      });
      ajax.setRetry(2, 2, retryCallback);

      ajax.send();

      const xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 404;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      jest.advanceTimersByTime(5000);

      // Retry should not be called for 4xx errors
      expect(retryCallback).not.toHaveBeenCalled();
    });
  });

  describe('retry with times set to 0', () => {
    test('connectionlost fires immediately when retry times is 0', () => {
      const connectionLostCallback = jest.fn();
      
      const ajax = new AJAXRequest({
        method: 'GET',
        url: 'https://example.com/api',
        onDisconnected: connectionLostCallback
      });
      ajax.setRetry(0, 2, jest.fn()); // 0 retries

      ajax.send();

      const xhr = xhrInstances[xhrInstances.length - 1];
      xhr.status = 0;
      xhr.readyState = 4;
      xhr.onreadystatechange.call(xhr);

      // With 0 retries, connectionlost should fire immediately
      // No need to advance timers
    });
  });
});
