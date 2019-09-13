
// 好用的扩展方法
Array.prototype.fillEmpty = function (size, any) {
    this.length = size;
    this.fill(any);
};

Array.prototype.removeObject = function (any) {
    let length = this.length;
    for (let i = 0; i < length; i++) {
        if (this[i] === any) {
            if (i === 0) {
                this.shift(); //删除并返回数组的第一个元素
            } else if (i === length - 1) {
                this.pop();  //删除并返回数组的最后一个元素
            } else {
                this.splice(i, 1); //删除下标为i的元素
            }
        }
    }
}

// return null
Array.prototype.findNearestValueInOrderList = function (number) {
    if (this.length == 0) return null

    for (let i = 0; i < this.length; i++) {
        if (this[i] >= number) {
            if (i == 0) {
                return this[0]
            } else {
                if (this[i] - number > number - this[i - 1]) {
                    return this[i - 1]
                } else {
                    return this[i]
                }
            }
        }
    }
    return this[this.length - 1]
}

Array.prototype.findNextValueInOrderList = function (number) {
    if (this.length == 0) return null

    for (let i = 0; i < this.length; i++) {
        if (this[i] > number) {
            return this[i]
        }
    }
    return this[this.length - 1]
}

Array.prototype.findLastValueInOrderList = function (number) {
    if (this.length == 0) return null

    for (let i = 0; i < this.length; i++) {
        if (this[i] >= number) {
            if (i == 0) {
                return this[0]
            } else {
                return this[i-1]
            }
        }
    }
    return this[this.length - 1]
}

// if first big, return -1，等于也算
Array.prototype.findFirstLittleIndexInOrderList = function (number) {
    if (this.length == 0) return -1

    for (let i = 0; i < this.length; i++) {
        if (this[i] == number) return i

        if (this[i] > number) {
            if (i == 0) {
                return -1
            } else {
                return i - 1
            }
        }
    }
    return this.length - 1
}

Array.prototype.clear = function () {
    this.splice(0, this.length);
}

window.repeat = function (times, func) {
    for (let i = 0; i < times; i++) {
        func();
    }
}

window.getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

Number.prototype.between = function (min, max) {
    return Math.min(Math.max(this, min), max)
}