import * as $ from 'jquery'
import '@/style.scss'
import baseJSON from '@static/base.json'

let base = baseJSON.links;
const timer = 10000;
const loadDiff = 500;

$.ajax({
    url: 'getBase.php',
    dataType: 'text',
    cache: false,
    data: '',
    type: 'post',
    success: function(php_script_response){
        base = JSON.parse(php_script_response).links;
    }
});

let screen = document.querySelector('.screen');
screen.addEventListener('click', function(){
    loadCoub();
    show();
});

let addBtn = document.getElementById('add');
addBtn.addEventListener('click', function(){
    let linkField = document.getElementById('link');
    let linkFull = linkField.value;
    linkField.value = '';
    linkField.placeholder = 'ссылка добавлена, добавьте еще одну';
    let link = linkFull.slice(linkFull.length-6,linkFull.length);  //сделать другой парс
    base.push(link);
});

function show() {
    screen.firstChild.remove();
    screen.firstChild.classList.toggle('coub_hidden');
    setTimeout(loadCoub, timer-loadDiff);
    setTimeout(show, timer);
};

function loadCoub() {
    let link = randLink();
    let coub = createCoub(link);
    screen.append(createCoub(link));
};

function createCoub(link) {
    let coub = document.createElement('iframe');
    coub.className = 'coub coub_hidden';
    coub.src = 'https://coub.com/embed/'+link+'?muted=false&autostart=true&originalSize=false&startWithHD=false';
    coub.allow = 'autoplay';
    return coub;
};

function randLink() {
    return base[randN(0,base.length)];
};

function randN(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
};