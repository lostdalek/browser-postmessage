'use strict';
var Browser = require('./core/browser');
var Frame = require('./frame/frame');

var instance;

var init = function() {
    // Singleton
    var frameInstance;
    return {
        addFrame: function(target) {
            if( target === undefined ) target = false;
            var browser = Browser.initialize();
            frameInstance = new Frame({
                target:target,
                browser: browser
            });
            return frameInstance;
        }
    };
};

module.exports = {
    version: '1.0.0',
    // Get the Singleton instance if one exists
    // or create one if it doesn't
    initialize: function (args) {
        if ( !instance ) {
            instance = init(args);
        }
        return instance;
    }
};
