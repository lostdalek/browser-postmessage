'use strict';
var inherits = require('inherits');
var Utils = require('./utils');
var Core = function(args) {
    Utils.call(this);
    this.setOptions(this, args);
};

inherits(Core, Utils);

module.exports = Core;
