import '@/style.scss'

import baseJSON from '@file/base.json'
let base = baseJSON.links;
const isProd = process.env.NODE_ENV === 'production';
import connect from '@module/connect.js'
if (isProd) { getBase() }
async function getBase() {
    base = await connect();
}

import send from '@module/send.js'

import config from '@file/film.config.json'
const timer = config.timer;
const transition = config.transition;

import * as rand from '@module/rand.js'
import * as parse from '@module/parse.js'

loadYTApi();
function loadYTApi() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

let screen = document.querySelector('.screen');
screen.addEventListener('click', function(){
    screen.lastChild.remove();
    screen.childNodes[0].style.display = 'block';
    onYouTubeIframeAPIReady('odd');
    setTimeout(onYouTubeIframeAPIReady, timer-transition, 'even');
});

let playerOdd, playerEven;
function onYouTubeIframeAPIReady(player) {
    currentLink = rand.thing(base);
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

function onPlayerOddReady(event) {
    event.target.playVideo();
}

function onPlayerEvenReady(event) {
    event.target.playVideo();
    transitionStart(event.target);
}

function onPlayerError(event) {
    base.splice(base.indexOf(currentLink), 1);
    playVideo(event.target);
}

var doneOdd = false;
function onPlayerOddStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !doneOdd) {
        event.target.seekTo(rand.start(event.target.getDuration(), timer));

        jCut(event.target, transition, rand.thing(['lin', 'exp']));

        setTimeout(changeVideo, timer, event.target, 'odd');
        doneOdd = true;
    }
}

var doneEven = false;
function onPlayerEvenStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !doneEven) {
        event.target.seekTo(rand.start(event.target.getDuration(), timer));

        jCut(event.target, transition, rand.thing(['lin', 'exp']));

        setTimeout(changeVideo, timer, event.target, 'even');
        doneEven = true;
    }
}

function changeVideo(player, playerPoint) {
    player.stopVideo();

    changeFrame(playerPoint);

    setTimeout(transitionStart, timer-transition*2, player);

    if (playerPoint === 'odd') {
        doneOdd = false;
    } else if (playerPoint === 'even') {
        doneEven = false;
    }

    setTimeout(playVideo, timer-transition*2, player);
}

function transitionStart(player) {
}
function transition50(player) {
}
function transitionEnd(player) {
}

const maxVol = 100;
function jCut(player, duration, type = 'lin', shift = 0) {
    const step = duration/maxVol;
    player.setVolume(0);
    if(type === 'lin'){
        let i = 0;
        setTimeout(up, shift);
        function up() {
            player.setVolume(Math.round(i));
            if (i <= maxVol) {
                i += step/100;
                setTimeout(up, 24);
            }
        }
    } else if(type === 'exp'){
        let i = 0;
        setTimeout(up, shift);
        function up() {
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
            if(i) { 
                player.setVolume(maxVol); 
            }
            i = true;
            setTimeout(up, duration-shift);
        }
    }
    setTimeout(transitionEnd, duration, player)
}

function changeFrame(playerPoint) {
    if (playerPoint === 'odd') {
        screen.childNodes[0].style.display = 'none';
        screen.childNodes[1].style.display = 'block';
    } else if (playerPoint === 'even') {
        screen.childNodes[1].style.display = 'none';
        screen.childNodes[0].style.display = 'block';
    }
}

let currentLink;
function playVideo(player) {
    currentLink = rand.thing(base);
    player.loadVideoById(currentLink);
}

let form = document.querySelector('.add-link');
let linkField = document.getElementById('link');
let firstAdd = false
linkField.addEventListener('mousedown', function(){
    if (!firstAdd){
        firstAdd = true;
        form.style.minHeight = '50px';
        linkField.style.textAlign = 'left';
        linkField.value = '';
        linkField.placeholder = 'подсказка: вставьте ссылку на видео с youtube и нажмите добавить';
        addBtn.style.display = 'block';
    }
});

let addBtn = document.getElementById('add');
addBtn.addEventListener('click', function(){
    let linkFieldValue = linkField.value;
    linkField.value = '';
    linkField.placeholder = 'идет обработка данных...';

    let link = parse.ytLink(linkFieldValue);
    if (link !== 'error') {
        const request = new XMLHttpRequest();
        request.open('GET',`https://www.googleapis.com/youtube/v3/videos?id=${link}&key=AIzaSyBjdUFZjn1Nf5NSIqbdzq6MjTn4Ht99blg`,true);
        request.addEventListener('readystatechange', function() {
            if ((request.readyState==4) && (request.status==200)) {
                if (JSON.parse(request.responseText).items.length > 0) {
                    send(link);
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