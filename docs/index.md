# Constructor
<a href="">`AJAXRequest([config])`</a>
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
Note that for callback arrays, they can be a single callback instead of an array as of version 1.1.1.

# Constants
| Name | Description |
|------|-------------|
|`AJAXRequest.CALLBACK_POOLS`| An array that contains the names of pools that will store callbacks. |
|`AJAXRequest.META`| An object that holds meta information about the library. It includes the following values: <ul><li>`VERSION`: Library version number.</li><li>`REALSE_DATE` The date at which the library was released.</li><li>`CONTRIBUTORS`: An array that contains the names of people who have cotrubuted to the development of the library.</li></ul>|
|`AJAXRequest.CALLBACK_POOLS`| An array that contains the names of pools that will store callbacks. |
# Methods
* <a href="#addheadername-value">`AJAXRequest.addHeader(name, value)`</a>
* <a href="#disablecallexceptpool_nameid-1">`AJAXRequest.disableCallExcept(pool_name[,id=-1])`</a>
* <a href="#getcallbackpool_nameid">`AJAXRequest.getCallBack(pool_name,id)`</a>
* <a href="#getcsrftoken">`AJAXRequest.getCsrfToken()`</a>
* <a href="#getparams">`AJAXRequest.getParams()`</a>
* <a href="#getrequmethod">`AJAXRequest.getReqMethod()`</a>
* <a href="#getserverresponse">`AJAXRequest.getServerResponse()`</a>
* <a href="#geturl">`AJAXRequest.getURL()`</a>
* <a href="#logmessagetypeforce">`AJAXRequest.log(message[,type[,force]])`</a>
* <a href="#removecallpool_nameid">`AJAXRequest.removeCall(pool_name,id)`</a>
* <a href="#responseasjson">`AJAXRequest.responseAsJSON()`</a>
* <a href="#setcallenabledpool_nameidcall">`AJAXRequest.setCallEnabled(pool_name,id[,call])`</a>
* <a href="#setafterajaxcallbackcall">`AJAXRequest.setAfterAjax(callback[,call])`</a>
* <a href="#setbeforeajaxcallbackcall">`AJAXRequest.setBeforeAjax(callback[,call])`</a>
* <a href="#setenabledbool">`AJAXRequest.setEnabled(bool)`</a>
* <a href="#send">`AJAXRequest.send()`</a>
* <a href="#setonclienterrorcallbackcall">`AJAXRequest.setOnClientError(callback[,call])`</a>
* <a href="#setondisconnectedcallbackcall">`AJAXRequest.setOnDisconnected(callback[,call])`</a>
* <a href="#setonservererrorcallbackcall">`AJAXRequest.setOnServerError(callback[,call])`</a>
* <a href="#setonsuccesscallbackcall">`AJAXRequest.setOnSuccess(callback[,call])`</a>
* <a href="#setparamsparams">`AJAXRequest.setParams(params)`</a>
* <a href="#setrequmethodmethod">`AJAXRequest.setReqMethod(method)`</a>
* <a href="#seturlurl">`AJAXRequest.setURL(url)`</a>


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
## `AJAXRequest.responseAsJSON()`
## `AJAXRequest.setCallEnabled(pool_name,id[,call])`
## `AJAXRequest.setAfterAjax(callback[,call])`
## `AJAXRequest.setBeforeAjax(callback[,call])`
## `AJAXRequest.setEnabled(bool)`
## `AJAXRequest.send()`
## `AJAXRequest.setOnClientError(callback[,call])`
## `AJAXRequest.setOnDisconnected(callback[,call])`
## `AJAXRequest.setOnServerError(callback[,call])`
## `AJAXRequest.setOnSuccess(callback[,call])`
## `AJAXRequest.setParams(params)`
## `AJAXRequest.setReqMethod(method)`
## `AJAXRequest.setURL(url)`


