window.ajax = new AJAXRequest({
    verbose:true,
    
    //The script which is used to handle uploads.
    //Modify this to pint to the actual uploads script.
    url:'http://example.com/ajax/upload.php',
    
    
    method:'post',
    beforeAjax: function () {
        // We get the form from the document and convert it to 
        // FormData object. This one is useful if we would like 
        //to supply extra inputs with the file.
        var form = document.getElementById('file-upload-form');
        this.AJAXRequest.setParams(new FormData(form));
    }
});