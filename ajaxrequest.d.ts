/**
 * AJAXRequest.js - TypeScript Definitions
 * A lightweight JavaScript library for making AJAX requests simpler.
 *
 * @version 3.0.0
 * @license MIT
 */

// ─── Type Aliases ────────────────────────────────────────────────────────────

/**
 * Supported HTTP request methods.
 */
declare type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Names of callback pools.
 */
declare type CallbackPoolName =
    | 'servererror'
    | 'clienterror'
    | 'success'
    | 'connectionlost'
    | 'afterajax'
    | 'beforeajax'
    | 'error'
    | 'retry'
    | 'retryend'
    | 'timeout'
    | 'abort';

/**
 * Backoff strategy identifiers for retry configuration.
 */
declare type BackoffStrategy = 'fixed' | 'linear' | 'exponential';

// ─── Callback Contexts ───────────────────────────────────────────────────────

/**
 * Context available inside response callbacks (onSuccess, onClientError,
 * onServerError, afterAjax, onDisconnected).
 */
declare interface CallbackContext {
    /** The AJAXRequest instance that fired this callback. */
    AJAXRequest: AJAXRequest;
    /** HTTP status code of the response (e.g. 200, 404). */
    status: number;
    /** Raw response body as a string. */
    response: string;
    /** Parsed JSON response, or null if response is not JSON. */
    jsonResponse: object | null;
    /** Parsed XML response as a Document, or null if response is not XML. */
    xmlResponse: Document | null;
    /** Object containing response headers (key-value pairs). */
    responseHeaders: Record<string, string>;
    /** Bound properties passed via the `props` option or `bind()` method. */
    props: Record<string, any>;
}

/**
 * Context available inside beforeAjax callbacks.
 */
declare interface BeforeAjaxContext {
    /** The AJAXRequest instance. */
    AJAXRequest: AJAXRequest;
    /** Bound properties. */
    props: Record<string, any>;
}

/**
 * Context available inside onError callbacks.
 */
declare interface ErrorCallbackContext extends CallbackContext {
    /** The Error object that was thrown. */
    e: Error;
}

/**
 * Context available inside onRetry callbacks.
 */
declare interface RetryCallbackContext {
    /** Seconds remaining before next retry attempt. */
    remainingSeconds: number;
    /** Current retry attempt number (1-indexed). */
    attemptNumber: number;
    /** Total configured retry attempts. */
    maxAttempts: number;
    /** The AJAXRequest instance. */
    AJAXRequest: AJAXRequest;
    /** Bound properties. */
    props: Record<string, any>;
}

/**
 * Context available inside onRetryEnd callbacks.
 */
declare interface RetryEndCallbackContext {
    /** True if a retry attempt eventually succeeded. */
    succeeded: boolean;
    /** Total number of retry attempts made. */
    attempts: number;
    /** The AJAXRequest instance. */
    AJAXRequest: AJAXRequest;
    /** Bound properties. */
    props: Record<string, any>;
}

/**
 * Context available inside onTimeout callbacks.
 */
declare interface TimeoutCallbackContext {
    /** Status code of the timed-out request (0). */
    status: number;
    /** The AJAXRequest instance. */
    AJAXRequest: AJAXRequest;
    /** Bound properties. */
    props: Record<string, any>;
}

/**
 * Context available inside onAbort callbacks.
 */
declare interface AbortCallbackContext {
    /** Status code of the aborted request (0). */
    status: number;
    /** The AJAXRequest instance. */
    AJAXRequest: AJAXRequest;
    /** Bound properties. */
    props: Record<string, any>;
}

// ─── Callback Types ──────────────────────────────────────────────────────────

/**
 * A callback function for response events.
 */
declare type ResponseCallback = (this: CallbackContext) => void;

/**
 * A callback function for beforeAjax events.
 */
declare type BeforeAjaxCallback = (this: BeforeAjaxContext) => void;

/**
 * A callback function for error events.
 */
declare type AJAXErrorCallback = (this: ErrorCallbackContext) => void;

/**
 * A callback function for retry events.
 */
declare type RetryCallback = (this: RetryCallbackContext) => void;

/**
 * A callback function for retryEnd events.
 */
declare type RetryEndCallback = (this: RetryEndCallbackContext) => void;

/**
 * A callback function for timeout events.
 */
