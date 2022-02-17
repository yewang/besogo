(function() {
'use strict';

// Parent object to hold coordinate system helper functions
besogo.coord = {};

// Null function for no coordinate system
besogo.coord.none = function(sizeX, sizeY) {
    return false;
};

// Western, chess-like, "A1" coordinate system
besogo.coord.western = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        labels.x[i] = numberToLetter(i);
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = (sizeY - i + 1) + '';
    }
    return labels;
};

// Simple purely numeric coordinate system
besogo.coord.numeric = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        labels.x[i] = i + '';
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = i + '';
    }
    return labels;
};

// Pierre Audouard corner-relative coordinate system
besogo.coord.pierre = function(sizeX, sizeY) {
    var labels = { x: [], xb: [], y: [], yb: [] }, i;
    for (i = 1; i <= sizeX / 2; i++) {
        labels.x[i] = 'a' + i;
        labels.x[sizeX - i + 1] = 'b' + i;
        labels.xb[i] = 'd' + i;
        labels.xb[sizeX - i + 1] = 'c' + i;
    }
    if (sizeX % 2) {
        i = Math.ceil(sizeX / 2);
        labels.x[i] = 'a';
        labels.xb[i] = 'c';
    }
    for (i = 1; i <= sizeY / 2; i++) {
        labels.y[i] = 'a' + i;
        labels.y[sizeY - i + 1] = 'd' + i;
        labels.yb[i] = 'b' + i;
        labels.yb[sizeY - i + 1] = 'c' + i;
    }
    if (sizeY % 2) {
        i = Math.ceil(sizeY / 2);
        labels.y[i] = 'd';
        labels.yb[i] = 'b';
    }
    return labels;
};

// Corner-relative, alpha-numeric, coordinate system
besogo.coord.corner = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        if (i < (sizeX / 2) + 1) {
            labels.x[i] = numberToLetter(i);
        } else {
            labels.x[i] = (sizeX - i + 1) + '';
        }
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = (sizeY - i + 1) + '';
        if (i > (sizeY / 2)) {
            labels.y[i] = numberToLetter(sizeY - i + 1);
        } else {
            labels.y[i] = i + '';
        }
    }
    return labels;
};

// Corner-relative, numeric and CJK, coordinate system
besogo.coord.eastcor = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        if (i < (sizeX / 2) + 1) {
            labels.x[i] = numberToCJK(i);
        } else {
            labels.x[i] = (sizeX - i + 1) + '';
        }
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = (sizeY - i + 1) + '';
        if (i > (sizeY / 2)) {
            labels.y[i] = numberToCJK(sizeY - i + 1);
        } else {
            labels.y[i] = i + '';
        }
    }
    return labels;
};

// Eastern, numeric and CJK, coordinate system
besogo.coord.eastern = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        labels.x[i] = i + ''; // Columns are numeric
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = numberToCJK(i);
    }

    return labels;
};

// Helper for converting numeric coord to letter (skipping I)
function numberToLetter(number) {
    return 'ABCDEFGHJKLMNOPQRSTUVWXYZ'.charAt((number - 1) % 25);
}

// Helper for converting numeric coord to CJK symbol
function numberToCJK(number) {
    var label = '',
        cjk = '一二三四五六七八九';

    if (number >= 20) { // 20 and larger
        label = cjk.charAt(number / 10 - 1) + '十';
    } else if (number >= 10) { // 10 through 19
        label = '十';
    }
    if (number % 10) { // Ones digit if non-zero
        label = label + cjk.charAt((number - 1) % 10);
    }
    return label;
}

})(); // END closure
