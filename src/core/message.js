'use strict';

var Utils = require('./utils');

var Message = function(args) {
    var that = this;
    this.parentFrameReady = false;
    this.childFrameReady = false;
    this.options = args;
    this.messageQueue = [];
    this.storedCallback = {};
    this.ownedByFrame = 'unknown';
    this.onwedByBrowser = 'unknown';
    this._listenEventTypeCallback = false;
    this._listenEventNameCallback = false;
    this.options.browser.setListenCallback(function(event){
        if(that.parentFrameReady && that.childFrameReady) {
/*

            //debug informations:
            var whois = '[CHILD]'+that.options.browser.id;
            if( that.options.browser.isParent) {
                whois = '[PARENT]'+that.options.browser.id;
            }
            console.log(whois+'[RECEIVE]',
                event.data.f.from, '>', event.data.f.to,
                event.data.b.from, '>', event.data.b.to
            );

*/

            // if events comes from child frames, receipt will be sent back to all frame
            // only callback if recipient:
            var isRecipient = true;
            if( event.data.type === 'receipt' ) {
                if(that.options.browser.id !== event.data.request.b.from) {
                    isRecipient = false;
                }
            } else {
                // if there is multiple child instances,
                // ensure from ok:
                //console.log('destination match?', that.options.fromFrame, that.ownedByFrame)
            }

            // trigger callbacks to generic listeners
            if( isRecipient ) {
                if( that._listenEventTypeCallback !== false ) {
                    that._listenEventTypeCallback.call(undefined, event.data);
                }
                if( that._listenEventNameCallback !== false ) {
                    that._listenEventNameCallback.call(undefined, event.data);
                }
            }

            // trigger callbacks to specified listeners:
            if( event.data.type !== 'receipt' ) {
                // foreach message received:
                // send callback to listener:
                that.receipt(event.data);
            } else {
                // if request has a callback on success:
                if( that.storedCallback[event.data.request.uid] !== undefined ) {
                    that.storedCallback[event.data.request.uid].call(undefined, event.data);
                    delete that.storedCallback[event.data.request.uid];
                }
            }
            return;
        }

        // initialization and handshaking

        /// Parent Frame Side
        if( that.options.browser.isParent ) {
            // if parent frame receive a message from child frame:
            if( event.data.type === 'handshake' ) {
                // ok parent frame has receive handshake from child frame
                that.parentFrameReady = true;
                that.childFrameReady = true;
                // send a receipt:
                that.receipt(event.data);
                // resume parent frame message queue:
                that.resumeQueue();
                // child frame is ready!
            }
        }
        // Child Frame Side
        else {
            /*if( event.data.type === 'handshake' ) {
                that.ownedByFrame = event.data.f.from;
                that.onwedByBrowser =  event.data.b.from;
                // never happen - parent do
                // parent frame try to handshake - parent frame is up and running
                that.parentFrameReady = true;
                // send a receipt to the child frame:
                that.receipt(event.data);
            }*/
            // if child frame receive the handshake receipt:
            // everything is up and running
            if( event.data.type === 'receipt' ) {
                if( event.data.request.type === 'handshake' ) {
                    //console.log('>>>>>>>>> OWNED BY', event.data.f.from)
                    that.ownedByFrame = event.data.f.from;
                    that.onwedByBrowser =  event.data.b.from;
                    that.parentFrameReady = true;
                    that.childFrameReady = true;
                    // resume child frame message queue:
                    that.resumeQueue();
                }
            }
        }
    });
};
Message.prototype.resumeQueue = function (filterType) {
    var newMessageQueue = [];
    if( this.messageQueue.length > 0) {
        var mqlen = this.messageQueue.length;
        for ( var i = 0; i < mqlen; i++) {
            // resume message by type
            if( filterType !== undefined ) {
                if( this.messageQueue[i].data.type === filterType ) {
                    // only resume message with filtered type
                    this.send(this.messageQueue[i].data, this.messageQueue[i].callback);
                } else {
                    newMessageQueue.push(this.messageQueue[i]);
                }
            } else {
                // resume all messages:
                this.send(this.messageQueue[i].data, this.messageQueue[i].callback);
            }
        }

        this.messageQueue = newMessageQueue;
    }
};

/**
 * Attach Callback function by event type
 * @param callback
 */
Message.prototype.onListenEventType = function(callback) {
    this._listenEventTypeCallback = callback;
};
/**
 * Attach Callback function by event name
 * @param callback
 */
Message.prototype.onListenEventName = function(callback) {
    this._listenEventNameCallback = callback;
};

Message.prototype.handshake = function (data) {
    //var targetFrame = this.options.targetFrame;
    data.type = 'handshake';
    if( this.options.browser.isParent && this.childFrameReady === false) {
        // queue
        this.messageQueue.push(data);
    } else {
        this.send(data);
    }
};
Message.prototype.receipt = function (data) {
    var dataContainer = {};
    dataContainer.name = 'onReceipt';
    dataContainer.msg = 'receipt';
    dataContainer.type = 'receipt';
    dataContainer.request = data;
    this.send(dataContainer);
};
Message.prototype.send = function (data, callback) {
    if( data === undefined ) {
        return;
    }
    data.uid = Utils.guid();

    data.f = {
        from: this.options.fromFrame,
        to: this.ownedByFrame
    };
    data.b = {
        from: this.options.browser.id,
        to: this.onwedByBrowser
    };

    if( data.name === undefined ) {
        data.name = '';
    }
    if( data.type === undefined ) {
        data.type = 'message';
    }

    // reference callback if exist:
    if( callback !== undefined ) {
        this.storedCallback[data.uid] = callback;
    }

    // stack all non service message:
    if( data.type !== 'handshake' && data.type !== 'receipt' &&
        ( this.childFrameReady === false || this.parentFrameReady === false)
    ) {
        this.messageQueue.push({data: data, callback: callback});
    } else {
         //console.log('<<>>', this.options.targetFrame);
        // send message to frame (ie: targetFrame = target)
        this.options.targetFrame.postMessage(data, '*');
    }
};

module.exports = Message;
