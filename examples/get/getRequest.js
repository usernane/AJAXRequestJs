//Creates new instance of the class 'AJAXRequest' using specific configuration.
//The configuration is supplied as an object.
window.ajax = new AJAXRequest({
    
    //Show more messages in the console. Activate in development mode only.
    verbose:true,
    
    // The end pont at which that will receive the request.
    url:'https://packagist.org/packages/list.json',
    
    //The method which is used to call the end point.
    method:'get',
    
    //An array that contains one callback which will get executed before AJAX 
    //Request is sent. The callback in this case is 
    //Used to collect user input and validate it.
    //If it is invalid, intercept the request and disable AJAX.
    //If valid, add it as request parameter and continue.
    //Notice how we accessed the methods of the instance using 'this.AJAXRequest'.
    beforeAjax: [
        function () {
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
        }
    ],
    
    //An array that contains one callback which will get executed after ajax 
    //request completed with success status (2xx or 3xx). 
    onSuccess: [
        function () {
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
        }
    ], 
    
    //An array that contains one callback which will get executed after ajax 
    //request completed with client error status (4xx). 
    //What we do is simply display the response code of the server.
    onClientErr: [
        function () {
            window.myList.innerHTML = '<li>'+this.status+'</li>';
        }
    ],
    
    //An array that contains one callback which will get executed after ajax 
    //request completed with server error status (5xx). 
    //What we do is simply display the response code of the server.
    onServerErr: [
        function () {
            window.myList.innerHTML = '<li>'+this.status+'</li>';
        }
    ],
    
    //An array that contains one callback which will get executed if no 
    //internet connection is available
    onDisconnected: [
        function () {
            window.myList.innerHTML = '<li>No internet access.</li>';
        }
    ]
});