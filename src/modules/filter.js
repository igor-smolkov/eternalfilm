//модуль с функциями рандома для разных задач
import * as rand from '@module/rand.js'
//видеофильтр
function set(filterDiv) {
    const filter = getFilter(rand.thing(['dark','light']),rand.thing(['cold','warm','grey','grey','none']),rand.thing([true, false]));
    filterDiv.style.backgroundImage = filter.gradient;
    filterDiv.style.mixBlendMode = filter.mode;
}

function reset(filterDiv) {
    filterDiv.style.backgroundImage = 'none';
    filterDiv.style.mixBlendMode = 'normal';
}

export {set, reset};

function getFilter(mood, sense, border = false) {
    let gradient;
    let mode;

    let filters = ["multiply","darken","overlay","color-dodge","color-burn","soft-light","hue","saturation","color"];

    const layerMain = {
        value: '',
        grow: 2
    };

    if (mood == 'dark') {
        layerMain.value = getColor(sense, 'dark-soft');
        filters = ["multiply","darken","overlay","overlay","color-dodge","color-dodge","color-dodge","soft-light","soft-light","soft-light","soft-light","color","color"];
    } else {
        layerMain.value = getColor(sense, 'light-soft');
        filters = ["multiply","multiply","darken","darken","overlay","soft-light","soft-light","color","color"];
    }

    gradient = getGradient([
        layerMain
    ]);

    if (border) {
        layerMain.grow = 10;
        const layerBorder = {
            value: getColor(sense,'dark-hard'),
            grow: 1
        };
        gradient = getGradient([
            layerBorder,
            layerMain,
            layerBorder
        ]);
        filters = ["multiply","multiply","darken","overlay","overlay","soft-light","soft-light"];
    }

    mode = filters[rand.n(0,filters.length)];

    return {
        gradient: gradient,
        mode: mode
    }
}

function getColor(sens = 'rand', mood = 'rand'){
    const percent = {
        darkHardMin: 0,
        darkHardMax: 15,
        darkSoftMin: 15,
        darkSoftMax: 50,
        lightSoftMin: 50,
        lightSoftMax: 85,
        lightHardMin: 85,
        lightHardMax: 100 
    }
    let min, max;
    switch (mood) {
        case 'dark-hard':
            min = Math.round(255 / 100 * percent.darkHardMin);
            max = Math.round(255 / 100 * percent.darkHardMax);
            break;
        case 'dark-soft':
            min = Math.round(255 / 100 * percent.darkSoftMin);
            max = Math.round(255 / 100 * percent.darkSoftMax);
            break;
        case 'light-soft':
            min = Math.round(255 / 100 * percent.lightSoftMin);
            max = Math.round(255 / 100 * percent.lightSoftMax);
            break;
        case 'light-hard':
            min = Math.round(255 / 100 * percent.lightHardMin);
            max = Math.round(255 / 100 * percent.lightHardMax);
            break;
        default:
            min = 0;
            max = 255;
    }
    let r, g, b;
    let color;
    switch (sens) {
        case 'cold':
            r = rand.n(min,min+Math.round((max-min)/2));
            g = rand.n(min,max);
            b = max;
            color = `rgba(${r},${g},${b},0.8)`;
            break;
        case 'warm':
            r = max;
            g = rand.n(min,max);
            b = min;
            color = `rgba(${r},${g},${b},0.8)`;
            break;
        case 'grey':
            const same = rand.n(min,max);
            r = same;
            g = same;
            b = same;
            color = `rgb(${r},${g},${b})`;
            break;
        default:
            r = rand.n(min,max);
            g = rand.n(min,max);
            b = rand.n(min,max);
            color = `rgba(${r},${g},${b},0.3)`;
    }
    return color;
}

function getGradient(colors) {
    let lg = 'linear-gradient(';
    for (let j = 0; j < colors.length; j++) {
        for(let i = 0; i <= colors[j].grow-1; i++){
            if (i != colors[j].grow-1) {
                lg += `${colors[j].value},`;
            } else {
                lg += `${colors[j].value}`;
            }
        }
        if (j != colors.length-1){
            lg += ',';
        }
    }
    lg += ')';
    return lg
}