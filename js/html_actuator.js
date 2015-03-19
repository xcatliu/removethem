function HTMLActuator() {
    this.score = 0;

    this.tileContainer = document.querySelector('.tile-container');
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
    if (metadata.over) {}
    var self = this;
    window.requestAnimationFrame(function () {
        if (metadata.init) {
            self.clearContainer(self.tileContainer);
            grid.cells.forEach(function (column) {
                column.forEach(function (cell) {
                    if (cell) {
                        self.addTile(cell);
                    }
                });
            });
            self.init = true;
        } else {
            self.clearActive();
            if (metadata.active) {
                self.activeTile(metadata.active);
            } else if (metadata.move) {
                self.removeTile(metadata.move.from);
                self.addTile(metadata.move.to);
                if (metadata.add.length == 0) {
                    self.removeFormat(metadata.remove).forEach(function (tile) {
                        self.removeTile(tile);
                    });
                } else {
                    metadata.add.forEach(function (tile) {
                        self.addTile(tile);
                    });
                    if (metadata.remove.length != 0) {
                        setTimeout(function () {
                            self.removeFormat(metadata.remove).forEach(function (tile) {
                                self.removeTile(tile);
                            });
                        }, 500);
                    }
                }
            }
        }
    });
};

HTMLActuator.prototype.clearContainer = function (container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
};

HTMLActuator.prototype.removeFormat = function (remove) {
    var removeList = [];
    var removeListCheck = [];
    remove.forEach(function (line) {
        line.forEach(function (tile) {
            if (removeListCheck.indexOf(tile.x + ',' + tile.y) == -1) {
                removeList.push(tile);
                removeListCheck.push(tile.x + ',' + tile.y);
            }
        });
    });
    return removeList;
};

HTMLActuator.prototype.removeTile = function (tile) {
    var position = {
        x: tile.x,
        y: tile.y
    };
    var positionClass = '.' + this.positionClass(position);
    var tileNode = document.querySelector(positionClass);
    if (tileNode) {
        tileNode.classList.add('tile-remove');
    }
};

HTMLActuator.prototype.activeTile = function (tile) {
    var tileNode = document.querySelector('.' + this.positionClass(tile));
    tileNode.classList.add('tile-active');
    var disable = tile.disable;
    disable.forEach(function (cell) {
        cell = cell.split(',');
        document.querySelectorAll('.grid-row')[cell[0]].children[cell[1]].classList.add('grid-disable');
    });
};

HTMLActuator.prototype.clearActive = function () {
    var tileNode = document.querySelector('.tile-active');
    if (tileNode) {
        tileNode.classList.remove('tile-active');
    }
    var disableNode = document.querySelectorAll('.grid-disable');
    Array.prototype.forEach.call(disableNode, function (node) {
        node.classList.remove('grid-disable');
    });
};

HTMLActuator.prototype.addTile = function (tile) {
    var self = this;

    var wrapper = document.createElement('div');
    var inner = document.createElement('div');
    var position = {
        x: tile.x,
        y: tile.y
    };
    var positionClass = this.positionClass(position);
    var classes = ['tile tile-add', 'tile-' + tile.color, positionClass];
    this.applyClasses(wrapper, classes);
    inner.classList.add('tile-inner');

    wrapper.appendChild(inner);
    this.tileContainer.appendChild(wrapper);
    wrapper.addEventListener('webkitAnimationEnd', function (event) {
        if (event.animationName == 'appear') {
            wrapper.classList.remove('tile-add');
        }
        if (event.animationName == 'remove') {
            wrapper.parentNode.removeChild(wrapper);
        }
    });
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
    element.setAttribute('class', classes.join(' '));
};

HTMLActuator.prototype.positionClass = function (position) {
    return 'tile-position-' + position.x + '-' + position.y;
};
