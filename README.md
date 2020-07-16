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

## Usage Example
In order to use the library, you must first include the JavaScript file in your head tag of your web page:
``` html
<head>
  <script src="https://cdn.jsdelivr.net/gh/usernane/ajax@1.1.0/AJAXRequest.js"></script>
</head>
```

### Basic Usage
The following code sample shows the most basic usage of the library.
``` javascript
 var ajax = new AJAXRequest({
    method:'get',
    url:'https://api.github.com/repos/usernane/js-ajax-helper',
    
    //enable for development to get more informative messages
    'enable-log':true
    
    //
    //Adds one success call back. We can add more.
    onSuccess:[function(){
        //The response might be stored as JSON object
        if(this.jsonResponse){
            console.log(this.jsonResponse);
        } else {
            //Or, it can be plain
            console.log(this.response);
        }
    }]
});



//send the request
ajax.send();

```
### More Complex Yet Simple
The following code sample shows more complex usage which sets a function to execute for diffrent HTTP codes.

``` javascript
 var ajax = new AJAXRequest({
    method:'get',
    url:'https://api.github.com/repos/usernane/js-ajax-helper',
    
    //A callbacks for 2xx and 3xx codes
    onSuccess: [
        function(){
            if(this.jsonResponse){
                //...
            } else {
                //...
            }
        }],
        
    //A callbacks for 4xx codes
    onClientErr:  [
        function(){
            if(this.jsonResponse){
                //...
            } else {
                //...
            }
        }],
    
    //A callbacks for 5xx codes
    onServerErr: [
        function(){
            if(this.jsonResponse){
                //...
            } else {
                //...
            }
        }],
    
    //A callbacks in case there was no internet connection with the server
    onDisconnected:  [
        function(){
            if(this.jsonResponse){
                //...
            } else {
                //...
            }
        }],
        
    //A callback that will be executed regardless of ajax status after it is completed.
    afterAjax:  [
        function(){
            if(this.jsonResponse){
                //...
            } else {
                //...
            }
        }],
});

ajax.send();

```

### Sending Parameters to Server
The class does support sending data using `GET`, `POST`, `OPTIONS`, `HEAD`, `PUT` or `DELETE` request methods. The data can be a simple string, an object or a `DataForm` object. 
#### As a String
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
`FormData` is usually used to send data to the server using `POST` or `PUT` to modify something in the database. Also, it can be used to upload files to the database. 

## License
The project is licensed under MIT license.

