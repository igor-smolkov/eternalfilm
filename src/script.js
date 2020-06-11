import '@/style.scss'

const link = '2cfnex';
const timer = 10000;
const loadDiff = 500;

let screen = document.querySelector('.screen');
screen.addEventListener('click', function(){
    loadCoub();
    show();
});

function show() {
    screen.firstChild.remove();
    screen.firstChild.display = 'block';
    setTimeout(loadCoub, timer-loadDiff);
    setTimeout(show, timer);
};

function loadCoub() {
    let coub = createCoub(link);
    coub.style.display = 'none';
    screen.append(createCoub(link));
};

function createCoub(link) {
    let coub = document.createElement('iframe');
    coub.className = 'coub';
    coub.src = 'https://coub.com/embed/'+link+'?muted=false&autostart=true&originalSize=false&startWithHD=false';
    coub.allow = 'autoplay';
    return coub;
};