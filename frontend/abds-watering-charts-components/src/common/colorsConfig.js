
export const heatMapColorConfig = function (value) {
    if (value > -30) {
        return 'rgb(5, 48, 97)';
    } else if (value > -100) {
        return 'rgb(51, 124, 183)';
    } else if (value > -200) {
        return 'rgb(143, 194, 221)';
    } else if (value > -300) {
        return 'rgb(241, 163, 133)'
    } else if (value > -1500) {
        return 'rgb(195, 61, 61)';
    } else return 'rgb(140, 13, 37)'
};