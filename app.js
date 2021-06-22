// XY座標のクラス
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

// 1変数の範囲のクラス
class Range {
    constructor(min, max) {
        this.min = min;
        this.max = max;
        this.range = max - min;
    }
    // 範囲内かどうか
    isWithin = value => this.min <= value && value <= this.max;
}

// XY座標の範囲のクラス
class XYRange {
    constructor(xMin, xMax, yMin, yMax) {
        this.value = new XY(new Range(xMin, xMax), new Range(yMin, yMax));
    }
    // 範囲内かどうか
    isWithin = xy => x.isWithin(xy.x) && this.range.y.isWithin(xy.y);
}

// メッセージをDOMに表示
const messageRender = message => $('.message').text(message);

// すごろくの順序を定義
class Order {
    #values;

    constructor(values) {
        this.#values = values;
        // 特殊な順序
        this.specials = {
            // スタート
            'start': 0,
            // ゴール
            'goal': this.#values.length - 1,
        }
    }

    // XY座標が存在するかどうか
    #doesValueExists = (xy) => {
        for (let i = 0; i < this.#values.length; i++) {
            if (xy.equals(this.#values[i])) {
                return true;
            }
        }
        return false;
    }
    // すごろくの順序からすごろくの盤面に変換
    toBoard = (range) => {
        const values = []
        const idx = new XY(range.x.min, range.y.min);
        for (; idx.y <= range.y.max; idx.y++) {
            values.push([]);
            for (idx.x = range.x.min; idx.x <= range.x.max; idx.x++) {
                // すごろくの順序に存在したら true, 存在しなかったら false
                values[idx.y].push(this.#doesValueExists(idx));
            }
        }
        return values;
    }

    // キーワードで特定の盤面の値を取得
    getValueByKey = keyword => {
        const toXyList = {
            'start': this.#values[this.specials.start],
            'goal': this.#values[this.specials.goal],
        }
        return toXyList[keyword];
    }

    getValueByIndex = index => index !== undefined ? this.#values[index] : undefined;
}

class Piece {
    #order;
    constructor(order) {
        this.#order = order;
        this.now = undefined;
        this.previous = undefined;
    }

    // 駒が特定のマスにあるかどうかを調べる
    isOn = keyword => this.now === this.#order.specials[keyword];
    // 駒の位置ををスタート位置に設定する（変数上）
    setStart = () => this.now = this.#order.specials.start;
    // 駒を進める（変数上）
    advance = (n) => {
        // ゴールしている場合
        if (this.isOn('goal')) {
            return false;
        }

        // 前の位置を記憶
        this.previous = this.now;

        const result = {
            // 進んだマス数
            'advanceN': undefined,
            // ゴールしたかどうか
            'doesGoal': undefined,
        }

        // 駒を進める
        // ゴールする場合
        if (this.now + n >= this.#order.specials.goal) {
            result.advanceN = this.#order.specials.goal - this.now;
            this.now = this.#order.specials.goal;
            result.doesGoal = true;
        }
        // ゴールしない場合
        else {
            this.now += n;
            result.advanceN = n;
            result.doesGoal = false
        }

        return result;
    }
    // 現在位置をリセット
    reset = () => {
        this.previous = undefined;
        this.setStart();
    }
}

class Board {
    #order;
    #size;
    #range;
    #values;
    constructor(size, order) {
        this.#size = size;
        this.#range = new XYRange(0, this.#size.x - 1, 0, this.#size.y - 1);
        this.#order = order;
        this.piece = new Piece(order);
        this.#values = this.#order.toBoard(this.#range.value);
        this.#initRender();
    }

    // 特定のマスを取得
    getValue = xy => this.#values[xy.y][xy.x];
    // 列ごと、マスごとに命令を実行
    valuesForEach = (rowsFunc, valueFunc) => {
        this.#values.forEach((rows, y) => {
            rowsFunc(y);
            rows.forEach((value, x) => {
                valueFunc(new XY(x, y));
            })
        })
    }
    // 特定マスのDOMを取得
    getSquareDOM = xy => $(`tr#rows-${xy.y} > th#value-${xy.x}`);
    // 特定マスを描くかどうかを決めるクラスを決定
    #getClassName = xy => this.getValue(xy) ? 'no-empty' : 'empty';

    // 盤面の初期描画
    #initRender = () => {
        this.valuesForEach((y) => {
            $('tbody').append(`<tr id="rows-${y}"></tr>`);
        }, (xy) => {
            // テキストの決定
            let textContent = ''
            const toTextContent = {
                'start': 'Start',
                'goal': 'Goal',
            }
            Object.keys(toTextContent).forEach(key => {
                if (xy.equals(this.#order.getValueByKey(key))) {
                    textContent = toTextContent[key];
                }
            });

            // 描画
            $(`#rows-${xy.y}`).append(`<th id="value-${xy.x}" class="${this.#getClassName(xy)}">${textContent}</th>`);
        })
    }
    // 再描画
    reRender = () => {
        if (!this.piece.isOn('start')) {
            this.getSquareDOM(this.#order.getValueByIndex(this.piece.previous)).removeClass('now');
        }
        this.getSquareDOM(this.#order.getValueByIndex(this.piece.now)).addClass('now');
    }
}

class Game {
    static #randomRange = new Range(1, 6);
    #order;
    #board;

    constructor(orderValue) {
        this.#order = new Order(orderValue);
        this.#board = new Board(new XY(4, 3), this.#order);
        this.#setStart();
    }

    // 駒の位置ををスタート位置に設定する（画面上）
    #setStart = () => {
        this.#board.piece.setStart();
        this.#board.reRender();
    }
    // 駒を進める（画面上）
    #advance = (n) => {
        const result = this.#board.piece.advance(n);
        if (!result) {
            return false;
        }
        // 再描画して反映
        this.#board.reRender();
        return result;
    }
    // 乱数によって駒を進める（画面上）
    randomAdvance = () => {
        const result = this.#advance(Math.floor(Math.random() * Game.#randomRange.max) + Game.#randomRange.min);
        messageRender(result ? `${result.advanceN}マス進みました。${result.doesGoal ? 'ゴールしました。' : ''}` : 'すでにゴールしています。');
    }
    // ゲームのリセット
    reset = () => {
        this.#board.getSquareDOM(this.#order.getValueByIndex(this.#board.piece.now)).removeClass('now');
        this.#board.piece.reset();
        this.#setStart();
        messageRender('リセットしました');
    }
}

const game = new Game([
    new XY(0, 0),
    new XY(1, 0),
    new XY(2, 0),
    new XY(3, 0),
    new XY(3, 1),
    new XY(3, 2),
    new XY(2, 2),
    new XY(1, 2),
    new XY(0, 2),
]);