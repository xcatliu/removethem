// 游戏逻辑处理总类，包含参数设置，逻辑处理等
function GameManager(size, EventManager, Actuator, StorageManager) {
    // 棋盘大小
    this.size = size;
    // 存储对象
    this.storageManager = new StorageManager();
    // 数据驱动对象
    this.actuator = new Actuator();
    // 事件处理对象
    this.eventManager = new EventManager();

    // 初始方块数，升级所需方块数，方块颜色库
    this.startTiles = 3;
    this.levelLine = 40;
    this.colors = ['blue', 'red', 'yellow', 'green', 'purple'];

    // 是否为初始化棋盘
    this.init = true;

    // 响应用户操作时的交换数据
    this.active = null;
    this.move = null;
    this.add = [];
    this.remove = [];

    // 设置事件名称，及具体响应
    this.eventManager.on('press', this.press.bind(this));
    this.eventManager.on('restart', this.restart.bind(this));

    // 初始化游戏
    this.setup();
}

// 重新开始游戏
GameManager.prototype.restart = function () {
    this.storageManager.clearGameState();
    this.active = null;
    this.move = null;
    this.add = [];
    this.remove = [];
    this.init = true;
    this.setup();
};

// 初始化
GameManager.prototype.setup = function () {
    // 查看缓存是否有数据
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

        // 添加初始方块
        this.addStartTiles();
    }
    this.actuate();
    this.init = false;
};

// 获取下一次出现方块的颜色集合
GameManager.prototype.randomNextTiles = function () {
    var tileNumber = this.level + 2,
        tiles = [];
    for (var i = 0; i < tileNumber; i++) {
        tiles.push(this.randomColor());
    }
    return tiles;
};

// 添加初始方块
GameManager.prototype.addStartTiles = function () {
    for (var i = 0; i < this.startTiles; i++) {
        var color = this.randomColor();
        var tile = new Tile(this.grid.randomAvailableCell(), color);

        this.grid.insertTile(tile);
    }
};

// 获取颜色库中的随机颜色
GameManager.prototype.randomColor = function () {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
};

// 数据驱动桥梁（帧刷新）
GameManager.prototype.actuate = function () {
    // 更新最高分数
    if (this.storageManager.getBestScore() < this.score) {
        this.storageManager.setBestScore(this.score);
    }

    // 判断是否达到升级条件
    if (this.line >= this.levelLine && this.level < 4) {
        this.line = 0;
        this.level++;
    }

    // 缓存当前数据
    this.storageManager.setGameState(this.serialize());

    // 将数据传入驱动对象中，构造VIEW
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
};

// 序列化当前数据
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

// 获取可移动的目标集合
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

// 获得不可移动的目标集合
GameManager.prototype.disabledMove = function (tile) {
    var disabled = [];
    var availableMove = this.availableMove(tile);
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            if (availableMove.indexOf(i + ',' + j) == -1 && !this.grid.cellOccupied({
                    x: i,
                    y: j
                })) {
                disabled.push(i + ',' + j);
            }
        }
    }
    return disabled;
};

// 检测消除附属函数
GameManager.prototype.checkTilesPart = function (lineArray, mode, tile) {
    for (var fk = 1; fk < 4; fk++) {
        switch (mode) {
        case 'xy+':
            var tempCell = {
                x: tile.x,
                y: tile.y + fk
            };
            break;
        case 'xy-':
            var tempCell = {
                x: tile.x,
                y: tile.y - fk
            };
            break;
        case 'x+y':
            var tempCell = {
                x: tile.x + fk,
                y: tile.y
            };
            break;
        case 'x-y':
            var tempCell = {
                x: tile.x - fk,
                y: tile.y
            };
            break;
        case 'x+y+':
            var tempCell = {
                x: tile.x + fk,
                y: tile.y + fk
            };
            break;
        case 'x-y-':
            var tempCell = {
                x: tile.x - fk,
                y: tile.y - fk
            };
            break;
        case 'x+y-':
            var tempCell = {
                x: tile.x + fk,
                y: tile.y - fk
            };
            break;
        case 'x-y+':
            var tempCell = {
                x: tile.x - fk,
                y: tile.y + fk
            };
            break;
        }
        if (this.grid.cellOccupied(tempCell)) {
            if (this.grid.cellContent(tempCell).color == tile.color) {
                lineArray.push(tempCell);
            } else {
                break;
            }
        } else {
            break;
        }
    }
};