declare type TimeoutCallback = (this: TimeoutCallbackContext) => void;

/**
 * A callback function for abort events.
 */
declare type AbortCallback = (this: AbortCallbackContext) => void;

/**
 * Object form of a callback with configuration options.
 */
declare interface CallbackObject {
    /** Unique identifier for the callback within its pool. */
    id?: string | number;
    /**
     * Whether the callback should be executed. Can be a boolean or a function
     * that returns a boolean.
     */
    call?: boolean | (() => boolean);
    /** Extra properties accessible via `this.props` in the callback. */
    props?: Record<string, any>;
    /** The callback function to execute. */
    callback: Function;
}

/**
 * A callback parameter: either a function or an object with options.
 *
 * Note: Due to JavaScript's dynamic `this` binding in callbacks, TypeScript
 * cannot infer the callback context type automatically. Use explicit type
 * annotations if you need typed access to `this` inside callbacks:
 *
 * ```typescript
 * ajax.setOnSuccess(function (this: CallbackContext) {
 *     console.log(this.status);
 * });
 * ```
 */
declare type CallbackParam = Function | CallbackObject;

// ─── Configuration Interfaces ────────────────────────────────────────────────

/**
 * Retry configuration using the object form.
 */
declare interface RetryConfig {
    /** Number of retry attempts. 0 disables retry. */
    times: number;
    /** Base wait time in seconds between retries (>= 1). Default: 5. */
    baseWait?: number;
    /** Maximum wait cap in seconds (for exponential backoff). Default: 60. */
    maxWait?: number;
    /** Backoff strategy. Default: 'fixed'. */
    backoff?: BackoffStrategy;
    /** Whether to add ±25% randomness to the wait time. Default: false. */
    jitter?: boolean;
    /** Legacy callback for retry events (prefer setOnRetry pool). */
    func?: Function;
    /** Extra properties passed to the legacy callback. */
    props?: Record<string, any>;
}

/**
 * Configuration object for the AJAXRequest constructor.
 */
declare interface AJAXRequestConfig {
    /** Request method. Default: 'GET'. */
    method?: string;
    /** The URL that will receive the request. */
    url?: string;
    /** Base URL prepended to the URL. */
    base?: string;
    /**
     * Parameters sent with the request. Can be a query string,
     * an object, or a FormData instance.
     */
    params?: string | object | FormData;
    /** Enable or disable AJAX. Default: true. */
    enabled?: boolean;
    /** Enable verbose console logging. Default: false. */
    verbose?: boolean;
    /** Custom headers to send with the request. */
    headers?: Record<string, string>;
    /** Callbacks executed before AJAX request is sent. */
    beforeAjax?: CallbackParam | CallbackParam[];
    /** Callbacks executed on 2xx/3xx response. */
    onSuccess?: CallbackParam | CallbackParam[];
    /** Callbacks executed on 4xx response. */
    onClientErr?: CallbackParam | CallbackParam[];
    /** Callbacks executed on 5xx response. */
    onServerErr?: CallbackParam | CallbackParam[];
    /** Callbacks executed when no internet connection. */
    onDisconnected?: CallbackParam | CallbackParam[];
    /** Callbacks executed after AJAX completes (regardless of status). */
    afterAjax?: CallbackParam | CallbackParam[];
    /** Callbacks executed when an error is thrown by other callbacks. */
    onErr?: CallbackParam | CallbackParam[];
    /** Callbacks executed on each retry countdown second. */
    onRetry?: CallbackParam | CallbackParam[];
    /** Callbacks executed when retry process ends. */
    onRetryEnd?: CallbackParam | CallbackParam[];
    /** Request timeout in milliseconds. 0 (default) disables the timeout. */
    timeout?: number;
    /**
     * An AbortSignal (from an AbortController) used to cancel the request
     * externally, aligning with the fetch API pattern.
     */
    signal?: AbortSignal;
    /** Callbacks executed when the request times out. */
    onTimeout?: CallbackParam | CallbackParam[];
    /** Callbacks executed when the request is aborted via abort(). */
    onAbort?: CallbackParam | CallbackParam[];
}

/**
 * Object returned when resolving the Promise from send().
 */
declare interface AJAXResponse {
    /** HTTP status code. */
    status: number;
    /** Raw response body. */
    response: string;
    /** Parsed JSON response, or null. */
    jsonResponse: object | null;
    /** Parsed XML response as a Document, or null. */
    xmlResponse: Document | null;
    /** Response headers as key-value pairs. */
    responseHeaders: Record<string, string>;
}

