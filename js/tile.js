function Tile(position, color) {
    this.x = position.x;
    this.y = position.y;
    this.color = color;
    this.disable = null;
}

Tile.prototype.updatePosition = function (position) {
    this.x = position.x;
    this.y = position.y;
};

Tile.prototype.updateDisable = function (disable) {
    this.disable = disable;
};

Tile.prototype.serialize = function () {
    return {
        position: {
            x: this.x,
            y: this.y
        },
        color: this.color
    };
};
