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
import * as filter from '@module/filter.js'

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
let titleFlag = false;
let start = false;
screen.addEventListener('click', function(){
    if ((!controlSmall)&&(!controlSmallAnim)) {
        if (!start) {
            controlReduce(true); 
        } else {
            controlReduce();
        }
    } else {
        if (filterOn) {
            filter.set(filterDiv);
        }
    }
    //если показ не начался
    if (!start) {       
        //показ начался
        start = true;
        //удаляем описание
        titleDiv.classList.toggle('title_none');
        titleDiv.firstChild.classList.toggle('title__text_on');
        //устанавливаем фильтр
        filterOn = true;
        filter.set(filterDiv);
        //отображаем элемент плеера (нечетный)
        frameOdd.classList.toggle('video_hidden');
        //создаем первый плеер
        onYouTubeIframeAPIReady('odd');
        //создаем второй плеер (четный)
        onYouTubeIframeAPIReady('even');
    }
});//
//текущая ссылка (id видео)
let currentLink;
//нечетный и четный плеер
let playerOdd, playerEven;
//функция создания плеера
function onYouTubeIframeAPIReady(order) {
    //меняем текущую ссылку (id) на случайную из базы
    currentLink = rand.thing(base);
    //для нечетного, иначе для четного
    if (order === 'odd') {
        playerOdd = new YT.Player(`player_${order}`, {
            videoId: currentLink,
            playerVars: { 'autoplay': 1, 'controls': 0 },
            events: {
                'onReady': function(){onPlayerReady(order)},
                'onStateChange': onPlayerOddStateChange,
                'onError': onPlayerError
            },
            order: '',
            vidStartTime: 0,
            cutCurrentTime: 0,
            transitionType: '',
            transitionEnd: false,
            waitTime: 0
        });
        frameOdd = document.querySelectorAll('.video')[0];
        console.log(playerOdd);
    } else if (order === 'even') {
        playerEven = new YT.Player(`player_${order}`, {
            videoId: currentLink,
            playerVars: { 'autoplay': 1, 'controls': 0 },
            events: {
                'onReady': function(){onPlayerReady(order)},
                'onStateChange': onPlayerEvenStateChange,
                'onError': onPlayerError
            },
            order: '',
            vidStartTime: 0,
            cutCurrentTime: 0,
            transitionType: '',
            transitionEnd: false,
            waitTime: 0
        });
        frameEven = document.querySelectorAll('.video')[1];
        console.log(playerEven);
    }
}

//таймеры на запуск нового видео и смену фреймов
let toEvenFirstPlay, toOddPlayNew, toOddChangeVideo, toEvenPlayNew, toEvenChangeVideo, toEvenTransition, toTransition;

//срабатывает когда плеер готов
function onPlayerReady(order) {    
    if (order === 'odd') {
        //отключаем звук видео
        playerOdd.mute();
        playerOdd.playVideo();
        toOddPlayNew = setTimeout(playerPlayNew, (timer-transition)*2, playerOdd);
        toOddChangeVideo = setTimeout(changeVideo, timer, playerOdd);
        console.log('ready:'+order);
    } else if (order === 'even') {
        playerEven.mute();
        playerEven.playVideo();
        toEvenPlayNew = setTimeout(playerPlayNew, timer*2, playerEven);
        toEvenChangeVideo = setTimeout(changeVideo, timer*2-transition, playerEven);
        console.log('ready:'+order);
    }
}

//флаг окончания нечетного видео
let doneOdd = false;
//флаг инициализации
let oddInit = false;
let oddReady = false;
//срабатывает когда в нечетном плеере происходят изменения
function onPlayerOddStateChange(event) {
    //если видео играет и не окончилось
    if (event.data == YT.PlayerState.PLAYING && !doneOdd) {
        //инициализация
        if(!oddInit) {
            playerOdd.order = 'odd';
            playerOdd.transitionEnd = true;
            playerOdd.waitTime = 0;

            playerOdd.vidStartTime = rand.start(playerOdd.getDuration(), timer);
            jump(playerOdd, playerOdd.vidStartTime);

            playerOdd.setVolume(100);

            oddInit = true;
            console.log('odd init');
        } else {
            //случайная точка начала фрагмента видео
            playerOdd.vidStartTime = rand.start(playerOdd.getDuration(), timer);
            jump(playerOdd, playerOdd.vidStartTime);
        }
        playerOdd.cutCurrentTime = 0;
        //включаем звук
        playerOdd.unMute();
        //флаг: видео окончено
        doneOdd = true;

        oddReady = true;
        pauseBtn.classList.remove('button_disabled');
        console.log('state:'+playerOdd.order);
    }
}

