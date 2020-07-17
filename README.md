# AJAXRequest.js
A JavaScript class library that can help in making AJAX requests much simpler task in your website. 
<p align="left">
<img src="https://img.shields.io/jsdelivr/gh/hm/usernane/ajax?color=light-green">
</p>
The main aim of the library is to extend XHR feature which is offered by any modren web browser.

## Main features:
* Assign callbacks to execute on success, client error, server error or on disconnected.
* Logging support in console for development.
* Get server response as a JSON object or a plain text.
* Enable and disable callbacks as needed since every callback has an ID.
* Send custom headers to the server as needed.
* Ability to extract CSRF token and send it automatically.

## Installation
In order to use the library, you must first include the JavaScript file in your head tag of your web page:
``` html
<head>
  <script src="https://cdn.jsdelivr.net/gh/usernane/AJAXRequestJs@1.1.0/AJAXRequest.js"></script>
</head>
```
It is possible to use the minified version of the libray by including the following JavaScript:

``` html
<head>
  <script src="https://cdn.jsdelivr.net/gh/usernane/AJAXRequestJs@1.1.0/AJAXRequest.min.js"></script>
</head>
```

## Basic Usage
The following code sample shows the most basic usage of the library.
``` javascript
 var ajax = new AJAXRequest({
    
    //Request method of the request
    method:'get',
    
    //The URL that will receive the request.
    url:'https://api.github.com/repos/usernane/js-ajax-helper',
    
    //enable for development to get more informative messages in the console
    verbose:true
    
    //Adds one call back to execute on success. We can add more.
    onSuccess:[function(){
        //The response might be stored as JSON object
        if(this.jsonResponse){
            console.log(this.jsonResponse);
        } else {
            //Or, it can be plain
            console.log(this.response);
        }
    }]
}).send();

```
## Configuration
When creating an instance of the class `AJAXRequest`, there are configuration options which are optional. They can be used to initialize the attributes of the instance.

``` javascript
{
    //The URL that will receive the request.
    url:'https://example.com/api',
    
    //Request method. If not provided, 'GET' is used.
    method:'get',
    
    //Parameters which will be send with the request. It can be an object, a `FormData` object or string in the form `key1=value1&key2=value2`.
    params:{},
    
    //A boolean which is used to enable or disable AJAX.
    enabled:true,
    
    //If this one is set to true, more informative messages will appear in the console.
    verbose:false,
    
    //Extra headers to send with the request.
    headers:{},
    
    //A set of callbacks. The enabled ones will be executed before AJAX request is sent.
    //The developer can use them to collect user inputs or intrupt AJAX request and disable it before 
    //Sending it to server.
    beforeAjax:[], 
    
    //A set of callbacks. The enabled ones executed when the request is finished with status code 2xx or 3xx.
    onSuccess:[], 
    
    //A set of callbacks. The enabled ones executed when the request is finished with status code 4xx.
    onClientErr:[], 
    
    //A set of callbacks. The enabled ones executed when the request is finished with status code 5xx.
    onServerErr:[], 
    
    //A set of callbacks. The enabled ones executed when there is no interned connection.
    onDisconnected:[], 
    
    //A set of callbacks. The enabled ones executed when the request is finished without looking at the status of the response.
    afterAjax:[], 
}
```

## Properties Accessable in Callbacks
Inside the callback that will be executed, the developer will have access to the properties of AJAX request and its response. The developer can use the keyword `this` to access them. The available properties are as follows:

``` javascript
function () {
    
    //The instance of the class. Can be used to modify the attributes of the object within the callback.
    this.AJAXRequest;
    
    //Response status code such as 200 or 404.
    this.status;
    
    //Server response as string.
    this.response;
    
    //If the server sent the response as JSON, this attribute is set to JSON object. If not sent as JSON, it will be set to null.
    this.jsonResponse;
    
    //An object that contains response headers. The keys of the object are headers names and the values are headers values.
    this.responseHeaders;
}
```
Note that for the callbacks which are set to be executed before the AJAX request is sent to the server only the property `this.AJAXRequest` is available.


## Sending Parameters to Server
The class does support sending data using `GET`, `POST`, `OPTIONS`, `HEAD`, `PUT` or `DELETE` request methods. The data can be a simple string, an object or a `DataForm` object. 

### As a String
The following sample code shows how to send parameters to the server as an object. We use `packagist.org` public API in this example.
``` javascript
 var ajax = new AJAXRequest({
    method:'get',
    url:'https://packagist.org/packages/list.json'
});

// Adds a custom parameter.
ajax.setParams('vendor=webfiori');

ajax.setOnSuccess(function(){
    if(this.jsonResponse){
        // We must know the format of JSON object to get data.
        for(var x = 0 ; x < this.jsonResponse.packageNames.length ; x++) {
            console.log('Package #'+x+' Name: '+this.jsonResponse.packageNames[x]);
        }
    }
    else{
        console.warn('No JSON data was received.');
    }
});
ajax.send();
```

#### As an Object
The following sample code shows how to send parameters to the server as a JavaScript object.
``` javascript
 var ajax = new AJAXRequest({
    method:'get',
    url:'https://packagist.org/search.json'
});

// Adds a custom parameter.
var searchString = 'webfiori';
var seachObj = {
    q:searchString
};
ajax.setParams(seachObj);

ajax.setOnSuccess(function(){
    if (this.jsonResponse) {
        console.warn('Printing Search Results:');
        for(var x = 0 ; x < this.jsonResponse.results.length ; x++) {
            var searchResult = this.jsonResponse.results[x];
            console.warn('Result #'+x+' Info:');
            console.log('Package Name: '+searchResult.name);
            console.log('Description: '+searchResult.description);
            console.log('Link: '+searchResult.url);
            console.log('Total Downloads: '+searchResult.downloads);
        }
    } else {
        console.warn('No JSON data was received.');
    }
});
ajax.send();
```
#### As a `FormData` Object
`FormData` is usually used to send data to the server using `POST` or `PUT` to modify something in the database. Also, it can be used to upload files to the server. 


## Adding Custom Headers
It is possible to add custom headers to the request in two ways. One way is to use the configuration variable `headers` and the second one is to use the method `AJAXRequest.addHeader()`. The following example shows how to add headers using first way.
``` javascript
var ajax = new AJAXRequest({
    url:'https://example.com/api',
    method:'post',
    headers:{
        //The request will be sent with two additional headers.
        'custom-header-1':'Header value',
        'token':'Some token'
    },
    onSuccess:[
        function () {
            //...
        }
    ]
}).send();
```

The next example shows how to use second way.

``` javascript
var ajax = new AJAXRequest({
    url:'https://example.com/api',
    method:'post',
    onSuccess:[
        function () {
            //...
        }
    ]
});
ajax.addHeader('custom-header-1','Header value');
ajax.addHeader('token','Some token');
ajax.send();
```

## CSRF Token
The library can extract CSRF token from the DOM and send it with request headers automatically. In order for this to happen, the token must be stored somewhere. There are 3 ways at which the token can be kept in the client side:
* As a `meta` tag with `name="csrf-token` and `content="the_token"`.
* As an input element with `name="csrf-token` and `value="the_token"`.
* As a `window.csrfToken` variable. 
If one of the 3 is met, the token will be sent to the server in the headers. The name of the header will be `X-CSRF-TOKEN`. Note that the token must be created and set by the server. Also, note that it will be only sent with unsafe request methods (`PUT`,`POST` and `DELETE`).

## License
The project is licensed under MIT license.

