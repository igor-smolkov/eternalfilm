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
//модуль для добавления видео фильтра
import setFilter from '@module/filter.js'

import title from '@module/title.js'
let titleStr = '';
getTitle();
async function getTitle() {
    titleStr = await title();
}

//запуск iframe api ютуба
loadYTApi();
function loadYTApi() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

//экран и слушатель по нажатию на него для запуска показа
let screen = document.querySelector('.screen');
let frameOdd = screen.querySelectorAll('.video')[0];
let frameEven = screen.querySelectorAll('.video')[1];
let filterDiv = screen.querySelector('.filter');
let titleDiv =  screen.querySelector('.title');
//флаг начала показа
let start = false;
screen.addEventListener('click', function(){
    if ((!controlSmall)&&(!controlSmallAnim)) {
        if (!start) {
            controlReduce(true); 
        } else {
            controlReduce();
        }
    } else {
        setFilter(filterDiv);
    }
    //если показ не начался
    if (!start) {       
        //показ начался
        start = true;
        //удаляем описание
        titleDiv.classList.toggle('title_none');
        titleDiv.firstChild.classList.toggle('title__text_on');
        //устанавливаем фильтр
        setFilter(filterDiv);
        //отображаем элемент плеера (нечетный)
        frameOdd.classList.toggle('video_hidden');
        //создаем первый плеер
        onYouTubeIframeAPIReady('odd');
        //с задержкой в продожительность минус переход создаем второй плеер (четный)
        setTimeout(onYouTubeIframeAPIReady, timer-transition, 'even');
    }
});//

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
                'onReady': onPlayerReady,
                'onStateChange': onPlayerOddStateChange,
                'onError': onPlayerError
            }
        });
        frameOdd = document.querySelectorAll('.video')[0];
    } else if (player === 'even') {
        playerEven = new YT.Player('player_even', {
            videoId: currentLink,
            playerVars: { 'autoplay': 1, 'controls': 0 },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerEvenStateChange,
                'onError': onPlayerError
            }
        });
        frameEven = document.querySelectorAll('.video')[1];
    }
}

//срабатывает когда плеер готов
function onPlayerReady(event) {
    //отключаем звук видео
    event.target.mute();
    //для данного плеера начать воспроизведение
    event.target.playVideo();
}

//срабатывает когда возникает ошибка (например ошибка встраивания)
function onPlayerError(event) {
    //удаляем видео из текущей базы
    console.log(currentLink);
    base.splice(base.indexOf(currentLink), 1);
    //запускаем новое видео
    playVideo(event.target);
}

//флаг окончания нечетного видео
let doneOdd = false;
//срабатывает когда в нечетном плеере происходят изменения
function onPlayerOddStateChange(event) {
    //если видео играет и не окончилось
    if (event.data == YT.PlayerState.PLAYING && !doneOdd) {
        //перепрыгиваем на случайную точку начала фрагмента из видео
        event.target.seekTo(rand.start(event.target.getDuration(), timer));

        //JCut монтажная склейка
        jCut(event.target, transition, rand.thing(['lin', 'exp']));

        let titleR = rand.n(1,6);
        //с задержкой в длинну фрагмента меняем видео (нечетный плеер на четный)
        if(titleR != 1) {
            setTimeout(changeVideo, timer, event.target, 'odd');
        } else {
            setTimeout(changeVideo, timer-transition, event.target, 'odd', true);
        }

        //флаг: видео окончено
        doneOdd = true;
    }
}

//флаг окончания четного видео
let doneEven = false;
//срабатывает когда в четном плеере происходят изменения
function onPlayerEvenStateChange(event) {
    //если видео играет и не окончилось
    if (event.data == YT.PlayerState.PLAYING && !doneEven) {
        //перепрыгиваем на случайную точку начала фрагмента из видео
        event.target.seekTo(rand.start(event.target.getDuration(), timer));

        //JCut монтажная склейка
        jCut(event.target, transition, rand.thing(['lin', 'exp']));

        let titleR = rand.n(1,6);
        //с задержкой в длинну фрагмента меняем видео (четный плеер на нечетный)
        if (titleR != 1) {
            setTimeout(changeVideo, timer, event.target, 'even');
        } else {
            setTimeout(changeVideo, timer-transition, event.target, 'even', true);
        }

        //флаг: видео окончено
        doneEven = true;
    }
}

