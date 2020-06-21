import * as $ from 'jquery'

export default function(link) {
    $.ajax({
        url: 'setBase.php',
        dataType: 'text',
        cache: false,
        data: ({str: link}),
        type: 'post',
        success: function(php_script_response){
            console.log(php_script_response)
        }
    });
}