
"use strict";

Object.defineProperties(AJAXRequest, {
    META: {
        writable: false,
        value: {}
    },
    CALLBACK_POOLS: {
        /**
        * Names of pools of events.
        * @type Array
        */
        value: ['servererror', 'clienterror', 'success', 'connectionlost', 'afterajax', 'beforeajax', 'error'],
        writable: false
    },
    XMLHttpFactories: {
        /**
        * Array of functions used to create XMLHttpRequest object.
        * @type Array
        */
        value: [
            function () { return new XMLHttpRequest(); },
            function () { return new ActiveXObject("Microsoft.XMLHTTP"); },
            function () { return new ActiveXObject("MSXML2.XMLHTTP.3.0"); }
        ],
        writable: false
    },
    createXhr: {
        /**
        * A factory function used to create XHR object for diffrent browsers.
        * @returns {Mixed} False in case of failure. Other than that, it will 
        * return XHR object that can be used to send AJAX.
        */
        value: function createXhr() {
            for (var i = 0; i < AJAXRequest.XMLHttpFactories.length; i++) {
                try {
                    var instance = AJAXRequest.XMLHttpFactories[i]();
                    instance.active = false;
                    return instance;
                }
                catch (e) {

                }
            }
            return false;
        },
        wriable: false
    },
    extractBase: {
        /**
         * Extract the value of the attribute 'href' of the 'base' tag.
         * 
         * @returns {String|null} If the tag 'base' and the attribute 'base' is set,
         * the method will return its value. Other than that, the method will return
         * null.
         */
        value: function () {
            var base = null;
            var baseTagsArr = document.getElementsByTagName('base');

            if (baseTagsArr.length === 1) {
                var baseTag = baseTagsArr[0];
                base = baseTag.getAttribute('href');

                if (base !== null && base.length === 0) {
                    base = null;
                }
            }
            return base;
        }
    },
    isValidURL: {
        /**
         * Checks if given string represents a valid URL or not.
         * 
         * @param {String} url The string that will be validated.
         * 
         * @returns {Boolean} If the given string is a valid URL, the method will return true.
         * Other than that, the method will return false.
         */
        value: function (url) {
            var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.=~+!]*)*' + // port and path
                '(\\?[;&a-z\\d%_.~+=/-]*)?' + // query string
                '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
            return !!pattern.test(url);
        }
    }
});

Object.defineProperties(AJAXRequest.META, {
    VERSION: {
        value: '2.1.9',
        writable: false
    },
    REALSE_DATE: {
        value: '2023-07-19',
        writable: false
    },
    CONTRIBUTORS: {
        value: [
            {
                name: 'Ibrahim Ali BinAlshikh',
                email: 'ibinshikh@hotmail.com'
            },
            {
                name: 'Ibrahim Beladi',
                email: ''
            }
        ],
        writable: false
    }
});
/**
 * A class that can be used to simplfy AJAX requests.
 * @author Ibrahim BinAlshikh <ibinshikh@hotmail.com>
 * @constructor
 * @param {Object} config AJAX configuration. The object can have the 
 * following properties:
 * <ul>
 * <li><b>method</b>: Request method such as GET or POST.</li>
 * <li><b>url</b>: The URL at which AJAX request will be sent 
 * to.</li>
 * <li><b>params</b>: A parameters which will be sent with the request. 
 * It can be an object, a FormData or a query string.</li>
 * <li><b>verbose</b>:A boolean Used for development. If set to true, more 
 * informative messages will appear in the console.</li>
 * <li><b>headers</b>: An object that can hold custom headers that will be 
 * sent with the request.</li>
 * <li><b>enabled</b>: A boolean to enable or disable AJAX.</li>
 * <li><b>beforeAjax</b>: An array that contains one or more callbacks which 
 * will be executed before AJAX request is sent. The callbacks can 
 * be used to collect user inputs and do final configuration before sending 
 * the request to the server.</li>
 * <li><b>onSuccess</b>: An array that contains one or more callbacks which 
 * will be executed when server sends the response code 2xx.</li>
 * <li><b>onClientErr</b>: An array that contains one or more callbacks which 
 * will be executed when server sends the response code 4xx.</li>
 * <li><b>onServerErr</b>: An array that contains one or more callbacks which 
 * will be executed when server sends the response code 5xx.</li>
 * <li><b>onDisconnected</b>: An array that contains one or more callbacks which 
 * will be executed when there is no internet connection.</li>
 * <li><b>afterAjax</b>: An array that contains one or more callbacks which 
 * will be executed after AJAX request is finishhed regrardless of status code.</li>
 * </ul>
 * @returns {AJAXRequest}
 */
