# ADR-0012: Remove Top-Level `ajax` Global from Module Builds

**Date:** 2026-09-08
**Status:** Accepted

## Context

`AJAXRequest.js` ends with a top-level statement:

```javascript
const ajax = new AJAXRequest();
```

This was introduced in the v2 era to support the CDN / `<script>` tag use case,
where a user includes the library from jsDelivr and immediately has a ready-made
`window.ajax` instance available without writing any setup code:

```html
<script src="https://cdn.jsdelivr.net/gh/usernane/AJAXRequestJs@2.x.x/AJAXRequest.js"></script>
<script>
  ajax.setURL('https://api.example.com/data');
  ajax.send();
</script>
```

v3 introduced rollup-based CJS, ESM, and UMD module builds (ADR-0003) and
published the package to npm. This creates a conflict: `new AJAXRequest()`
calls `AJAXRequest.createXhr()` which calls `new XMLHttpRequest()`. In a
Node.js process, a Next.js SSR render, or any non-browser environment,
`XMLHttpRequest` is not defined and the import throws at module-load time:

```
ReferenceError: XMLHttpRequest is not defined
    at Function.createXhr (dist/ajaxrequest.cjs.js:48)
    at new AJAXRequest (dist/ajaxrequest.cjs.js:2334)
    at Object.<anonymous> (dist/ajaxrequest.cjs.js:2428)
```

Both the CJS (`require('ajaxrequest-helper')`) and ESM
(`import ... from 'ajaxrequest-helper'`) builds were affected, making the npm
package entirely unusable in Node / SSR contexts (#126).

## Decision

Remove the top-level `const ajax = new AJAXRequest()` statement from
`AJAXRequest.js` (the source that feeds the rollup builds).

Retain the statement in the two legacy hand-maintained CDN files —
`dist/AJAXRequest.js` and `dist/AJAXRequest.min.js` — because those files are
exclusively served via the jsDelivr `gh/` CDN to browser `<script>` tag
consumers who depend on `window.ajax` being present.

The split is appropriate because the two audiences are distinct:

| Consumer | Entry point | Needs `ajax` global? |
|---|---|---|
| `<script>` tag / jsDelivr CDN | `dist/AJAXRequest(.min).js` | Yes — kept |
| npm / CJS `require()` | `dist/ajaxrequest.cjs.js` | No — removed |
| npm / ESM `import` | `dist/ajaxrequest.esm.js` | No — removed |
| npm / UMD `<script>` or bundler | `dist/ajaxrequest.umd.js` | No — removed |

npm / module consumers instantiate the library themselves:

```javascript
const AJAXRequest = require('ajaxrequest-helper');
const ajax = new AJAXRequest({ url: '...', method: 'GET' });
```

## Alternatives Considered

### A. Guard with `typeof XMLHttpRequest !== 'undefined'`

```javascript
const ajax = (typeof XMLHttpRequest !== 'undefined') ? new AJAXRequest() : null;
```

Rejected: `ajax` would silently be `null` in Node. Any code that calls
`ajax.setURL(...)` would throw a `TypeError: Cannot read properties of null`
with no clear indication of the root cause. Failing loudly at instantiation
time (the developer's responsibility) is better than failing silently at
call time.

### B. Lazy initialisation via a getter

Define `ajax` as a getter on `globalThis` that creates the instance on first
access, skipping creation if `XMLHttpRequest` is absent.

Rejected: adds complexity for a global that module consumers never use.
The correct solution for module consumers is explicit instantiation.

### C. Keep the global in UMD as well

UMD bundles run in both browser and Node environments. Keeping `ajax` in the
UMD build means it would still throw in Node when loaded as a CommonJS fallback.
UMD is a module format first; the `dist/AJAXRequest.js` legacy file already
serves the browser-global use case without module overhead.

### D. Remove from legacy CDN files too

Rejected: the CDN files are explicitly for `<script>` tag consumers, and
removing `ajax` would be a breaking change for existing v2 CDN users without
any benefit to them.

## Consequences

### Positive

- `require('ajaxrequest-helper')` and `import ... from 'ajaxrequest-helper'`
  no longer throw in Node, SSR, or any non-browser environment.
- The npm package becomes usable in server-side contexts.
- No side effects at module load time — module consumers only pay for what
  they instantiate.
- Aligns with the pattern used by every major HTTP library (axios, got, ky).

### Negative

- Any npm consumer who was relying on a side-effect global `ajax`
  (e.g. `window.ajax` after `require()`-ing) will need to instantiate
  explicitly. This is an unlikely pattern but is a breaking change in theory.
- The `ajax` global is no longer available in the UMD build when loaded via
  a `<script>` tag. Users of the UMD CDN path should switch to the legacy
  `dist/AJAXRequest.js` URL or instantiate manually.

### Migration

CDN / script-tag consumers: **no change** — `dist/AJAXRequest.js` retains
the `ajax` global.

npm consumers who used the implicit global: replace with explicit
instantiation:

```javascript
// Before (relied on side effect)
const AJAXRequest = require('ajaxrequest-helper');
ajax.setURL('...');  // relied on window.ajax side-effect

// After
const AJAXRequest = require('ajaxrequest-helper');
const ajax = new AJAXRequest();
ajax.setURL('...');
```
