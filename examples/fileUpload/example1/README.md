This example shows how to upload files to the server using the class `AJAXRequest.js`.

What we have in this example is a simple HTML form that contains two inputs. The first 
one is the file input and the second one is the submit input. On the submit button, 
we have assigned a `onclick` event. The event is to call the method `AJAXRequest.send()` and 
process the upload. We collect form information on the `beforeAjax` callback.