// 棋盘类，构造时可选择新建还是读取
function Grid(size, previousState) {
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// 获得一个全新的棋盘
Grid.prototype.empty = function () {
    var cells = [];
    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];
        for (var y = 0; y < this.size; y++) {
            row[y] = null;
        }
    }
    return cells;
};

// 从数据中读取棋盘数据构造
Grid.prototype.fromState = function (state) {
    var cells = [];
    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];
        for (var y = 0; y < this.size; y++) {
            var tile = state[x][y];
            row.push(tile ? new Tile(tile.position, tile.color) : null);
        }
    }
    return cells;
}

// 获得一个随机的空闲位置
Grid.prototype.randomAvailableCell = function () {
    var cells = this.availableCells();
    if (cells.length) {
        return cells[Math.floor(Math.random() * cells.length)];
    }
};

// 获取所有的空闲位置
Grid.prototype.availableCells = function () {
    var cells = [];
    this.eachCell(function (x, y, tile) {
        if (!tile) {
            cells.push({
                x: x,
                y: y
            });
        }
    });
    return cells;
};

// 遍历棋盘所有位置
Grid.prototype.eachCell = function (callback) {
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            callback(x, y, this.cells[x][y]);
        }
    }
};

// 判断是否有空闲位置
Grid.prototype.cellsAvailable = function () {
    return !!this.availableCells().length;
};

// 判断某个位置是否空闲
Grid.prototype.cellAvailable = function (cell) {
    if (this.withinBounds(cell)) {
        return !this.cellOccupied(cell);
    } else {
        return false;
    }
};

// 判断某个位置是否被占用
Grid.prototype.cellOccupied = function (cell) {
    if (this.withinBounds(cell)) {
        return !!this.cellContent(cell);
    } else {
        return false;
    }

};

// 获取某个位置的内容
Grid.prototype.cellContent = function (cell) {
    if (this.withinBounds(cell)) {
        return this.cells[cell.x][cell.y];
    } else {
        return null;
    }
};

// 增加删除移动方块
Grid.prototype.insertTile = function (tile) {
    this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
    this.cells[tile.x][tile.y] = null;
};

Grid.prototype.moveTile = function (tile, cell) {
    this.removeTile(tile);
    this.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

// 判断是否在边界内
Grid.prototype.withinBounds = function (position) {
    return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size;
};

// 序列化棋盘
Grid.prototype.serialize = function () {
    var cellState = [];
    for (var x = 0; x < this.size; x++) {
        var row = cellState[x] = [];
        for (var y = 0; y < this.size; y++) {
            row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
        }
    }
    return {
        size: this.size,
        cells: cellState
    };
};
