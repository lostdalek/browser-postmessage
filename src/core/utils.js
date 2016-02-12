'use strict';
//var _assign = require('lodash.assign');

var Utils = function() {

};

Utils.prototype.setOptions = function (obj, options) {
    if (!obj.hasOwnProperty('options')) {
        obj.options = obj.options ? new Object(obj.options) : {};
    }
    for (var i in options) {
        obj.options[i] = options[i];
    }
    return obj.options;

};
Utils.prototype.extend = function (dest) {
    var i, j, len, src;

    for (j = 1, len = arguments.length; j < len; j++) {
        src = arguments[j];
        for (i in src) {
            dest[i] = src[i];
        }
    }
    return dest;
};

Utils.guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4();
};

module.exports = Utils;
