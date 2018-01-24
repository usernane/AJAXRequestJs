
"use strict";
/**
 * A class that can be used to simplfy AJAX requests.
 * @version 0.0.1
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
    this.onsuccesspool = [function(code=''){
        console.info('AJAX: Success '+code);
    }];
    /**
     * A pool of functions to call in case of server error.
     */
    this.onservererrorpool = [function(code=''){
        console.info('AJAX: Server Error '+code);
    }];
    /**
     * A pool of functions to call in case of client error.
     */
    this.onclienterrorpool = [function(code=''){
        console.info('AJAX: Client Error '+code);
    }];
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
                this.onsuccesspool[i](this.status);
            }
        }
        else if(this.readyState === 4 && this.status >= 400 && this.status < 500){
            console.info('AJAX: Ready State = 4 (DONE)');
            for(var i = 0 ; i < this.onsuccesspool.length ; i++){
                this.onclienterrorpool[i](this.status);
            }
        }
        else if(this.readyState === 4 && this.status >= 300 && this.status < 400){
            console.info('AJAX: Ready State = 4 (DONE)');
            console.info('Redirect');
        }
        else if(this.readyState === 4 && this.status >= 500 && this.status < 600){
            console.info('AJAX: Ready State = 4 (DONE)');
            for(var i = 0 ; i < this.onsuccesspool ; i++){
                this.onservererrorpool[i](this.status);
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
        var XMLHttpFactories = [
            function () {return new XMLHttpRequest();}
        ];
        for(var i = 0 ; i < XMLHttpFactories.length ; i++){
            try{
                return XMLHttpFactories[i]();
            }
            catch(e){

            }
        }
        return false;
    };
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
     * parameter is not a function, a warning will be shown in the console.
     * @returns {undefined}
     */
    this.setOnServerError = function(callback){
        if(typeof callback === 'function'){
            this.onservererrorpool.push(callback);
        }
        else{
            console.warn('Provided parameter is not a function.');
        }
    };
    /**
     * Append a function to the pool of functions that will be called in case of 
     * client error (code 4xx). 
     * @param {Function} callback A function to call on client error. If this 
     * parameter is not a function, a warning will be shown in the console.
     * @returns {undefined}
     */
    this.setOnClientError = function(callback){
        if(typeof callback === 'function'){
            this.onclienterrorpool.push(callback);
        }
        else{
            console.warn('Provided parameter is not a function.');
        }
    };
    /**
     * Append a function to the pool of functions that will be called in case of 
     * successfull request (code 2xx). 
     * @param {Function} callback A function to call on server error. If this 
     * parameter is not a function, a warning will be shown in the console.
     * @returns {undefined}
     */
    this.setOnSuccess = function(callback){
        if(typeof callback === 'function'){
            this.onsuccesspool.push(callback);
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
                };
                this.setOnSuccess(a);
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