//флаг окончания четного видео
let doneEven = false;
//флаг инициализации
let evenInit = false;
let evenReady = false;
//срабатывает когда в четном плеере происходят изменения
function onPlayerEvenStateChange(event) {
    //если видео играет и не окончилось
    if (event.data == YT.PlayerState.PLAYING && !doneEven) {
        //инициализация
        if(!evenInit) {
            playerEven.order = 'even';
            playerEven.transitionEnd = true;
            playerEven.waitTime = 0;
            playerEven.transitionType = rand.thing(['lin', 'exp', 'cut']);
            playerEven.pauseVideo();

            playerEven.vidStartTime = rand.start(playerEven.getDuration(), timer);
            jump(playerEven, playerEven.vidStartTime);

            playerEven.setVolume(0);

            toEvenFirstPlay = setTimeout(playVideo, timer-transition, playerEven);

            toEvenTransition = setTimeout(jCut, timer-transition, playerEven, transition);

            evenInit = true;
            console.log('even init');
        } else {
            //случайная точка начала фрагмента видео
            playerEven.vidStartTime = rand.start(playerEven.getDuration(), timer);
            jump(playerEven, playerEven.vidStartTime);
        }
        playerEven.cutCurrentTime = 0;
        //включаем звук
        playerEven.unMute();
        //флаг: видео окончено
        doneEven = true;

        evenReady = true;
        pauseBtn.classList.remove('button_disabled');
        console.log('state:'+playerEven.order);
    }
}

function jump(player, startTime) {
    player.seekTo(startTime);
}

function playVideo(player) {
    player.playVideo();
    if (!player.transitionEnd) {
        jCut(player, transition, player.cutCurrentTime + player.waitTime);
        console.log('transition not end, cur time:'+player.cutCurrentTime)
    }
    console.log('even play, odd cur:'+(playerOdd.getCurrentTime()-playerOdd.vidStartTime));
}

//смена видео (плееров)
function changeVideo(player, titleOn = false) {
    frameHandler();

    player.stopVideo();

    //если нужно менять на нечетный плеер, значит сбрасываем нечетный флаг окночания видео, иначе сбрасываем четный
    if (player.order === 'odd') {
        doneOdd = false;
        clearTimeout(toOddChangeVideo);
        toOddChangeVideo = setTimeout(changeVideo, (timer-transition)*2, player);
    } else if (player.order === 'even') {
        doneEven = false;
        clearTimeout(toEvenChangeVideo);
        toEvenChangeVideo = setTimeout(changeVideo, (timer-transition)*2, player);
    }

    if (titleFlag) {
        titleFlag = false;
        titleDiv.classList.toggle('title_none');
    }
}

function frameHandler() {
    frameOdd.classList.toggle('video_hidden');
    frameEven.classList.toggle('video_hidden');
}

function playerPlayNew(player) {
    pauseBtn.classList.add('button_disabled');

    titleFlag = rand.n(1,6) == 1 ? true : false;
    if (titleFlag) {
        titleDiv.classList.toggle('title_none');
        titleDiv.firstChild.innerHTML = titleStr;
        getTitle();
    }

    if (player.order === 'odd') {
        oddReady = false;
        clearTimeout(toOddPlayNew);
        toOddPlayNew = setTimeout(playerPlayNew, (timer-transition)*2, player);
    } else if (player.order === 'even') {
        evenReady = false;
        clearTimeout(toEvenPlayNew);
        toEvenPlayNew = setTimeout(playerPlayNew, (timer-transition)*2, player);
    }
    //текущая ссылка (id) = случаная из базы
    currentLink = rand.thing(base);
    //отключаем звук видео
    player.mute();
    player.setVolume(0);
    //подгрузка нового видео с ютуба по id
    player.loadVideoById(currentLink);
    player.playVideo();
    player.transitionType = rand.thing(['lin', 'exp', 'cut']);
    jCut(player, transition);
}

