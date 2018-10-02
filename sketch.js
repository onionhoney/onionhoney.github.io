var X, Y;

var linearRangeGen = (l, r) => (() => {
    let p = Math.random();
    return l + (r - l) * p;
});
var bernoulliGen = (p) => (() => {
    return (Math.random() < p);
});
var uniformChoice = (arr) => (() => {
    let l = arr.length;
    return arr[Math.floor(Math.random() * l)];
});

var adjust = (x, l, r, step) => {
    if (r - l < step) return x;
    while (x < l) x += step;
    while (x > r) x -= step;
    return x;
}

const BACK = 48;
const WINDOW = 1500;
const iter = 6;
const incr = 2;
const INIT_ITER = 10000;

var probGen = linearRangeGen(0.80, 0.99);
var colorGen = uniformChoice([0, BACK]);
let color_from, color_to;

var ctrl;

function setup() {
    X = windowWidth;
    Y = windowHeight;
    let cnv = createCanvas(X, Y);
    cnv.parent('canvas-holder');

    //cnv.position(0, 0);

    ctrl = new Controller();
    ctrl.grow(INIT_ITER);
    //iter = createSlider(0, 10, 1);
    color_from = color('gold');
    color_to = color(255, 255, 255, 0.5);
}

function draw() {
    background(BACK);
    ctrl.draw();
    ctrl.grow(iter);
    //text(ctrl.oldLines.length, 10, 30);
}

function windowResized() {
    X = windowWidth;
    Y = windowHeight;
    resizeCanvas(X, Y);
    ctrl.reset();
    ctrl.grow(INIT_ITER * 2);
}


class Controller {
    constructor() {
        this.oldLines = [];
        this.newLine = this.createLine();
    }
    reset() {
        this.oldLines = [];
        this.newLine = this.createLine();
    }
    createLine() {
        let x = linearRangeGen(0, X)();
        let y = linearRangeGen(0, Y)();
        let skew = 10;
        let ranges = [[skew, 90 - skew], [90 + skew, 180 - skew]];
        let [l, r] = uniformChoice(ranges)();
        let theta = linearRangeGen(l, r)();
        let dx = Math.cos(theta / 180 * Math.PI);
        let dy = Math.sin(theta / 180 * Math.PI);
        return new Line(x, y, dx, dy, probGen());
    }
    setColor(idx) {
        let c = lerpColor(color_from, color_to, idx / WINDOW);
        stroke(c);
        if (idx < 2) {
            strokeWeight(3);
        } else if (idx < 10) {
            strokeWeight(2);
        } else {
            strokeWeight(1);
        }
    }
    draw() {
        let l = this.oldLines.length;
        let num = l - Math.max(0, l - WINDOW);
        for (let i = 0; i < num; i++) {
            this.setColor(i + 1);
            this.oldLines[l - 1 - i].draw();
        }
        if (l === WINDOW * 2) {
            this.oldLines = this.oldLines.slice(WINDOW);
        }
        this.setColor(0);
        this.newLine.draw();
    }

    grow(times=1) {
        // grow the nodes
        for (let i = 0; i < times; i++) {
        this.newLine.grow();
        if (!this.newLine.growing) {
            this.oldLines.push(this.newLine);

            if (this.newLine.isInBound()) {
                this.newLine = this.newLine.spawn();
            } else {
                this.newLine = this.newLine.wrap();
            }
        }
    }
    }
}

class Line {
    constructor(x, y, dx, dy, prob) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.growing = true;
        this.prob = prob;
        this.willGrow = bernoulliGen(prob);
        this.len = 0;
    }

    interp(r = 1) {
        var x = this.x + this.dx * this.len * r;
        var y = this.y + this.dy * this.len * r;

        return [x, y];
    }
    isInBound(r = 1) {
        let [nx, ny] = this.interp(r);

        return (0 <= nx && nx <= X && 0 <= ny && ny <= Y);
    }
    draw() {
        let [nx, ny] = this.interp();
        line(this.x, this.y, nx, ny);
    }
    grow() {
        if (this.growing && this.willGrow()) {
            if (!this.isInBound()) {
                this.growing = false;
            } else {
                this.len += incr;
            }
        } else {
            this.growing = false;
        }
        return this.growing;
    }
    spawn() {
        let [x, y] = this.interp(linearRangeGen(0, 1)());
        let [dx, dy] = uniformChoice([[-this.dy, this.dx], [this.dy, -this.dx]])();
        let prob = probGen();
        return new Line(x, y, dx, dy, prob);
    }
    wrap() {
        let [x, y] = this.interp();
        let nx = adjust(x, 0, X, X), ny = adjust(y, 0, Y, Y);
        return new Line(nx, ny, this.dx, this.dy, this.prob);
    }
}