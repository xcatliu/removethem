function GameManager(size, EventManager, Actuator, StorageManager) {
    this.size = size;
    this.storageManager = new StorageManager();
    this.actuator = new Actuator();
    this.eventManager = new EventManager();

    this.startTiles = 3;
    this.levelLine = 40;
    this.colors = ['blue', 'red', 'yellow', 'green', 'purple'];

    this.init = true;
    this.active = null;
    this.move = null;
    this.add = [];
    this.remove = [];
    this.eventManager.on('press', this.press.bind(this));

    this.setup();
}

GameManager.prototype.restart = function () {
    this.storageManager.clearGameState();
    this.setup();
};

GameManager.prototype.setup = function () {
    var previousState = this.storageManager.getGameState();

    if (previousState) {
        this.grid = new Grid(previousState.grid.size, previousState.grid.cells);
        this.score = previousState.score;
        this.level = previousState.level;
        this.over = previousState.over;
        this.combo = previousState.combo;
        this.next = previousState.next;
        this.line = previousState.line;
    } else {
        this.grid = new Grid(this.size);
        this.score = 0;
        this.level = 1;
        this.over = false;
        this.combo = 0;
        this.next = this.randomNextTiles();
        this.line = 0;

        this.addStartTiles();
    }
    this.init = true;

    this.actuate();
};

GameManager.prototype.randomNextTiles = function () {
    var tileNumber = this.level + 2,
        tiles = [];
    for (var i = 0; i < tileNumber; i++) {
        tiles.push(this.randomColor());
    }
    return tiles;
};

GameManager.prototype.addStartTiles = function () {
    for (var i = 0; i < this.startTiles; i++) {
        this.addRandomTile();
    }
};

GameManager.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
        var color = this.randomColor();
        var tile = new Tile(this.grid.randomAvailableCell(), color);

        this.grid.insertTile(tile);
    }
};

GameManager.prototype.randomColor = function () {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
};

GameManager.prototype.actuate = function () {
    if (this.storageManager.getBestScore() < this.score) {
        this.storageManager.setBestScore(this.score);
    }

    if (this.over) {
        this.storageManager.clearGameState();
    } else {
        this.storageManager.setGameState(this.serialize());
    }

    this.actuator.actuate(this.grid, {
        score: this.score,
        over: this.over,
        level: this.level,
        combo: this.combo,
        next: this.next,
        line: this.line,
        levelLine: this.levelLine,
        active: this.active,
        init: this.init,
        move: this.move,
        add: this.add,
        remove: this.remove,
        bestScore: this.storageManager.getBestScore()
    });
    this.init = false;
};

GameManager.prototype.serialize = function () {
    return {
        grid: this.grid.serialize(),
        score: this.score,
        level: this.level,
        over: this.over,
        combo: this.combo,
        next: this.next,
        line: this.line
    };
};

GameManager.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

GameManager.prototype.availableMove = function (tile) {
    var checkList = [{
        x: tile.x,
        y: tile.y
    }];
    var checkedList = [];
    while (checkList.length != 0) {
        var currentTile = checkList.pop();
        var currentTileString = currentTile.x + ',' + currentTile.y;
        if (checkedList.indexOf(currentTileString) == -1) {
            checkedList.push(currentTileString);
            var tempCells = [{
                x: currentTile.x,
                y: currentTile.y - 1
            }, {
                x: currentTile.x,
                y: currentTile.y + 1
            }, {
                x: currentTile.x - 1,
                y: currentTile.y
            }, {
                x: currentTile.x + 1,
                y: currentTile.y
            }];
            for (var i = 0; i < tempCells.length; i++) {
                if (this.grid.cellAvailable(tempCells[i])) {
                    checkList.push(tempCells[i]);
                }
            }
        } else {
            continue;
        }
    }
    return checkedList;
};

GameManager.prototype.disabledMove = function (tile) {
    var disabled = [];
    var availableMove = this.availableMove(tile);
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            if (availableMove.indexOf(i + ',' + j) == '-1' && !this.grid.cellOccupied({
                    x: i,
                    y: j
                })) {
                disabled.push(i + ',' + j);
            }
        }
    }
    return disabled;
};

