# js-ajax-helper
A JavaScript file that can help in making AJAX requests much simpler task in your website. 

The main aim of the library is to extend XHR feature which is offered by any modren web browser.

# Main features:
* Assign callbacks to execute on success, client error, server error or on disconnected.
* Logging support in console for development.

# Usage Example
In order to use the library, you must first include the JavaScript file in your head tag of your web page:
``` html
<head>
  <script src="AJAX.js"></script>
</head>
```

## Basic Usage
The following code sample shows the most basic usage of the library.
``` javascript
 var ajax = new AJAX({
    method:'get',
    url:'https://api.github.com/repos/usernane/js-ajax-helper',
    
    //enable for development to get more informative messages
    'enable-log':true
});

//Adds one success call back. We can add more.
ajax.setOnSuccess(function(){
    //The response might be stored as JSON object
    if(this.jsonResponse){
        console.log(this.jsonResponse);
    }
    else{
        //Or, it can be plain
        console.log(this.response);
    }
});

//send the request
ajax.send();

```
## More Complex Yet Simple
The following code sample shows more complex usage which sets a function to execute for diffrent HTTP codes.

``` javascript
 var ajax = new AJAX({
    method:'get',
    url:'https://api.github.com/repos/usernane/js-ajax-helper'
});

//A callback for 2xx and 3xx codes
ajax.setOnSuccess(function(){
    if(this.jsonResponse){
        //...
    }
    else{
        //...
    }
});

//A callback for 4xx codes
ajax.setOnClientError(function(){
    if(this.jsonResponse){
        //...
    }
    else{
        //...
    }
});

//A callback for 5xx codes
ajax.setOnServerError(function(){
    if(this.jsonResponse){
        //...
    }
    else{
        //...
    }
});

//A callback in case there was no internet connection with the server
ajax.setOnDisconnected(function(){
    if(this.jsonResponse){
        //...
    }
    else{
        //...
    }
});

//A callback that will be executed regardless of ajax status after it is completed.
ajax.setAfterAjax(function(){
    if(this.jsonResponse){
        //...
    }
    else{
        //...
    }
});

//send the request
ajax.send();

```