//срабатывает когда возникает ошибка (например ошибка встраивания)
function onPlayerError(event) {
    //удаляем видео из текущей базы
    console.log(currentLink);
    base.splice(base.indexOf(currentLink), 1);
    // //запускаем новое видео
    // playerPlayNew(event.target);
}

//максимальная громкость воспроизведения
const maxVol = 100;
//JСut склейка (переход с наложением звука)
function jCut(player, duration, shift = 0) {
    let type = player.transitionType;
    //player.setVolume(0);
    let minVol = 0;
    if (player.getVolume() != undefined){
        minVol = player.getVolume();
        console.log('VOLUME:'+minVol);
    }

    let shiftWait = shift;
    function wait(order) {
        setTimeout(function () {
            shiftWait += 10;
            check(order);
        }, 10)
    }
    function check(order) {
        if (((!oddReady)&&(order=='odd'))||((!evenReady)&&(order=='even'))) {
            wait(order);
        } else {
            player.transitionEnd = false;
            player.waitTime = shiftWait;
            if (shiftWait < transition) {
                if (type == 'lin') {  
                    lin();
                } else if (type == 'exp') {
                    exp();
                } else if (type == 'cut') {
                    player.mute();
                    toTransition = setTimeout(cut, transition-shiftWait);
                }
                console.log('TYPE:'+type);
                console.log('shift:'+shiftWait);
            } else {
                cut();
            }
        }
    }
    check(player.order);

    console.log('TYPE:'+type);

    let i = minVol;

    function lin() {
        setTimeout(function () {
            player.setVolume(i);
            console.log('vol:'+i);
            i++;
            if (i < maxVol) {
                if (!paused) {
                    lin();
                }
            } else {
                player.transitionEnd = true;
            }
        }, ((duration-shiftWait)/(maxVol-minVol)))
    }

    let step = shift;
    function exp() {
        setTimeout(function () {
            player.setVolume(i);
            console.log('vol:'+i);
            i = Math.round(Math.exp(step/1075));
            step += 100;
            if (i < maxVol) {
                if (!paused) {
                    exp();
                }
            } else {
                player.transitionEnd = true;
            }
        }, 100)
    }

    function cut() {
        player.unMute();
        player.setVolume(maxVol);
        player.transitionEnd = true;
    }

    console.log((duration-shift)/(maxVol-minVol));
    console.log(duration);
    console.log(shift);
    console.log(maxVol);
    console.log(minVol);

    console.log(`${minVol} / ${maxVol}`);

    console.log(`${minVol} / ${maxVol}`);

    // //шаг задержки = длинна перехода / максимальную громкость
    // const step = duration/maxVol;
    // //устанавливаем громкость на минимум
    // player.setVolume(0);
    // //включаем звук видео
    // player.unMute();
    // //типы нарастания громкости: линейная, экспоненциальная, резкое включение
    // if(type === 'lin'){
    //     let i = 0;
    //     //начало нарастания после сдвига shift
    //     setTimeout(up, shift);
    //     function up() {
    //         //громкость видео равна счетчику
    //         player.setVolume(Math.round(i));
    //         //пока i меньше или равно максимальной громкости увеличиваем с шагом / 100
    //         if (i <= maxVol) {
    //             i += step/100;
    //             setTimeout(up, 24);
    //         }
    //     }
    // } //else if(type === 'exp'){
    //     let i = 0;
    //     setTimeout(up, shift);
    //     function up() {
    //         //громкость видео равна экспоненте i
    //         player.setVolume(Math.round(Math.exp(i)));
    //         if (Math.exp(i) <= maxVol) {
    //             i += step/(100/0.05);
    //             setTimeout(up, 24);
    //         }
    //     }
    // }
    //переход закончится за время перехода
    //setTimeout(playerHiddHandler, duration, player);
}

