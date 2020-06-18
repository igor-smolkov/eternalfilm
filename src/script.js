import * as $ from 'jquery'
import '@/style.scss'
import baseJSON from '@static/base.json'

let base = baseJSON.links;
const timer = 10000;
const transition = 4000;

//connect();
function connect() {
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
}

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
    if (player === 'odd') {
        playerOdd = new YT.Player('player_odd', {
            videoId: randLink(),
            playerVars: { 'autoplay': 1, 'controls': 0 },
            events: {
                'onReady': onPlayerOddReady,
                'onStateChange': onPlayerOddStateChange
            }
        });
    } else if (player === 'even') {
        playerEven = new YT.Player('player_even', {
            videoId: randLink(),
            playerVars: { 'autoplay': 1, 'controls': 0 },
            events: {
                'onReady': onPlayerEvenReady,
                'onStateChange': onPlayerEvenStateChange
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

var doneOdd = false;
function onPlayerOddStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !doneOdd) {
        event.target.seekTo(randStart(event.target.getDuration()));
        setTimeout(changeVideo, timer, event.target, 'odd');
        doneOdd = true;
    }
}

var doneEven = false;
function onPlayerEvenStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !doneEven) {
        event.target.seekTo(randStart(event.target.getDuration()));
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
    player.mute();
    //setTimeout(transition50, transition/2, player);
    setTimeout(transitionEnd, transition, player);
}
function transition50(player) {
    player.setVolume(10);
    player.unMute();
}
function transitionEnd(player) {
    //player.setVolume(50);
    player.unMute();
}

function test(){
    console.log('test');
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

function playVideo(player) {
    player.loadVideoById(randLink());
}

let addBtn = document.getElementById('add');
addBtn.addEventListener('click', function(){
    let linkField = document.getElementById('link');
    let linkFull = linkField.value;
    linkField.value = '';
    linkField.placeholder = 'ссылка добавлена, добавьте еще одну';
    let link = linkFull.slice(linkFull.indexOf('v=')+2,linkFull.length);

    //отправка
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

    base.push(link);
});

function randStart(duration) {
    return randN(0,duration-(timer/1000));
}

function randLink() {
    return base[randN(0,base.length)];
};

function randN(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
};