window.ajax = new AJAXRequest({
    verbose:true,
    
    //The script which is used to handle uploads.
    url:'http://localhost/ajax/examples/server.php',
    
    
    method:'post',
    beforeAjax:[
        function () {
            var statusLbl = document.getElementById('status-display');
            var fileInput = document.getElementById('file-input');
            var f = new FormData();
            
            this.AJAXRequest.setParams({
                'my-file':fileInput.files[0]
            });
            statusLbl.innerHTML = 'Uploading file...';
            
        }
    ],
    
    onSuccess: [
        function () {
            var statusLbl = document.getElementById('status-display');
            statusLbl.innerHTML = 'Uploaded. Server response: <pre>'+this.response+'</pre>';
        }
    ],
    
    onClientErr: [
        function () {
            var statusLbl = document.getElementById('status-display');
            statusLbl.innerHTML = 'Client Error (code '+this.status+')';
        }
    ]
});