/**
 * Discriminates the reason a request failed. Available on the value the
 * Promise from send() rejects with.
 */
declare type AJAXRejectionType =
    | 'clienterror'
    | 'servererror'
    | 'connectionlost'
    | 'timeout'
    | 'abort'
    | 'disabled'
    | 'beforeajax_error';

/**
 * Object the Promise from send() rejects with. For HTTP-level failures
 * (clienterror/servererror/connectionlost) it also carries the response
 * fields. For timeout/abort it carries the status (0). For 'disabled' and
 * 'beforeajax_error' only `type` (and, for the latter, `error`) is present.
 *
 * Note: TypeScript cannot type Promise rejection values, so send() is typed
 * as Promise<AJAXResponse>. Callers should treat the value caught in a
 * catch/`.catch()` as AJAXRejection.
 */
declare interface AJAXRejection {
    /** The reason the request failed. */
    type: AJAXRejectionType;
    /** HTTP status code, or 0 for timeout/abort/connectionlost. */
    status?: number;
    /** Raw response body, when available. */
    response?: string;
    /** Parsed JSON response, when available. */
    jsonResponse?: object | null;
    /** Parsed XML response as a Document, when available. */
    xmlResponse?: Document | null;
    /** Response headers, when available. */
    responseHeaders?: Record<string, string>;
    /** The thrown Error, present only when type is 'beforeajax_error'. */
    error?: Error;
}

/**
 * META information about the library.
 */
declare interface AJAXRequestMeta {
    /** Library version string. */
    readonly VERSION: string;
    /** Release date string. */
    readonly RELEASE_DATE: string;
    /** List of contributors. */
    readonly CONTRIBUTORS: ReadonlyArray<{ name: string; email: string }>;
}

/**
 * Frozen object containing backoff strategy constants.
 */
declare interface BackoffEnum {
    /** Wait a fixed number of seconds between every retry. */
    readonly FIXED: 'fixed';
    /** Wait grows linearly: baseWait * attemptNumber. */
    readonly LINEAR: 'linear';
    /** Wait doubles each attempt: baseWait * 2^(attempt-1). */
    readonly EXPONENTIAL: 'exponential';
}

// ─── Main Class ──────────────────────────────────────────────────────────────

/**
 * A class that simplifies making AJAX requests.
 */
declare class AJAXRequest {
    /**
     * Creates a new AJAXRequest instance.
     * @param config - Optional configuration object.
     */
    constructor(config?: AJAXRequestConfig);

    // ─── Static Properties ───────────────────────────────────────────────

    /** Metadata about the library (version, release date, contributors). */
    static readonly META: AJAXRequestMeta;

    /** Names of all callback pools. */
    static readonly CALLBACK_POOLS: ReadonlyArray<CallbackPoolName>;

    /** Enum of supported retry backoff strategies. */
    static readonly BACKOFF: BackoffEnum;

    // ─── Static Methods ──────────────────────────────────────────────────

    /**
     * Factory function to create an XMLHttpRequest object.
     * @returns An XMLHttpRequest instance, or false if unsupported.
     */
    static createXhr(): XMLHttpRequest | false;

    /**
     * Extracts the value of the `href` attribute from the `<base>` tag.
     * @returns The base URL string, or null if not found.
     */
    static extractBase(): string | null;

    /**
     * Checks if a given string is a valid URL.
     * @param url - The string to validate.
     * @returns True if valid URL, false otherwise.
     */
    static isValidURL(url: string): boolean;

    // ─── Instance Properties ─────────────────────────────────────────────

    /** Enable verbose console output for debugging. */
    verbose: boolean;

    // ─── Getters ─────────────────────────────────────────────────────────

    /**
     * Checks if AJAX is enabled.
     * @returns True if enabled, false if disabled.
     */
    isEnabled(): boolean;

    /**
     * Returns the base URL used for requests.
     * @returns The base URL, or null if not set.
     */
    getBase(): string | null;

    /**
     * Returns the request method.
     */
    getMethod(): HttpMethod;

    /**
     * Returns the request URL (path part).
     */
    getURL(): string;

    /**
     * Returns the full request URL (base + URL).
     */
    getRequestURL(): string;

