/// <reference path="../../ajaxrequest.d.ts" />

// Type-level smoke test for the AJAXRequest declarations. Not executed at
// runtime; compiled with `tsc --noEmit` to validate the public API surface.

// Config with the new fields.
const controller = new AbortController();
const req = new AJAXRequest({
    method: 'GET',
    url: 'https://example.com/api',
    timeout: 5000,
    signal: controller.signal,
    onTimeout: function (this: TimeoutCallbackContext) {
        console.log(this.status, this.AJAXRequest);
    },
    onAbort: function (this: AbortCallbackContext) {
        console.log(this.status);
    },
    onSuccess: function (this: CallbackContext) {
        const doc: Document | null = this.xmlResponse;
        console.log(doc, this.jsonResponse, this.responseHeaders);
    }
});

// New instance methods.
const okTimeout: boolean = req.setTimeout(3000);
const currentTimeout: number = req.getTimeout();
const okSignal: boolean = req.setSignal(controller.signal);
const cleared: boolean = req.setSignal(null);
const sig: AbortSignal | null = req.getSignal();
const aborted: boolean = req.abort();

// New callback registration.
const tId = req.setOnTimeout(function () {});
const aId = req.setOnAbort(function () {});

// Pool name union accepts the new pools.
const poolT: CallbackPoolName = 'timeout';
const poolA: CallbackPoolName = 'abort';

// send() resolves with AJAXResponse; rejection value treated as AJAXRejection.
req.send()
    .then((res: AJAXResponse) => {
        const s: number = res.status;
        console.log(s);
    })
    .catch((err: AJAXRejection) => {
        if (err.type === 'timeout' || err.type === 'abort') {
            console.log('cancelled/timed out', err.status);
        }
    });

// Reference the values so noUnusedLocals (if enabled) stays quiet.
console.log(okTimeout, currentTimeout, okSignal, cleared, sig, aborted, tId, aId, poolT, poolA);