function AJAXRequest(config = {
    method: 'get',
    url: '',
    'verbose': false,
    enabled: true,
    beforeAjax: [],
    onSuccess: [],
    onClientErr: [],
    onServerErr: [],
    onDisconnected: [],
    afterAjax: [],
    onErr: [],
    headers: {}
}) {
    /**
     * Any custom headers that will be sent with the request.
     */
    this.customHeaders = {};
    this.extras = {};
    /**
     * Request method.
     */
    this.method = 'GET';
    /**
     * An array that holds objects which will be binded with callbacks.
     */
    this.bindParams = [];
    /**
     * The URL of AJAX request
     */
    this.url = '';
    /**
     * The base URL which is used to send requests.
     */
    this.base = null;
    /**
     * Any parameters to send with the request.
     */
    this.params = '';
    /**
     * Enable or disable AJAX. used to ristrict access.
     */
    this.enabled = true;
    /**
     * Server response after processing the request.
     */
    this.serverResponse = null;
    /**
     * A callback function to call in case of file upload is completed. 
     * Similar to onreadystatechange.
     * @returns {undefined}
     */
    this.onload = function () { };
    this.onprogress = function (e) {

        if (e.lengthComputable) {
            var percentComplete = (e.loaded / e.total) * 100;
            console.info('AJAXRequest: Uploaded ' + percentComplete + '%');
        } else {
            console.info('AJAXRequest: Not lengthComputable!');
        }
    };
    /**
     * A pool of functions to call in case of internet connection lost.
     */
    this.onconnectionlostpool = [
        {
            id: '0',
            call: true,
            pool:'connectionlost',
            func: function () {
                console.info('AJAXRequest: Connection lost. Status: ' + this.status);
            }
        }
    ];
    /**
     * A pool of functions to call before ajax request is sent.
     */
    this.onbeforeajaxpool = [
        {
            id: '0',
            call: true,
            pool:'beforeajax',
            func: function () {
                console.info('AJAXRequest: Executing Before AJAX callbacks.');
            }
        }
    ];
    /**
     * A pool of functions to call after ajax has finished with regards of the 
     * final state.
     */
    this.onafterajaxpool = [
        {
            id: '0',
            call: true,
            pool:'afterajax',
            func: function () {
                console.info('AJAXRequest: After AJAX ' + this.status);
            }
        }
    ];
    /**
     * A pool of functions to call in case one of the functions in the 
     * instance thrown an exception.
     */
    this.onerrorpool = [
        {
            id: '0',
            call: true,
            pool:'error',
            func: function () {
                console.info('AJAXRequest: Error in one of the callbacks.');
            }
        }
    ];
    /**
     * A pool of functions to call in case of successful request.
     */
    this.onsuccesspool = [
        {
            id: '0',
            call: true,
            pool:'success',
            func: function () {
                console.info('AJAXRequest: Success ' + this.status);
            }
        }
    ];
    /**
     * A pool of functions to call in case of server error.
     */
    this.onservererrorpool = [
        {
            id: '0',
            call: true,
            pool:'ervererror',
            func: function () {
                console.info('AJAXRequest: Server Error ' + this.status);
            }
        }
    ];
    /**
     * A pool of functions to call in case of client error.
     */
    this.onclienterrorpool = [
        {
            id: '0',
            call: true,
            pool:'clienterror',
            func: function () {
                console.info('AJAXRequest: Client Error ' + this.status);
            }
        }
    ];
    this.retry = {
        times:3,
        passed:0,
        wait:5,
        pass_number:0,
        func: function () {
            
        }
    },
    Object.defineProperty(this, 'onreadystatechange', {
        value: function () {
            if (this.readyState === 0) {
                this.log('AJAXRequest: Ready State = 0 (UNSENT)', 'info');
            } else if (this.readyState === 1) {
                this.log('AJAXRequest: Ready State = 1 (OPENED)', 'info');
            } else if (this.readyState === 2) {
                this.log('AJAXRequest: Ready State = 2 (HEADERS_RECEIVED)', 'info');
            } else if (this.readyState === 3) {
                this.log('AJAXRequest: Ready State = 3 (LOADING)', 'info');
            } else if (this.readyState === 4 && this.status === 0) {
                this.log('AJAXRequest: Ready State = 4 (DONE)', 'info');
                
                if (this.retry.times !== 0 && this.retry.pass_number < this.retry.times) {
                    this.log('AJAXRequest: Retry after '+this.retry.wait+' seconds...', 'info');
                    var i = this;
                    this.retry.id = setInterval(function () {
                        
                        i.retry.passed++;
                        i.retry.func(i.retry.wait - i.retry.passed, i.retry.pass_number);
                        if (i.retry.passed === i.retry.wait) {
                            clearInterval(i.retry.id);
                            i.retry.passed = 0;
                            i.retry.pass_number++;
                            i.AJAXRequest.send();
                        }
                    }, 1000);
                } else {
                    this.retry.pass_number = 0;
                    setProbsAfterAjax(this, 'connectionlost');
                }
            } else if (this.readyState === 4 && this.status >= 200 && this.status < 300) {
                this.log('AJAXRequest: Ready State = 4 (DONE).', 'info');
                setProbsAfterAjax(this, 'success');
            } else if (this.readyState === 4 && this.status >= 400 && this.status < 500) {
                this.log('AJAXRequest: Ready State = 4 (DONE).', 'info');
                setProbsAfterAjax(this, 'clienterror');
            } else if (this.readyState === 4 && this.status >= 300 && this.status < 400) {
                this.log('AJAXRequest: Ready State = 4 (DONE).', 'info');
                this.log('Redirect', 'info', true);
                setProbsAfterAjax(this, 'success');
            } else if (this.readyState === 4 && this.status >= 500 && this.status < 600) {
                this.log('AJAXRequest: Ready State = 4 (DONE).', 'info');
                setProbsAfterAjax(this, 'servererror');
            } else if (this.readyState === 4) {
                this.active = false;
                this.log('Status: ' + this.status, 'info');
            }
        },
        writable: false,
        enumerable: false
    });
    function canCall(funcObj) {
        var canCall = funcObj.call === true;
        var type = typeof funcObj.call;

        if (type === 'function') {
            canCall = funcObj.call();
        }
        return canCall;
    }
    function bindParams(funcObj, ajaxRequest) {
        var bindObj = {};
        for (var x = 0 ; x < ajaxRequest.bindParams.length ; x++) {
            var objProps = ajaxRequest.bindParams[x];
            
            if (objProps.pools.indexOf(funcObj.pool) !== -1) {
                var keys = Object.keys(objProps.params);
                for (var y = 0 ; y < keys.length ; y++) {
                    bindObj[keys[y]] = objProps.params[keys[y]];
                }
            }
        }
        funcObj.props = bindObj;
    }
    function callOnErr(inst, jsonResponse, headers, e) {
        inst.log('AJAXRequest: An error occurred while executing the callback at "' + e.fileName + '" line ' + e.lineNumber + '. Check Below for more details.', 'error', true);
        inst.log(e, 'error', true);

        for (var i = 0; i < inst.onerrorpool.length; i++) {
            try {
                bindParams(inst.onerrorpool[i], inst);
                if (canCall(inst.onerrorpool[i])) {
                    inst.log('AJAXRequest: Callback ' + inst.onerrorpool[i].id + ' is enabled.', 'info');
                    inst.onerrorpool[i].AJAXRequest = inst;
                    inst.onerrorpool[i].e = e;
                    inst.onerrorpool[i].status = inst.status;
                    inst.onerrorpool[i].response = inst.responseText;
                    inst.onerrorpool[i].xmlResponse = inst.responseXML;
                    inst.onerrorpool[i].jsonResponse = jsonResponse;
                    inst.onerrorpool[i].responseHeaders = headers;
                    
                    inst.onerrorpool[i].func();
                } else {
                    inst.log('AJAXRequest: Callback "' + inst.onerrorpool[i].id + '" is disabled.', 'warning');
                }
            } catch (e) {
                inst.log('AJAXRequest: An error occurred while executing the callback at "' + e.fileName + '" line ' + e.lineNumber + '. Check Below for more details.', 'error', true);
                inst.log(e, 'error', true);
            }
        }
    }
    function setProbsAfterAjax(xhr, pool_name) {
        //xhr is of type XMLHTTPRequest
        xhr.received = true;
        var headers = getResponseHeadersObj(xhr);
        var p = 'on' + pool_name + 'pool';
        try {
            var jsonResponse = JSON.parse(xhr.responseText);
        } catch (e) {
            xhr.log('AJAXRequest: Unable to convert response into JSON object.', 'warning', true);
            xhr.log('AJAXRequest: "jsonResponse" is set to \'null\'.', 'warning', true);
            var jsonResponse = null;
        }
        for (var i = 0; i < xhr[p].length; i++) {
            xhr[p][i].url = xhr.url;
            xhr[p][i].base = xhr.base;
            xhr[p][i].requestUrl = xhr.requestUrl;
            xhr[p][i].status = xhr.status;
            xhr[p][i].response = xhr.responseText;
            xhr[p][i].xmlResponse = xhr.responseXML;
            xhr[p][i].jsonResponse = jsonResponse;
            xhr[p][i].responseHeaders = getResponseHeadersObj(xhr);

            try {
                bindParams(xhr[p][i], xhr.AJAXRequest);
                if (canCall(xhr[p][i])) {
                    xhr.log('AJAXRequest: Callback "' + xhr[p][i].id + '" is enabled.', 'info');
                    xhr[p][i].func();
                } else {
                    xhr.log('AJAXRequest: Callback "' + xhr[p][i].id + '" is disabled.', 'warning');
                }
            } catch (e) {
                callOnErr(xhr, jsonResponse, headers, e);
            }


        }
        for (var i = 0; i < xhr.onafterajaxpool.length; i++) {
            xhr.onafterajaxpool[i].status = xhr.status;
            xhr.onafterajaxpool[i].response = xhr.responseText;
            xhr.onafterajaxpool[i].xmlResponse = xhr.responseXML;
            xhr.onafterajaxpool[i].jsonResponse = jsonResponse;
            xhr.onafterajaxpool[i].responseHeaders = headers;

            try {
                bindParams(xhr.onafterajaxpool[i], xhr.AJAXRequest);
                if (canCall(xhr.onafterajaxpool[i])) {
                    xhr.log('AJAXRequest: Callback "' + xhr.onafterajaxpool[i].id + '" is enabled.', 'info');
                    
                    xhr.onafterajaxpool[i].func();
                } else {
                    xhr.log('AJAXRequest: Callback "' + xhr.onafterajaxpool[i].id + '" is disabled.', 'warning');
                }
            } catch (e) {
                callOnErr(xhr, jsonResponse, headers, e);
            }
        }
        xhr.active = false;
        xhr.log('AJAXRequest: Finished AJAX Request.', 'info');
    }
    /**
     * This function will extract response headers from the response.
     * @returns {Object} The function will return response headers as an object. 
     * The keys of the object are headers names and the values are headers values.
     * @param {Object} xhr The XMLHttpRequest object that the headers will be 
     * extracted from.
     */
    function getResponseHeadersObj(xhr) {
        var retVal = {};
        var headersArr = xhr.getAllResponseHeaders().split("\r\n");
        for (var x = 0; x < headersArr.length; x++) {
            var fullHeader = headersArr[x];
            var key = fullHeader.substring(0, fullHeader.indexOf(':'));
            if (key.length > 0) {
                retVal[key] = fullHeader.substring(fullHeader.indexOf(':') + 1).trim();
            }
        }
        return retVal;
    }
    /**
     * A utility function used to show warning in the console about the existance 
     * of events pool.
     * @param {String} p_name The name of the pool.
     * @returns {undefined}
     */
    function noSuchPool(p_name) {
        console.warn('No such bool: ' + p_name);
        var pools = '';
        for (var x = 0; x < AJAXRequest.CALLBACK_POOLS.length; x++) {
            if (x === AJAXRequest.CALLBACK_POOLS.length - 1) {
                pools += ' or ' + AJAXRequest.CALLBACK_POOLS[x];
            } else {
                if (x === AJAXRequest.CALLBACK_POOLS.length - 2) {
                    pools += AJAXRequest.CALLBACK_POOLS[x];
                } else {
                    pools += AJAXRequest.CALLBACK_POOLS[x] + ', ';
                }
            }
        }
        console.info('Pool name must be one of the following: ' + pools);
    }
    Object.defineProperties(this, {
        isEnabled: {
            /**
            * Checks if AJAX is enabled or disabled.
            * @returns {Boolean} True if enabled and false if disabled.
            */
            value: function () {
                return this.enabled;
            },
            writable: false,
            enumerable: true
        },
        getCallbacksIDs: {
            /**
             * Returns the IDs of all added callbacks.
             * 
             * @param {String} poolName If specified, only the IDs of callbacks in the selected pool will be
             * returned.
             * 
             * @returns {Object|Array} If the pool name is not provided, the method will return an object. The
             * properties of the object are pools names and the value of each property is an array that
             * contains the IDs of callbacks in the pool. If pool name is given, the method will return an
             * array that contains the IDs of callbacks in the specified pool.
             */
            value: function (poolName = null) {
                var retVal = {};

                if (AJAXRequest.CALLBACK_POOLS.indexOf(poolName) !== -1) {
                    retVal = [];

                    var p = 'on' + poolName + 'pool';
                    for (var y = 0; y < this[p].length; y++) {
                        retVal.push(this[p][y].id);
                    }

                    return retVal;
                } else if (poolName === null) {
                    for (var x = 0; x < AJAXRequest.CALLBACK_POOLS.length; x++) {
                        var poolName = AJAXRequest.CALLBACK_POOLS[x];
                        if (retVal[poolName] === undefined) {
                            retVal[poolName] = [];
                        }
                        var p = 'on' + poolName + 'pool';

                        for (var y = 0; y < this[p].length; y++) {
                            retVal[poolName].push(this[p][y].id);
                        }
                    }
                }


                return retVal;
            },
            writable: false,
            enumerable: true
        },
        getBase: {
            /**
             * Returns the value of the base URL which is used to send AJAX requests.
             * 
             * @returns {String|null} If the base is set, the method will return its value.
             * If not, the method will return the value of the attribute 'href' of the 
             * 'base' tag. Other than that, null is returned.
             */
            value: function () {
                return this.base;
            },
            writable: false,
            enumerable: true
        },
        bind: {
            /**
             * Binds a variable to a callback.
             * 
             * Note that this method will override any existing bindings and bind with the
             * new provided object.
             * 
             * @param {Object} obj An object that contains the variables that will be binded.
             * 
             * @param {String|null} callbackId Optional callback ID. If Specified, the variable will
             * only binded with callbacks having provided ID.
             * 
             * @param {String|null} poolName An optional pool name. If specified, the variable will
             * only be binded to the callbacks in the given pool. Possible values for the parameter
             * must be taken from the array AJAXRequest.CALLBACK_POOLS.
             * 
             * @returns {undefined}
             */
            value: function (obj, callbackId = null, poolName = null) {
                if (obj === null || obj === undefined || typeof obj !== 'object') {
                    this.log('AJAXRequest.bind: Provided object is invalid.', 'warning');
                    return;
                }

                this.log('AJAXRequest.bind: Callback ID = "' + callbackId + '"', 'info');
                this.log('AJAXRequest.bind: Pool = "' + poolName + '"', 'info');
                var applicablePools = [];
                
                if (callbackId === null || callbackId === undefined) {
                    this.log('AJAXRequest.bind: The binding will be for all callbacks.', 'warning');
                    var cId = 'ALL';
                } else {
                    var cId = callbackId + '';
                    this.log('AJAXRequest.bind: The binding will be for callbacks with given ID.', 'info');
                }

                if (poolName === null || poolName === undefined) {
                    this.log('AJAXRequest.bind: The binding will be for all pools.', 'warning');
                    applicablePools = AJAXRequest.CALLBACK_POOLS;
                } else {
                    if (AJAXRequest.CALLBACK_POOLS.indexOf(poolName) === -1) {
                        this.log('AJAXRequest.bind: No such pool: ""' + poolName + '.', 'warning');
                        return;
                    }
                    this.log('AJAXRequest.bind: The binding will be for callbacks in the specified pool.', 'info');
                    applicablePools.push(poolName);
                }
                this.bindParams.push({
                    pools:applicablePools,
                    callbackId:callbackId,
                    params:obj
                });
            },
            writable: false,
            enumerable: true
        },
        setBase: {
            /**
             * Updates the value of the base URL which is used to send AJAX requests.
             * 
             * @param {String|null} base The value of the new base URL. Only set if given URL is
             * valid.
             */
            value: function (base) {

                if (base === null || base === undefined || base.trim().length === 0) {
                    this.base = null;
                    this.log('AJAXRequest.setBase: Base is set to "null".');
                    return;
                }
                base = base.trim();

                if (AJAXRequest.isValidURL(base)) {
                    while (base[base.length - 1] === '/') {
                        base = base.substring(0, base.length - 1);
                    }
                    this.base = base;
                    this.log('AJAXRequest.setBase: Base is set to "' + this.getBase() + '".', 'info');
                } else {
                    this.log('AJAXRequest.setBase: Base not updated.', 'warning');
                }
            },
            writable: false,
            enumerable: true
        },
        log: {
            /**
             * Shows a message in the browser's console.
             * @param {String} message The message to display.
             * @param {String} type The type of the message. It can be 'info',  
             * 'error' or 'warning'. 
             * @param {boolean} force If set to true, the message will be shown 
             * even if the logging is disabled.
             */
            value: function (message, type = '', force = false) {
                if (this.verbose === true || force === true) {
                    if (type === 'info') {
                        console.info(message);
                    } else if (type === 'warning') {
                        console.warn(message);
                    } else if (type === 'error') {
                        console.error(message);
                    } else {
                        console.log(message);
                    }
                }
            },
            writable: false,
            enumerable: true
        },
        setResponse: {
            /**
            * Sets the value of the property serverResponse. Do not call this function 
            * manually.
            * @param {String} response
            * @returns {undefined}
            */
            value: function (response) {
                this.serverResponse = response;
                this.log('AJAXRequest.setResponse: Response updated.', 'info');
            },
            writable: false,
            enumerable: true
        },
        getServerResponse: {
            /**
            * Return the value of the property serverResponse. Call this function after 
            * any complete AJAX request to get response load in case there is a load.
            * @returns {String}
            */
            value: function () {
                return this.serverResponse;
            },
            writable: false,
            enumerable: true
        },
        responseAsJSON: {
            /**
            * Return a JSON representation of response payload in case it can be convirted 
            * into JSON object. Else, in case the payload cannot be convirted, it returns 
            * undefined.
            * @returns {Object|undefined}
            */
            value: function () {
                try {
                    return JSON.parse(this.getServerResponse());
                } catch (e) {
                    this.log('AJAXRequest.responseAsJSON: Unable to convert server response to JSON object!', 'warning', true);
                }
                return undefined;
            },
            writable: false,
            enumerable: true
        },
        addCallback: {
            /**
            * 
            * @param {Function|Object} callback A function to call. This also can be an object.
            * The object can have following properties, 'callback' The function that will be executed.
            * 'id': A unique itentifier for the callback.
            * 'call': a boolean or function that evaluate to a boolean. Used to decide if the 
            * callback will be executed or not. 'props' Extra properties that the developer would like
            * to have passed in the callback. Accessed using the keyword 'this' in the body of the
            * callback.
            * 
            * @param {String} poolName The name of the pool at which the callback will be added to.
            * Must be a value from the array AJAXRequest.CALLBACK_POOLS.
            * 
            * @returns {undefined|String} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value: function (callback, poolName) {
                var inst = this;
                var pool_name = poolName.toLowerCase();
                this.log('AJAXRequest.addCallback: Adding new callback to the pool "' + pool_name + '"...', 'info');

                if (AJAXRequest.CALLBACK_POOLS.indexOf(pool_name) !== -1) {
                    var p = 'on' + pool_name + 'pool';

                    var callType = typeof callback;
                    var id = this[p].length + '';

                    if (callType === 'function') {
                        this.log('AJAXRequest.addCallback: Callback given as function.', 'info');

                        this[p].push({ AJAXRequest: inst, id: id, call: true, func: callback, pool:poolName });
                        this.log('AJAXRequest.addCallback: New callback added [id = "' + id + '"].', 'info');

                        return id;
                    } else if (callType === 'object') {
                        this.log('AJAXRequest.addCallback: Callback given as an object.', 'info');

                        if (typeof callback.callback === 'function') {
                            this.log('AJAXRequest.addCallback: Property "callback" is set.', 'info');
                            var toAdd = {
                                func: callback.callback,
                                AJAXRequest: inst,
                                pool:poolName,
                            }
                            var typeOfId = typeof callback.id;

                            if (typeOfId === 'undefined' || callback.id === null) {
                                this.log('AJAXRequest.addCallback: Property "id" is not set. Using generated ID.', 'warning');
                                toAdd.id = id;
                            } else {
                                this.log('AJAXRequest.addCallback: Property "id" is set.', 'info');
                                toAdd.id = callback.id + '';
                                if (this.getCallbacksIDs(pool_name).indexOf(toAdd.id) !== -1) {
                                    this.log('AJAXRequest.addCallback: Can\'t Add callback. A callback with ID "' + toAdd.id + '" was already added to the pool "' + poolName + '".', 'warning', true);
                                    return;
                                }
                                id = toAdd.id;
                            }


                            if (typeof callback.call === 'boolean') {
                                this.log('AJAXRequest.addCallback: Property "call" is set as a boolean.', 'info');
                                toAdd.call = callback.call;
                            } else if (typeof callback.call === 'function') {
                                this.log('AJAXRequest.addCallback: Property "call" is set as a function.', 'info');
                                toAdd.call = callback.call;
                            } else {
                                this.log('AJAXRequest.addCallback: Property "call" is not set. Using "true" as default value.', 'warning');
                                toAdd.call = true;
                            }

                            this[p].push(toAdd);
                            this.log('AJAXRequest.addCallback: New callback added [id = "' + toAdd.id + '"].', 'info');
                        } else {
                            this.log('AJAXRequest.addCallback: Property "callback" is not set or invalid. Callback with ID "' + toAdd.id + '" was not added to the pool "' + poolName + '".', 'warning', true);
                        }
                    }

                } else {
                    this.log('AJAXRequest.addCallback: No such pool: \'' + pool_name + '\'', 'error');
                }
            },
            writable: false,
            enumerable: true
        },
        setOnServerError: {
            /**
            * Append a function to the pool of functions that will be called in case of 
            * server error (code 5xx). 
            * 
            * @param {Function|Object} callback A function to call. This also can be an object.
            * The object can have following properties, 'callback' The function that will be executed.
            * 'id': A unique itentifier for the callback.
            * 'call': a boolean or function that evaluate to a boolean. Used to decide if the 
            * callback will be executed or not. 'props' Extra properties that the developer would like
            * to have passed in the callback. Accessed using the keyword 'this' in the body of the
            * callback.
            * 
            * @returns {undefined|String|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value: function (callback) {
                return this.addCallback(callback, 'servererror');
            },
            writable: false,
            enumerable: true
        },
        removeCall: {
            /**
            * Removes a callback function from a specific pool given its ID.
            * @param {String} pool_name The name of the pool. It should be one of the 
            * values in the array AJAXRequest.CALLBACK_POOLS.
            * @param {String} id The ID of the callback function.
            * @returns {undefined}
            */
            value: function (pool_name, id) {
                id = id + '';

                if (pool_name !== undefined && pool_name !== null) {
                    if (typeof pool_name === 'string') {
                        pool_name = pool_name.toLowerCase();
                        if (AJAXRequest.CALLBACK_POOLS.indexOf(pool_name) !== -1) {
                            pool_name = 'on' + pool_name + 'pool';
                            for (var x = 0; x < this[pool_name].length; x++) {
                                if (this[pool_name][x]['id'] === id) {
                                    return this[pool_name].pop(this[pool_name][x]);
                                }
                            }
                            this.log('AJAXRequest.removeCall: No callback was found with ID = "' + id + '" in the pool \'' + pool_name + '\'', 'error');
                        } else {
                            noSuchPool(pool_name);
                        }
                    } else {
                        this.log('AJAXRequest.removeCall: Invalid pool name type. Pool name must be string.', 'error');
                    }
                } else {
                    noSuchPool(pool_name);
                }
            },
            writable: false,
            enumerable: true
        },
        disableCallsExcept: {
            value: function (id, call) {
                for (var x = 0; x < AJAXRequest.CALLBACK_POOLS.length; x++) {
                    this.disableCallExcept(AJAXRequest.CALLBACK_POOLS[x], id);
                }
            },
            writable: false,
            enumerable: true
        },
        disableCallExcept: {
            /**
            * Disable all callback functions except the one that its ID is given.
            * @param {String} pool_name The name of the pool. It should be a value from 
            * the array AJAXRequest.CALLBACK_POOLS.
            * @param {String} id The ID of the function that was provided when the function 
            * was added to the pool. If the ID does not exist, All callbacks will be disabled.
            * @returns {undefined}
            */
            value: function (pool_name, id = -1) {
                id = id + '';

                if (pool_name !== undefined && pool_name !== null) {
                    if (typeof pool_name === 'string') {
                        pool_name = pool_name.toLowerCase();
                        if (AJAXRequest.CALLBACK_POOLS.indexOf(pool_name) !== -1) {
                            pool_name = 'on' + pool_name + 'pool';
                            for (var x = 0; x < this[pool_name].length; x++) {
                                //first two IDs are reserved. do not disable.
                                if (this[pool_name][x]['id'] !== id && this[pool_name][x]['id'] > 1) {
                                    this[pool_name][x]['call'] = false;
                                } else {
                                    this[pool_name][x]['call'] = true;
                                }
                            }
                            return;
                        } else {
                            noSuchPool(pool_name);
                        }
                    } else {
                        this.log('AJAXRequest.disableCallExcept: Invalid pool name type. Pool name must be string.', 'error');
                    }
                } else {
                    noSuchPool(pool_name);
                }
            },
            writable: false,
            enumerable: true
        },
        setCallsEnabled: {
            /**
             * Enable or disable a callbacks with same ID in all pools given the ID.
             * 
             * @param {String|Number} id The ID that was set for all callbacks.
             * 
             * @param {Boolean|Function} call This can be a boolean or can be a function that evaluate
             * to a boolean.
             */
            value: function (id, call) {
                for (var x = 0; x < AJAXRequest.CALLBACK_POOLS.length; x++) {
                    this.setCallEnabled(AJAXRequest.CALLBACK_POOLS[x], id, call);
                }
            },
            writable: false,
            enumerable: true
        },
        setCallEnabled: {
            /**
            * Enable or disable a callback on specific pool.
            * @param {String} pool_name The name of the pool. It must be one of the 
            * values in the aray AJAXRequest.CALLBACK_POOLS.
            * 
            * @param {String} id The ID of the callback. It is given when the callback 
            * was added.
            * 
            * @param {Boolean} call If set to true, the function will be called. Else 
            * if it is set to false, it will be not called.
            */
            value: function (pool_name, id, call) {
                id = id + ''
                if (pool_name !== undefined && pool_name !== null) {
                    if (typeof pool_name === 'string') {
                        pool_name = pool_name.toLowerCase();
                        this.log('AJAXRequest.setCallEnabled: Checking if pool "' + pool_name + '" exist...', 'info')
                        if (AJAXRequest.CALLBACK_POOLS.indexOf(pool_name) !== -1) {
                            pool_name = 'on' + pool_name + 'pool';
                            for (var x = 0; x < this[pool_name].length; x++) {
                                if (this[pool_name][x]['id'] === id) {
                                    this[pool_name][x]['call'] = call;
                                    this.log('AJAXRequest.setCallEnabled: Callback status updated.', 'info');
                                    return;
                                }
                            }
                            this.log('AJAXRequest.setCallEnabled: No callback was found with ID = "' + id + '" in the pool \'' + pool_name + '\'', 'warning');
                        } else {
                            noSuchPool(pool_name);
                        }
                    } else {
                        this.log('AJAXRequest.setCallEnabled: Invalid pool name type. Pool name must be string.', 'error');
                    }
                } else {
                    noSuchPool(pool_name);
                }
            },
            writable: false,
            enumerable: true
        },
        getCallBack: {
            /**
            * Returns an object that contains the information of a callback function. 
            * @param {type} pool_name The name of the pool. It must be in the array 
            * AJAXRequest.CALLBACK_POOLS.
            * @param {String} id The ID of the callback.
            * @returns {Object|undefined} Returns an object that contains the 
            * information of the callback. If it is not found, or the pool name is invalid, 
            * the method will show a warning in the console and returns undefined.
            */
            value: function (pool_name, id) {
                id = id + '';
                if (pool_name !== undefined && pool_name !== null) {
                    if (typeof pool_name === 'string') {
                        pool_name = pool_name.toLowerCase();
                        if (AJAXRequest.CALLBACK_POOLS.indexOf(pool_name) !== -1) {
                            pool_name = 'on' + pool_name + 'pool';
                            for (var x = 0; x < this[pool_name].length; x++) {
                                if (this[pool_name][x]['id'] === id) {
                                    return this[pool_name][x];
                                }
                            }
                            this.log('AJAXRequest.getCallBack: No callback was found with ID = "' + id + '" in the pool \'' + pool_name + '\'', 'warning');
                        } else {
                            noSuchPool(pool_name);
                        }
                    } else {
                        this.log('AJAXRequest.getCallBack: Invalid pool name type. Pool name must be string.', 'error');
                    }
                } else {
                    noSuchPool(pool_name);
                }
            },
            writable: false,
            enumerable: true
        },
        setOnClientError: {
            /**
            * Append a function to the pool of functions that will be called in case of 
            * client error (code 4xx). 
            * 
            * @param {Function|Object} callback A function to call. This also can be an object.
            * The object can have following properties, 'callback' The function that will be executed.
            * 'id': A unique itentifier for the callback.
            * 'call': a boolean or function that evaluate to a boolean. Used to decide if the 
            * callback will be executed or not. 'props' Extra properties that the developer would like
            * to have passed in the callback. Accessed using the keyword 'this' in the body of the
            * callback.
            * 
            * @returns {undefined|String|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value: function (callback, call = true) {
                return this.addCallback(callback, 'clienterror');
            },
            writable: false,
            enumerable: true
        },
        setBeforeAjax: {
            /**
            * Append a function to the pool of functions that will be called before 
            * ajax request is sent to the server.  
            * 
            * @param {Function|Object} callback A function to call. This also can be an object.
            * The object can have following properties, 'callback' The function that will be executed.
            * 'id': A unique itentifier for the callback.
            * 'call': a boolean or function that evaluate to a boolean. Used to decide if the 
            * callback will be executed or not. 'props' Extra properties that the developer would like
            * to have passed in the callback. Accessed using the keyword 'this' in the body of the
            * callback.
            * 
            * @returns {undefined|String|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value: function (callback) {
                return this.addCallback(callback, 'beforeajax');
            },
            writable: false,
            enumerable: true
        },
        setAfterAjax: {
            /**
            * Append a function to the pool of functions that will be called after 
            * ajax request is finished regardless of the status. 
            * 
            * @param {Function|Object} callback A function to call. This also can be an object.
            * The object can have following properties, 'callback' The function that will be executed.
            * 'id': A unique itentifier for the callback.
            * 'call': a boolean or function that evaluate to a boolean. Used to decide if the 
            * callback will be executed or not. 'props' Extra properties that the developer would like
            * to have passed in the callback. Accessed using the keyword 'this' in the body of the
            * callback.
            * 
            * @returns {undefined|String|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value: function (callback) {
                return this.addCallback(callback, 'afterajax');
            },
            writable: false,
            enumerable: true
        },
        setOnError: {
            /**
            * Append a function to the pool of functions that will be called in case 
            * one of the callbacks on the instance thrown an exception. 
            * 
            * @param {Function|Object} callback A function to call. This also can be an object.
            * The object can have following properties, 'callback' The function that will be executed.
            * 'id': A unique itentifier for the callback.
            * 'call': a boolean or function that evaluate to a boolean. Used to decide if the 
            * callback will be executed or not. 'props' Extra properties that the developer would like
            * to have passed in the callback. Accessed using the keyword 'this' in the body of the
            * callback.
            * 
            * @returns {undefined|String|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            * 
            */
            value: function (callback) {
                return this.addCallback(callback, 'error');
            },
            writable: false,
            enumerable: true
        },
        getCsrfToken: {
            value: function () {
                this.log('AJAXRequest.getCsrfToken: Searching for CSRF token value.', 'info');
                this.log('AJAXRequest.getCsrfToken: Checking "window.csrfToken"...', 'info');
                if (window.csrfToken === undefined || window.csrfToken === null) {
                    this.log('AJAXRequest.getCsrfToken: It is not set.', 'warning');
                    this.log('AJAXRequest.getCsrfToken: Searching for meta tag with name = "csrf-token"...', 'info');
                    var csrfEl = document.querySelector('meta[name="csrf-token"]');
                    if (csrfEl === null) {
                        this.log('AJAXRequest.getCsrfToken: Element not found.', 'warning');
                        this.log('AJAXRequest.getCsrfToken: Searching for input element with name = "csrf-token"...', '');
                        var csrfEl = document.querySelector('input[name="csrf-token"]');
                        if (csrfEl === null) {
                            this.log('AJAXRequest.getCsrfToken: Element not found.', 'warning');
                            this.log('AJAXRequest.getCsrfToken: CSRF token not found.', 'warning');
                            var csrfEl = document.querySelector('input[name="csrf-token"]');
                        } else {
                            this.log('AJAXRequest.getCsrfToken: Checking the value of the attribute "value"...', 'info');
                            window.csrfToken = csrfEl.getAttribute('value');
                            if (window.csrfToken) {
                                this.log('AJAXRequest.getCsrfToken: CSRF token found.', 'info');
                            }
                        }
                    } else {
                        this.log('AJAXRequest.getCsrfToken: Checking the value of the attribute "content"...', 'info');
                        window.csrfToken = csrfEl.getAttribute('content');
                        if (window.csrfToken) {
                            this.log('AJAXRequest.getCsrfToken: CSRF token found.', 'info');
                        } else {
                            this.log('AJAXRequest.getCsrfToken: The attribute "content" has no value.', 'warning');
                            this.log('AJAXRequest.getCsrfToken: Searching for input element with name = "csrf-token"...', '');
                            var csrfEl = document.querySelector('input[name="csrf-token"]');
                            if (csrfEl === null) {
                                this.log('AJAXRequest.getCsrfToken: Element not found.', 'warning');
                                this.log('AJAXRequest.getCsrfToken: CSRF token not found.', 'warning');
                                var csrfEl = document.querySelector('input[name="csrf-token"]');
                            } else {
                                this.log('AJAXRequest.getCsrfToken: Checking the value of the attribute "value"...', 'info');
                                window.csrfToken = csrfEl.getAttribute('value');
                                if (window.csrfToken) {
                                    this.log('AJAXRequest.getCsrfToken: CSRF token found.', 'info');
                                }
                            }
                        }
                    }
                } else {
                    this.log('AJAXRequest.getExtractCsrfToken: CSRF token found.', 'info');
                }
                return window.csrfToken;
            },
            writable: false,
            enumerable: true
        },
        addHeader: {
            /**
             * Adds new custom header to the request.
             * The custom header will be sent once the method 'AJAXRequest.send()' is called.
             * @param {String} name The name of the header. It must be non-empty string.
             * @param {String} value The value of the header.
             * @return {Boolean} If the header is added, the method will return true. 
             * If not added, the method will return false.
             */
            value: function (name, value) {
                this.log('AJAXRequest.addHeader: Trying to add new header with name "' + name + '" and value "' + value + '".', 'info');
                if (typeof name === 'string') {
                    name = name.trim();
                    if (name.length > 0) {
                        if (typeof value === 'string') {
                            this.customHeaders[name] = value;
                            this.log('AJAXRequest.addHeader: Header added.', 'info');
                            return true;
                        } else {
                            this.log('AJAXRequest.addHeader: Invalid header value is given.', 'warning');
                        }
                    } else {
                        this.log('AJAXRequest.addHeader: Invalid header name is given.', 'warning');
                    }
                } else {
                    this.log('AJAXRequest.addHeader: Invalid header name is given.', 'warning');
                }
                return false;
            },
            writable: false,
            enumerable: true
        },
        setOnSuccess: {
            /**
            * Append a function to the pool of functions that will be called in case of 
            * successfull request (code 2xx). 
            * 
            * @param {Function|Object} callback A function to call. This also can be an object.
            * The object can have following properties, 'callback' The function that will be executed.
            * 'id': A unique itentifier for the callback.
            * 'call': a boolean or function that evaluate to a boolean. Used to decide if the 
            * callback will be executed or not. 'props' Extra properties that the developer would like
            * to have passed in the callback. Accessed using the keyword 'this' in the body of the
            * callback.
            * 
            * @returns {undefined|String|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value: function (callback) {
                return this.addCallback(callback, 'success');
            },
            writable: false,
            enumerable: true
        },
        setOnDisconnected: {
            /**
            * Append a function to the pool of functions that will be called in case of 
            * internec connection is lost (code 0). 
            * 
            * @param {Function|Object} callback A function to call. This also can be an object.
            * The object can have following properties, 'callback' The function that will be executed.
            * 'id': A unique itentifier for the callback.
            * 'call': a boolean or function that evaluate to a boolean. Used to decide if the 
            * callback will be executed or not. 'props' Extra properties that the developer would like
            * to have passed in the callback. Accessed using the keyword 'this' in the body of the
            * callback.
            * 
            * @returns {undefined|String|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value: function (callback) {
                return this.addCallback(callback, 'connectionlost');
            },
            writable: false,
            enumerable: true
        },
        setMethod: {
            /**
            * Sets the request method.
            * @param {String} method get, post or delete. If the request method is not 
            * supported, A warning will be shown in the console and default (GET) will 
            * be used.
            * @returns {undefined}
            */
            value: function (method) {
                if (method !== undefined && method !== null) {
                    method = method.toUpperCase();
                    if (method === 'GET' || method === 'POST' || method === 'DELETE' || method === 'PUT' || method === 'HEAD' || method === 'OPTIONS') {
                        this.method = method;
                        this.log('AJAXRequest.setMethod: Request method is set to ' + method + '.', 'info');
                    } else {
                        this.log('AJAXRequest.setMethod: Null, undefined or unsupported method. GET is set as default.', 'warning', true);
                        this.method = 'GET';
                    }
                } else {
                    this.log('AJAXRequest.setMethod: Null, undefined or unsupported method. GET is set as default.', 'warning', true);
                    this.method = 'GET';
                }
            },
            writable: false,
            enumerable: true
        },
        setReqMethod: {
            /**
            * Sets the request method.
            * @param {String} method get, post or delete. If the request method is not 
            * supported, A warning will be shown in the console and default (GET) will 
            * be used.
            * @returns {undefined}
            * @deprecated since version 2.0.0
            */
            value: function (method) {
                this.setMethod(method)
            },
            writable: false,
            enumerable: true
        },
        getMethod: {
            /**
            * Returns request method.
            * @returns {String}
            */
            value: function () {
                return this.method;
            },
            writable: false,
            enumerable: true
        },
        getReqMethod: {
            /**
            * Returns request method.
            * @returns {String}
            * @deprecated since version 2.0.0
            */
            value: function () {
                return this.method;
            },
            writable: false,
            enumerable: true
        },
        setURL: {
            /**
            * Sets AJAX request URL (or URI)
            * @param {String} url
            * @returns {undefined}
            */
            value: function (url) {
                if (url === null || url === undefined) {
                    this.log('AJAXRequest.setURL: "null" or "undefined" is given as URL.', 'warning');
                    return;
                }
                url += '';
                while (url[0] === '/') {
                    url = url.substring(1, url.length);
                }
                this.url = url;
                this.log('AJAXRequest.setURL: URL is set to \'' + url + '\'.', 'info');
            },
            writable: false,
            enumerable: true
        },
        getURL: {
            /**
            * Returns request URL.
            * @returns {String}
            */
            value: function () {
                return this.url;
            },
            writable: false,
            enumerable: true
        },
        setParams: {
            /**
            * Sets request payload that will be send with it.
            * @param {String|FormData|Object} params
            * @returns {undefined}
            */
            value: function (params) {
                if (params !== undefined && params !== null) {
                    this.params = params;
                    this.log('AJAXRequest.setParams: Parameters updated.', 'info');
                } else {
                    this.log('AJAXRequest.setParams: Cannot set parameters to null or undefined.', 'warning');
                }
            },
            writable: false,
            enumerable: true
        },
        getParams: {
            /**
            * Returns request payload.
            * @returns {String}
            */
            value: function () {
                return this.params;
            },
            writable: false,
            enumerable: true
        },
        getRequestURL: {
            /**
            * Returns a string that represents the URL at which AJAX request will be send to.
            * 
            * @returns {String} A string such as 'https://example.com/apis/get-user'.
            */
            value: function () {
                var url = this.getURL();
                var base = this.getBase();
                var requestUrl = url;

                if (base === null) {
                    return requestUrl;
                } else {
                    var subPart = url.substring(0, base.length);

                    if (subPart === base) {
                        var requestUrl = url;
                    } else {
                        var requestUrl = base + '/' + url;
                    }
                }
                return requestUrl;
            },
            writable: false,
            enumerable: true
        },
        setRetry:{
            /**
             * Sets the callback that will be used on retry before executing
             * connection lost callbacks.
             * 
             * @param {Number} times The number of times at which the callback
             * will retry.
             * 
             * @param {Number} timeBetweenEachTryInSeconds Number of seconds 
             * between each run.
             * 
             * @param {Function} func The callback that will be executed.
             * 
             * @param {Object} props Any extra parameters to have access to within
             * the callback.
             * 
             * @returns {boolean} If set, the method will return true.
             * False if not.
             */
            value: function (times, timeBetweenEachTryInSeconds, func, props = {}) {
                var num = Number.parseInt(times);
                if (Number.isNaN(num) || num < 0) {
                    return false;
                }
                var time = Number.parseInt(timeBetweenEachTryInSeconds);
                if (Number.isNaN(time) || time < 1) {
                    return false;
                }
                if (!(typeof func === 'function')) {
                    return false;
                }
                var xprops = typeof props === 'object' ? props : {};
                this.retry = {
                    times:num,
                    passed:0,
                    wait:time,
                    pass_number:0,
                    func: func,
                    props:xprops
                };
                return true;
            },
            writable: false,
            enumerable: true
        },
        send: {
            /**
            * Send AJAX request to the server.
            * @returns {Boolean} True in case of the status of AJAX request is open. 
            * else, it will return false.
            */
            value: function () {
                this.log('AJAXRequest.send: Executing before AJAX callbacks...', 'info');
                for (var i = 0; i < this.onbeforeajaxpool.length; i++) {
                    try {
                        bindParams(this.onbeforeajaxpool[i], this);
                        
                        if (canCall(this.onbeforeajaxpool[i])) {
                            
                            this.onbeforeajaxpool[i].func();
                        }
                    } catch (e) {
                        callOnErr(this, null, {}, e);
                        return false;
                    }
                }
                this.log('AJAXRequest.send: Finished executing the before AJAX callbacks.', 'info');
                this.log('AJAXRequest.send: Checking if AJAX is enabled....', 'info');
                if (this.isEnabled()) {
                    this.log('AJAXRequest.send: It is enabled.', 'info');
                    var method = this.getReqMethod();
                    var params = this.getParams();
                    var url = this.getURL();
                    var base = this.getBase();
                    var requestUrl = this.getRequestURL();

                    this.log('AJAXRequest.send: Params: ' + params, 'info');
                    this.log('AJAXRequest.send: Request Method: ' + method, 'info');
                    this.log('AJAXRequest.send: Base: ' + base, 'info');
                    this.log('AJAXRequest.send: URL: ' + url, 'info');
                    this.log('AJAXRequest.send: Request URL: ' + requestUrl, 'info');
                    
                    var nonActiveXhr = this.getNonSendXhr();
                    nonActiveXhr.received = false;
                    nonActiveXhr.active = true;
                    nonActiveXhr.log = this.log;
                    nonActiveXhr.AJAXRequest = this;
                    nonActiveXhr.retry = this.retry;
                    nonActiveXhr.onreadystatechange = this.onreadystatechange;
                    nonActiveXhr.url = url;
                    nonActiveXhr.requestUrl = requestUrl;
                    nonActiveXhr.base = base;
                    nonActiveXhr.onload = this.onload;
                    nonActiveXhr.onprogress = this.onprogress;
                    nonActiveXhr.onsuccesspool = this.onsuccesspool;
                    nonActiveXhr.onservererrorpool = this.onservererrorpool;
                    nonActiveXhr.onclienterrorpool = this.onclienterrorpool;
                    nonActiveXhr.onconnectionlostpool = this.onconnectionlostpool;
                    nonActiveXhr.onafterajaxpool = this.onafterajaxpool;
                    nonActiveXhr.onerrorpool = this.onerrorpool;
                    nonActiveXhr.verbose = this.verbose;
                    this.log('AJAXRequest.send: Checking parameters type...', 'info');
                    if (typeof this.params === 'object' && this.params.toString() !== '[object FormData]') {
                        this.log('AJAXRequest.send: An object is given. Extracting values...', 'info');
                        if (method === 'PUT' || method === 'POST') {
                            this.log('AJAXRequest.send: Will store parameters in FormData since request method is ' + method + '.', 'info');
                            var localParams = new FormData();
                        } else {
                            var localParams = '';
                        }
                        var keys = Object.keys(this.params);
                        var and = '';
                        for (var x = 0; x < keys.length; x++) {
                            var paramVal = this.params[keys[x]];

                            if (paramVal !== undefined && paramVal !== null) {
                                this.log('AJAXRequest.send: Parameter as string: ' + paramVal.toString());
                                if (Array.isArray(paramVal)) {
                                    this.log('AJAXRequest.send: Array is found. Turning it to string-like array.', 'info');
                                    //Turn the array to array-like string
                                    var toAppend = '[';
                                    var comma = '';
                                    for (var y = 0; y < paramVal.length; y++) {
                                        if (typeof paramVal[y] === 'string') {
                                            toAppend += comma + '"' + encodeURIComponent(paramVal[y]) + '"';
                                        } else if (typeof paramVal[y] === 'number') {
                                            toAppend += comma + paramVal[y];
                                        } else if (typeof paramVal[y] === 'boolean') {
                                            toAppend += paramVal[y] ? comma + 'true' : comma + 'false';
                                        }
                                        comma = ',';
                                    }
                                    toAppend += ']';
                                    if (typeof localParams === 'object') {
                                        localParams.append(keys[x], encodeURIComponent(toAppend));
                                    } else {
                                        localParams += and + encodeURIComponent(keys[x]) + '=' + encodeURIComponent(toAppend);
                                    }

                                } else {
                                    if (typeof localParams === 'object') {
                                        if (typeof paramVal === 'object' && (paramVal.toString() === '[object File]' || paramVal.toString() === '[object Blob]')) {
                                            this.log('AJAXRequest.send: File or Blob is found.', 'info');
                                            localParams.append(keys[x], this.params[keys[x]]);
                                        } else {
                                            localParams.append(keys[x], encodeURIComponent(this.params[keys[x]]));
                                        }
                                    } else {
                                        localParams += and + encodeURIComponent(keys[x]) + '=' + encodeURIComponent(this.params[keys[x]]);
                                    }
                                }
                                and = '&';
                            } else {
                                this.log('AJAXRequest.send: The value of the parameter "' + keys[x] + '" is undefined or null. It will be not included in the request.', 'warning', true);
                            }
                        }
                        this.log('AJAXRequest.send: Extracted. Result = ' + localParams, 'info');
                    } else {
                        this.log('AJAXRequest.send: Form data or string is given.', 'info');
                        var localParams = this.params;
                    }

                    if (method === 'GET' || method === 'DELETE') {
                        if (localParams !== undefined && localParams !== null && localParams !== '') {
                            nonActiveXhr.open(method, requestUrl + '?' + localParams);
                        } else {
                            nonActiveXhr.open(method, requestUrl);
                        }
                        if (method === 'DELETE') {
                            //Add CSRF token.
                            var csrfTok = this.getCsrfToken();
                            if (csrfTok) {
                                nonActiveXhr.setRequestHeader('X-CSRF-TOKEN', csrfTok);
                            }
                        }
                        var customHeadersKeys = Object.keys(this.customHeaders);
                        if (customHeadersKeys.length > 0) {
                            this.log('AJAXRequest.send: Adding custom headers to request..', 'info');
                        }
                        for (var x = 0; x < customHeadersKeys.length; x++) {
                            nonActiveXhr.setRequestHeader(customHeadersKeys[x], this.customHeaders[customHeadersKeys[x]]);
                        }
                        nonActiveXhr.send();
                        return true;
                    } else if (method === 'POST' || method === 'PUT') {
                        nonActiveXhr.open(method, requestUrl);

                        //Add CSRF token.
                        var csrfTok = this.getCsrfToken();
                        if (csrfTok) {
                            nonActiveXhr.setRequestHeader('X-CSRF-TOKEN', csrfTok);
                        }
                        if (localParams.toString() !== '[object FormData]') {
                            nonActiveXhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                            this.log('AJAXRequest.send: Setting header \'Content-Type\' to \'application/x-www-form-urlencoded\'.', 'info');
                        }
                        var customHeadersKeys = Object.keys(this.customHeaders);
                        if (customHeadersKeys.length > 0) {
                            this.log('AJAXRequest.send: Adding custom headers to request..', 'info');
                        }
                        for (var x = 0; x < customHeadersKeys.length; x++) {
                            nonActiveXhr.setRequestHeader(customHeadersKeys[x], this.customHeaders[customHeadersKeys[x]]);
                        }
                        nonActiveXhr.send(localParams);
                        return true;
                    } else {
                        nonActiveXhr.open(method, requestUrl);
                        nonActiveXhr.send();
                    }
                } else {
                    this.log('AJAXRequest.send: AJAX is disabled.', 'info', true);
                }
                return false;
            },
            writable: false,
            enumerable: true
        },
        setEnabled: {
            /**
            * Enable or disable AJAX.
            * @param {Boolean} boolean True to enable AJAX. False to disable. If 
            * other value is given, AJAX will be enabled.
            * @returns {undefined}
            */
            value: function (boolean) {
                if (boolean === true) {
                    this.enabled = true;
                    this.log('AJAXRequest.setEnabled: AJAX is enabled.', 'info');
                } else if (boolean === false) {
                    this.enabled = false;
                    this.log('AJAXRequest.setEnabled: AJAX is disabled.', 'info');
                } else {
                    this.enabled = true;
                    this.log('AJAXRequest.setEnabled: AJAX is enabled.', 'info');
                }
            },
            writable: false,
            enumerable: true
        },
        xhr_pool:{
            value:[
                AJAXRequest.createXhr(),
            ],
            writable:false,
            enumerable: true
        },
        getNonSendXhr:{
            value:function () {
                for (var x = 0 ; x < this.xhr_pool.length ; x++) {
                    if (!this.xhr_pool[x].active) {
                        return this.xhr_pool[x];
                    }
                }
                var newXhr = AJAXRequest.createXhr();
                if (newXhr === false || newXhr === undefined || newXhr === null) {
                    this.log('AJAXRequest: Unable to creeate xhr object! Browser does not support it.', 'error', true);
                    return;
                }
                this.xhr_pool.push(newXhr);
                return newXhr;
            },
            writable:false,
            enumerable: true
        },
        hasNonReceivedRequest:{
            value:function () {
                for (var x = 0 ; x < this.xhr_pool.length ; x++) {
                    if (!this.xhr_pool[x].received) {
                        return true;
                    }
                }
                return false;
            },
            writable:false,
            enumerable: true
        }
    });
    
    var instance = this;
    this.verbose = config.verbose;
    if (this.verbose === true) {
        this.log('AJAXRequest: Verbose mode is enabled. More messages will be shown in the console.');
    }
    this.setReqMethod(config.method);
    this.setURL(config.url);
    this.setEnabled(config.enabled);

    if (config.base) {
        this.setBase(config.base);
    } else {
        this.setBase(AJAXRequest.extractBase());
    }
    //Set params
    instance.setParams(config.params);

    //Add custom headers
    if (typeof config.headers === 'object') {
        var keys = Object.keys(config.headers);
        for (var x = 0; x < keys.length; x++) {
            instance.addHeader(keys[x], config.headers[keys[x]]);
        }
    }

    //Add callbacks
    function addCalls(configVar, method, instance) {
        if (Array.isArray(configVar)) {
            configVar.forEach((callback) => {
                instance[method](callback);
            });
        } else if (typeof configVar === 'function' || typeof configVar === 'object') {
            instance[method](configVar);
        }
    }
    addCalls(config.beforeAjax, 'setBeforeAjax', instance);
    addCalls(config.onSuccess, 'setOnSuccess', instance);
    addCalls(config.onClientErr, 'setOnClientError', instance);
    addCalls(config.onServerErr, 'setOnServerError', instance);
    addCalls(config.onDisconnected, 'setOnDisconnected', instance);
    addCalls(config.afterAjax, 'setAfterAjax', instance);
    addCalls(config.onErr, 'setOnError', instance);

}
//Global AJAXRequest Instance
const ajax = new AJAXRequest();