    /**
     * Returns the request parameters.
     */
    getParams(): string | object | FormData;

    /**
     * Returns the last server response as a string.
     */
    getServerResponse(): string | null;

    /**
     * Extracts and returns the CSRF token from the DOM.
     * Checks meta tags, input elements, and window.csrfToken.
     * @returns The CSRF token string, or null/undefined if not found.
     */
    getCsrfToken(): string | null | undefined;

    /**
     * Returns the IDs of all added callbacks.
     * @param poolName - Optional pool name to filter by.
     * @returns Object with pool names as keys and ID arrays as values,
     *          or an array of IDs if poolName is specified.
     */
    getCallbacksIDs(poolName?: CallbackPoolName): Record<string, Array<string | number>> | Array<string | number>;

    /**
     * Returns information about a callback in a specific pool.
     * @param poolName - The pool to search in.
     * @param id - The callback ID.
     * @returns The callback object, or undefined if not found.
     */
    getCallBack(poolName: CallbackPoolName, id: string | number): CallbackObject | undefined;

    // ─── Setters ─────────────────────────────────────────────────────────

    /**
     * Sets the request method.
     * @param method - HTTP method (GET, POST, PUT, DELETE, HEAD, OPTIONS).
     */
    setMethod(method: string): void;

    /**
     * Sets the request URL.
     * @param url - The URL or path.
     */
    setURL(url: string): void;

    /**
     * Sets the base URL for requests.
     * @param base - The base URL string, or null to clear.
     */
    setBase(base: string | null): void;

    /**
     * Sets the request parameters/payload.
     * @param params - Query string, object, or FormData.
     */
    setParams(params: string | object | FormData): void;

    /**
     * Enables or disables AJAX.
     * @param boolean - True to enable, false to disable.
     */
    setEnabled(boolean: boolean): void;

    /**
     * Sets the request timeout in milliseconds. Parsed with parseInt; 0
     * disables the timeout. Invalid (NaN/negative) values are ignored.
     * @param timeout - Timeout in milliseconds (>= 0).
     * @returns True if updated, false if the value was invalid.
     */
    setTimeout(timeout: number): boolean;

    /**
     * Returns the current request timeout in milliseconds (0 = none).
     */
    getTimeout(): number;

    /**
     * Sets an AbortSignal used to cancel the request externally. Pass null to
     * clear. Aligns with the fetch API pattern.
     * @param signal - An AbortSignal, or null to clear.
     * @returns True if set/cleared, false if the value was not a valid signal.
     */
    setSignal(signal: AbortSignal | null): boolean;

    /**
     * Returns the currently configured AbortSignal, or null.
     */
    getSignal(): AbortSignal | null;

    /**
     * Aborts any in-progress request(s) sent by this instance: clears pending
     * retry intervals, calls XMLHttpRequest.abort(), fires the onAbort pool,
     * and rejects the associated Promise with { type: 'abort' }.
     * @returns True if at least one request was aborted, false otherwise.
     */
    abort(): boolean;

    // ─── Callback Registration ───────────────────────────────────────────

    /**
     * Adds a callback to a named pool.
     * @param callback - Function or callback object.
     * @param poolName - Target pool name.
     * @returns The callback ID, or undefined if not added.
     */
    addCallback(callback: CallbackParam, poolName: CallbackPoolName): string | number | undefined;

