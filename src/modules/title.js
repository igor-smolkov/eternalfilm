export default function() {
    return new Promise(function (resolve) {
        const request = new XMLHttpRequest();
        request.open('GET',`https://fish-text.ru/get?type=title`,true);
        request.addEventListener('readystatechange', function() {
            if ((request.readyState==4) && (request.status==200)) {
                //при успешном запросе, если в полученном объекте свойство list не пустой массив обрабатываем наш id, инче оповещаем что видео не существует
                resolve(JSON.parse(request.responseText).text);
            }
        });
        request.send();
    });
}