// 以某个方块为中心，检测是否有可消除的序列，参数为数组
GameManager.prototype.checkTiles = function (tiles) {
    // 如果游戏结束，应该返回空序列
    if (this.over) {
        return [];
    }
    var removeTiles = [];
    for (var i = 0; i < tiles.length; i++) {
        // 检测四个方向
        var line1Array = [{
            x: tiles[i].x,
            y: tiles[i].y
        }];
        this.checkTilesPart(line1Array, 'xy+', tiles[i]);
        this.checkTilesPart(line1Array, 'xy-', tiles[i]);

        var line2Array = [{
            x: tiles[i].x,
            y: tiles[i].y
        }];
        this.checkTilesPart(line2Array, 'x+y', tiles[i]);
        this.checkTilesPart(line2Array, 'x-y', tiles[i]);

        var line3Array = [{
            x: tiles[i].x,
            y: tiles[i].y
        }];
        this.checkTilesPart(line3Array, 'x+y+', tiles[i]);
        this.checkTilesPart(line3Array, 'x-y-', tiles[i]);

        var line4Array = [{
            x: tiles[i].x,
            y: tiles[i].y
        }];
        this.checkTilesPart(line4Array, 'x+y-', tiles[i]);
        this.checkTilesPart(line4Array, 'x-y+', tiles[i]);

        // 大于等于4个的时候消除
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

    // 依次消除方块
    var removeCount = 0;
    for (var i = 0; i < removeTiles.length; i++) {
        for (var j = 0; j < removeTiles[i].length; j++) {
            if (this.grid.cellOccupied(removeTiles[i][j])) {
                this.grid.removeTile(removeTiles[i][j]);
                removeCount++;
            }
        }
    }

    // 可能出现刚好添加的方块把所有的格子都占了，在检测没有可消除之后应该游戏结束
    if (!this.grid.cellsAvailable()) {
        this.over = true;
    }

    // 计算得分公式
    this.score += ((removeCount + this.combo * 2 + this.level) * (removeTiles.length));

    // 返回值为二维数组，第一维为消除序列，第二维为方块
    return removeTiles;
};

// 添加下一次出现的方块
GameManager.prototype.addNextTiles = function () {
    // 若空闲位置不够放置下一次出现的方块，游戏结束，为了不影响检测逻辑，返回空数组
    if (this.grid.availableCells().length < this.next.length) {
        this.over = true;
        return [];
    }
    // 正常逻辑返回添加的方块数组，以便检查是否有巧合被消除的
    var nextTiles = [];
    for (var i = 0; i < this.next.length; i++) {
        var tile = new Tile(this.grid.randomAvailableCell(), this.next[i]);
        nextTiles.push(tile);
        this.grid.insertTile(tile);
    }
    return nextTiles;
};

// 点击棋盘的事件响应，用户交互逻辑
GameManager.prototype.press = function (cell) {
    // 若游戏结束，不响应用户操作
    if (this.over) {
        return;
    }
    /**
     *
     *用户点击棋盘逻辑应如下：
     *
     *  若该位置有方块：不管是否有已激活方块，均对该位置方块执行toggle激活操作，同时清空move，add，remove等数据，更新disabled区域
     *
     *  若该位置无方块：
     *
     *      若当前无激活方块：不操作
     *
     *      若当前有激活方块：
     *
     *          若该位置为不可达区域：清空active
     *
     *          若该位置可达：执行move操作，清空active，并检测是否会消除
     *
     *              若可消除：不增加新方块，构造remove，不设置add，并修改combo和line
     *
     *              若不可消除：增加新方块，构造add，同时检测新方块是否可消除，构造remove，若可消除则修改combo和line
     *
     **/
    if (this.grid.cellOccupied(cell)) {
        this.move = null;
        this.add = [];
        this.remove = [];
        var currentTile = this.grid.cellContent(cell);
        if (this.active != null && this.active == currentTile) {
            this.active = null;
        } else {
            this.active = currentTile;
        }
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
                this.grid.moveTile(currentTile, cell);
                this.remove = this.checkTiles([currentTile]);
                this.active = null;

                if (this.remove.length == 0) {
                    this.add = this.addNextTiles();
                    this.remove = this.checkTiles(this.add);
                    this.next = this.randomNextTiles();
                }

                if (this.remove.length == 0) {
                    this.combo = 0;
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
