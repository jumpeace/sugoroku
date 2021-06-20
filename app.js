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
    getAdd = xy => new XY(this.x + xy.x,this.y + xy.y);
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
        this.range = new XY(new Range(xMin, xMax), new Range(yMin, yMax));
    }
    isWithin = xy => this.range.x.isWithin(xy.x) && this.range.y.isWithin(xy.y);
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

class Board {
    constructor() {
        this.values = [
            [true, true, true, true],
            [false, false, false, true],
            [true, true, true, true],
        ]
        this.size = new XY(4, 3)
        this.range = new XYRange(0, this.size.x - 1, 0, this.size.y - 1);
        this.specials = [
            {
                key: 'undefined',
                xy: new XY(-1, -1),
            },
            {
                key: 'start',
                xy: new XY(0, 0),
                textContent: 'START',
            },
            {
                key: 'goal',
                xy: new XY(0, 2),
                textContent: 'GOAL!!',
            },
            {
                key: 'now',
                xy: new XY(-1, -1),
            },
            {
                key: 'previous',
                xy: new XY(-1, -1),
            },
        ];
        this.previousXyWay = undefined;
    }
    getValue = xy => this.values[xy.y][xy.x];
    getSpecial = (arg, way = 'key') => {
        if (way === 'xy') {
            return this.specials.find(special => special[way].equals(arg))
        }
        return this.specials.find(special => special[way] === arg)
    };
    valuesForEach = (rowsFunc, valueFunc) => {
        this.values.forEach((rows, y) => {
            rowsFunc(y);
            rows.forEach((value, x) => {
                valueFunc(new XY(x, y));
            })
        })
    }
    getTh = xy => $(`tr#rows-${xy.y} > th#value-${xy.x}`);
    setStart = () => {
        const startXy = this.getSpecial('start').xy;
        this.getSpecial('now').xy = new XY(startXy.x, startXy.y);
        this.reRender();
    }
    #getTextContent = xy => {
        const special = this.getSpecial(xy, 'xy');
        return this.getValue(xy) && special && Object.keys(special).some(key => key === 'textContent') ? special.textContent : '';
    }
    #getClassName = xy => this.getValue(xy) ? 'no-empty' : 'empty';
    initRender = () => {
        this.valuesForEach((y) => {
            $('tbody').append(`<tr id="rows-${y}"></tr>`);
        }, (xy) => {
            $(`#rows-${xy.y}`).append(`<th id="value-${xy.x}" class="${this.#getClassName(xy)}">${this.#getTextContent(xy)}</th>`);
        })
    }
    reRender = () => {
        if (!this.getSpecial('previous').xy.equals(this.getSpecial('undefined').xy)) {
            this.getTh(this.getSpecial('previous').xy).removeClass('now');
        }
        this.getTh(this.getSpecial('now').xy).addClass('now');
    }
    #canAdvance = (advanceXy) => {
        const xy = this.getSpecial('now').xy.getAdd(advanceXy);
        return this.range.isWithin(xy) && this.getValue(xy);
    }
    #findAdvanceXyWay = () => {
        const xyWayList = [];
        xyWayForEach(xyWay => {
            if (!this.#canAdvance(xyWay)) {
                return;
            }
            if (this.previousXyWay !== undefined) {
                if (xyWay.isXReverse(this.previousXyWay) || xyWay.isYReverse(this.previousXyWay)) {
                    return;
                }
            }
            xyWayList.push(xyWay);
        });
        if (xyWayList.length !== 1) {
            console.log(xyWayList)
            return false;
        }
        this.previousXyWay = xyWayList[0];
        return xyWayList[0];
    }
    advance = () => {
        if (this.getSpecial('now').xy.equals(this.getSpecial('goal').xy)) {
            return false;
        }
        // 進められるマスを見つける
        const advanceXyWay = this.#findAdvanceXyWay();

        console.log(advanceXyWay)

        // 進められる場合
        if (advanceXyWay) {
            // 変数を変更
            this.getSpecial('previous').xy = new XY(this.getSpecial('now').xy.x, this.getSpecial('now').xy.y);
            this.getSpecial('now').xy.setAdd(advanceXyWay);

            // 再描画して反映
            this.reRender();
        }
        return true;
    }
    reset = () => {
        this.getTh(this.getSpecial('now').xy).removeClass('now');
        this.getSpecial('previous').xy = this.getSpecial('undefined').xy;
        this.setStart();
        this.reRender();
        // TODO goal付近までいってリセットするとそのあと進めない
    }
}

const board = new Board();

board.initRender();
board.setStart();