# ADR-0011: Retry Mechanism Redesign

**Date:** 2026-08-25
**Status:** Proposed

## Context

The current retry mechanism in AJAXRequest.js has several design issues that need to be addressed for v3.0.0:

1. **Doesn't compose with Promises (#95)**: When retry calls `this.AJAXRequest.send()`, it creates a new Promise that nobody awaits, leaving the original Promise orphaned and never settled.

2. **Single callback, not a pool (#112)**: Unlike all other events (`onSuccess`, `onClientErr`, etc.), retry only supports a single callback via `setRetry()`, inconsistent with the library's design.

3. **Fixed wait time only (#113)**: No support for backoff strategies (linear, exponential) or jitter, which are industry standard for robust retry logic.

4. **Shared mutable state**: The `retry` object is shared by reference across XHRs, causing state mutations that can interfere with concurrent requests.

### Current Retry Flow

```
User calls send()
    └─> XHR sent
           └─> onreadystatechange fires
                  └─> status === 0 (disconnected)?
                         ├─> YES: retries remaining?
                         │      ├─> YES: setInterval countdown, then send() again
                         │      └─> NO:  callbacks for 'connectionlost'
                         └─> NO: callbacks for success/error
```

The problem is at "send() again" — this creates an entirely new request flow with no connection to the original Promise.

## Decision

### 1. Promise Continuity Through Retries

Modify `send()` to accept internal parameters for Promise continuity:

```javascript
send(_internalResolve, _internalReject) {
    const isRetry = typeof _internalResolve === 'function';
    
    let promiseResolve, promiseReject, promise;
    
    if (isRetry) {
        // Retry: reuse original Promise's resolve/reject
        promiseResolve = _internalResolve;
        promiseReject = _internalReject;
        promise = undefined;  // Don't return new Promise for retry
    } else {
        // Normal call: create new Promise
        promise = new Promise((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });
    }
    
    // Store on XHR instance for settlement after callbacks
    nonActiveXhr._resolve = promiseResolve;
    nonActiveXhr._reject = promiseReject;
    
    // ... rest of send logic ...
    
    return promise;
}
```

Retry handler passes through the original handlers:

```javascript
// Changed from: i.AJAXRequest.send()
// Changed to:
i.AJAXRequest.send(i._resolve, i._reject);
```

### 2. `onRetry` and `onRetryEnd` Callback Pools

Add `onretrypool` and `onretryendpool` alongside other callback pools:

```javascript
this.onretrypool = [];
this.onretryendpool = [];

// New methods following existing patterns
setOnRetry(callback) { ... }
setOnRetryEnd(callback) { ... }
```

#### `onRetry` Context
- `this.remainingSeconds` — seconds until next attempt
- `this.attemptNumber` — current attempt (1-indexed)
- `this.maxAttempts` — total configured attempts
- `this.AJAXRequest` — the AJAXRequest instance

#### `onRetryEnd` Context
- `this.succeeded` — boolean, did retry eventually succeed?
- `this.attempts` — how many attempts were made
- `this.AJAXRequest` — the AJAXRequest instance

#### Event Order

```
Connection lost:
  → onRetry (attempt 1)
  → onRetry (attempt 2)
  → ... 
  → onRetryEnd { succeeded: true/false }
  → onSuccess OR onDisconnected
  → afterAjax
  → Promise settles
```

The `onRetryEnd` pool fires:
- **Before** `onSuccess` if retry succeeded (allows UI cleanup before success handling)
- **Before** `onDisconnected` if retries exhausted (allows UI cleanup before error handling)
- **Only** when retry was actually attempted (not on first successful request)

### 3. Backoff Configuration

Extend retry configuration to support backoff strategies:

```javascript
this.retry = {
    times: 3,
    backoff: 'fixed',      // 'fixed' | 'linear' | 'exponential'
    baseWait: 5,           // base seconds (renamed from 'wait')
    maxWait: 60,           // cap for exponential
    jitter: false,         // add ±25% randomness
    passed: 0,             // internal state
    pass_number: 0         // internal state
};
```

Wait calculation:

```javascript
function calculateWait(attempt, config) {
    let wait;
    switch (config.backoff) {
        case 'linear':
            wait = config.baseWait * attempt;
            break;
        case 'exponential':
            wait = config.baseWait * Math.pow(2, attempt - 1);
            break;
        default:
            wait = config.baseWait;
    }
    
    wait = Math.min(wait, config.maxWait);
    
    if (config.jitter) {
        const jitterRange = wait * 0.25;
        wait += (Math.random() * jitterRange * 2) - jitterRange;
    }
    
    return Math.max(1, Math.round(wait));
}
```

### 4. Isolate Retry State Per-Request

Clone retry config for each XHR instead of sharing reference:

```javascript
// Changed from: nonActiveXhr.retry = this.retry;
// Changed to:
nonActiveXhr.retry = {
    ...this.retry,
    passed: 0,
    pass_number: 0
};
```

## Alternatives Considered

### A. Retry returns the new Promise

Have retry's `send()` call return a Promise that chains to the original. Rejected because:
- Requires complex Promise chaining
- The original Promise would need to "adopt" the retry Promise's state
- More invasive change to the flow

### B. Separate retry method

Create `_retryInternal()` that bypasses Promise creation. Rejected because:
- Duplicates send() logic (parameter serialization, headers, etc.)
- Two code paths to maintain

### C. Store resolve/reject on AJAXRequest instance

Instead of passing through parameters, store on the instance. Rejected because:
- Breaks concurrent requests from same instance
- Each `send()` would overwrite previous resolve/reject

## Consequences

### Positive

- **Promise works with retry**: `await ajax.send()` settles correctly after all retries exhausted or success
- **Consistent callback API**: `setOnRetry()` follows same pattern as other event callbacks
- **Robust retry**: Backoff strategies prevent thundering herd, respect struggling servers
- **Concurrent request safety**: Isolated retry state per XHR

### Negative

- **Increased complexity**: Retry logic becomes more sophisticated
- **More configuration options**: Users need to understand backoff strategies
- **Subtle API change**: `send()` signature changes (internal params), though external API unchanged

### Migration

- **Backward compatible**: Old `setRetry(times, wait, func)` continues to work
- **Default behavior unchanged**: Without new options, retry works as before (fixed backoff)

## Implementation Order

1. **#95**: Promise support with retry continuity (this ADR, section 1)
2. **#112**: `onRetry` callback pool (this ADR, section 2)
3. **#114**: `onRetryEnd` callback pool (this ADR, section 2)
4. **#113**: Backoff strategies (this ADR, section 3)

Section 4 (isolated state) should be implemented with #95 as it's a bug fix.