GameManager.prototype.checkTiles = function (tiles) {
    if (this.over) {
        return;
    }

    var removeTiles = [];
    for (var i = 0; i < tiles.length; i++) {
        var currentColor = tiles[i].color;
        // 四个方向
        var line1Array = [{
            x: tiles[i].x,
            y: tiles[i].y
        }];
        for (var fk = 1; fk < 4; fk++) {
            var tempCell = {
                x: tiles[i].x,
                y: tiles[i].y + fk
            };
            if (this.grid.cellOccupied(tempCell)) {
                if (this.grid.cellContent(tempCell).color == currentColor) {
                    line1Array.push(tempCell);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        for (var fk = 1; fk < 4; fk++) {
            var tempCell = {
                x: tiles[i].x,
                y: tiles[i].y - fk
            };
            if (this.grid.cellOccupied(tempCell)) {
                if (this.grid.cellContent(tempCell).color == currentColor) {
                    line1Array.push(tempCell);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        var line2Array = [{
            x: tiles[i].x,
            y: tiles[i].y
        }];
        for (var fk = 1; fk < 4; fk++) {
            var tempCell = {
                x: tiles[i].x + fk,
                y: tiles[i].y
            };
            if (this.grid.cellOccupied(tempCell)) {
                if (this.grid.cellContent(tempCell).color == currentColor) {
                    line2Array.push(tempCell);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        for (var fk = 1; fk < 4; fk++) {
            var tempCell = {
                x: tiles[i].x - fk,
                y: tiles[i].y
            };
            if (this.grid.cellOccupied(tempCell)) {
                if (this.grid.cellContent(tempCell).color == currentColor) {
                    line2Array.push(tempCell);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        var line3Array = [{
            x: tiles[i].x,
            y: tiles[i].y
        }];
        for (var fk = 1; fk < 4; fk++) {
            var tempCell = {
                x: tiles[i].x + fk,
                y: tiles[i].y + fk
            };
            if (this.grid.cellOccupied(tempCell)) {
                if (this.grid.cellContent(tempCell).color == currentColor) {
                    line3Array.push(tempCell);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        for (var fk = 1; fk < 4; fk++) {
            var tempCell = {
                x: tiles[i].x - fk,
                y: tiles[i].y - fk
            };
            if (this.grid.cellOccupied(tempCell)) {
                if (this.grid.cellContent(tempCell).color == currentColor) {
                    line3Array.push(tempCell);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        var line4Array = [{
            x: tiles[i].x,
            y: tiles[i].y
        }];
        for (var fk = 1; fk < 4; fk++) {
            var tempCell = {
                x: tiles[i].x + fk,
                y: tiles[i].y - fk
            };
            if (this.grid.cellOccupied(tempCell)) {
                if (this.grid.cellContent(tempCell).color == currentColor) {
                    line4Array.push(tempCell);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        for (var fk = 1; fk < 4; fk++) {
            var tempCell = {
                x: tiles[i].x - fk,
                y: tiles[i].y + fk
            };
            if (this.grid.cellOccupied(tempCell)) {
                if (this.grid.cellContent(tempCell).color == currentColor) {
                    line4Array.push(tempCell);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        if (line1Array.length >= 4) {
            removeTiles.push(line1Array);
        }
        if (line2Array.length >= 4) {
            removeTiles.push(line2Array);
        }
        if (line3Array.length >= 4) {
            removeTiles.push(line3Array);
        }
        if (line4Array.length >= 4) {
            removeTiles.push(line4Array);
        }
    }
    var removeCount = 0;
    for (var i = 0; i < removeTiles.length; i++) {
        for (var j = 0; j < removeTiles[i].length; j++) {
            if (this.grid.cellOccupied(removeTiles[i][j])) {
                this.grid.removeTile(removeTiles[i][j]);
                removeCount++;
            }
        }
    }

    if (!this.grid.cellsAvailable()) {
        this.over = true;
    }

    this.score += ((removeCount + this.combo * 2) * (removeTiles.length));

    return removeTiles;
};

GameManager.prototype.addNextTiles = function () {
    if (this.grid.availableCells().length < this.next.length) {
        this.over = true;
        return;
    }
    var nextTiles = [];
    if (this.grid.cellsAvailable()) {
        for (var i = 0; i < this.next.length; i++) {
            var tile = new Tile(this.grid.randomAvailableCell(), this.next[i]);
            nextTiles.push(tile);
            this.grid.insertTile(tile);
        }
    }
    return nextTiles;
};

GameManager.prototype.press = function (cell) {
    if (this.over) {
        return;
    }
    if (this.grid.cellOccupied(cell)) {
        var currentTile = this.grid.cellContent(cell);
        if (this.active != null && this.active == currentTile) {
            this.active = null;
        } else {
            this.active = currentTile;
        }
        this.move = null;
        this.add = [];
        this.remove = [];
        if (this.active) {
            this.active.updateDisable(this.disabledMove(currentTile));
        }

        this.actuate();
    } else {
        if (this.active == null) {
            return;
        } else {
            var currentTile = this.grid.cellContent(this.active);
            if (currentTile.disable.indexOf(cell.x + ',' + cell.y) == -1) {
                this.move = {
                    from: {
                        x: currentTile.x,
                        y: currentTile.y,
                        color: currentTile.color
                    },
                    to: {
                        x: cell.x,
                        y: cell.y,
                        color: currentTile.color
                    }
                };
                this.moveTile(currentTile, cell);
                this.active = null;

                this.remove = this.checkTiles([currentTile]);

                if (this.remove.length == 0) {
                    this.combo = 0;
                    this.add = this.addNextTiles();
                    this.remove = this.checkTiles(this.add);
                    this.next = this.randomNextTiles();
                } else {
                    this.combo++;
                    this.line += this.remove.length;
                }
                this.actuate();
            } else {
                this.active = null;
                this.actuate();
            }
        }
    }
};
