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
* <a href="">`AJAXRequest.send()`</a>
## AJAXRequest.send()

