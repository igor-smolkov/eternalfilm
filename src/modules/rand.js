function thing(arr) {
    return arr[n(0,arr.length)];
}

function start(interval, duration) {
    return n(0,interval-(duration/1000));
}

// function randLink() {
//     return base[randN(0,base.length)];
// };

function n(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
};

export {n, thing, start};