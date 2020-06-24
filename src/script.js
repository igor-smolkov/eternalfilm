//ключ для проверки существования видео
import api from '@/api.json'
//стили
import '@/style.scss'

//база ссылок для разработки
import baseJSON from '@file/base.json'
let base = baseJSON.links;
//проверка режима разработки
const isProd = process.env.NODE_ENV === 'production';
//в сборке для сервера получаем базу от сервера
import connect from '@module/connect.js'
if (isProd) { getBase() }
//подключаемся к серверу и получаем данные
async function getBase() {
    base = await connect();
}

//модуль для отправки данных на сервер
import send from '@module/send.js'

//конфигурация платформы
import config from '@file/film.config.json'
//длинна видео форагмента
const timer = config.timer;
//длинна перехода между фрагментами
const transition = config.transition;

//модуль с функциями рандома для разных задач
import * as rand from '@module/rand.js'
//модуль для парсинга добавляемых пользователями ссылок
import * as parse from '@module/parse.js'

//запуск iframe api ютуба
loadYTApi();
function loadYTApi() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

//экран и слуашатель по нажатию на него для запуска показа
let screen = document.querySelector('.screen');
screen.addEventListener('click', function(){
    //удаляем описание
    screen.lastChild.remove();
    //отображаем элемент плеера (нечетный)
    screen.childNodes[0].classList.toggle('video_none');
    //создаем первый плеер
    onYouTubeIframeAPIReady('odd');
    //с задержкой в продожительность минус переход создаем второй плеер (четный)
    setTimeout(onYouTubeIframeAPIReady, timer-transition, 'even');
});

//нечетный и четный плеер
let playerOdd, playerEven;
//функция создания плеера
function onYouTubeIframeAPIReady(player) {
    //меняем текущую ссылку (id) на случайную из базы
    currentLink = rand.thing(base);
    //для нечетного, иначе для четного
    if (player === 'odd') {
        playerOdd = new YT.Player('player_odd', {
            videoId: currentLink,
            playerVars: { 'autoplay': 1, 'controls': 0 },
            events: {
                'onReady': onPlayerOddReady,
                'onStateChange': onPlayerOddStateChange,
                'onError': onPlayerError
            }
        });
    } else if (player === 'even') {
        playerEven = new YT.Player('player_even', {
            videoId: currentLink,
            playerVars: { 'autoplay': 1, 'controls': 0 },
            events: {
                'onReady': onPlayerEvenReady,
                'onStateChange': onPlayerEvenStateChange,
                'onError': onPlayerError
            }
        });
    }
}

//срабатывает когда нечетный плеер готов
function onPlayerOddReady(event) {
    //отключаем звук видео
    event.target.mute();
    //для данного плеера начать воспроизведение
    event.target.playVideo();
}

//срабатывает когда четный плеер готов
function onPlayerEvenReady(event) {
    //отключаем звук видео
    event.target.mute();
    //для данного плеера начать воспроизведение
    event.target.playVideo();
    // transitionStart(event.target);
}

//срабатывает когда возникает ошибка (например ошибка встраивания)
function onPlayerError(event) {
    //удаляем видео из текущей базы
    base.splice(base.indexOf(currentLink), 1);
    //запускаем новое видео
    playVideo(event.target);
}

//флаг окончания нечетного видео
var doneOdd = false;
//срабатывает когда в нечетном плеере происходят изменения
function onPlayerOddStateChange(event) {
    //если видео играет и не окончилось
    if (event.data == YT.PlayerState.PLAYING && !doneOdd) {
        //перепрыгиваем на случайную точку начала фрагмента из видео
        event.target.seekTo(rand.start(event.target.getDuration(), timer));

        //JCut монтажная склейка
        jCut(event.target, transition, rand.thing(['lin', 'exp']));

        //с задержкой в длинну фрагмента меняем видео (нечетный плеер на четный)
        setTimeout(changeVideo, timer, event.target, 'odd');

        //флаг: видео окончено
        doneOdd = true;
    }
}

//флаг окончания четного видео
var doneEven = false;
//срабатывает когда в четном плеере происходят изменения
function onPlayerEvenStateChange(event) {
    //если видео играет и не окончилось
    if (event.data == YT.PlayerState.PLAYING && !doneEven) {
        //перепрыгиваем на случайную точку начала фрагмента из видео
        event.target.seekTo(rand.start(event.target.getDuration(), timer));

        //JCut монтажная склейка
        jCut(event.target, transition, rand.thing(['lin', 'exp']));

        //с задержкой в длинну фрагмента меняем видео (четный плеер на нечетный)
        setTimeout(changeVideo, timer, event.target, 'even');

        //флаг: видео окончено
        doneEven = true;
    }
}

