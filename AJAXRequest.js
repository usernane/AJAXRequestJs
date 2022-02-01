
"use strict";

Object.defineProperties(AJAXRequest,{
    META:{
        writable:false,
        value:{}
    },
    CALLBACK_POOLS:{
        /**
        * Names of pools of events.
        * @type Array
        */
        value:['servererror','clienterror','success','connectionlost','afterajax','beforeajax', 'onerror'],
        writable:false
    },
    XMLHttpFactories:{
        /**
        * Array of functions used to create XMLHttpRequest object.
        * @type Array
        */
        value:[
            function (){return new XMLHttpRequest();},
            function (){return new ActiveXObject("Microsoft.XMLHTTP");},
            function (){return new ActiveXObject("MSXML2.XMLHTTP.3.0");}
        ],
        writable:false
    },
    createXhr:{
        /**
        * A factory function used to create XHR object for diffrent browsers.
        * @returns {Mixed} False in case of failure. Other than that, it will 
        * return XHR object that can be used to send AJAX.
        */
        value:function createXhr(){
            for(var i = 0 ; i < AJAXRequest.XMLHttpFactories.length ; i++){
                try{
                    return AJAXRequest.XMLHttpFactories[i]();
                }
                catch(e){

                }
            }
            return false;
        },
        wriable:false
    },
    extractBase:{
        /**
         * Extract the value of the attribute 'href' of the 'base' tag.
         * 
         * @returns {String|null} If the tag 'base' and the attribute 'base' is set,
         * the method will return its value. Other than that, the method will return
         * null.
         */
        value:function() {
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
    isValidURL:{
        /**
         * Checks if given string represents a valid URL or not.
         * 
         * @param {String} url The string that will be validated.
         * 
         * @returns {Boolean} If the given string is a valid URL, the method will return true.
         * Other than that, the method will return false.
         */
        value:function (url) {
            var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.=~+!]*)*'+ // port and path
                '(\\?[;&a-z\\d%_.~+=/-]*)?'+ // query string
                '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
            return !!pattern.test(url);
        }
    }
});
Object.defineProperties(AJAXRequest.META,{
    VERSION:{
        value:'1.2.4',
        writable:false
    },
    REALSE_DATE:{
        value:'2022-02-02',
        writable:false
    },
    CONTRIBUTORS:{
        value:[
            {
                name:'Ibrahim Ali BinAlshikh',
                email:'ibinshikh@hotmail.com'
            },
            {
                name:'Ibrahim Beladi',
                email:''
            }
        ],
        writable:false
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
function AJAXRequest(config={
    method:'get',
    url:'',
    'verbose':false,
    enabled:true,
    beforeAjax:[],
    onSuccess:[],
    onClientErr:[],
    onServerErr:[],
    onDisconnected:[],
    afterAjax:[],
    onErr:[],
    headers:{}
}){
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
    this.onload = function(){};
    this.onprogress = function(e){

        if (e.lengthComputable) {
            var percentComplete = (e.loaded / e.total) * 100;
            console.info('AJAXRequest: Uploaded '+percentComplete+'%');
        } else {
            console.info('AJAXRequest: Not lengthComputable!');
        }
    };
    /**
     * A pool of functions to call in case of internet connection lost.
     */
    this.onconnectionlostpool = [
        {
            id:0,
            call:true,
            func:function(){
                console.info('AJAXRequest: Connection lost. Status: '+this.status);
            }
        }
    ];
    /**
     * A pool of functions to call before ajax request is sent.
     */
    this.onbeforeajaxpool = [
        {
            id:0,
            call:true,
            func:function(){
                console.info('AJAXRequest: Before AJAX callback.');
            }
        }
    ];
    /**
     * A pool of functions to call after ajax has finished with regards of the 
     * final state.
     */
    this.onafterajaxpool = [
        {
            id:0,
            call:true,
            func:function(){
                console.info('AJAXRequest: After AJAX '+this.status);
            }
        }
    ];
    /**
     * A pool of functions to call in case one of the functions in the 
     * instance thrown an exception.
     */
    this.onerrorpool = [
        {
            id:0,
            call:true,
            func:function(){
                console.info('AJAXRequest: Error in one of the callbacks.');
            }
        }
    ];
    /**
     * A pool of functions to call in case of successful request.
     */
    this.onsuccesspool = [
        {
            id:0,
            call:true,
            func:function(){
                console.info('AJAXRequest: Success '+this.status);
            }
        }
    ];
    /**
     * A pool of functions to call in case of server error.
     */
    this.onservererrorpool = [
        {
            id:0,
            call:true,
            func:function(){
                console.info('AJAXRequest: Server Error '+this.status);
            }
        }
    ];
    /**
     * A pool of functions to call in case of client error.
     */
    this.onclienterrorpool = [
        {
            id:0,
            call:true,
            func:function(){
                console.info('AJAXRequest: Client Error '+this.status);
            }
        }
    ];
    Object.defineProperty(this,'onreadystatechange',{
        value:function(){
            if(this.readyState === 0){
                this.log('AJAXRequest: Ready State = 0 (UNSENT)','info');
            } else if (this.readyState === 1) {
                this.log('AJAXRequest: Ready State = 1 (OPENED)','info');
            } else if (this.readyState === 2) {
                this.log('AJAXRequest: Ready State = 2 (HEADERS_RECEIVED)','info');
            } else if (this.readyState === 3) {
                this.log('AJAXRequest: Ready State = 3 (LOADING)','info');
            } else if (this.readyState === 4 && this.status === 0){
                this.log('AJAXRequest: Ready State = 4 (DONE)','info');
                setProbsAfterAjax(this, 'connectionlost');
            } else if (this.readyState === 4 && this.status >= 200 && this.status < 300) {
                this.log('AJAXRequest: Ready State = 4 (DONE)','info');
                setProbsAfterAjax(this, 'success');
            } else if (this.readyState === 4 && this.status >= 400 && this.status < 500) {
                this.log('AJAXRequest: Ready State = 4 (DONE)','info');
                setProbsAfterAjax(this, 'clienterror');
            } else if (this.readyState === 4 && this.status >= 300 && this.status < 400) {
                this.log('AJAXRequest: Ready State = 4 (DONE)','info');
                this.log('Redirect','info',true);
            } else if (this.readyState === 4 && this.status >= 500 && this.status < 600) {
                this.log('AJAXRequest: Ready State = 4 (DONE)','info');
                setProbsAfterAjax(this, 'servererror');
            } else if(this.readyState === 4) {
                this.log('Status: '+this.status,'info');
            }
        },
        writable:false,
        enumerable: false
    });
    function callOnErr(inst, jsonResponse, headers, e) {
        inst.log('An error occurred while executing the callback at "'+e.fileName+'" line '+e.lineNumber+'. Check Below for more details.','error', true);
        inst.log(e,'error', true);

        for(var i = 0 ; i < inst.onerrorpool.length ; i++){
            try {
                if (inst.onerrorpool[i].call === true) {
                    inst.onerrorpool[i].AJAXRequest = inst;
                    inst.onerrorpool[i].e = e;
                    inst.onerrorpool[i].status = inst.status;
                    inst.onerrorpool[i].response = inst.responseText;
                    inst.onerrorpool[i].xmlResponse = inst.responseXML;
                    inst.onerrorpool[i].jsonResponse = jsonResponse;
                    inst.onerrorpool[i].responseHeaders = headers;
                    inst.onerrorpool[i].func();
                }
            } catch (e) {
                inst.log('An error occurred while executing the callback at "'+e.fileName+'" line '+e.lineNumber+'. Check Below for more details.','error', true);
                inst.log(e,'error', true);
            }
        }
    }
    function setProbsAfterAjax(inst, pool_name) {
        try{
            var jsonResponse = JSON.parse(inst.responseText);
        } catch(e) {
            inst.log('Unable to convert response into JSON object.','warning', true);
            inst.log('"jsonResponse" is set to \'null\'.','warning', true);
            var jsonResponse = null;
        }
        for(var i = 0 ; i < inst['on'+pool_name+'pool'].length ; i++){
            inst['on'+pool_name+'pool'][i].AJAXRequest = inst;
            inst['on'+pool_name+'pool'][i].status = inst.status;
            inst['on'+pool_name+'pool'][i].response = inst.responseText;
            inst['on'+pool_name+'pool'][i].xmlResponse = inst.responseXML;
            inst['on'+pool_name+'pool'][i].jsonResponse = jsonResponse;
            inst['on'+pool_name+'pool'][i].responseHeaders = getResponseHeadersObj(inst);
            if (inst['on'+pool_name+'pool'][i].call === true) {
                try {
                    inst['on'+pool_name+'pool'][i].func();
                } catch (e) {
                    callOnErr(inst, jsonResponse, headers, e);
                }
            }
        }
        for(var i = 0 ; i < inst.onafterajaxpool.length ; i++){
            var headers = getResponseHeadersObj(inst);
            inst.onafterajaxpool[i].AJAXRequest = inst;
            inst.onafterajaxpool[i].status = inst.status;
            inst.onafterajaxpool[i].response = inst.responseText;
            inst.onafterajaxpool[i].xmlResponse = inst.responseXML;
            inst.onafterajaxpool[i].jsonResponse = jsonResponse;
            inst.onafterajaxpool[i].responseHeaders = headers;
            if (inst.onafterajaxpool[i].call === true) {
                try {
                    inst.onafterajaxpool[i].func();
                } catch (e) {
                    callOnErr(inst, jsonResponse, headers, e);
                }
            }
        }
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
        for (var x = 0 ; x < headersArr.length ; x++) {
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
    function noSuchPool(p_name){
        console.warn('No such bool: '+p_name);
        var pools = '';
        for (var x = 0 ; x < AJAXRequest.CALLBACK_POOLS.length ; x++) {
            if (x === AJAXRequest.CALLBACK_POOLS.length - 1) {
               pools += ' or '+ AJAXRequest.CALLBACK_POOLS[x];
            } else {
                if (x === AJAXRequest.CALLBACK_POOLS.length - 2) {
                   pools += AJAXRequest.CALLBACK_POOLS[x]; 
                } else {
                    pools += AJAXRequest.CALLBACK_POOLS[x]+', ';
                }
            }
        }
        console.info('Pool name must be one of the following: '+pools);
    }
    Object.defineProperties(this,{
        isEnabled:{
            /**
            * Checks if AJAX is enabled or disabled.
            * @returns {Boolean} True if enabled and false if disabled.
            */
            value:function(){
                return this.enabled;
            },
            writable:false,
            enumerable: true
        },
        getBase:{
            /**
             * Returns the value of the base URL which is used to send AJAX requests.
             * 
             * @returns {String|null} If the base is set, the method will return its value.
             * If not, the method will return the value of the attribute 'href' of the 
             * 'base' tag. Other than that, null is returned.
             */
            value:function () {
                return this.base;
            },
            writable:false,
            enumerable: true
        },
        setBase:{
            /**
             * Updates the value of the base URL which is used to send AJAX requests.
             * 
             * @param {String|null} base The value of the new base URL. Only set if given URL is
             * valid.
             */
            value:function(base) {

                if (base === null || base === undefined || base.trim().length === 0) {
                    this.base = null;
                    this.log('AJAXREquest.setBase: Base is set to "null".');
                    return;
                }
                base = base.trim();

                if (AJAXRequest.isValidURL(base)) {
                    while (base[base.length - 1] === '/') {
                        base = base.substring(0, base.length - 1);
                    }
                    this.base = base;
                    this.log('AJAXREquest.setBase: Base is set to "'+this.getBase()+'".', 'info');
                } else {
                    this.log('AJAXREquest.setBase: Base not updated.', 'warning');
                }
            },
            writable:false,
            enumerable: true
        },
        log:{
            /**
             * Shows a message in the browser's console.
             * @param {String} message The message to display.
             * @param {String} type The type of the message. It can be 'info',  
             * 'error' or 'warning'. 
             * @param {boolean} force If set to true, the message will be shown 
             * even if the logging is disabled.
             */
            value:function(message,type='',force=false){
                if(this.verbose === true || force === true){
                    if(type==='info'){
                        console.info(message);
                    } else if (type==='warning') {
                        console.warn(message);
                    } else if (type==='error') {
                        console.error(message);
                    } else {
                        console.log(message);
                    }
                }
            },
            writable:false,
            enumerable: true
        },
        setResponse:{
            /**
            * Sets the value of the property serverResponse. Do not call this function 
            * manually.
            * @param {String} response
            * @returns {undefined}
            */
            value:function(response){
                this.serverResponse = response;
                this.log('AJAXRequest.setResponse: Response updated.','info');
            },
            writable:false,
            enumerable: true
        },
        getServerResponse:{
            /**
            * Return the value of the property serverResponse. Call this function after 
            * any complete AJAX request to get response load in case there is a load.
            * @returns {String}
            */
            value:function(){
                return this.serverResponse;
            },
            writable:false,
            enumerable: true
        },
        responseAsJSON:{
            /**
            * Return a JSON representation of response payload in case it can be convirted 
            * into JSON object. Else, in case the payload cannot be convirted, it returns 
            * undefined.
            * @returns {Object|undefined}
            */
            value:function(){
                try{
                    return JSON.parse(this.getServerResponse());
                } catch(e) {
                    this.log('AJAXRequest.responseAsJSON: Unable to convert server response to JSON object!','warning',true);
                }
                return undefined;
            },
            writable:false,
            enumerable: true
        },
        setOnServerError:{
            /**
            * Append a function to the pool of functions that will be called in case of 
            * server error (code 5xx). 
            * @param {Function} callback A function to call on server error. If this 
            * @param {Boolean} call If true, the method will be called. Else if false,
            * the method will be not called.
            * @returns {undefined|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value:function(callback,call=true){
                if (typeof callback === 'function') {
                    var id = this.onservererrorpool[this.onservererrorpool.length - 1]['id'] + 1; 
                    this.onservererrorpool.push({'id':id,'call':call,'func':callback});
                    this.log('AJAXRequest.setOnServerError: New callback added [id = '+id+' , call = '+call+'].','info');
                    return id;
                } else {
                    this.log('AJAXRequest.setOnServerError: Provided parameter is not a function.','warning');
                }
                return undefined;
            },
            writable:false,
            enumerable: true
        },
        removeCall:{
            /**
            * Removes a callback function from a specific pool given its ID.
            * @param {String} pool_name The name of the pool. It should be one of the 
            * values in the array AJAXRequestCALLBACK_POOLS.
            * @param {Number} id The ID of the callback function.
            * @returns {undefined}
            */
            value:function(pool_name,id){
                if (pool_name !== undefined && pool_name !== null) {
                    if (typeof pool_name === 'string'){
                        pool_name = pool_name.toLowerCase();
                        if (AJAXRequest.CALLBACK_POOLS.indexOf(pool_name) !== -1) {
                            pool_name = 'on'+pool_name+'pool';
                            for (var x = 0 ; x < this[pool_name].length ; x++) {
                                if (this[pool_name][x]['id'] === id) {
                                    return this[pool_name].pop(this[pool_name][x]);
                                }
                            }
                            this.log('AJAXRequest.removeCall: No callback was found with ID = '+id+' in the pool \''+pool_name+'\'','error');
                        } else {
                            noSuchPool(pool_name);
                        }
                    } else {
                        this.log('AJAXRequest.removeCall: Invalid pool name type. Pool name must be string.','error');
                    }
                } else {
                    noSuchPool(pool_name);
                }
            },
            writable:false,
            enumerable: true
        },
        disableCallExcept:{
            /**
            * Disable all callback functions except the one that its ID is given.
            * @param {String} pool_name The name of the pool. It should be a value from 
            * the array AJAXRequestCALLBACK_POOLS.
            * @param {Number} id The ID of the function that was provided when the function 
            * was added to the pool. If the ID does not exist, All callbacks will be disabled.
            * @returns {undefined}
            */
            value:function(pool_name,id=-1){
                if (pool_name !== undefined && pool_name !== null) {
                    if (typeof pool_name === 'string') {
                        pool_name = pool_name.toLowerCase();
                        if (AJAXRequest.CALLBACK_POOLS.indexOf(pool_name) !== -1) {
                            pool_name = 'on'+pool_name+'pool';
                            for (var x = 0 ; x < this[pool_name].length ; x++) {
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
                        this.log('AJAXRequest.disableCallExcept: Invalid pool name type. Pool name must be string.','error');
                    }
                } else {
                    noSuchPool(pool_name);
                }
            },
            writable:false,
            enumerable: true
        },
        setCallEnabled:{
            /**
            * Enable or disable a callback on specific pool.
            * @param {String} pool_name The name of the pool. It must be one of the 
            * values in the aray AJAXRequest.CALLBACK_POOLS.
            * @param {Number} id The ID of the callback. It is given when the callback 
            * was added.
            * @param {Boolean} call If set to true, the function will be called. Else 
            * if it is set to false, it will be not called.
            * @returns {undefined}
            */
            value:function(pool_name,id,call=true){
                if (pool_name !== undefined && pool_name !== null) {
                    if (typeof pool_name === 'string') {
                        pool_name = pool_name.toLowerCase();
                        if (AJAXRequest.CALLBACK_POOLS.indexOf(pool_name) !== -1) {
                            pool_name = 'on'+pool_name+'pool';
                            for (var x = 0 ; x < this[pool_name].length ; x++) {
                                if (this[pool_name][x]['id'] === id) {
                                    this[pool_name][x]['call'] = call;
                                    return;
                                }
                            }
                            this.log('AJAXRequest.setCallEnabled: No callback was found with ID = '+id+' in the pool \''+pool_name+'\'','warning');
                        } else {
                            noSuchPool(pool_name);
                        }
                    } else {
                        this.log('AJAXRequest.setCallEnabled: Invalid pool name type. Pool name must be string.','error');
                    }
                } else {
                    noSuchPool(pool_name);
                }
            },
            writable:false,
            enumerable: true
        },
        getCallBack:{
            /**
            * Returns an object that contains the information of a callback function. 
            * @param {type} pool_name The name of the pool. It must be in the array 
            * AJAXRequest.CALLBACK_POOLS.
            * @param {Number} id The ID of the callback.
            * @returns {Object|undefined} Returns an object that contains the 
            * information of the callback. If it is not found, or the pool name is invalid, 
            * the method will show a warning in the console and returns undefined.
            */
            value:function(pool_name,id){
                if (pool_name !== undefined && pool_name !== null) {
                    if (typeof pool_name === 'string') {
                        pool_name = pool_name.toLowerCase();
                        if (AJAXRequest.CALLBACK_POOLS.indexOf(pool_name) !== -1) {
                            pool_name = 'on'+pool_name+'pool';
                            for (var x = 0 ; x < this[pool_name].length ; x++) {
                                if (this[pool_name][x]['id'] === id) {
                                    return this[pool_name][x];
                                }
                            }
                            this.log('AJAXRequest.getCallBack: No callback was found with ID = '+id+' in the pool \''+pool_name+'\'','warning');
                        } else {
                            noSuchPool(pool_name);
                        }
                    } else {
                        this.log('AJAXRequest.getCallBack: Invalid pool name type. Pool name must be string.','error');
                    }
                } else {
                    noSuchPool(pool_name);
                }
            },
            writable:false,
            enumerable: true
        },
        setOnClientError:{
            /**
            * Append a function to the pool of functions that will be called in case of 
            * client error (code 4xx). 
            * @param {Boolean} call If true, the method will be called. Else if i i false,
            * the method will be not called.
            * @param {Function} callback A function to call on client error.
            * @returns {undefined|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value:function(callback,call=true){
                if (typeof callback === 'function') {
                    var id = this.onclienterrorpool[this.onclienterrorpool.length - 1]['id'] + 1; 
                    this.onclienterrorpool.push({'id':id,'call':call,'func':callback});
                    this.log('AJAXRequest.setOnClientError: New callback added [id = '+id+' , call = '+call+'].','info');
                    return id;
                } else {
                    this.log('AJAXRequest.setOnClientError: Provided parameter is not a function.','error');
                }
            },
            writable:false,
            enumerable: true
        },
        setBeforeAjax:{
            /**
            * Append a function to the pool of functions that will be called before 
            * ajax request is sent to the server.  
            * @param {Function} callback A function to call before ajax request is 
            * sent to the server.
            * @param {Boolean} call If set to true, the callback will be called. If false, 
            * it woun't be called.
            * @returns {undefined|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value:function(callback,call=true){
                if (typeof callback === 'function') {
                    var id = this.onbeforeajaxpool[this.onbeforeajaxpool.length - 1]['id'] + 1; 
                    this.onbeforeajaxpool.push({'id':id,'call':call,'func':callback});
                    this.log('AJAXRequest.setBeforeAjax: New callback added [id = '+id+' , call = '+call+'].','info');
                    return id;
                } else {
                    this.log('AJAXRequest.setBeforeAjax: Provided parameter is not a function.','error');
                }
            },
            writable:false,
            enumerable: true
        },
        setAfterAjax:{
            /**
            * Append a function to the pool of functions that will be called after 
            * ajax request is finished regardless of the status. 
            * @param {Function} callback A function to call after AJAX request is finished.
            * @returns {undefined|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            * @param {Boolean} call If set to true, the callback will be called. If false, 
            * it woun't be called.
            */
            value:function(callback,call=true){
                if (typeof callback === 'function') {
                    var id = this.onafterajaxpool[this.onafterajaxpool.length - 1]['id'] + 1; 
                    this.onafterajaxpool.push({'id':id,'call':call,'func':callback});
                    this.log('AJAXRequest.setAfterAjax: New callback added [id = '+id+' , call = '+call+'].','info');
                    return id;
                } else {
                    this.log('AJAXRequest.setAfterAjax: Provided parameter is not a function.','error');
                }
            },
            writable:false,
            enumerable: true
        },
        setOnError:{
            /**
            * Append a function to the pool of functions that will be called in case 
            * one of the callbacks on the instance thrown an exception. 
            * 
            * @param {Function} callback A function to call.
            * 
            * @returns {undefined|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            * 
            * @param {Boolean} call If set to true, the callback will be called. If false, 
            * it woun't be called.
            */
            value:function(callback,call=true){
                if (typeof callback === 'function') {
                    var id = this.onerrorpool[this.onerrorpool.length - 1]['id'] + 1; 
                    this.onerrorpool.push({'id':id,'call':call,'func':callback});
                    this.log('AJAXRequest.setOnError: New callback added [id = '+id+' , call = '+call+'].','info');
                    return id;
                } else {
                    this.log('AJAXRequest.setOnError: Provided parameter is not a function.','error');
                }
            },
            writable:false,
            enumerable: true
        },
        getCsrfToken: {
            value:function(){
                this.log('AJAXRequest.getCsrfToken: Searching for CSRF token value.','info');
                this.log('AJAXRequest.getCsrfToken: Checking "window.csrfToken"...','info');
                if (window.csrfToken === undefined || window.csrfToken === null) {
                    this.log('AJAXRequest.getCsrfToken: It is not set.','warning');
                    this.log('AJAXRequest.getCsrfToken: Searching for meta tag with name = "csrf-token"...','info');
                    var csrfEl = document.querySelector('meta[name="csrf-token"]');
                    if (csrfEl === null) {
                        this.log('AJAXRequest.getCsrfToken: Element not found.','warning');
                        this.log('AJAXRequest.getCsrfToken: Searching for input element with name = "csrf-token"...', '');
                        var csrfEl = document.querySelector('input[name="csrf-token"]');
                        if (csrfEl === null) {
                            this.log('AJAXRequest.getCsrfToken: Element not found.','warning');
                            this.log('AJAXRequest.getCsrfToken: CSRF token not found.', 'warning');
                            var csrfEl = document.querySelector('input[name="csrf-token"]');
                        } else {
                            this.log('AJAXRequest.getCsrfToken: Checking the value of the attribute "value"...','info');
                            window.csrfToken = csrfEl.getAttribute('value');
                            if (window.csrfToken) {
                                this.log('AJAXRequest.getCsrfToken: CSRF token found.','info');
                            }
                        }
                    } else {
                        this.log('AJAXRequest.getCsrfToken: Checking the value of the attribute "content"...','info');
                        window.csrfToken = csrfEl.getAttribute('content');
                        if (window.csrfToken) {
                            this.log('AJAXRequest.getCsrfToken: CSRF token found.','info');
                        } else {
                            this.log('AJAXRequest.getCsrfToken: The attribute "content" has no value.','warning');
                            this.log('AJAXRequest.getCsrfToken: Searching for input element with name = "csrf-token"...', '');
                            var csrfEl = document.querySelector('input[name="csrf-token"]');
                            if (csrfEl === null) {
                                this.log('AJAXRequest.getCsrfToken: Element not found.','warning');
                                this.log('AJAXRequest.getCsrfToken: CSRF token not found.', 'warning');
                                var csrfEl = document.querySelector('input[name="csrf-token"]');
                            } else {
                                this.log('AJAXRequest.getCsrfToken: Checking the value of the attribute "value"...','info');
                                window.csrfToken = csrfEl.getAttribute('value');
                                if (window.csrfToken) {
                                    this.log('AJAXRequest.getCsrfToken: CSRF token found.','info');
                                }
                            }
                        }
                    }
                } else {
                    this.log('AJAXRequest.getExtractCsrfToken: CSRF token found.','info');
                }
                return window.csrfToken;
            },
            writable:false,
            enumerable: true
        },
        addHeader:{
            /**
             * Adds new custom header to the request.
             * The custom header will be sent once the method 'AJAXRequest.send()' is called.
             * @param {String} name The name of the header. It must be non-empty string.
             * @param {String} value The value of the header.
             * @return {Boolean} If the header is added, the method will return true. 
             * If not added, the method will return false.
             */
            value:function(name, value) {
                this.log('AJAXRequest.addHeader: Trying to add new header with name "'+name+'" and value "'+value+'".', 'info');
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
            writable:false,
            enumerable: true
        },
        setOnSuccess:{
            /**
            * Append a function to the pool of functions that will be called in case of 
            * successfull request (code 2xx). 
            * @param {Boolean} call If true, the method will be called. Else if i i false,
            * the method will be not called.
            * @param {Function} callback A function to call on success.
            * @returns {undefined|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value:function(callback,call=true){
                if (typeof callback === 'function') {
                    var id = this.onsuccesspool[this.onsuccesspool.length - 1]['id'] + 1; 
                    this.onsuccesspool.push({'id':id,'call':call,'func':callback});
                    this.log('AJAXRequest.setOnSuccess: New callback added [id = '+id+' , call = '+call+'].','info');
                    return id;
                } else {
                    this.log('AJAXRequest.setOnSuccess: Provided parameter is not a function.','error');
                }
            },
            writable:false,
            enumerable: true
        },
        setOnDisconnected:{
            /**
            * Append a function to the pool of functions that will be called in case of 
            * internec connection is lost (code 0). 
            * @param {Boolean} call If true, the method will be called. Else if false,
            * the method will be not called.
            * @param {Function} callback A function to call on lost connection event.
            * @returns {undefined|Number} Returns an ID for the function. If not added, 
            * the method will return undefined.
            */
            value:function(callback,call=true){
                if(typeof callback === 'function'){
                    var id = this.onconnectionlostpool[this.onconnectionlostpool.length - 1]['id'] + 1; 
                    this.onconnectionlostpool.push({'id':id,'call':call,'func':callback});
                    this.log('AJAXRequest.setOnDisconnected: New callback added [id = '+id+' , call = '+call+'].','info');
                    return id;
                } else {
                    this.log('AJAXRequest.setOnDisconnected: Provided parameter is not a function.','error');
                }
            },
            writable:false,
            enumerable: true
        },
        setReqMethod:{
            /**
            * Sets the request method.
            * @param {String} method get, post or delete. If the request method is not 
            * supported, A warning will be shown in the console and default (GET) will 
            * be used.
            * @returns {undefined}
            */
            value:function(method){
                if (method !== undefined && method !== null) {
                    method = method.toUpperCase();
                    if(method === 'GET' || method === 'POST' || method === 'DELETE' || method === 'PUT' || method === 'HEAD' || method === 'OPTIONS'){
                        this.method = method;
                        this.log('AJAXRequest.setReqMethod: Request method is set to '+method+'.','info');
                    } else {
                        this.log('AJAXRequest.setReqMethod: Null, undefined or unsupported method. GET is set as default.','warning',true);
                        this.method = 'GET';
                    }
                } else {
                    this.log('AJAXRequest.setReqMethod: Null, undefined or unsupported method. GET is set as default.','warning',true);
                    this.method = 'GET';
                }
            },
            writable:false,
            enumerable: true
        },
        getReqMethod:{
            /**
            * Returns request method.
            * @returns {String}
            */
            value:function(){
                return this.method;
            },
            writable:false,
            enumerable: true
        },
        setURL:{
            /**
            * Sets AJAX request URL (or URI)
            * @param {String} url
            * @returns {undefined}
            */
            value:function(url){
                while (url[0] === '/') {
                    url = url.substring(1, url.length);
                }
                this.url = url;
                this.log('AJAXRequest.setURL: URL is set to \''+url+'\'.','info');
            },
            writable:false,
            enumerable: true
        },
        getURL:{
            /**
            * Returns request URL.
            * @returns {String}
            */
            value:function(){
                return this.url;
            },
            writable:false,
            enumerable: true
        },
        setParams:{
            /**
            * Sets request payload that will be send with it.
            * @param {String|FormData|Object} params
            * @returns {undefined}
            */
            value:function(params){
                if (params !== undefined && params !== null) {
                    this.params = params;
                    this.log('AJAXRequest.setParams: Parameters updated.','info');
                } else {
                    this.log('AJAXRequest.setParams: Cannot set parameters to null or undefined.','warning');
                }
            },
            writable:false,
            enumerable: true
        },
        getParams:{
            /**
            * Returns request payload.
            * @returns {String}
            */
            value:function(){
                return this.params;
            },
            writable:false,
            enumerable: true
        },
        getRequestURL:{
            /**
            * Returns a string that represents the URL at which AJAX request will be send to.
            * 
            * @returns {String} A string such as 'https://example.com/apis/get-user'.
            */
             value:function(){
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
                        var requestUrl = base+'/'+url;
                    }
                }
                return requestUrl;
            },
            writable:false,
            enumerable: true
        },
        send:{
            /**
            * Send AJAX request to the server.
            * @returns {Boolean} True in case of the status of AJAX request is open. 
            * else, it will return false.
            */
            value:function(){
                this.log('AJAXRequest.send: Executing bofe AJAX callbacks...','info');
                for (var i = 0 ; i < this.onbeforeajaxpool.length ; i++) {
                    this.onbeforeajaxpool[i].AJAXRequest = this;
                    if(this.onbeforeajaxpool[i].call === true){
                        this.onbeforeajaxpool[i].func();
                    }
                }
                this.log('AJAXRequest.send: Finished executing the before AJAX callbacks.','info');
                this.log('AJAXRequest.send: Checking if AJAX is enabled....','info');
                if (this.isEnabled()) {
                    this.log('AJAXRequest.send: It is enabled.','info');
                    var method = this.getReqMethod();
                    var params = this.getParams();
                    var url = this.getURL();
                    var base = this.getBase();
                    var requestUrl = this.getRequestURL();

                    this.log('AJAXRequest.send: Params: '+params,'info');
                    this.log('AJAXRequest.send: Request Method: '+method,'info');
                    this.log('AJAXRequest.send: Base: '+base,'info');
                    this.log('AJAXRequest.send: URL: '+url,'info');
                    this.log('AJAXRequest.send: Request URL: '+requestUrl,'info');

                    this.xhr.log = this.log;
                    this.xhr.onreadystatechange = this.onreadystatechange;
                    this.xhr.onload = this.onload;
                    this.xhr.onprogress = this.onprogress;
                    this.xhr.onsuccesspool = this.onsuccesspool;
                    this.xhr.onservererrorpool = this.onservererrorpool;
                    this.xhr.onclienterrorpool = this.onclienterrorpool;
                    this.xhr.onconnectionlostpool = this.onconnectionlostpool;
                    this.xhr.onafterajaxpool = this.onafterajaxpool;
                    this.xhr.onerrorpool = this.onerrorpool;
                    this.xhr.verbose = this.verbose;
                    this.log('AJAXRequest.send: Checking parameters type...', 'info');
                    if (typeof this.params === 'object' && this.params.toString() !== '[object FormData]') {
                        this.log('AJAXRequest.send: An object is given. Extracting values...', 'info');
                        if (method === 'PUT' || method === 'POST') {
                            this.log('AJAXRequest.send: Will store parameters in FormData since request method is '+method+'.', 'info');
                            var localParams = new FormData();
                        } else {
                            var localParams = '';
                        }
                        var keys = Object.keys(this.params);
                        var and = '';
                        for (var x = 0 ; x < keys.length ; x++) {
                            var paramVal = this.params[keys[x]];
                            
                            if (paramVal !== undefined && paramVal !== null) {
                                this.log('AJAXRequest.send: Parameter as string: '+paramVal.toString());
                                if (Array.isArray(paramVal)) {
                                    this.log('AJAXRequest.send: Array is found. Turning it to string-like array.', 'info');
                                    //Turn the array to array-like string
                                    var toAppend = '[';
                                    var comma = '';
                                    for (var y = 0 ; y < paramVal.length ; y++) {
                                        if (typeof paramVal[y] === 'string') {
                                            toAppend += comma+'"'+encodeURIComponent(paramVal[y])+'"';
                                        } else if (typeof paramVal[y] === 'number') {
                                            toAppend += comma+paramVal[y];
                                        } else if (typeof paramVal[y] === 'boolean') {
                                            toAppend += paramVal[y] ? comma+'true' : comma+'false';
                                        }
                                        comma = ',';
                                    }
                                    toAppend += ']';
                                    if (typeof localParams === 'object') {
                                        localParams.append(keys[x], encodeURIComponent(toAppend));
                                    } else {
                                        localParams += and+encodeURIComponent(keys[x])+'='+encodeURIComponent(toAppend);
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
                                        localParams += and+encodeURIComponent(keys[x])+'='+encodeURIComponent(this.params[keys[x]]);
                                    }
                                }
                                and = '&';
                            } else {
                                this.log('AJAXRequest.send: The value of the parameter "'+keys[x]+'" is undefined or null. It will be not included in the request.', 'warning', true);
                            }
                        }
                        this.log('AJAXRequest.send: Extracted. Result = '+localParams, 'info');
                    } else {
                        this.log('AJAXRequest.send: Form data or string is given.', 'info');
                        var localParams = this.params;
                    }
                    
                    if (method === 'GET' || method === 'DELETE') {
                        if(localParams !== undefined && localParams !== null && localParams !== ''){
                            this.xhr.open(method,requestUrl+'?'+localParams);
                        } else {
                            this.xhr.open(method,requestUrl);
                        }
                        if (method === 'DELETE') {
                            //Add CSRF token.
                            var csrfTok = this.getCsrfToken();
                            if (csrfTok) {
                                this.xhr.setRequestHeader('X-CSRF-TOKEN', csrfTok);
                            }
                        }
                        var customHeadersKeys = Object.keys(this.customHeaders);
                        if (customHeadersKeys.length > 0) {
                            this.log('AJAXRequest.send: Adding custom headers to request..','info');
                        }
                        for (var x = 0 ; x < customHeadersKeys.length ; x++) {
                             this.xhr.setRequestHeader(customHeadersKeys[x], this.customHeaders[customHeadersKeys[x]]);
                        }
                        this.xhr.send();
                        return true;
                    } else if (method === 'POST' || method === 'PUT'){
                        this.xhr.open(method,requestUrl);
                        
                        //Add CSRF token.
                        var csrfTok = this.getCsrfToken();
                        if (csrfTok) {
                            this.xhr.setRequestHeader('X-CSRF-TOKEN', csrfTok);
                        }
                        if(localParams.toString() !== '[object FormData]'){
                            this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                            this.log('AJAXRequest.send: Setting header \'Content-Type\' to \'application/x-www-form-urlencoded\'.','info');
                        }
                        var customHeadersKeys = Object.keys(this.customHeaders);
                        if (customHeadersKeys.length > 0) {
                            this.log('AJAXRequest.send: Adding custom headers to request..','info');
                        }
                        for (var x = 0 ; x < customHeadersKeys.length ; x++) {
                             this.xhr.setRequestHeader(customHeadersKeys[x], this.customHeaders[customHeadersKeys[x]]);
                        }
                        this.xhr.send(localParams);
                        return true;
                    } else {
                        this.xhr.open(method,requestUrl);
                        this.xhr.send();
                    }
                } else{
                    this.log('AJAXRequest.send: AJAX is disabled.','info',true);
                }
                return false;
            },
            writable:false,
            enumerable: true
        },
        setEnabled:{
            /**
            * Enable or disable AJAX.
            * @param {Boolean} boolean True to enable AJAX. False to disable. If 
            * other value is given, AJAX will be enabled.
            * @returns {undefined}
            */
            value:function(boolean){
                if(boolean === true){
                    this.enabled = true;
                    this.log('AJAXRequest.setEnabled: AJAX is enabled.','info');
                } else if (boolean === false){
                    this.enabled = false;
                    this.log('AJAXRequest.setEnabled: AJAX is disabled.','info');
                } else {
                    this.enabled = true;
                    this.log('AJAXRequest.setEnabled: AJAX is enabled.','info');
                }
            },
            writable:false,
            enumerable: true
        },
        xhr:{
            /**
            * The XMLHttpRequest object that is used to send AJAX.
            */
            value:AJAXRequest.createXhr(),
            writable:false,
            enumerable: true
        }
    });
    //configuration 
    if (this.xhr === false || this.xhr === undefined || this.xhr === null) {
        this.log('AJAXRequest: Unable to creeate xhr object! Browser does not support it.','error',true);
        return;
    }
    var instance = this;
    var a = function() {
        instance.setResponse(instance.xhr.responseText);
    };
    this.verbose= config.verbose;
    if (this.verbose === true) {
        this.log('AJAXRequest: Verbose mode is enabled. More messages will be shown in the console.');
    }
    this.setOnSuccess(a);
    this.setOnServerError(a);
    this.setOnClientError(a);
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
        for (var x = 0 ; x < keys.length ; x++) {
            instance.addHeader(keys[x], config.headers[keys[x]]);
        }
    }
    
    //Add callbacks
    if (Array.isArray(config.beforeAjax)) {
        config.beforeAjax.forEach((callback) => {
            instance.setBeforeAjax(callback);
        });
    } else if (typeof config.beforeAjax === 'function') {
        instance.setBeforeAjax(config.beforeAjax);
    }
    
    if (Array.isArray(config.onSuccess)) {
        config.onSuccess.forEach((callback) => {
            instance.setOnSuccess(callback);
        });
    } else if (typeof config.onSuccess === 'function') {
        instance.setOnSuccess(config.onSuccess);
    }
    
    if (Array.isArray(config.onClientErr)) {
        config.onClientErr.forEach((callback) => {
            instance.setOnClientError(callback);
        });
    } else if (typeof config.onClientErr === 'function') {
        instance.setOnClientError(config.onClientErr);
    }
    
    if (Array.isArray(config.onServerErr)) {
        config.onServerErr.forEach((callback) => {
            instance.setOnServerError(callback);
        });
    } else if (typeof config.onServerErr === 'function') {
        instance.setOnServerError(config.onServerErr);
    }
    
    if (Array.isArray(config.onDisconnected)) {
        config.onDisconnected.forEach((callback) => {
            instance.setOnDisconnected(callback);
        });
    } else if (typeof config.onDisconnected === 'function') {
        instance.setOnDisconnected(config.onDisconnected);
    }
    
    if (Array.isArray(config.afterAjax)) {
        config.afterAjax.forEach((callback) => {
            instance.setAfterAjax(callback);
        });
    } else if (typeof config.afterAjax === 'function') {
        instance.setAfterAjax(config.afterAjax);
    }
    
    if (Array.isArray(config.onErr)) {
        config.onErr.forEach((callback) => {
            instance.setOnError(callback);
        });
    } else if (typeof config.onErr === 'function') {
        instance.setOnError(config.onErr);
    }
}
