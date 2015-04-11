// 方块类
function Tile(position, color) {
    this.x = position.x;
    this.y = position.y;
    this.color = color;
    this.disable = null;
}

// 更新位置
Tile.prototype.updatePosition = function (position) {
    this.x = position.x;
    this.y = position.y;
};

// 更新不可达目标
Tile.prototype.updateDisable = function (disable) {
    this.disable = disable;
};

// 序列化方块
Tile.prototype.serialize = function () {
    return {
        position: {
            x: this.x,
            y: this.y
        },
        color: this.color
    };
};