    /**
     * Adds a callback to the beforeAjax pool.
     * @returns The callback ID, or undefined if not added.
     */
    setBeforeAjax(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the onSuccess pool.
     * @returns The callback ID, or undefined if not added.
     */
    setOnSuccess(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the onClientError pool (4xx).
     * @returns The callback ID, or undefined if not added.
     */
    setOnClientError(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the onServerError pool (5xx).
     * @returns The callback ID, or undefined if not added.
     */
    setOnServerError(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the onDisconnected pool.
     * @returns The callback ID, or undefined if not added.
     */
    setOnDisconnected(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the onTimeout pool (fired when the request times out).
     * @returns The callback ID, or undefined if not added.
     */
    setOnTimeout(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the onAbort pool (fired when the request is aborted).
     * @returns The callback ID, or undefined if not added.
     */
    setOnAbort(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the afterAjax pool.
     * @returns The callback ID, or undefined if not added.
     */
    setAfterAjax(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the onError pool (exception handling).
     * @returns The callback ID, or undefined if not added.
     */
    setOnError(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the onRetry pool.
     * @returns The callback ID, or undefined if not added.
     */
    setOnRetry(callback: CallbackParam): string | number | undefined;

    /**
     * Adds a callback to the onRetryEnd pool.
     * @returns The callback ID, or undefined if not added.
     */
    setOnRetryEnd(callback: CallbackParam): string | number | undefined;

    // ─── Callback Management ─────────────────────────────────────────────

    /**
     * Removes a callback from a pool by ID.
     * @param poolName - The pool to remove from.
     * @param id - The callback ID.
     */
    removeCall(poolName: CallbackPoolName, id: string | number): void;

    /**
     * Enables or disables a callback in a specific pool.
     * @param poolName - The target pool.
     * @param id - The callback ID.
     * @param call - True to enable, false to disable, or a function returning boolean.
     */
    setCallEnabled(poolName: CallbackPoolName, id: string | number, call: boolean | (() => boolean)): void;

    /**
     * Enables or disables callbacks with the same ID across all pools.
     * @param id - The callback ID.
     * @param call - True to enable, false to disable, or a function returning boolean.
     */
    setCallsEnabled(id: string | number, call: boolean | (() => boolean)): void;

    /**
     * Disables all callbacks in a pool except the one with the given ID.
     * @param poolName - The target pool.
     * @param id - The callback ID to keep enabled.
     */
    disableCallExcept(poolName: CallbackPoolName, id: string | number): void;

    /**
     * Disables all callbacks in all pools except those with the given ID.
     * @param id - The callback ID to keep enabled.
     */
    disableCallsExcept(id: string | number): void;

    // ─── Headers ─────────────────────────────────────────────────────────

    /**
     * Adds a custom header to the request.
     * @param name - Header name (non-empty string).
     * @param value - Header value.
     * @returns True if added, false otherwise.
     */
    addHeader(name: string, value: string): boolean;

    // ─── Binding ─────────────────────────────────────────────────────────

    /**
     * Binds an object to callbacks, accessible via `this.props`.
     * @param obj - Object containing properties to bind.
     * @param callbackId - Optional: only bind to callbacks with this ID.
     * @param poolName - Optional: only bind to callbacks in this pool.
     */
    bind(obj: object, callbackId?: string | null, poolName?: CallbackPoolName | null): void;

    // ─── Retry ───────────────────────────────────────────────────────────

    /**
     * Configures retry behaviour on connection lost (object form).
     * @param config - Retry configuration object.
     * @returns True if configured successfully, false on invalid params.
     */
    setRetry(config: RetryConfig): boolean;

    /**
     * Configures retry behaviour on connection lost (legacy positional form).
     * @param times - Number of retry attempts.
     * @param timeBetweenEachTryInSeconds - Seconds between retries.
     * @param func - Callback executed on each retry tick.
     * @param props - Extra properties passed to the callback.
     * @returns True if configured successfully, false on invalid params.
     */
    setRetry(times: number, timeBetweenEachTryInSeconds: number, func: Function, props?: object): boolean;

    // ─── Send ────────────────────────────────────────────────────────────

    /**
     * Sends the AJAX request.
     * @returns A Promise that resolves with an {@link AJAXResponse} on 2xx/3xx.
     * On failure it rejects with an {@link AJAXRejection} (4xx/5xx, connection
     * lost, timeout, abort, disabled, or a beforeAjax error).
     */
    send(): Promise<AJAXResponse>;

    // ─── Deprecated ──────────────────────────────────────────────────────

    /**
     * @deprecated Use setMethod() instead.
     */
    setReqMethod(method: string): void;

    /**
     * @deprecated Use getMethod() instead.
     */
    getReqMethod(): HttpMethod;

    // ─── Internal (not typically used directly) ──────────────────────────

    /** Logs a message to the console (only if verbose is enabled). */
    log(message: string, type?: string, force?: boolean): void;

    /** Parses and stores the server response. */
    setResponse(response: string): void;

    /** Returns the parsed JSON response or null. */
    responseAsJSON(): object | null;

    /** Returns true if any XHR in the pool has not received a response. */
    hasNonReceivedRequest(): boolean;
}

/** Global AJAXRequest instance available when using UMD/script tag. */
declare const ajax: AJAXRequest;
