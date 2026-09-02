// Async/await example for AJAXRequest.js (v3+).
//
// Since v3, AJAXRequest.send() returns a Promise, so requests can be awaited
// inside an async function. The Promise:
//   - resolves with the response ({ status, response, jsonResponse,
//     xmlResponse, responseHeaders }) on a 2xx/3xx status, and
//   - rejects with an object carrying a `type` discriminator on failure.
//
// Rejection `type` values:
//   'clienterror'      -> 4xx response
//   'servererror'      -> 5xx response
//   'connectionlost'   -> no internet connection
//   'timeout'          -> request exceeded the configured timeout
//   'abort'            -> request was cancelled via abort() / AbortController
//   'disabled'         -> AJAX was disabled before sending
//   'beforeajax_error' -> a beforeAjax callback threw

// A controller lets us cancel the request from anywhere (fetch-style).
const controller = new AbortController();

// Create the request. `timeout` and `signal` are v3 features.
const req = new AJAXRequest({
    method: 'GET',
    url: 'https://api.github.com/repos/usernane/AJAXRequestJs',
    timeout: 8000,            // reject with { type: 'timeout' } after 8s
    signal: controller.signal // controller.abort() -> { type: 'abort' }
});

// Wire the button (see asyncAwait.html) to this handler.
async function loadRepo() {
    const output = document.getElementById('output');
    output.textContent = 'Loading...';

    try {
        // Await the Promise returned by send().
        const res = await req.send();

        // Resolved: we have a 2xx/3xx response.
        if (res.jsonResponse) {
            const repo = res.jsonResponse;
            output.textContent =
                repo.full_name + ' — ★ ' + repo.stargazers_count +
                ' (status ' + res.status + ')';
        } else {
            output.textContent = 'Received (status ' + res.status + '): ' + res.response;
        }
    } catch (err) {
        // Rejected: branch on the discriminating `type`.
        switch (err.type) {
            case 'timeout':
                output.textContent = 'The request timed out. Please try again.';
                break;
            case 'abort':
                output.textContent = 'The request was cancelled.';
                break;
            case 'connectionlost':
                output.textContent = 'No internet connection.';
                break;
            case 'clienterror':
                output.textContent = 'Client error (' + err.status + ').';
                break;
            case 'servererror':
                output.textContent = 'Server error (' + err.status + ').';
                break;
            default:
                output.textContent = 'Request failed: ' + err.type;
        }
    }
}

// Cancel an in-flight request.
function cancelRepo() {
    // Either call the controller...
    controller.abort();
    // ...or call req.abort() directly — both settle the awaited Promise
    // with { type: 'abort' }.
}
