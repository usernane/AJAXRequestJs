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
  <script src="https://cdn.jsdelivr.net/gh/usernane/ajax@1.0.2/AJAX.js"></script>
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

## Sending Parameters to Server
The class does support sending data using `GET`, `POST`, `PUT` or `DELETE` request methods. The data can be a simple string, an object or a `DataForm` object. 
### As a String
The following sample code shows how to send parameters to the server as an object. We use `packagist.org` public API in this example.
``` javascript
 var ajax = new AJAX({
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
?q=webfiori
### As an Object
The following sample code shows how to send parameters to the server as a JavaScript object.
``` javascript
 var ajax = new AJAX({
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
    if(this.jsonResponse){
        console.warn('Printing Search Results:');
        for(var x = 0 ; x < this.jsonResponse.results.length ; x++) {
            var searchResult = this.jsonResponse.results[x];
            console.warn('Result #'+x+' Info:');
            console.log('Package Name: '+searchResult.name);
            console.log('Description: '+searchResult.description);
            console.log('Link: '+searchResult.url);
            console.log('Total Downloads: '+searchResult.downloads);
        }
    }
    else{
        console.warn('No JSON data was received.');
    }
});
ajax.send();
```
### As a `FormData` Object
`FormData` is usually used to send data to the server using `POST` or `PUT` to modify something in the database. Also, it can be used to upload files to the database. 
