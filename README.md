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
The following code sample shows the most basic usage of the library.
``` javascript
 var ajax = new AJAX({
    method:'get',
    url:'https://api.github.com/repos/usernane/js-ajax-helper'
});

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