let paused = false;
function pause() {
    paused = true;

    if (playerOdd.getCurrentTime() <= 0){
        playerOdd.cutCurrentTime = -1;
    } else {
        playerOdd.cutCurrentTime = Math.round((playerOdd.getCurrentTime()-playerOdd.vidStartTime)*1000);
        if ((playerOdd.cutCurrentTime < 0)||(playerOdd.cutCurrentTime === NaN)) {
            playerOdd.cutCurrentTime = 0;
        }
        if (playerOdd.cutCurrentTime > timer){
            playerOdd.cutCurrentTime = -1;
            frameHandler();
        }
        playerOdd.pauseVideo();
    }

    if (playerEven.getCurrentTime() <= 0){
        playerEven.cutCurrentTime = -1;
    } else {
        playerEven.cutCurrentTime = Math.round((playerEven.getCurrentTime()-playerEven.vidStartTime)*1000);
        if ((playerEven.cutCurrentTime < 0)||(playerOdd.cutCurrentTime == NaN)) {
            playerEven.cutCurrentTime = 0;
        }
        if (playerEven.cutCurrentTime > timer){
            playerEven.cutCurrentTime = -1;
            frameHandler();
        }
        playerEven.pauseVideo();
    }

    clearTimeout(toEvenFirstPlay);
    clearTimeout(toOddPlayNew);
    clearTimeout(toOddChangeVideo);
    clearTimeout(toEvenPlayNew);
    clearTimeout(toEvenChangeVideo);
    clearTimeout(toTransition);
    clearTimeout(toEvenTransition);

    console.log('odd CUR time:'+playerOdd.getCurrentTime());
    console.log('even CUR time:'+playerEven.getCurrentTime());

    console.log('odd DURATION:'+playerOdd.getDuration());
    console.log('even DURATION:'+playerEven.getDuration());

    console.log('odd pause:'+playerOdd.cutCurrentTime);
    console.log('even pause:'+playerEven.cutCurrentTime);

    console.log('odd pause =:'+(Math.round((playerOdd.getCurrentTime()-playerOdd.vidStartTime)*1000)));
    console.log('even pause =:'+(Math.round((playerEven.getCurrentTime()-playerEven.vidStartTime)*1000)));

    console.log('odd vid start:'+playerOdd.vidStartTime);
    console.log('even vid start:'+playerEven.vidStartTime);
}