//смена видео (плееров)
function changeVideo(player, playerPoint, titleOn = false) {
    if (titleOn) {
        titleDiv.classList.toggle('title_none');
        titleDiv.firstChild.innerHTML = titleStr;
        getTitle(); //следующий заголовок
        setTimeout(titleEnd, transition);
        function titleEnd() {
            titleDiv.classList.toggle('title_none');
        }

        setTimeout(playVideo, timer-transition, player);
        setTimeout(transitionStart, timer-transition, player);
    } else {
        //с задержкой в длину фрагмента минус два перехода запускаем данный плеер снова
        setTimeout(playVideo, timer-transition*2, player); 
        //новый переход начнется через время фрагмента минус два перехода
        setTimeout(transitionStart, timer-transition*2, player);
    }

    frameOdd.classList.toggle('video_hidden');
    frameEven.classList.toggle('video_hidden');

    player.stopVideo();

    //если нужно менять на нечетный плеер, значит сбрасываем нечетный флаг окночания видео, иначе сбрасываем четный
    if (playerPoint === 'odd') {
        doneOdd = false;
    } else if (playerPoint === 'even') {
        doneEven = false;
    }
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
let control = document.querySelector('.control');
let form = document.querySelector('.form');
let mini = document.querySelector('.mini');
let opt = document.querySelector('.opt');
let back = document.getElementById('back');
let logo = document.querySelector('.logo');
let animCount;
let controlSmall = false;
let controlSmallAnim = false;
let controlFocus = false;
let controlFocusAnimEnd = false;
let isTouch = false;

control.addEventListener('animationend', function() {
    if (!controlSmall) {
        switch (animCount) {
            case 1: {
                mini.classList.toggle('mini_none');
                opt.classList.toggle('opt_none');
                control.classList.toggle('control_anim_square');
                control.classList.toggle('control_anim_rotate');
                animCount++;
                break;
            }
            case 2: {
                opt.classList.toggle('opt_none');
                logo.classList.toggle('logo_none');
                control.classList.toggle('control_anim_rotate');
                control.classList.toggle('control_small');
                controlSmall = true;
                controlSmallAnim = false;
                controlFocusAnimEnd = true;
                animCount++;
                break;
            }
        }
    } else {
        if (controlFocus) {
            control.className = "control control_small_square"
            opt.className = 'opt';
            logo.className = 'logo logo_none';
        } else {
            control.className = "control control_small"
            opt.className = 'opt opt_none';
            logo.className = 'logo';
        }
        controlFocusAnimEnd = true;
    }
});


control.addEventListener('mouseover', function() {
    if (!isTouch) {
        becomeOpt();
    }
});
control.addEventListener('mouseout', function() {
    if (!isTouch) {
        becomeLogo();
    }
});

let touchFlag = false;
control.addEventListener('touchstart', function() {
    isTouch = true;
    if (!touchFlag) {
        touchFlag = true;
        becomeOpt();
    } else {
        touchFlag = false;
        becomeLogo();
    }
});

screen.addEventListener('touchstart', function() {
    isTouch = true;
    if (touchFlag) {
        touchFlag = false;
        becomeLogo();
    }
});

function becomeOpt() {
    if (controlSmall) {
        if (controlFocusAnimEnd) {
            controlFocus = true;
            controlFocusAnimEnd = false;
            control.classList.toggle('control_anim_rotate_back');
        } else {
            control.className = "control control_small_square"
            opt.className = 'opt';
            logo.className = 'logo logo_none';
            controlFocusAnimEnd = true;
        }
    }
    if (controlSmallAnim) {
        controlSmall = true;
        controlSmallAnim = false;
        control.className = "control control_small_square"
        mini.className = 'mini';
        opt.className = 'opt';
        logo.className = 'logo logo_none';
        controlFocusAnimEnd = true;
    }
}
function becomeLogo() {
    if (controlSmall) {
        if (controlFocusAnimEnd) {
            controlFocus = false;
            controlFocusAnimEnd = false;
            control.classList.toggle('control_anim_rotate');
        } else {
            control.className = "control control_small"
            opt.className = 'opt opt_none';
            logo.className = 'logo';
            controlFocusAnimEnd = true;
        }
    }
}

// control.addEventListener('click', function() {
//     if ((controlSmall)&&(!controlSmallAnim)) {
//         controlBack();
//     }
// });

back.addEventListener('mouseup', function() {
    controlBack();
});
back.addEventListener('touchstart', function() {
    controlBack();
});

function controlReduce(anim = false) {
    form.classList.toggle('form_none');
    if (anim) {
        controlSmallAnim = true;
        control.classList.toggle('control_anim_square');
        animCount = 1;      
    } else {
        control.className = "control control_small"
        mini.classList.toggle('mini_none');
        opt.className = 'opt opt_none';
        logo.className = 'logo';
        controlSmall = true;
        controlFocusAnimEnd = true;
    }
}

function controlBack() {
    controlSmall = false;
    control.className = "control";
    form.classList.toggle('form_none');
    mini.classList.toggle('mini_none');
    animCount = 0;
    formProcess();
    linkField.focus();
}

//поле ввода ссылки
let linkField = document.getElementById('link');
//флаг на добавление первой ссылки
let firstAdd = false
//слушатель нажатия на поле ввода
linkField.addEventListener('mousedown', function(){
    //если это первое добавление ссылки, то увеличить поле и добавить подсказку
    if (!firstAdd){
        formProcess();
    }
});

function formProcess() {
    firstAdd = true;
    linkField.style.textAlign = 'left';
    linkField.value = '';
    linkField.placeholder = 'подсказка: вставьте ссылку на видео с youtube и нажмите добавить';
    addBtn.style.display = 'block';
}

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