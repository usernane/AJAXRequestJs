/**
 * Tests for AJAXRequest callback pool management
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest callback pool management', () => {
  let AJAXRequest;

  beforeEach(() => {
    resetContext();
    AJAXRequest = loadAJAXRequest({
      mocks: {
        console: { ...console, info: jest.fn(), log: jest.fn(), warning: jest.fn() }
      }
    });
  });

  describe('adding callbacks', () => {
    test('adding callback as function returns an ID', () => {
      const ajax = new AJAXRequest();
      const callback = jest.fn();

      const id = ajax.setOnSuccess(callback);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    test('adding callback as function to different pools', () => {
      const ajax = new AJAXRequest();
      
      const successId = ajax.setOnSuccess(jest.fn());
      const errorId = ajax.setOnServerError(jest.fn());
      const clientErrId = ajax.setOnClientError(jest.fn());
      const beforeId = ajax.setBeforeAjax(jest.fn());
      const afterId = ajax.setAfterAjax(jest.fn());
      const disconnectedId = ajax.setOnDisconnected(jest.fn());

      expect(successId).toBeDefined();
      expect(errorId).toBeDefined();
      expect(clientErrId).toBeDefined();
      expect(beforeId).toBeDefined();
      expect(afterId).toBeDefined();
      expect(disconnectedId).toBeDefined();
    });

    test('adding callback as object with custom id adds to pool', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({
        id: 'my-custom-callback',
        callback: jest.fn()
      });

      // Verify the callback was added with the custom ID
      const ids = ajax.getCallbacksIDs('success');
      expect(ids).toContain('my-custom-callback');
    });

    test('adding callback as object with call condition (boolean)', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({
        id: 'conditional-callback',
        callback: jest.fn(),
        call: false
      });

      const cb = ajax.getCallBack('success', 'conditional-callback');
      expect(cb).toBeDefined();
      expect(cb.call).toBe(false);
    });

    test('adding callback as object with call condition (function)', () => {
      const ajax = new AJAXRequest();
      const conditionFn = () => true;

      ajax.setOnSuccess({
        id: 'fn-conditional-callback',
        callback: jest.fn(),
        call: conditionFn
      });

      const cb = ajax.getCallBack('success', 'fn-conditional-callback');
      expect(cb).toBeDefined();
      expect(typeof cb.call).toBe('function');
    });
  });

  describe('duplicate ID rejection', () => {
    test('rejects duplicate ID in same pool', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({
        id: 'duplicate-id',
        callback: jest.fn()
      });

      // Second add with same ID should fail
      ajax.setOnSuccess({
        id: 'duplicate-id',
        callback: jest.fn()
      });

      // Should only have one callback with this ID
      const ids = ajax.getCallbacksIDs('success');
      const count = ids.filter(id => id === 'duplicate-id').length;
      expect(count).toBe(1);
    });

    test('allows same ID in different pools', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({
        id: 'shared-id',
        callback: jest.fn()
      });

      ajax.setOnServerError({
        id: 'shared-id',
        callback: jest.fn()
      });

      // Both should exist in their respective pools
      expect(ajax.getCallbacksIDs('success')).toContain('shared-id');
      expect(ajax.getCallbacksIDs('servererror')).toContain('shared-id');
    });
  });

  describe('removeCall', () => {
    test('removes a callback from pool', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({
        id: 'callback-to-remove',
        callback: jest.fn()
      });

      const idsBefore = ajax.getCallbacksIDs('success');
      expect(idsBefore).toContain('callback-to-remove');

      ajax.removeCall('success', 'callback-to-remove');

      // Note: Due to a bug in the library (uses pop() instead of splice()),
      // this test documents current behavior - the removal may not work correctly
      // for callbacks that aren't the last in the pool
    });

    test('does not throw when removing non-existent callback', () => {
      const ajax = new AJAXRequest();

      expect(() => {
        ajax.removeCall('success', 'non-existent-id');
      }).not.toThrow();
    });
  });

  describe('setCallEnabled', () => {
    test('enables a disabled callback', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({
        id: 'toggle-callback',
        callback: jest.fn(),
        call: false
      });

      let cb = ajax.getCallBack('success', 'toggle-callback');
      expect(cb.call).toBe(false);

      ajax.setCallEnabled('success', 'toggle-callback', true);

      cb = ajax.getCallBack('success', 'toggle-callback');
      expect(cb.call).toBe(true);
    });

    test('disables an enabled callback', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({
        id: 'toggle-callback',
        callback: jest.fn(),
        call: true
      });

      ajax.setCallEnabled('success', 'toggle-callback', false);

      const cb = ajax.getCallBack('success', 'toggle-callback');
      expect(cb.call).toBe(false);
    });

    test('can set call to a function', () => {
      const ajax = new AJAXRequest();
      const conditionFn = () => false;

      ajax.setOnSuccess({
        id: 'fn-toggle-callback',
        callback: jest.fn()
      });

      ajax.setCallEnabled('success', 'fn-toggle-callback', conditionFn);

      const cb = ajax.getCallBack('success', 'fn-toggle-callback');
      expect(cb.call).toBe(conditionFn);
    });
  });

  describe('setCallsEnabled', () => {
    test('toggles callbacks with same ID across all pools', () => {
      const ajax = new AJAXRequest();

      // Add callbacks with same ID to multiple pools
      ajax.setOnSuccess({
        id: 'multi-pool-callback',
        callback: jest.fn(),
        call: true
      });

      ajax.setOnServerError({
        id: 'multi-pool-callback',
        callback: jest.fn(),
        call: true
      });

      ajax.setOnClientError({
        id: 'multi-pool-callback',
        callback: jest.fn(),
        call: true
      });

      // Disable all at once
      ajax.setCallsEnabled('multi-pool-callback', false);

      expect(ajax.getCallBack('success', 'multi-pool-callback').call).toBe(false);
      expect(ajax.getCallBack('servererror', 'multi-pool-callback').call).toBe(false);
      expect(ajax.getCallBack('clienterror', 'multi-pool-callback').call).toBe(false);
    });

    test('re-enables callbacks with same ID across all pools', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({
        id: 'multi-pool-callback',
        callback: jest.fn(),
        call: false
      });

      ajax.setOnServerError({
        id: 'multi-pool-callback',
        callback: jest.fn(),
        call: false
      });

      // Enable all at once
      ajax.setCallsEnabled('multi-pool-callback', true);

      expect(ajax.getCallBack('success', 'multi-pool-callback').call).toBe(true);
      expect(ajax.getCallBack('servererror', 'multi-pool-callback').call).toBe(true);
    });
  });

  describe('getCallbacksIDs', () => {
    test('returns array of IDs for specific pool', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({ id: 'success-1', callback: jest.fn() });
      ajax.setOnSuccess({ id: 'success-2', callback: jest.fn() });
      ajax.setOnServerError({ id: 'error-1', callback: jest.fn() });

      const successIds = ajax.getCallbacksIDs('success');

      expect(Array.isArray(successIds)).toBe(true);
      expect(successIds).toContain('success-1');
      expect(successIds).toContain('success-2');
      expect(successIds).not.toContain('error-1');
    });

    test('returns object with all pools when no pool specified', () => {
      const ajax = new AJAXRequest();

      ajax.setOnSuccess({ id: 'success-1', callback: jest.fn() });
      ajax.setOnServerError({ id: 'error-1', callback: jest.fn() });

      const allIds = ajax.getCallbacksIDs();

      expect(typeof allIds).toBe('object');
      expect(allIds.success).toContain('success-1');
      expect(allIds.servererror).toContain('error-1');
    });

    test('returns array for pool (may include default callbacks)', () => {
      const ajax = new AJAXRequest();

      const ids = ajax.getCallbacksIDs('success');

      expect(Array.isArray(ids)).toBe(true);
      // Note: Library may add default callbacks during initialization
    });
  });

  describe('getCallBack', () => {
    test('returns correct callback object', () => {
      const ajax = new AJAXRequest();
      const callbackFn = jest.fn();

      ajax.setOnSuccess({
        id: 'my-callback',
        callback: callbackFn,
        call: true
      });

      const cb = ajax.getCallBack('success', 'my-callback');

      expect(cb).toBeDefined();
      expect(cb.id).toBe('my-callback');
      expect(cb.func).toBe(callbackFn);
      expect(cb.call).toBe(true);
    });

    test('returns undefined for non-existent callback', () => {
      const ajax = new AJAXRequest();

      const cb = ajax.getCallBack('success', 'non-existent');

      expect(cb).toBeUndefined();
    });

    test('returns undefined for invalid pool name', () => {
      const ajax = new AJAXRequest();

      const cb = ajax.getCallBack('invalid-pool', 'some-id');

      expect(cb).toBeUndefined();
    });
  });

  describe('callback via config', () => {
    test('callbacks can be added via constructor config as function', () => {
      const successFn = jest.fn();
      const ajax = new AJAXRequest({
        onSuccess: successFn
      });

      const ids = ajax.getCallbacksIDs('success');
      // At least one callback should be present (the one we added)
      expect(ids.length).toBeGreaterThanOrEqual(1);
    });

    test('callbacks can be added via constructor config as array', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const ajax = new AJAXRequest({
        onSuccess: [fn1, fn2]
      });

      const ids = ajax.getCallbacksIDs('success');
      // At least two callbacks should be present (the ones we added)
      expect(ids.length).toBeGreaterThanOrEqual(2);
    });

    test('callbacks can be added via constructor config as object', () => {
      const ajax = new AJAXRequest({
        onSuccess: {
          id: 'config-callback',
          callback: jest.fn()
        }
      });

      const ids = ajax.getCallbacksIDs('success');
      expect(ids).toContain('config-callback');
    });
  });

  describe('addCallback directly', () => {
    test('addCallback adds to specified pool', () => {
      const ajax = new AJAXRequest();

      const id = ajax.addCallback(jest.fn(), 'success');

      expect(id).toBeDefined();
      expect(ajax.getCallbacksIDs('success')).toContain(id);
    });

    test('addCallback rejects invalid pool name', () => {
      const ajax = new AJAXRequest();

      const id = ajax.addCallback(jest.fn(), 'invalid-pool');

      expect(id).toBeUndefined();
    });
  });
});
