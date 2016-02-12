'use strict';

var inherits = require('inherits');
//var _assign = require('lodash.assign');
var Core = require('../core/core');
var Utils = require('../core/utils');
var Message = require('../core/message');

var Frame = function(args) {
    this.options = {
        target: '',
        targetWindow: false,
        browser: false
    };

    Core.call(this);
    //options = _assign(options, args);
    this.setOptions(this, args);
    this.initialize(args);
};
inherits(Frame, Core);

Frame.prototype.initialize = function () {
    var that = this;

    this.listenEventNameCallbacks = {};
    this.listenEventTypeCallbacks = {};
    this.uid = 'frame-'+Utils.guid();
    this.eventTypeHistory = [];
    // check browser instance:
    if( this.options.browser.isParent &&  this.options.target !== false  ) {
        // is parent frame
        var elTarget = document.getElementById(this.options.target);
        if( elTarget!== undefined ) {
            this.options.targetWindow = elTarget.contentWindow;
        }
    } else {
        // is server
        this.options.targetWindow = window.top;
    }

    var targetFrame = this.options.browser.setTargetFrame(this.options.targetWindow);

    this.messageQueue = [];
    this.messageChannel = new Message({
        browser: this.options.browser,
        target: this.options.target,
        fromFrame: this.uid,
        targetFrame: targetFrame
    });

    this.messageChannel.onListenEventName(function(data){

        // if there is multiple child instances,
        // ensure seft frame is recipient:
        //console.log('from', data.from, that.options.browser.id);

        if( that.listenEventNameCallbacks[data.name] !== undefined ) {
            that.listenEventNameCallbacks[data.name].call(undefined, data);
        }
    });

    this.messageChannel.onListenEventType(function(data){
        if( that.listenEventTypeCallbacks[data.type] !== undefined ) {
            that.listenEventTypeCallbacks[data.type].call(undefined, data);
        }
    });

    // if as server, send handshake
    if( this.options.browser.isParent === false ) {
        this.messageChannel.handshake({
            name: 'onFrameReady',
            msg: 'child frame handshake request'
        });
    } else {
        // allow child to know who is it's parent
        this.messageChannel.handshake({
            name: 'onParentFrameReady',
            msg: 'parent frame handshake request'
        });
    }
};
Frame.prototype.getUid = function() {
    return this.uid;
};
Frame.prototype.listenEventType = function (eventType, callback) {
    this.listenEventTypeCallbacks[eventType] = callback;
    return this;
};

Frame.prototype.listenEventName = function (eventName, callback) {
    this.listenEventNameCallbacks[eventName] = callback;
    return this;
};

/**
 * Send a event to target Frame
 * target frame can be a child frame (if root)
 * or parent frame if already embedded
 *
 * @param data
 * @param callback
 */
Frame.prototype.send = function(data, callback) {
    data.target = this.options.target;
    this.messageChannel.send(data, callback);

    return this;
};

module.exports = Frame;
