ajax.verbose = true;
ajax.setURL('http://localhost/ajax/examples/server.php');
ajax.setMethod('post');
ajax.setBeforeAjax({
    id:'Upload File',
    callback:function () {
        var statusLbl = document.getElementById('status-display');
        var fileInput = document.getElementById('file-input');
        var f = new FormData();
        
        this.AJAXRequest.setParams({
            'my-file':fileInput.files[0]
        });
        statusLbl.innerHTML = 'Uploading file...';
        
    }
});
ajax.setOnSuccess({
    id:'Upload File',
    callback:function () {
        var statusLbl = document.getElementById('status-display');
        statusLbl.innerHTML = 'Uploaded. Server response: <pre>'+this.response+'</pre>';
    }
});
ajax.setOnClientError({
    id:'Upload File',
    callback:function () {
        var statusLbl = document.getElementById('status-display');
        statusLbl.innerHTML = 'Client Error (code '+this.status+')';
    }
});