
//Show more messages in the console. Activate in development mode only.
ajax.verbose = true;

// The end pont at which that will receive the request.
ajax.setURL('https://packagist.org/packages/list.json');

//The method which is used to call the end point.
ajax.setMethod('get');

//Adding one callback which will get executed before AJAX 
//Request is sent. The callback in this case is 
//Used to collect user input and validate it.
//If it is invalid, intercept the request and disable AJAX.
//If valid, add it as request parameter and continue.
//Notice how we accessed the methods of the instance using 'this.AJAXRequest'.
ajax.setBeforeAjax(function () {
    var list = document.getElementById('packages-list');
    window.myList = list;
    var vendorName = document.getElementById('package-name-input').value.trim();
    if (vendorName.length === 0) {
        this.AJAXRequest.setEnabled(false); 
        list.innerHTML = '<li>Please enter vendor name.</li>';
        return;
    } else {
        this.AJAXRequest.setEnabled(true);
    }

    list.innerHTML = '<li>Please wait a moment...</li>';
    this.AJAXRequest.setParams({
        vendor:vendorName
    });
});

//Add one callback which will get executed after ajax 
//request completed with success status (2xx or 3xx). 
ajax.setOnSuccess(function () {
    alert('Fetched.');
    var packages = this.jsonResponse.packageNames;

    var listBody = '';
    for (var x = 0 ; x < packages.length ; x++) {
        var pkgName = packages[x];
        listBody += '<li><a href="https://packagist.org/packages/'+pkgName+'">'+pkgName+'</a></li>';
    }
    if (listBody.length === 0) {
        listBody = '<li>NO Packages found.';
    }
    window.myList.innerHTML = listBody;
});

//Adding two callbacks which will get executed after ajax 
//request completed with client error status (4xx). 
//What we do is simply display the response code of the server.
ajax.setOnClientError(function () {
    window.myList.innerHTML = '<li>'+this.status+'</li>';
});
ajax.setOnClientError(function () {
    alert('Error: '+this.status);
});

//One callback which will get executed after ajax 
//request completed with server error status (5xx). 
//What we do is simply display the response code of the server.
ajax.setOnServerError(function () {
    window.myList.innerHTML = '<li>'+this.status+'</li>';
});

//An array that contains two callbacks which will get executed if no 
//internet connection is available
ajax.setOnDisconnected(function () {
    window.myList.innerHTML = '<li>No internet access.</li>';
});
ajax.setOnDisconnected(function () {
    alert('Make sure that you are connected to the internet. (code '+this.status+')');
});