# Async/Await Example

Demonstrates the Promise-based API added in v3: awaiting `ajax.send()` inside an
`async` function and handling outcomes with `try/catch`.

It shows:

- `await ajax.send()` resolving with the response on a 2xx/3xx status.
- Branching on the rejection `type` in `catch` — including the v3
  `timeout` and `abort` outcomes.
- Configuring a `timeout` and passing an `AbortController` `signal`, plus
  cancelling with `controller.abort()` / `req.abort()`.

## Files

- `asyncAwait.html` — minimal page that loads the v3 UMD build and the script.
- `asyncAwait.js` — the annotated example.

## Running

Open `asyncAwait.html` in a browser (ideally served over a local HTTP server so
the CDN script and CORS behave as expected).
