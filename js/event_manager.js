function EventManager() {
    this.events = {};
    this.listen();
}

EventManager.prototype.on = function (event, callback) {
    if (!this.events[event]) {
        this.events[event] = [];
    }
    this.events[event].push(callback);
};

EventManager.prototype.emit = function (event, data) {
    var callbacks = this.events[event];
    if (callbacks) {
        callbacks.forEach(function (callback) {
            callback(data);
        });
    }
};

EventManager.prototype.listen = function () {
    var gameContainer = document.getElementsByClassName('game-container')[0];
    gameContainer.addEventListener(this.eventTouchmove, function (event) {
        event.preventDefault();
    });

    this.bindPress('.touchpad-cell', this.touchpadPress);
    this.bindPress('.restart-button', function () {
        this.emit('restart', {});
    });
};

EventManager.prototype.touchpadPress = function (event) {
    var currentCell = event.target,
        node = currentCell,
        x = 0,
        y = 0;
    while (node = node.previousSibling) {
        if (node.nodeType == 1) {
            y++;
        }
    }
    var currentParent = currentCell.parentNode;
    node = currentParent;
    while (node = node.previousSibling) {
        if (node.nodeType == 1) {
            x++;
        }
    }
    this.emit('press', {
        x: x,
        y: y
    });
};

EventManager.prototype.bindPress = function (selector, fn) {
    var els = document.querySelectorAll(selector);
    var self = this;
    var info = navigator.userAgent;
    var eventName = '';
    if (info.indexOf('iPod') != -1 || info.indexOf('iPad') != -1 || info.indexOf('iPhone') != -1 || info.indexOf('Android') != -1) {
        eventName = 'touchstart';
    } else {
        eventName = 'click';
    }
    Array.prototype.forEach.call(els, function (el) {
        el.addEventListener(eventName, fn.bind(self));
    });
};
