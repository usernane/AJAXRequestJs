
"use strict";
/**
 * Names of pools of events.
 * @type Array
 */
AJAX.CALLBACK_POOLS = ['servererror','clienterror','success'];
/**
 * Array of functions used to create XMLHttpRequest object.
 * @type Array
 */
AJAX.XMLHttpFactories = [
    function (){return new XMLHttpRequest();},
    function (){return new ActiveXObject("Microsoft.XMLHTTP");},
    function (){return new ActiveXObject("MSXML2.XMLHTTP.3.0");}
];
/**
 * A class that can be used to simplfy AJAX requests.
 * @version 0.0.2
 * @author Ibrahim BinAlshikh <ibinshikh@hotmail.com>
 * @constructor
 * @returns {AJAX}
 */
function AJAX(){
    /**
     * Request method.
     */
    this.method = 'GET';
    /**
     * The URL of AJAX request
     */
    this.url = '';
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
            console.info('Uploaded: '+percentComplete+'%');
        }
    };
    /**
     * A pool of functions to call in case of successful request.
     */
    this.onsuccesspool = [
        {
            'id':0,
            'call':true,
            'func':function(code=''){
                console.info('AJAX: Success '+code);
            }
        }
    ];
    /**
     * A pool of functions to call in case of server error.
     */
    this.onservererrorpool = [
        {
            'id':0,
            'call':true,
            'func':function(code=''){
                console.info('AJAX: Server Error '+code);
            }
        }
    ];
    /**
     * A pool of functions to call in case of client error.
     */
    this.onclienterrorpool = [
        {
            'id':0,
            'call':true,
            'func':function(code=''){
                console.info('AJAX: Client Error '+code);
            }
        }
    ];
    this.onreadystatechange = function(){
        if(this.readyState === 0){
            console.info('AJAX: Ready State = 0 (UNSENT)');
        }
        else if(this.readyState === 1){
            console.info('AJAX: Ready State = 1 (OPENED)');
        }
        else if(this.readyState === 2){
            console.info('AJAX: Ready State = 2 (HEADERS_RECEIVED)');
        }
        else if(this.readyState === 3){
            console.info('AJAX: Ready State = 3 (LOADING)');
        }
        else if(this.readyState === 4 && this.status >= 200 && this.status < 300){
            console.info('AJAX: Ready State = 4 (DONE)');
            for(var i = 0 ; i < this.onsuccesspool.length ; i++){
                if(this.onsuccesspool[i].call === true){
                    this.onsuccesspool[i].func(this.status);
                }
            }
        }
        else if(this.readyState === 4 && this.status >= 400 && this.status < 500){
            console.info('AJAX: Ready State = 4 (DONE)');
            for(var i = 0 ; i < this.onclienterrorpool.length ; i++){
                if(this.onclienterrorpool[i].call === true){
                    this.onclienterrorpool[i].func(this.status);
                }
            }
        }
        else if(this.readyState === 4 && this.status >= 300 && this.status < 400){
            console.info('AJAX: Ready State = 4 (DONE)');
            console.info('Redirect');
        }
        else if(this.readyState === 4 && this.status >= 500 && this.status < 600){
            console.info('AJAX: Ready State = 4 (DONE)');
            for(var i = 0 ; i < this.onsuccesspool ; i++){
                if(this.onsuccesspool[i].call === true){
                    this.onsuccesspool[i].func(this.status);
                }
            }
        }
        else if(this.readyState === 4){
            console.log('Status: '+this.status);
        }
    };
    /**
     * A factory function used to create XHR object for diffrent browsers.
     * @returns {Mixed} False in case of failure. Other than that, it will 
     * return XHR object that can be used to send AJAX.
     */
    function createXhr(){
        for(var i = 0 ; i < AJAX.XMLHttpFactories.length ; i++){
            try{
                return AJAX.XMLHttpFactories[i]();
            }
            catch(e){

            }
        }
        return false;
    };
    /**
     * A utility function used to show warning in the console about the existance 
     * of events pool.
     * @param {String} p_name The name of the pool.
     * @returns {undefined}
     */
    function noSuchPool(p_name){
        console.warn('No such bool: '+p_name);
        var pools = '';
        for(var x = 0 ; x < AJAX.CALLBACK_POOLS.length ; x++){
            if(x === AJAX.CALLBACK_POOLS.length - 1){
               pools += ' or '+ AJAX.CALLBACK_POOLS[x];
            }
            else{
                if(x === AJAX.CALLBACK_POOLS.length - 2){
                   pools += AJAX.CALLBACK_POOLS[x]; 
                }
                else{
                    pools += AJAX.CALLBACK_POOLS[x]+', ';
                }
            }
        }
        console.info('Pool name must be one of the following: '+pools);
    }
    /**
     * Sets the value of the property serverResponse. Do not call this function 
     * manually.
     * @param {String} response
     * @returns {undefined}
     */
    this.setResponse = function(response){
        this.serverResponse = response;
    };
    /**
     * Return the value of the property serverResponse. Call this function after 
     * any complete AJAX request to get response load in case there is a load.
     * @returns {String}
     */
    this.getServerResponse = function(){
        return this.serverResponse;
    };
    /**
     * Return a JSON representation of response payload in case it can be convirted 
     * into JSON object. Else, in case the payload cannot be convirted, it returns 
     * undefined.
     * @returns {Object|undefined}
     */
    this.responseAsJSON = function(){
        try{
            return JSON.parse(this.getServerResponse());
        }
        catch(e){
            console.warn('Unable to convirt server response to JSON object!');
        }
    };
    /**
     * Append a function to the pool of functions that will be called in case of 
     * server error (code 5xx). 
     * @param {Function} callback A function to call on server error. If this 
     * @param {Boolean} call If true, the method will be called. Else if i i false,
     * the method will be not called.
     * parameter is not a function, a warning will be shown in the console.
     * @returns {undefined|Number} Returns an ID for the function. If not added, 
     * the method will return undefined.
     */
    this.setOnServerError = function(callback,call=true){
        if(typeof callback === 'function'){
            var id = this.onservererrorpool[this.onservererrorpool.length - 1]['id'] + 1; 
            this.onservererrorpool.push({'id':id,'call':call,'func':callback});
            return id;
        }
        else{
            console.warn('Provided parameter is not a function.');
        }
    };
    /**
     * Removes a callback function from a specific pool given its ID.
     * @param {String} pool_name The name of the pool. It should be one of the 
     * values in the array AJAX.CALLBACK_POOLS.
     * @param {Number} id The ID of the callback function.
     * @returns {undefined}
     */
    this.removeCall = function(pool_name,id){
        if(pool_name !== undefined && pool_name !== null){
            if(typeof pool_name === 'string'){
                pool_name = pool_name.toLowerCase();
                if(AJAX.CALLBACK_POOLS.indexOf(pool_name) !== -1){
                    pool_name = 'on'+pool_name+'pool';
                    for(var x = 0 ; x < this[pool_name].length ; x++){
                        if(this[pool_name][x]['id'] === id){
                            this[pool_name].pop(this[pool_name][x]);
                            return;
                        }
                    }
                    console.warn('No callback was found with ID = '+id);
                }
                else{
                    noSuchPool(pool_name);
                }
            }
            else{
                console.warn('Invalid pool name type. Pool name must be string.');
            }
        }
        else{
            noSuchPool(pool_name);
        }
    };
    /**
     * Disable all callback functions except the one that its ID is given.
     * @param {String} pool_name The name of the pool. It should be a value from 
     * the array AJAX.CALLBACK_POOLS.
     * @param {Number} id The ID of the function that was provided when the function 
     * was added to the pool. If the ID does not exist, All callbacks will be disabled.
     * @returns {undefined}
     */
    this.disableCallExcept = function(pool_name,id){
        if(pool_name !== undefined && pool_name !== null){
            if(typeof pool_name === 'string'){
                pool_name = pool_name.toLowerCase();
                if(AJAX.CALLBACK_POOLS.indexOf(pool_name) !== -1){
                    pool_name = 'on'+pool_name+'pool';
                    for(var x = 0 ; x < this[pool_name].length ; x++){
                        if(this[pool_name][x]['id'] !== id){
                            this[pool_name][x]['call'] = false;
                        }
                        else{
                            this[pool_name][x]['call'] = true;
                        }
                    }
                }
                else{
                    noSuchPool(pool_name);
                }
            }
            else{
                console.warn('Invalid pool name type. Pool name must be string.');
            }
        }
        else{
            noSuchPool(pool_name);
        }
    },
    /**
     * Enable or disable a callback on specific pool.
     * @param {String} pool_name The name of the pool. It must be one of the 
     * values in the aray AJAX.CALLBACK_POOLS.
     * @param {Number} id The ID of the callback. It is given when the callback 
     * was added.
     * @param {Boolean} call If set to true, the function will be called. Else 
     * if it is set to false, it will be not called.
     * @returns {undefined}
     */
    this.setCallEnabled = function(pool_name,id,call=true){
        if(pool_name !== undefined && pool_name !== null){
            if(typeof pool_name === 'string'){
                pool_name = pool_name.toLowerCase();
                if(AJAX.CALLBACK_POOLS.indexOf(pool_name) !== -1){
                    pool_name = 'on'+pool_name+'pool';
                    for(var x = 0 ; x < this[pool_name].length ; x++){
                        if(this[pool_name][x]['id'] === id){
                            this[pool_name][x]['call'] = call;
                            return;
                        }
                    }
                    console.warn('No callback was found with ID = '+id);
                }
                else{
                    noSuchPool(pool_name);
                }
            }
            else{
                console.warn('Invalid pool name type. Pool name must be string.');
            }
        }
        else{
            noSuchPool(pool_name);
        }
    };
    /**
     * Returns an object that contains the information of a callback function. 
     * @param {type} pool_name The name of the pool. It must be in the array 
     * AJAX.CALLBACK_POOLS.
     * @param {Number} id The ID of the callback.
     * @returns {Object|undefined} Returns an object that contains the 
     * information of the callback. If it is not found, or the pool name is invalid, 
     * the method will show a warning in the console and returns undefined.
     */
    this.getCallBack = function(pool_name='',id){
        if(pool_name !== undefined && pool_name !== null){
            if(typeof pool_name === 'string'){
                pool_name = pool_name.toLowerCase();
                if(AJAX.CALLBACK_POOLS.indexOf(pool_name) !== -1){
                    pool_name = 'on'+pool_name+'pool';
                    for(var x = 0 ; x < this[pool_name].length ; x++){
                        if(this[pool_name][x]['id'] === id){
                            return this[pool_name][x];
                        }
                    }
                    console.warn('No callback was found with ID = '+id);
                }
                else{
                    noSuchPool(pool_name);
                }
            }
            else{
                console.warn('Invalid pool name type. Pool name must be string.');
            }
        }
        else{
            noSuchPool(pool_name);
        }
    };
    /**
     * Append a function to the pool of functions that will be called in case of 
     * client error (code 4xx). 
     * @param {Boolean} call If true, the method will be called. Else if i i false,
     * the method will be not called.
     * @param {Function} callback A function to call on client error. If this 
     * parameter is not a function, a warning will be shown in the console.
     * @returns {undefined|Number} Returns an ID for the function. If not added, 
     * the method will return undefined.
     */
    this.setOnClientError = function(callback,call=true){
        if(typeof callback === 'function'){
            var id = this.onclienterrorpool[this.onclienterrorpool.length - 1]['id'] + 1; 
            this.onclienterrorpool.push({'id':id,'call':call,'func':callback});
            return id;
        }
        else{
            console.warn('Provided parameter is not a function.');
        }
    };
    /**
     * Append a function to the pool of functions that will be called in case of 
     * successfull request (code 2xx). 
     * @param {Boolean} call If true, the method will be called. Else if i i false,
     * the method will be not called.
     * @param {Function} callback A function to call on server error. If this 
     * parameter is not a function, a warning will be shown in the console.
     * @returns {undefined|Number} Returns an ID for the function. If not added, 
     * the method will return undefined.
     */
    this.setOnSuccess = function(callback,call=true){
        if(typeof callback === 'function'){
            var id = this.onsuccesspool[this.onsuccesspool.length - 1]['id'] + 1; 
            this.onsuccesspool.push({'id':id,'call':call,'func':callback});
            return id;
        }
        else{
            console.warn('Provided parameter is not a function.');
        }
    };
    /**
     * Sets the request method.
     * @param {String} method get, post or delete. If the request method is not 
     * supported, A warning will be shown in the console and default (GET) will 
     * be used.
     * @returns {undefined}
     */
    this.setReqMethod = function(method){
        if(method !== undefined && method !== null){
            method = method.toUpperCase();
            if(method === 'GET' || method === 'POST' || method === 'DELETE'){
                this.method = method;
            }
        }
        else{
            console.warn('Null, undefined or unsupported method. GET is used.');
            this.method = 'GET';
        }
    };
    /**
     * Returns request method.
     * @returns {String}
     */
    this.getReqMethod = function(){
        return this.method;
    };
    /**
     * Sets AJAX request URL (or URI)
     * @param {String} url
     * @returns {undefined}
     */
    this.setURL = function(url){
        this.url = url;
    };
    /**
     * Returns request URL.
     * @returns {String}
     */
    this.getURL = function(){
        return this.url;
    };
    /**
     * Sets request payload that will be send with it.
     * @param {String} params
     * @returns {undefined}
     */
    this.setParams = function(params){
        this.params = params;
    };
    /**
     * Returns request payload.
     * @returns {String}
     */
    this.getParams = function(){
        return this.params;
    };
    /**
     * Send AJAX request to the server.
     * @returns {Boolean} True in case of the status of AJAX request is open. 
     * else, it will return false.
     */
    this.send = function(){
        if(this.isEnabled()){
            var method = this.getReqMethod();
            var params = this.getParams();
            var url = this.getURL();
            console.info('Ajax Params: '+params);
            console.info('Request Method: '+method);
            console.info('URL: '+url);
            var xhr = createXhr();
            if(xhr === false){
                console.error('Unable to creeate AJAX object! Browser not supported.');
            }
            else{
                var instance = this;
                var a = function(){
                    instance.setResponse(xhr.responseText);
                    instance.removeCall('onservererror',id1);
                    instance.removeCall('onsuccess',id2);
                    instance.removeCall('onclienterror',id3);
                };
                var id1 = this.setOnSuccess(a);
                var id2 = this.setOnServerError(a);
                var id3 = this.setOnClientError(a);
                xhr.onreadystatechange = this.onreadystatechange;
                xhr.onload = this.onload;
                xhr.onprogress = this.onprogress;
                xhr.onsuccesspool = this.onsuccesspool;
                xhr.onservererrorpool = this.onservererrorpool;
                xhr.onclienterrorpool = this.onclienterrorpool;
                if(method === 'GET' || method === 'DELETE'){
                    if(params !== undefined && params !== null && params !== ''){
                        xhr.open(method,url+'?'+params);
                    }
                    else{
                        xhr.open(method,url);
                    }
                    xhr.send();
                    return true;
                }
                else if(method === 'POST'){
                    xhr.open(method,url);
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    xhr.send(params);
                    return true;
                }
                else{
                    console.error('Method not supported: '+method);
                }
            }
        }
        else{
            console.warn('AJAX: AJAX is disabled.');
        }
        return false;
    };
    /**
     * Checks if AJAX is enabled or not.
     * @returns {Boolean}
     */
    this.isEnabled = function(){
        return this.enabled;
    };
    /**
     * Enable or disable AJAX.
     * @param {Boolean} boolean True to enable AJAX. False to disable.
     * @returns {undefined}
     */
    this.setEnabled = function(boolean){
        if(boolean === true){
            this.enabled = true;
        }
        else{
            this.enabled = false;
        }
    };
}