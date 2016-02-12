'use strict';
var instance;
var onMessageEvent = function() {

};
var guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4();
};
var browserInstance = function() {
    var _targetFrame = false;
    var _listenCallbacks = [];
    var _isParent = window.top !== window.self ? false : true;

    onMessageEvent = function(data) {
        if( _listenCallbacks.length > 0 ) {

            for ( var i = 0; i < _listenCallbacks.length; i++) {
                var cb = _listenCallbacks[i];
                cb.call(undefined, data);
            }
        }
    };

    // listen current Frame Window:
    if (window.addEventListener) window.addEventListener('message', onMessageEvent, false);
    else if(window.attachEvent) window.attachEvent('onmessage', onMessageEvent);



    return {
        id: 'bwsr-'+guid(),
        isParent: _isParent,
        targetFrame: _targetFrame,
        setTargetFrame: function(domDocument) {
            _targetFrame = domDocument;
            return _targetFrame;
        },
        setListenCallback: function( callback ) {
            _listenCallbacks.push(callback);
        }
    };

};

module.exports = {
    initialize: function (args) {
        if ( !instance ) {
            instance = browserInstance(args);
        }
        return instance;
    },
    isParent: function() {
        return instance.isParent;
    }
};

