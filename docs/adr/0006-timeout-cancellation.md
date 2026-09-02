# ADR-0006: Request Timeout and Cancellation

**Date:** 2026-09-02
**Status:** Accepted

## Context

v3.0.0-beta (milestone #3) introduces request timeout and cancellation, three
of the enterprise features listed in the v3 goals. The relevant issues are:

- **#103** — `timeout` option in the configuration object
- **#104** — `setTimeout()` / `getTimeout()` accessors
- **#105** — `abort()` method for explicit cancellation
- **#106** — `AbortController` / `signal` support (fetch-aligned)

Before this work, the library recognised only one non-success terminal outcome
for a request that did not return an HTTP status: a **lost connection**
(`readyState === 4 && status === 0`), which fires the `connectionlost` pool and
drives the retry mechanism (see ADR-0011).

A browser `XMLHttpRequest` surfaces a timeout and an explicit `abort()` in a way
that is easy to confuse with a lost connection: all three end with `status === 0`.
Treating them identically would be incorrect:

- A **timeout** means the server was reached but was too slow. The caller
  usually wants to distinguish "server is slow" from "you are offline".
- An **abort** is a deliberate, user-initiated cancellation. Retrying it or
  reporting it as a disconnect would be surprising and wrong.

The design question was therefore how to model timeout and abort as terminal
outcomes that are **distinct** from a lost connection, on both the callback side
and the Promise side, without disturbing the existing retry semantics.

## Decision

### 1. Timeout is a distinct outcome with its own pool (#103, #104)

- Add a `timeout` scalar to the instance (milliseconds; `0` = no timeout).
- `config.timeout`, plus `setTimeout(ms)` / `getTimeout()` accessors.
  `setTimeout()` parses with `parseInt`, accepts `0`, rejects `NaN`/negative
  values with a warning and returns a boolean (leaving the current value
  unchanged on failure). The constructor delegates config validation to
  `setTimeout()` so validation lives in one place.
- Add a **dedicated `timeout` callback pool** (`ontimeoutpool`,
  `setOnTimeout()`, `onTimeout` config key) rather than reusing
  `connectionlost`.
- On `send()`, set `xhr.timeout` and attach `xhr.ontimeout`, which fires the
  timeout pool, then `afterAjax`, and **rejects the Promise with
  `{ type: 'timeout' }`**.
- A timeout does **not** trigger the retry mechanism.

### 2. Abort is a distinct outcome with its own pool (#105)

- Add an `abort()` method. For every active request (or one with a pending
  retry countdown) it:
  1. flags the XHR as aborted (`_aborted = true`) **before** calling
     `xhr.abort()`,
  2. clears any pending retry interval,
  3. calls `xhr.abort()`,
  4. fires the dedicated `abort` pool (`onabortpool`, `setOnAbort()`,
     `onAbort` config key), then `afterAjax`,
  5. **rejects the Promise with `{ type: 'abort' }`**.
- `abort()` returns `true` if at least one request was aborted, else `false`.
- The `_aborted` flag is checked at the top of the `status === 0` branch in
  `onreadystatechange` so an aborted request is **not** re-interpreted as a
  lost connection and **does not** retry.

### 3. AbortController support delegates to `abort()` (#106)

- Accept `config.signal`, plus `setSignal()` / `getSignal()` accessors.
  Validation is a duck-type check (`aborted` boolean + `addEventListener`).
- On `send()`:
  - If the signal is **already aborted**, fail fast — reject with
    `{ type: 'abort' }` and fire `onAbort` **without opening the XHR**
    (matches the fetch API).
  - Otherwise attach an `abort` listener that routes through the existing
    `abort()` method, so signal-triggered cancellation is identical to a manual
    `abort()`.
- The listener is **detached once the request settles** (success, error,
  timeout, or abort) so a later `controller.abort()` is a no-op and no listener
  leaks.

### 4. Typed rejection payloads

The Promise rejection payload carries a discriminating `type` so
`async`/`await` callers can branch on the outcome:

```
{ type: 'clienterror' | 'servererror' | 'connectionlost'
       | 'timeout' | 'abort' | 'disabled' | 'beforeajax_error', ... }
```

`timeout` and `abort` are new members of this set.

### Terminal outcome model

```
readyState 4:
  status 2xx/3xx ......... success pool        → resolve
  status 4xx ............. clienterror pool     → reject { type: 'clienterror' }
  status 5xx ............. servererror pool     → reject { type: 'servererror' }
  status 0:
    _aborted ............. (handled by abort()) → reject { type: 'abort' }
    otherwise ............ connectionlost pool  → retry, else reject { type: 'connectionlost' }
xhr.ontimeout ............ timeout pool         → reject { type: 'timeout' }  (no retry)
```

## Alternatives Considered

### A. Reuse the `connectionlost` pool for timeout/abort

Fold timeout and abort into the existing disconnected pool, distinguished only
by a flag. Rejected: it conflates semantically different outcomes, makes retry
suppression awkward, and forces every disconnected handler to branch on a flag.
Dedicated pools are consistent with the library's existing per-event pool
design (`onSuccess`, `onClientErr`, `onRetry`, …).

### B. Resolve (rather than reject) on abort

Some libraries resolve with a sentinel on cancellation. Rejected: fetch and
axios both reject/throw on abort, and rejecting lets `await` callers use
`try/catch` uniformly across all failure outcomes.

### C. Retry on timeout

Treat a timeout like a disconnect and retry. Rejected for this milestone:
retrying a slow endpoint often just times out again, and callers frequently
want to surface the timeout immediately. Retry remains tied to genuine
connection loss.

### D. Per-request timeouts

Because a single instance can have multiple concurrent XHRs (the `xhr_pool`),
a per-request timeout was considered. Rejected as scope creep: the issues
specify an instance-level timeout. The value is applied to each XHR at
`send()` time.

## Consequences

### Positive

- Callers can distinguish offline vs. slow vs. cancelled on both the callback
  and Promise sides.
- Cancellation is fetch-aligned (`AbortController`), easing migration.
- Abort correctly suppresses retry and is never misreported as a disconnect.
- Signal listeners are cleaned up, avoiding leaks and stale cancellation.

### Negative

- `CALLBACK_POOLS` grows by two entries (`timeout`, `abort`); the rejection
  `type` set grows by two. Both are additive.
- More public surface: `setTimeout`/`getTimeout`, `abort`, `setSignal`/
  `getSignal`, `setOnTimeout`/`setOnAbort`, and the `timeout`/`signal`/
  `onTimeout`/`onAbort` config keys.

### Migration

- **Backward compatible.** All additions are opt-in. With no `timeout`/`signal`
  configured and no `abort()` call, behaviour is unchanged. Existing
  `connectionlost`/retry semantics are untouched.

## Implementation Order

1. **#103** — `timeout` config + dedicated `onTimeout` pool
2. **#104** — `setTimeout()` / `getTimeout()` (refactors #103 validation)
3. **#105** — `abort()` + dedicated `onAbort` pool + `_aborted` retry guard
4. **#106** — `AbortController` support, delegating to `abort()`