function play() {
    paused = false;

    if (playerOdd.cutCurrentTime !== -1) {
        playVideo(playerOdd);
        toOddPlayNew = setTimeout(playerPlayNew, (timer-transition)*2-playerOdd.cutCurrentTime, playerOdd);
        toOddChangeVideo = setTimeout(changeVideo, timer-playerOdd.cutCurrentTime, playerOdd);
        console.log('odd start:'+playerOdd.cutCurrentTime);//o1//o2//o4//o5//o6
        console.log('o1//o2//o4//o5//o6');

        if (playerEven.cutCurrentTime !== -1) {
            if (playerEven.cutCurrentTime == 0) {
                toEvenFirstPlay = setTimeout(playVideo, timer-transition-playerOdd.cutCurrentTime, playerEven);
                toEvenTransition = setTimeout(jCut, timer-transition-playerOdd.cutCurrentTime, playerEven, transition);
                toEvenPlayNew = setTimeout(playerPlayNew, timer*2-playerOdd.cutCurrentTime, playerEven);
                toEvenChangeVideo = setTimeout(changeVideo, timer*2-transition-playerOdd.cutCurrentTime, playerEven);
                console.log('even on timer');//e1
                console.log('e1');
            } else {
                playVideo(playerEven);
                toEvenPlayNew = setTimeout(playerPlayNew, (timer-transition)*2-playerEven.cutCurrentTime, playerEven);
                toEvenChangeVideo = setTimeout(changeVideo, timer-playerEven.cutCurrentTime, playerEven);
                console.log('even start:'+playerEven.cutCurrentTime);//e2//e4//e6
                console.log('e2//e4//e6');
            }
        } else {
            toEvenPlayNew = setTimeout(playerPlayNew, (timer-transition*2)-(playerOdd.cutCurrentTime-transition), playerEven);
            toEvenChangeVideo = setTimeout(changeVideo, (timer-transition)*2-(playerOdd.cutCurrentTime-transition), playerEven);
            console.log('even on timer');//e5
            console.log('e5');
        }
    } else {
        toOddPlayNew = setTimeout(playerPlayNew, (timer-transition*2)-(playerEven.cutCurrentTime-transition), playerOdd);
        toOddChangeVideo = setTimeout(changeVideo, (timer-transition)*2-(playerEven.cutCurrentTime-transition), playerOdd);
        console.log('odd on timer');//o3//o7
        console.log('o3//o7');

        playVideo(playerEven);
        toEvenPlayNew = setTimeout(playerPlayNew, (timer-transition)*2-playerEven.cutCurrentTime, playerEven);
        toEvenChangeVideo = setTimeout(changeVideo, timer-playerEven.cutCurrentTime, playerEven);
        console.log('even start:'+playerEven.cutCurrentTime);//e3//e7
        console.log('e3//e7');
    }
    console.log('------------------play-end-----------');
    console.log('doneOdd:'+doneOdd+'|--------|doneEven:'+doneEven);
}

//форма
let control = document.querySelector('.control');
let form = document.querySelector('.form');
let mini = document.querySelector('.mini');
let opt = document.querySelector('.opt');
let logo = document.querySelector('.logo');
let backBtn = document.getElementById('back');
let filterBtn = document.getElementById('filter');
let pauseBtn = document.getElementById('pause');
let animCount;
let controlSmall = false;
let controlSmallAnim = false;
let controlFocus = false;
let controlFocusAnimEnd = false;
let isTouch = false;

control.addEventListener('animationend', function() {
    if (!btnClickReady) {
    console.log('ANIMATION END');
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

backBtn.addEventListener('mouseup', function() {
    controlBack();
});
backBtn.addEventListener('touchstart', function() {
    controlBack();
});

let btnClickReady = false;
backBtn.addEventListener('mouseover', function() {
    btnClickReady = true;
});
backBtn.addEventListener('animationend', function() {
    backBtn.classList.toggle('button_invert')
});
backBtn.addEventListener('mouseout', function() {
    btnClickReady = false;
    backBtn.classList.remove('button_invert')
});
filterBtn.addEventListener('mouseover', function() {
    btnClickReady = true;
});
filterBtn.addEventListener('animationend', function() {
    if (!filterOn){
        filterBtn.classList.add('button_invert')
    }
});
filterBtn.addEventListener('mouseout', function() {
    btnClickReady = false;
    if (!filterOn){
        filterBtn.classList.remove('button_invert')
    }
});
pauseBtn.addEventListener('mouseover', function() {
    btnClickReady = true;
});
pauseBtn.addEventListener('animationend', function() {
    pauseBtn.classList.toggle('button_invert')
});
pauseBtn.addEventListener('mouseout', function() {
    btnClickReady = false;
    pauseBtn.classList.remove('button_invert')
});

let filterOn = false;
filterBtn.addEventListener('click', function() {
    if (!filterOn) {
        filterOn = true;
        filter.set(filterDiv);
        filterBtn.classList.add('button_invert');
    } else {
        filterOn = false;
        filter.reset(filterDiv);
        filterBtn.classList.remove('button_invert');
    }
});

pauseBtn.addEventListener('click', function() {
    if ((oddInit && evenInit) && (oddReady && evenReady)) {
        if (!paused) {
            pause();
            pauseBtn.classList.remove('button_pause');
            pauseBtn.classList.add('button_play');
        } else {
            play();
            pauseBtn.classList.remove('button_play');
            pauseBtn.classList.add('button_pause');
        }
    }
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