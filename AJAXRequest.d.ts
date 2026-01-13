// 1. Helper Types
type CallbackFunction = (response?: any, ...args: any[]) => void;

interface CallbackObject {
    callback: CallbackFunction;
    id?: string;
    call?: boolean | (() => boolean);
    props?: Record<string, any>;
}

// 2. Config Interface
export interface AJAXRequestConfig {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS";
    url?: string;
    base?: string;
    params?: string | object | FormData;
    headers?: Record<string, string>;
    verbose?: boolean;
    enabled?: boolean;

    // Callbacks can be a function, an object, or an array
    beforeAjax?:
        | CallbackFunction
        | CallbackObject
        | (CallbackFunction | CallbackObject)[];
    onSuccess?:
        | CallbackFunction
        | CallbackObject
        | (CallbackFunction | CallbackObject)[];
    onClientErr?:
        | CallbackFunction
        | CallbackObject
        | (CallbackFunction | CallbackObject)[];
    onServerErr?:
        | CallbackFunction
        | CallbackObject
        | (CallbackFunction | CallbackObject)[];
    onDisconnected?:
        | CallbackFunction
        | CallbackObject
        | (CallbackFunction | CallbackObject)[];
    afterAjax?:
        | CallbackFunction
        | CallbackObject
        | (CallbackFunction | CallbackObject)[];
    onErr?:
        | CallbackFunction
        | CallbackObject
        | (CallbackFunction | CallbackObject)[];
}

// 3. Main Class Definition
export declare class AJAXRequest {
    // --- STATIC PROPERTIES & METHODS ---
    static META: {
        readonly VERSION: string;
        readonly REALSE_DATE: string;
        readonly CONTRIBUTORS: Array<{ name: string; email: string }>;
    };
    static CALLBACK_POOLS: string[];
    static XMLHttpFactories: Array<() => XMLHttpRequest | any>;

    static createXhr(): XMLHttpRequest | false;
    static extractBase(): string | null;
    static isValidURL(url: string): boolean;

    // --- INSTANCE PROPERTIES ---
    customHeaders: Record<string, string>;
    extras: Record<string, any>;
    method: string;
    bindParams: any[];
    url: string;
    base: string | null;
    params: string | object | FormData;
    enabled: boolean;
    serverResponse: string | null;
    verbose: boolean;

    // Exposed internal pools
    xhr_pool: XMLHttpRequest[];

    // Retry configuration object
    retry: {
        times: number;
        passed: number;
        wait: number;
        pass_number: number;
        func: CallbackFunction;
        props: object;
    };

    // --- CONSTRUCTOR ---
    constructor(config?: AJAXRequestConfig);

    // --- INSTANCE METHODS ---

    // Status
    isEnabled(): boolean;
    setEnabled(enabled: boolean): void;

    // URL & Params
    setURL(url: string): void;
    getURL(): string;
    setBase(base: string | null): void;
    getBase(): string | null;
    getRequestURL(): string;
    setParams(params: string | object | FormData): void;
    getParams(): string | object | FormData;

    // Methods
    setMethod(method: string): void;
    getMethod(): string;
    /** @deprecated since version 2.0.0 */
    setReqMethod(method: string): void;
    /** @deprecated since version 2.0.0 */
    getReqMethod(): string;

    // Headers & Tokens
    addHeader(name: string, value: string): boolean;
    getCsrfToken(): string | null;

    // Execution
    send(): boolean;

    // Responses
    setResponse(response: string): void;
    getServerResponse(): string | null;
    responseAsJSON(): any | undefined;

    // Callback Management
    addCallback(
        callback: CallbackFunction | CallbackObject,
        poolName: string
    ): string | undefined;
    removeCall(poolName: string, id: string): void;
    getCallbacksIDs(poolName?: string): string[] | Record<string, string[]>;
    getCallBack(poolName: string, id: string): any;

    // Enabling/Disabling Callbacks
    disableCallsExcept(id: string, call: boolean): void;
    disableCallExcept(poolName: string, id?: string): void;
    setCallsEnabled(id: string, call: boolean | (() => boolean)): void;
    setCallEnabled(poolName: string, id: string, call: boolean): void;

    // Binding
    bind(
        obj: object,
        callbackId?: string | null,
        poolName?: string | null
    ): void;

    // Helper Setters
    setBeforeAjax(
        callback: CallbackFunction | CallbackObject
    ): string | undefined;
    setOnSuccess(
        callback: CallbackFunction | CallbackObject
    ): string | undefined;
    setOnClientError(
        callback: CallbackFunction | CallbackObject,
        call?: boolean
    ): string | undefined;
    setOnServerError(
        callback: CallbackFunction | CallbackObject
    ): string | undefined;
    setOnDisconnected(
        callback: CallbackFunction | CallbackObject
    ): string | undefined;
    setAfterAjax(
        callback: CallbackFunction | CallbackObject
    ): string | undefined;
    setOnError(callback: CallbackFunction | CallbackObject): string | undefined;

    // Utilities / Internals
    log(
        message: string,
        type?: "info" | "warning" | "error" | "",
        force?: boolean
    ): void;
    setRetry(
        times: number,
        timeBetweenEachTryInSeconds: number,
        func: CallbackFunction,
        props?: object
    ): boolean;
    getNonSendXhr(): XMLHttpRequest | undefined;
    hasNonReceivedRequest(): boolean;

    // Instance Event Handlers
    onload: () => void;
    onprogress: (e: ProgressEvent) => void;
}

declare const ajax: AJAXRequest;
export default ajax;
