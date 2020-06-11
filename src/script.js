import '@/style.scss'

const link = '2cfnex';
const timer = 5000;

let screen = document.querySelector('.screen');
screen.addEventListener('click', function(){
    show();
});

function show(){
    screen.firstChild.remove();
    screen.append(createCoub(link));
    setTimeout(show, timer);
}

function createCoub(link){
    let coub = document.createElement('iframe');
    coub.className = 'coub';
    coub.src = 'https://coub.com/embed/'+link+'?muted=false&autostart=true&originalSize=false&startWithHD=false';
    coub.allow = 'autoplay';
    return coub;
};