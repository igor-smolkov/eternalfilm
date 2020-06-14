import * as $ from 'jquery'
import '@/style.scss'
import baseJSON from '@static/base.json'

let base = baseJSON.links;
const timer = 7000;

connect();
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
    screen.firstChild.style.display = 'block';
    screen.lastChild.remove();
    onYouTubeIframeAPIReady();
    //show();
});

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: randLink(),
        playerVars: { 'autoplay': 1, 'controls': 0 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        const randStart = randN(0,player.getDuration()-(timer/1000));
        player.seekTo(randStart);
        setTimeout(stopVideo, timer);
        done = true;
    }
}

function stopVideo() {
    player.stopVideo();
    playVideo();
}

function playVideo() {
    player.cueVideoById(randLink(), 10);
    player.playVideo();
    done = false;
}

let addBtn = document.getElementById('add');
addBtn.addEventListener('click', function(){
    let linkField = document.getElementById('link');
    let linkFull = linkField.value;
    linkField.value = '';
    linkField.placeholder = 'ссылка добавлена, добавьте еще одну';
    let link = linkFull.slice(linkFull.indexOf('v=')+2,linkFull.length);  //сделать другой парс

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

function randLink() {
    return base[randN(0,base.length)];
};

function randN(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
};