//смена видео (плееров)
function changeVideo(player, playerPoint) {
    //останавливаем воспроизведение у данного плеера
    player.stopVideo();

    //меняем местами фреймы с плеерами
    screen.childNodes[0].classList.toggle('video_none');
    screen.childNodes[1].classList.toggle('video_none');

    //если нужно менять на нечетный плеер, значит сбрасываем нечетный флаг окночания видео, иначе сбрасываем четный
    if (playerPoint === 'odd') {
        doneOdd = false;
    } else if (playerPoint === 'even') {
        doneEven = false;
    }

    //с задержкой в длину фрагмента минус два перехода запускаем данный плеер снова
    setTimeout(playVideo, timer-transition*2, player);

    //новый переход начнется через время фрагмента минус два перехода
    setTimeout(transitionStart, timer-transition*2, player);
}

//начало перехода
function transitionStart(player) {
}
//половина перехода
function transition50(player) {
}
//конец перехода
function transitionEnd(player) {
}

//максимальная громкость воспроизведения
const maxVol = 100;
//JСut склейка (переход с наложением звука)
function jCut(player, duration, type = 'lin', shift = 0) {
    //шаг задержки = длинна перехода / максимальную громкость
    const step = duration/maxVol;
    //устанавливаем громкость на минимум
    player.setVolume(0);
    //включаем звук видео
    player.unMute();
    //типы нарастания громкости: линейная, экспоненциальная, резкое включение
    if(type === 'lin'){
        let i = 0;
        //начало нарастания после сдвига shift
        setTimeout(up, shift);
        function up() {
            //громкость видео равна счетчику
            player.setVolume(Math.round(i));
            //пока i меньше или равно максимальной громкости увеличиваем с шагом / 100
            if (i <= maxVol) {
                i += step/100;
                setTimeout(up, 24);
            }
        }
    } else if(type === 'exp'){
        let i = 0;
        setTimeout(up, shift);
        function up() {
            //громкость видео равна экспоненте i
            player.setVolume(Math.round(Math.exp(i)));
            if (Math.exp(i) <= maxVol) {
                i += step/(100/0.05);
                setTimeout(up, 24);
            }
        }
    } else if(type === 'cut'){
        let i = false;
        setTimeout(up, shift);
        function up() {
            //если i = true устанавливаем громкость на максимум
            if(i) { 
                player.setVolume(maxVol); 
            }
            i = true;
            //перехапускаем один раз в конце перехода с учетом задержки
            setTimeout(up, duration-shift);
        }
    }
    //переход закончится за время перехода
    setTimeout(transitionEnd, duration, player)
}

//текущая ссылка (id видео)
let currentLink;
//запуск нового видео
function playVideo(player) {
    //текущая ссылка (id) = случаная из базы
    currentLink = rand.thing(base);
    //отключаем звук видео
    player.mute();
    //подгрузка нового видео с ютуба по id
    player.loadVideoById(currentLink);
}

//форма
let form = document.querySelector('.add-link');
//поле ввода ссылки
let linkField = document.getElementById('link');
//флаг на добавление первой ссылки
let firstAdd = false
//слушатель нажатия на поле ввода
linkField.addEventListener('mousedown', function(){
    //если это первое добавление ссылки, то увеличить поле и добавить подсказку
    if (!firstAdd){
        firstAdd = true;
        form.style.minHeight = '50px';
        linkField.style.textAlign = 'left';
        linkField.value = '';
        linkField.placeholder = 'подсказка: вставьте ссылку на видео с youtube и нажмите добавить';
        addBtn.style.display = 'block';
    }
});

//кнопка добавления ссылки и обработчик
let addBtn = document.getElementById('add');
addBtn.addEventListener('click', function(){
    //получаем значение поля, сбрысываем и оповещаем о процессе обработки
    let linkFieldValue = linkField.value;
    linkField.value = '';
    linkField.placeholder = 'идет обработка данных...';

    //получаем id из ссылки
    let link = parse.ytLink(linkFieldValue);
    //если в id нет ошибок проверяем наличие видео через api ютуба, иначе оповещаем о неккоректном формате
    if (link !== 'error') {
        //ajax запрос к api
        const request = new XMLHttpRequest();
        request.open('GET',`https://www.googleapis.com/youtube/v3/videos?id=${link}&key=${api.key}`,true);
        request.addEventListener('readystatechange', function() {
            if ((request.readyState==4) && (request.status==200)) {
                //при успешном запросе, если в полученном объекте свойство list не пустой массив обрабатываем наш id, инче оповещаем что видео не существует
                if (JSON.parse(request.responseText).items.length > 0) {
                    //отправляем id на сервер
                    send(link);
                    //добавляем к текущей базе
                    base.push(link);
                    linkField.placeholder = 'ссылка добавлена, добавьте еще одну';
                } else {
                    linkField.placeholder = 'видео не существует, проверьте ссылку';
                }
            }
        });
        request.send();
    } else {
        linkField.placeholder = 'некорректный формат! пример ссылки: https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    }
});