import '@/style.scss'

function createCoub(){
    let coub = document.createElement('iframe');
    coub.className = 'coub';
    coub.src = 'https://coub.com/embed/2cfnex?muted=false&autostart=true&originalSize=false&startWithHD=false';
    coub.frameBorder = 0;
    coub.width = '100%';
    coub.height = '100%';
    coub.allow = 'autoplay';
    return coub;
}

let screen = document.querySelector('.screen');
screen.addEventListener('click', function(){
    screen.firstChild.remove();
    screen.append(createCoub());
});
