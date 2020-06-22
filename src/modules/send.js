export default function(link) {
    const body = 'str=' + encodeURIComponent(link);
    const request = new XMLHttpRequest();
    request.open('POST','setBase.php',true);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    request.addEventListener('readystatechange', function() {
        if ((request.readyState==4) && (request.status==200)) {
            console.log(request.responseText);
        }
    });
    request.send(body);
}