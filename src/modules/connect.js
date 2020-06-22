export default function() {
    return new Promise(function (resolve) {
        const request = new XMLHttpRequest();
        request.open('GET','getBase.php',true);
        request.addEventListener('readystatechange', function() {
            if ((request.readyState==4) && (request.status==200)) {
                resolve(JSON.parse(request.responseText).links);
            }
        });
        request.send();
    });
}
