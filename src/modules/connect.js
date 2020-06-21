import * as $ from 'jquery'

let base;
$.ajax({
    url: 'getBase.php',
    dataType: 'json',
    cache: false,
    data: '',
    type: 'post',
    success: function(php_script_response){
        base = php_script_response.links;
    }
});

export {base};