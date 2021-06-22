class XY {
    #x;
    #y;
    constructor(x, y) {
        this.#x = x;
        this.#y = y;
    }
    get x() {
        return this.#x;
    }
    set x(x) {
        this.#x = x;
    }
    get y() {
        return this.#y;
    }
    set y(y) {
        this.#y = y;
    }

    equals = xy => this.x === xy.x && this.y === xy.y;
    isXReverse = xy => this.x === xy.x * (-1) && this.x !== 0 && this.y === xy.y;
    isYReverse = xy => this.x === xy.x && this.y !== 0 && this.y === xy.y * (-1);
    getAdd = xy => new XY(this.x + xy.x, this.y + xy.y);
    setAdd = xy => {
        this.x += xy.x;
        this.y += xy.y;
    }
}

class Range {
    constructor(min, max) {
        this.min = min;
        this.max = max;
        this.range = max - min;
    }
    isWithin = value => this.min <= value && value <= this.max;
}

class XYRange {
    constructor(xMin, xMax, yMin, yMax) {
        this.value = new XY(new Range(xMin, xMax), new Range(yMin, yMax));
    }
    isWithin = xy => x.isWithin(xy.x) && this.range.y.isWithin(xy.y);
}

const xyWayForEach = func => {
    const xyWayList = [
        new XY(-1, 0),
        new XY(0, -1),
        new XY(0, 1),
        new XY(1, 0),
    ];
    xyWayList.forEach(xyWay => {
        func(xyWay);
    })
}

class Order {
    #values = [
        new XY(0, 0),
        new XY(1, 0),
        new XY(2, 0),
        new XY(3, 0),
        new XY(3, 1),
        new XY(3, 2),
        new XY(2, 2),
        new XY(1, 2),
        new XY(0, 2),
    ];
    #now = undefined;
    #specials = {
        'start': 0,
        'goal': this.#values.length - 1,
        'previous': undefined,
    };

    #findValue = (xy) => {
        for (let i = 0; i < this.#values.length; i++) {
            if (xy.equals(this.#values[i])) {
                return this.#values[i];
            }
        }
        return false;
    }
    toBoard = (range) => {
        const values = []
        const idx = new XY(range.x.min, range.y.min);
        for (; idx.y <= range.y.max; idx.y++) {
            values.push([]);
            for (idx.x = range.x.min; idx.x <= range.x.max; idx.x++) {
                values[idx.y].push(this.#findValue(idx));
            }
        }
        return values;
    }

    #getSpecial = key => this.#specials[key];
    getIsOn = key => this.#now === this.#getSpecial(key);
    getXy = key => {
        const previousOrder = this.#getSpecial('previous');
        const toXyList = {
            'start': this.#values[this.#getSpecial('start')],
            'goal': this.#values[this.#getSpecial('goal')],
            'now': this.#values[this.#now],
            'previous': (previousOrder !== undefined) ? this.#values[previousOrder] : undefined,
        }
        return toXyList[key];
    }

    setStart = () => this.#now = this.#getSpecial('start');
    advance = (n) => {
        // ゴールしている場合
        if (this.getIsOn('goal')) {
            return false;
        }

        // 前の位置を記憶
        this.#specials.previous = this.#now;

        const result = {
            'advanceN': undefined,
            'doesGoal': undefined,
        }

        // 駒を進める
        if (this.#now + n >= this.#values.length - 1) {
            result.advanceN = this.#specials.goal - this.#now;
            this.#now = this.#getSpecial('goal');
            result.doesGoal = true;
        }
        else {
            this.#now += n;
            result.advanceN = n;
            result.doesGoal = false
        }
        return result;
    }
    reset = () => {
        this.#specials.previous = undefined;
        this.setStart();
    }
}

class Board {
    #order = new Order();
    #size = new XY(4, 3);
    #range;
    #values;
    constructor() {
        this.#range = new XYRange(0, this.#size.x - 1, 0, this.#size.y - 1);
        this.#values = this.#order.toBoard(this.#range.value);
        this.#initRender();
        this.#setStart();
    }
    getValue = xy => this.#values[xy.y][xy.x];
    valuesForEach = (rowsFunc, valueFunc) => {
        this.#values.forEach((rows, y) => {
            rowsFunc(y);
            rows.forEach((value, x) => {
                valueFunc(new XY(x, y));
            })
        })
    }
    getThDOM = xy => $(`tr#rows-${xy.y} > th#value-${xy.x}`);
    #getClassName = xy => this.getValue(xy) ? 'no-empty' : 'empty';

    #initRender = () => {
        this.valuesForEach((y) => {
            $('tbody').append(`<tr id="rows-${y}"></tr>`);
        }, (xy) => {
            $(`#rows-${xy.y}`).append(`<th id="value-${xy.x}" class="${this.#getClassName(xy)}"></th>`);
        })
    }
    #reRender = () => {
        if (!this.#order.getIsOn('start')) {
            this.getThDOM(this.#order.getXy('previous')).removeClass('now');
        }
        this.getThDOM(this.#order.getXy('now')).addClass('now');
    }

    #setStart = () => {
        this.#order.setStart();
        this.#reRender();
    }
    #advance = (n) => {
        // マスを進める
        const result = this.#order.advance(n);
        if (!result) {
            return false;
        }
        // 再描画して反映
        this.#reRender();
        return result;
    }
    randomAdvance = () => {
        const result = this.#advance(Math.floor(Math.random() * 6) + 1);
        console.log(result ? `${result.advanceN}マス進みました` : 'すでにゴールしています');
        if (result && result.doesGoal) {
            console.log('ゴールしました');
        }
    }
    reset = () => {
        this.getThDOM(this.#order.getXy('now')).removeClass('now');
        this.#order.reset();
        this.#setStart();
        console.log('リセットしました');
    }
}

const board = new Board();