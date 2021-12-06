# Table of Content
* [Constructor](#constructor)
* [Constants](#constants)
* [Methods](#methods)
  * <a href="#ajaxrequestaddheadername-value">`AJAXRequest.addHeader(name, value)`</a>
  * <a href="#ajaxrequestdisablecallexceptpool_nameid-1">`AJAXRequest.disableCallExcept(pool_name[,id=-1])`</a>
  * <a href="#ajaxrequestgetcallbackpool_nameid">`AJAXRequest.getCallBack(pool_name,id)`</a>
  * <a href="#ajaxrequestgetcsrftoken">`AJAXRequest.getCsrfToken()`</a>
  * <a href="#ajaxrequestgetparams">`AJAXRequest.getParams()`</a>
  * <a href="#ajaxrequestgetrequmethod">`AJAXRequest.getReqMethod()`</a>
  * <a href="#ajaxrequestgetserverresponse">`AJAXRequest.getServerResponse()`</a>
  * <a href="#ajaxrequestgeturl">`AJAXRequest.getURL()`</a>
  * <a href="#ajaxrequestlogmessagetypeforce">`AJAXRequest.log(message[,type[,force]])`</a>
  * <a href="#ajaxrequestremovecallpool_nameid">`AJAXRequest.removeCall(pool_name,id)`</a>
  * <a href="#ajaxrequestresponseasjson">`AJAXRequest.responseAsJSON()`</a>
  * <a href="#ajaxrequestsetcallenabledpool_nameidcall">`AJAXRequest.setCallEnabled(pool_name,id[,call])`</a>
  * <a href="#ajaxrequestsetafterajaxcallbackcall">`AJAXRequest.setAfterAjax(callback[,call])`</a>
  * <a href="#ajaxrequestsetbeforeajaxcallbackcall">`AJAXRequest.setBeforeAjax(callback[,call])`</a>
  * <a href="#ajaxrequestsetenabledbool">`AJAXRequest.setEnabled(bool)`</a>
  * <a href="#ajaxrequestsend">`AJAXRequest.send()`</a>
  * <a href="#ajaxrequestsetonerrorcallbackcall">`AJAXRequest.setOnError(callback[,call])`</a>
  * <a href="#ajaxrequestsetonclienterrorcallbackcall">`AJAXRequest.setOnClientError(callback[,call])`</a>
  * <a href="#ajaxrequestsetondisconnectedcallbackcall">`AJAXRequest.setOnDisconnected(callback[,call])`</a>
  * <a href="#ajaxrequestsetonservererrorcallbackcall">`AJAXRequest.setOnServerError(callback[,call])`</a>
  * <a href="#ajaxrequestsetonsuccesscallbackcall">`AJAXRequest.setOnSuccess(callback[,call])`</a>
  * <a href="#ajaxrequestsetparamsparams">`AJAXRequest.setParams(params)`</a>
  * <a href="#ajaxrequestsetrequmethodmethod">`AJAXRequest.setReqMethod(method)`</a>
  * <a href="#ajaxrequestseturlurl">`AJAXRequest.setURL(url)`</a>

# Constructor
## `AJAXRequest([config])`
Create an instance of the class. 
## Parameters:
### `config` [Optinal]
AJAX configuration object. The object can have the 
following properties:
<ul>
  <li><b>method</b>: Request method such as GET or POST.</li>
  <li><b>url</b>: The URL at which AJAX request will be sent to.</li>
  <li><b>params</b>: A parameters which will be sent with the request. It can be an object, a FormData or a query string.</li>
  <li><b>verbose</b>:A boolean Used for development. If set to true, more informative messages will appear in the console.</li>
  <li><b>headers</b>: An object that can hold custom headers that will be sent with the request. The keys of the object are headers names and the values are headers values.</li>
  <li><b>enabled</b>: A boolean to enable or disable AJAX.</li>
  <li><b>beforeAjax</b>: An array that contains one or more callbacks which will be executed before AJAX request is sent. The callbacks can be used to collect user inputs and do final configuration before sending the request to the server.</li>
  <li><b>onSuccess</b>: An array that contains one or more callbacks which will be executed when server sends the response code 2xx.</li>
  <li><b>onClientErr</b>: An array that contains one or more callbacks which will be executed when server sends the response code 4xx.</li>
  <li><b>onServerErr</b>: An array that contains one or more callbacks which will be executed when server sends the response code 5xx.</li>
  <li><b>onDisconnected</b>: An array that contains one or more callbacks which will be executed when there is no internet connection.</li>
  <li><b>afterAjax</b>: An array that contains one or more callbacks which will be executed after AJAX request is finishhed regrardless of status code.</li>
</ul>
<b>Note that for callback arrays, they can be a single callback instead of an array as of version 1.1.1.</b>

# Constants
| Name | Description |
|------|-------------|
|`AJAXRequest.CALLBACK_POOLS`| An array that contains the names of pools that will store callbacks. |
|`AJAXRequest.META`| An object that holds meta information about the library. It includes the following values: <ul><li>`VERSION`: Library version number.</li><li>`REALSE_DATE` The date at which the library was released.</li><li>`CONTRIBUTORS`: An array that contains the names of people who have cotrubuted to the development of the library.</li></ul>|
|`AJAXRequest.CALLBACK_POOLS`| An array that contains the names of pools that will store callbacks. |
# Methods


## `AJAXRequest.addHeader(name, value)`
Adds new custom header to the request. The custom header will be sent once the method <a href="#send">`AJAXRequest.send()`</a> is called.
### Parameters:
#### `name` : String 
The name of the header (such as `x-custom-header`). It must be non-empty string.
#### `value` : String
The value of the header (such as `Super Header`).

## `AJAXRequest.disableCallExcept(pool_name[,id=-1])`
Disable all callback functions except the one that its ID is given.

### Parameters:
#### `pool_name` : String 
The name of the pool. It should be a value from the array `AJAXRequest.CALLBACK_POOLS`.
#### `id` : Number 
The ID of the callback that was provided when the callback was added to the pool. If the ID does not exist or not provided, All callbacks in the pool will be disabled.

## `AJAXRequest.getCallBack(pool_name,id)`
Returns an object that contains the information of a callback function given its ID. 
### Parameters:
#### `pool_name` : String 
The name of the pool that has the given callback.
#### `id` : Number 
The ID of the callback that was provided when the callback was added to the pool.
### Returns: `Object|undefined`
Returns an object that contains the information of the callback. The returned object will have the following structure: 
``` javascript
{
  id:-1,
  call:bool,
  func:function(){}
}
```
The key `id` is the ID of the callback. The key `call` is a boolean. It is set to true if the callback will be executed. The key `func` is the actuall callback. If no callback is found which has the given ID or pool name is invalid, the method will show a warning in the console and returns `undefined`.

## `AJAXRequest.getCsrfToken()`
Try to extract CSRF token and return its value. In order for method to work, the token must be stored somewhere. There are 3 ways at which the token can be kept in the client side:
* As a `meta` tag with `name="csrf-token` and `content="the_token"`.
* As an input element with `name="csrf-token` and `value="the_token"`.
* As a `window.csrfToken` variable. 
### Returns: `String|undefined` 
If the token is extracted, the method will return the value of the token as string. Other than that, the method will return `undefined`.

## `AJAXRequest.getParams()`
Returns request payload.
### Returns: `String|FormData|Object` 
Debending on the type of payload which was set using the method <a href="#setparams">AJAXRequest.setParama()</a>, the method will return different resuult.

## `AJAXRequest.getReqMethod()`
Returns request method that will be used when sending AJAX request.
### Returns: `String`
The method will return a string such as `GET` or `POST`. Default value is `GET`.

## `AJAXRequest.getServerResponse()`
Return the value of the property serverResponse. Call this function after any complete AJAX request to get response load in case there is a load.
### Returns: `String`

## `AJAXRequest.getURL()`
Returns the URL at which AJAX request will be sent to.
### Returns: `String`

## `AJAXRequest.log(message[,type[,force]])`
Output a message in the browser's console. This method is usefule in development.
### Parameters:
#### `message` : `String`
The message that will be shown in the console.
#### `type` : `String` [Optional]
The type of the message. It can be 'info',  'error' or 'warning'. 
#### `force` : `Boolean` [Optional]
If set to true, the message will be shown even if verbose mode is disabled.

## `AJAXRequest.removeCall(pool_name,id)`
Removes a callback function from a specific pool given its ID.
### Parameters:
#### `pool_name` : `String`
The name of the pool. It should be one of the values in the array `AJAXRequest.CALLBACK_POOLS`.
#### `id` : `Number` 
The ID of the callback function.

## `AJAXRequest.responseAsJSON()`
Return a JSON object that represents response payload. The method will attempt to convert server response to JSON object. If it fails, it will return `undefined`.
### Returns: `Object|undefined`

## `AJAXRequest.setCallEnabled(pool_name,id[,call])`
Enable or disable a callback on specific pool.
### Parameters:
#### `pool_name` : `String`
The name of the pool. It should be one of the values in the array `AJAXRequest.CALLBACK_POOLS`.
#### `id` : `Number` 
The ID of the callback function.
#### `call` : `Boolean`
If set to true, the callback function will be enabled and executed. Else if it is set to false, it will be not called.

## `AJAXRequest.setAfterAjax(callback[,call])`
Append a function to the pool of functions that will be called after ajax request is finished regardless of the status. 
### Parameters:
####  `callback` : `Function`
A function to call after AJAX request is finished.
#### `call` : `Boolean` [Optional]
If set to true, the callback will be called. If false, it woun't be called. Default is `true`.
### Returns: `Number`
If the callback is added, the method will return a number that represents its ID. If not added, the method will return `undefined`.

## `AJAXRequest.setBeforeAjax(callback[,call])`
Append a function to the pool of functions that will be called before ajax request is sent. 
### Parameters:
####  `callback` : `Function`
A function to call before AJAX request is sent.
#### `call` : `Boolean` [Optional]
If set to true, the callback will be called. If false, it woun't be called. Default is `true`.
### Returns: `Number`
If the callback is added, the method will return a number that represents its ID. If not added, the method will return `undefined`.
## `AJAXRequest.setEnabled(bool)`
Enable or disable AJAX.
### Parameters:
#### `boolean` : `Boolean` 
True to enable AJAX. False to disable. If other value is given, AJAX will be enabled.

## `AJAXRequest.send()`
Send AJAX request to the server.
### Returns: `Boolean`
True in case of the status of AJAX request is open. else, it will return false.

## `AJAXRequest.setOnError(callback[,call])`
Append a function to the pool of functions that will be called in case of client error (code 4xx). 
### Parameters:
#### `callback` : `Function` 
A function to call on client error.
#### `call` : `Boolean` [Optional]
If true, the method will be called. Else if false is given, the method will be not called. Default value is `true`.
## Returns: `Number|undefined`
If the callback is added, the method will return a number that represents its ID. If not added, the method will return `undefined`.

## `AJAXRequest.setOnClientError(callback[,call])`
Append a function to the pool of functions that will be called in case one of the callbacks on the instance thrown an exception. 
### Parameters:
#### `callback` : `Function` 
A function to call on error.
#### `call` : `Boolean` [Optional]
If true, the method will be called. Else if false is given, the method will be not called. Default value is `true`.
## Returns: `Number|undefined`
If the callback is added, the method will return a number that represents its ID. If not added, the method will return `undefined`.

## `AJAXRequest.setOnDisconnected(callback[,call])`
Append a function to the pool of functions that will be called in case there is no internet connection. 
### Parameters:
#### `callback` : `Function` 
A function to call on disconnected.
#### `call` : `Boolean` [Optional]
If true, the method will be called. Else if false is given, the method will be not called. Default value is `true`.
## Returns: `Number|undefined`
If the callback is added, the method will return a number that represents its ID. If not added, the method will return `undefined`.

## `AJAXRequest.setOnServerError(callback[,call])`
Append a function to the pool of functions that will be called in case of server error (code 5xx). 
### Parameters:
#### `callback` : `Function` 
A function to call on server error.
#### `call` : `Boolean` [Optional]
If true, the method will be called. Else if false is given, the method will be not called. Default value is `true`.
## Returns: `Number|undefined`
If the callback is added, the method will return a number that represents its ID. If not added, the method will return `undefined`.

## `AJAXRequest.setOnSuccess(callback[,call])`
Append a function to the pool of functions that will be called in case of success (code 2xx or 3xx). 
### Parameters:
#### `callback` : `Function` 
A function to call on success.
#### `call` : `Boolean` [Optional]
If true, the method will be called. Else if false is given, the method will be not called. Default value is `true`.
## Returns: `Number|undefined`
If the callback is added, the method will return a number that represents its ID. If not added, the method will return `undefined`.

## `AJAXRequest.setParams(params)`
Sets request payload that will be send with it.
### Parameters:
#### `params` : `String|FormData|Object`
The parameters can be a simple string like `a=super`, A `FormData` object or a javaScript object. The object can have any type of data.

## `AJAXRequest.setReqMethod(method)`
Sets the request method.
### Parameters:
#### `method` : `String`
A string such as 'get', 'post' or 'delete'. If the request method is not valid, A warning will be shown in the console and default (which is 'GET') will be set.

## `AJAXRequest.setURL(url)`
Sets AJAX request URL (or URI)
### Parameters:
#### `url` : `String`
The URL that will receive AJAX request.

